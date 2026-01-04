# GCP Cloud Run デプロイ手順

このドキュメントでは、Spice Road MVPをTerraformを使ってGoogle Cloud Runにデプロイする手順を説明します。

## 概要

このプロジェクトはTerraformを使用してインフラをコード化(IaC)しています。手動でのgcloudコマンド実行は不要です。

## 前提条件

### 必須ツール

1. **asdf** - バージョン管理ツール
2. **Terraform** >= 1.6.6 (asdfで管理)
3. **Google Cloud SDK (gcloud)** - GCP CLI
4. **GCPプロジェクト** - アクティブなプロジェクトと適切な権限

### 推奨スペック

- メモリ: 4GB以上
- ディスク空き容量: 10GB以上
- ネットワーク: インターネット接続

---

## クイックスタート

### 1. asdfとTerraformのセットアップ

```bash
# asdfをインストール（未インストールの場合）
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0

# シェル設定に追加
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc  # bash の場合
# または
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc   # zsh の場合

# シェルを再起動
source ~/.bashrc  # または source ~/.zshrc

# プロジェクトルートに移動
cd /path/to/spice-road-mvp

# Terraformプラグインを追加
asdf plugin add terraform https://github.com/asdf-community/asdf-hashicorp.git

# .tool-versions に定義されたバージョンをインストール
asdf install

# 確認
terraform version  # Terraform v1.6.6が表示されるはず
```

### 2. GCP認証設定

```bash
# gcloud認証
gcloud auth login
gcloud auth application-default login

# プロジェクトIDを設定
gcloud config set project YOUR_PROJECT_ID
```

### 3. 環境変数ファイルの作成

```bash
cd terraform/gcp

# .env.example をコピー
cp .env.example .env

# エディタで編集
nano .env
```

**.env の最小設定**:

```bash
# GCP認証（gcloud CLI使用の場合はコメントアウト）
# GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# GCPプロジェクト設定（必須）
GOOGLE_PROJECT="your-gcp-project-id"
GOOGLE_REGION="asia-northeast1"
```

### 4. Terraform変数ファイルの作成

```bash
# terraform.tfvars.example をコピー
cp terraform.tfvars.example terraform.tfvars

# エディタで編集
nano terraform.tfvars
```

**最小設定**:

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

### 5. Terraformによるインフラ構築

```bash
# Terraformの初期化
./scripts/tf-init.sh

# プランの確認
./scripts/tf-plan.sh

# インフラのデプロイ
./scripts/tf-apply.sh
```

### 6. Dockerイメージのビルドとプッシュ

```bash
# Docker認証を設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

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

### 7. Cloud Runサービスの更新

イメージをプッシュしたら、`terraform/gcp/terraform.tfvars`を更新：

```hcl
cpp_api_image  = "asia-northeast1-docker.pkg.dev/PROJECT_ID/spice-road-prod/cpp-api:latest"
frontend_image = "asia-northeast1-docker.pkg.dev/PROJECT_ID/spice-road-prod/frontend:latest"
```

再度Terraformを実行：

```bash
cd terraform/gcp
./scripts/tf-apply.sh
```

### 8. デプロイの確認

```bash
# FrontendのURLを取得
terraform output frontend_service_url

# APIへアクセス（ヘルスチェック）
API_URL=$(terraform output -raw cpp_api_service_url)
curl $API_URL/health

# ブラウザでアクセス
open $(terraform output -raw frontend_service_url)
```

---

## 詳細ドキュメント

より詳しい手順や設定については、以下のドキュメントを参照してください：

- **[terraform/gcp/DEPLOYMENT.md](terraform/gcp/DEPLOYMENT.md)** - 詳細なデプロイ手順
- **[terraform/gcp/README.md](terraform/gcp/README.md)** - Terraform設定の説明
- **[terraform/gcp/ARCHITECTURE.md](terraform/gcp/ARCHITECTURE.md)** - アーキテクチャの詳細

---

## アーキテクチャ

```
Internet
    ↓
[Cloud Run: Frontend]
    ↓
[Cloud Run: C++ API]
    ↓
[Cloud SQL: PostgreSQL]
    ↓
[Redis: Memorystore]
```

**デプロイされるリソース:**
- Artifact Registry (Dockerイメージ保存)
- Cloud Run Services (Frontend, C++ API)
- Cloud SQL (PostgreSQL 16 データベース)
- Memorystore (Redis キャッシュ)
- IAM (サービスアカウント、Workload Identity Federation)

---

## 料金について

Cloud Runは使用量ベースの課金です:
- 0リクエスト時: ほぼ無料（最小インスタンス0）
- リクエスト数に応じて自動スケール
- 使用したリソース分のみ課金

詳細: https://cloud.google.com/run/pricing

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

### ログの確認

```bash
# C++ APIのログ
gcloud run logs read spice-road-cpp-api --region asia-northeast1 --limit 50

# Frontendのログ
gcloud run logs read spice-road-frontend --region asia-northeast1 --limit 50
```

---

## インフラの削除

すべてのリソースを削除する場合：

```bash
cd terraform/gcp
./scripts/tf-destroy.sh
```

**警告**: この操作は元に戻せません。すべてのCloud Runサービス、Cloud SQL、Redis、IAMリソースが削除されます。

---

## 参考資料

- [Terraform公式ドキュメント](https://www.terraform.io/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Authentication for Terraform | Google Cloud](https://cloud.google.com/docs/terraform/authentication)
- [asdf公式サイト](https://asdf-vm.com/)
