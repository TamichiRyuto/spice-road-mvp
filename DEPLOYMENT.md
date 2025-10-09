# GCP Cloud Run デプロイ手順

このドキュメントでは、Spice Road APIをGoogle Cloud Runにデプロイする手順を説明します。

## 前提条件

1. GCPプロジェクトが作成済み
2. Google Cloud CLIがインストール済み
3. GitHubリポジトリが作成済み
4. 必要な権限を持つGCPサービスアカウント

## 1. GCPの初期設定

### Artifact Registryの作成

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-northeast1"

# Artifact Registryリポジトリを作成
gcloud artifacts repositories create spice-road \
  --repository-format=docker \
  --location=$REGION \
  --description="Spice Road Docker images"
```

### 必要なAPIの有効化

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  containerregistry.googleapis.com \
  --project=$PROJECT_ID
```

### サービスアカウントの作成

```bash
# サービスアカウントを作成
gcloud iam service-accounts create spice-road-deployer \
  --display-name="Spice Road Deployer" \
  --project=$PROJECT_ID

# 必要な権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:spice-road-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:spice-road-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:spice-road-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:spice-road-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

## 2. Workload Identity Federationの設定

GitHub ActionsからGCPに認証するためにWorkload Identity Federationを設定します。

```bash
# Workload Identity Poolを作成
gcloud iam workload-identity-pools create "github-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Workload Identity Providerを作成
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# サービスアカウントにバインディングを追加
gcloud iam service-accounts add-iam-policy-binding \
  "spice-road-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

**注意**: `PROJECT_NUMBER`, `YOUR_GITHUB_USERNAME`, `YOUR_REPO_NAME`を実際の値に置き換えてください。

プロジェクト番号を取得:
```bash
gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
```

## 3. GitHub Secretsの設定

GitHubリポジトリの Settings > Secrets and variables > Actions から以下のシークレットを追加します:

| Secret Name | Value | 説明 |
|------------|-------|------|
| `GCP_PROJECT_ID` | `your-project-id` | GCPプロジェクトID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider` | Workload Identity Provider ID |
| `GCP_SERVICE_ACCOUNT` | `spice-road-deployer@PROJECT_ID.iam.gserviceaccount.com` | サービスアカウントのメール |

## 4. デプロイの実行

### 自動デプロイ

`main`ブランチにプッシュすると自動的にデプロイが実行されます:

```bash
git add .
git commit -m "Deploy to Cloud Run"
git push origin main
```

### 手動デプロイ

GitHubのActionsタブから手動でワークフローを実行できます。

### ローカルから手動デプロイ

```bash
# C++ APIのビルドとデプロイ
cd cpp-api
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/spice-road/spice-road-cpp-api -f Dockerfile.production .

gcloud run deploy spice-road-cpp-api \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/spice-road/spice-road-cpp-api \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8080

# C++ APIのURLを取得
CPP_API_URL=$(gcloud run services describe spice-road-cpp-api \
  --region $REGION \
  --format 'value(status.url)')

# Nginxのビルドとデプロイ
cd ../nginx
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/spice-road/spice-road-nginx .

gcloud run deploy spice-road-nginx \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/spice-road/spice-road-nginx \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars "CPP_API_URL=$CPP_API_URL"
```

## 5. デプロイの確認

デプロイが完了したら、以下のコマンドでURLを確認します:

```bash
# Nginx GatewayのURL
gcloud run services describe spice-road-nginx \
  --region $REGION \
  --format 'value(status.url)'
```

### エンドポイントのテスト

```bash
# NginxのURL
NGINX_URL=$(gcloud run services describe spice-road-nginx --region $REGION --format 'value(status.url)')

# ヘルスチェック
curl $NGINX_URL/health

# API ドキュメント
curl $NGINX_URL/api-docs

# APIエンドポイントのテスト
curl $NGINX_URL/api/shops
```

## アーキテクチャ

```
Internet
    ↓
[Cloud Run: Nginx Gateway]
    ↓ (内部通信)
[Cloud Run: C++ API]
```

- **Nginx**: リバースプロキシ、キャッシング、CORS処理
- **C++ API**: C++26で実装されたバックエンドAPI

## 料金について

Cloud Runは使用量ベースの課金です:
- 0リクエスト時: ほぼ無料（最小インスタンス0）
- リクエスト数に応じて自動スケール
- 使用したリソース分のみ課金

## トラブルシューティング

### ログの確認

```bash
# C++ APIのログ
gcloud run logs read spice-road-cpp-api --region $REGION --limit 50

# Nginxのログ
gcloud run logs read spice-road-nginx --region $REGION --limit 50
```

### サービスの削除

```bash
gcloud run services delete spice-road-nginx --region $REGION
gcloud run services delete spice-road-cpp-api --region $REGION
```

## 次のステップ

- [ ] カスタムドメインの設定
- [ ] Cloud CDNの有効化
- [ ] Cloud Armorでセキュリティ強化
- [ ] Cloud Loggingでモニタリング設定
- [ ] Cloud Schedulerで定期的なヘルスチェック
