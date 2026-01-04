# Deployment Guide

本番環境へのデプロイ手順を説明します。

## 前提条件

### 必須ツール

1. **asdf** - バージョン管理ツール
2. **Terraform** - インフラ管理
3. **Google Cloud SDK (gcloud)** - GCP CLI
4. **GCPプロジェクト** - アクティブなプロジェクトと適切な権限

### 推奨スペック

- メモリ: 4GB以上
- ディスク空き容量: 10GB以上
- ネットワーク: インターネット接続

---

## ステップ1: asdfセットアップ

### asdfのインストール

```bash
# macOS / Linux
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0

# .bashrc または .zshrc に追加
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc  # bash の場合
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc   # zsh の場合

# シェルを再起動
source ~/.bashrc  # または source ~/.zshrc
```

**参考**: [asdf公式ドキュメント](https://asdf-vm.com/)

### Terraformプラグインのインストール

```bash
# Terraformプラグインを追加
asdf plugin add terraform https://github.com/asdf-community/asdf-hashicorp.git

# Node.jsプラグインを追加（フロントエンド用）
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

# プロジェクトディレクトリに移動
cd /path/to/spice-road-mvp

# .tool-versions に定義されたバージョンをインストール
asdf install

# インストール確認
terraform version
node --version
```

**参考**:
- [asdf-hashicorp プラグイン](https://github.com/asdf-community/asdf-hashicorp)
- [Managing Multiple Tool Versions with asdf](https://schoenwald.aero/posts/2025-02-20_managing-multiple-tool-versions/)

---

## ステップ2: GCP認証設定

### 方法A: gcloud CLI認証（開発環境推奨）

```bash
# gcloud SDKをインストール（未インストールの場合）
# https://cloud.google.com/sdk/docs/install

# 認証を実行
gcloud auth login

# Application Default Credentials (ADC) を設定
gcloud auth application-default login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# 確認
gcloud auth application-default print-access-token
```

**メリット**:
- サービスアカウントキー不要
- 自動的に認証情報を更新
- セキュアな認証方法

**参考**: [Authentication for Terraform | Google Cloud](https://cloud.google.com/docs/terraform/authentication)

### 方法B: サービスアカウントキー（本番環境/CI/CD）

```bash
# 1. サービスアカウントを作成
gcloud iam service-accounts create terraform-sa \
    --display-name="Terraform Service Account"

# 2. 必要なIAMロールを付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/editor"

# 3. サービスアカウントキーを作成（注意: セキュアに保管）
gcloud iam service-accounts keys create ~/gcp-terraform-key.json \
    --iam-account=terraform-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

# 4. キーファイルのパーミッション設定
chmod 600 ~/gcp-terraform-key.json
```

**⚠️ セキュリティ警告**:
- サービスアカウントキーはセキュリティリスクがあります
- 定期的にローテーションしてください
- バージョン管理システムにコミットしないでください
- 本番環境では Workload Identity Federation の使用を検討してください

**参考**: [Google Cloud Provider Configuration Reference](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference)

### .envファイルの作成

```bash
cd terraform/gcp

# .env.example をコピー
cp .env.example .env

# エディタで編集
nano .env  # または vim, code など
```

**.env の設定例**:

```bash
# 方法A: gcloud CLI認証の場合（GOOGLE_APPLICATION_CREDENTIALSをコメントアウト）
# GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
GOOGLE_PROJECT="your-gcp-project-id"
GOOGLE_REGION="asia-northeast1"

# 方法B: サービスアカウントキーの場合
GOOGLE_APPLICATION_CREDENTIALS="/home/user/gcp-terraform-key.json"
GOOGLE_PROJECT="your-gcp-project-id"
GOOGLE_REGION="asia-northeast1"
```

**重要**: `.env` ファイルは `.gitignore` に含まれており、コミットされません。

---

## 🏗️ ステップ3: Terraformによるインフラ構築

### 3.1 terraform.tfvars の作成

```bash
cd terraform/gcp

# サンプルをコピー
cp terraform.tfvars.example terraform.tfvars

# エディタで編集
nano terraform.tfvars
```

**最小限の設定**:

```hcl
project_id = "your-gcp-project-id"
region     = "asia-northeast1"
environment = "prod"
app_name = "spice-road"

# 初回デプロイ時はイメージURLを空にしておく
cpp_api_image  = ""
frontend_image = ""

# 認証なしアクセスを許可（公開アプリの場合）
allow_unauthenticated = true
```

### 3.2 Terraformの初期化

```bash
# ラッパースクリプトを使用（.envを自動ロード）
./scripts/tf-init.sh

# または直接実行（手動で環境変数を設定する場合）
source .env
terraform init
```

### 3.3 インフラのプランニング

```bash
# ラッパースクリプトを使用
./scripts/tf-plan.sh

# または直接実行
source .env
terraform plan -var="project_id=$GOOGLE_PROJECT"
```

**出力例**:

```
Plan: 15 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + artifact_registry_repository_url = (known after apply)
  + cpp_api_service_url              = (known after apply)
  + frontend_service_url             = (known after apply)
```

### 3.4 インフラの適用

```bash
# ラッパースクリプトを使用（安全確認プロンプト付き）
./scripts/tf-apply.sh

# または直接実行
source .env
terraform apply -var="project_id=$GOOGLE_PROJECT"
```

**確認プロンプト**:

```
Are you sure you want to continue? (yes/no)
```

`yes` を入力して続行します。

### 3.5 デプロイ完了の確認

```bash
# 出力値を確認
terraform output

# 特定の値を取得
terraform output frontend_service_url
terraform output cpp_api_service_url
terraform output artifact_registry_repository_url
```

---

## 🐳 ステップ4: Dockerイメージのビルドとプッシュ

### 4.1 Artifact Registryへの認証

```bash
# Docker認証を設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### 4.2 イメージのビルドとプッシュ

```bash
# Artifact Registry URLを取得
REGISTRY_URL=$(cd terraform/gcp && terraform output -raw artifact_registry_repository_url)

# C++ APIイメージをビルド＆プッシュ
cd cpp-api
docker build -t ${REGISTRY_URL}/cpp-api:latest .
docker push ${REGISTRY_URL}/cpp-api:latest

# Frontendイメージをビルド＆プッシュ
cd ../frontend
docker build -t ${REGISTRY_URL}/frontend:latest .
docker push ${REGISTRY_URL}/frontend:latest
```

### 4.3 Cloud Runサービスの更新

イメージをプッシュしたら、terraform.tfvars を更新：

```hcl
cpp_api_image  = "asia-northeast1-docker.pkg.dev/PROJECT_ID/spice-road-prod/cpp-api:latest"
frontend_image = "asia-northeast1-docker.pkg.dev/PROJECT_ID/spice-road-prod/frontend:latest"
```

再度 Terraform を実行：

```bash
cd terraform/gcp
./scripts/tf-apply.sh
```

---

## ✅ ステップ5: デプロイの検証

### 5.1 サービスURLの確認

```bash
cd terraform/gcp

# Frontend URLを取得
FRONTEND_URL=$(terraform output -raw frontend_service_url)
echo "Frontend: $FRONTEND_URL"

# C++ API URLを取得
API_URL=$(terraform output -raw cpp_api_service_url)
echo "API: $API_URL"
```

### 5.2 動作確認

```bash
# Frontendへアクセス
curl $FRONTEND_URL

# APIへアクセス（ヘルスチェック）
curl $API_URL/health
```

### 5.3 ブラウザでの確認

```bash
# macOS
open $FRONTEND_URL

# Linux
xdg-open $FRONTEND_URL

# WSL
wslview $FRONTEND_URL
```

---

## 🔄 CI/CD統合（オプション）

### GitHub Actionsでの自動デプロイ

Terraformで作成されたWorkload Identity Providerを使用します。

**GitHub Secretsの設定**:

1. GitHub リポジトリの Settings → Secrets → Actions
2. 以下のシークレットを追加:

```
GCP_PROJECT_ID: your-gcp-project-id
GCP_WORKLOAD_IDENTITY_PROVIDER: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

**ワークフロー例** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v3

      - id: auth
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: deploy-sa@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Deploy with Terraform
        run: |
          cd terraform/gcp
          terraform init
          terraform apply -auto-approve -var="project_id=${{ secrets.GCP_PROJECT_ID }}"
```

---

## インフラの削除

**⚠️ 警告**: この操作は元に戻せません！

```bash
cd terraform/gcp

# ラッパースクリプトを使用（安全確認プロンプト付き）
./scripts/tf-destroy.sh

# または直接実行
source .env
terraform destroy -var="project_id=$GOOGLE_PROJECT"
```

---

## トラブルシューティング

### エラー: "terraform: command not found"

```bash
# asdfでTerraformがインストールされているか確認
asdf list terraform

# インストールされていない場合
asdf install terraform 1.6.6
```

### エラー: "Error: google: could not find default credentials"

```bash
# gcloud認証を実行
gcloud auth application-default login

# または .env ファイルを確認
cat terraform/gcp/.env
```

### エラー: "Error creating Service: googleapi: Error 403: Permission denied"

```bash
# 必要なAPIが有効化されているか確認
gcloud services list --enabled

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### エラー: "Error: Invalid provider configuration"

```bash
# Terraformを再初期化
cd terraform/gcp
rm -rf .terraform
./scripts/tf-init.sh
```

---

## 📚 参考資料

### 公式ドキュメント

- [asdf公式サイト](https://asdf-vm.com/)
- [Authentication for Terraform | Google Cloud](https://cloud.google.com/docs/terraform/authentication)
- [Google Cloud Provider Configuration Reference | Terraform Registry](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

### ベストプラクティス

- [Build Production-Ready Google Cloud Infrastructure with Terraform in 2025](https://dev.to/livingdevops/build-production-ready-google-cloud-infrastructure-with-terraform-in-2025-1jj7)
- [Terraform GCP Provider: 5 Best Practices from Real Projects](https://controlmonkey.io/resource/terraform-gcp-provider-best-practices/)

### セキュリティ

- [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)

---

## ヒント

1. **環境の分離**: dev, staging, prodで異なるGCPプロジェクトを使用してください
2. **Terraform State**: 本番環境ではGCS bucketにstateを保存してください
3. **セキュリティ**: 最小権限の原則に従ってIAMロールを設定してください
4. **コスト管理**: GCP Billing Alerts を設定して予算超過を防いでください
5. **バックアップ**: 重要なデータは定期的にバックアップしてください

---

**最終更新**: 2024-11-26
**対象バージョン**: Terraform 1.6.6, asdf latest
