# GitHub Actions ワークフロー テンプレート

このドキュメントは、Terraform を使用してバックエンド・フロントエンドを継続的にデプロイするための GitHub Actions ワークフローの基本構造とテンプレートを提供します。

## 基本構造

```yaml
name: ワークフロー名

# トリガー設定
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:  # 手動実行

# 環境変数（全ジョブ共通）
env:
  VARIABLE_NAME: value

# ジョブ定義
jobs:
  job-name:
    name: 表示名
    runs-on: ubuntu-latest

    # 権限設定（重要！）
    permissions:
      contents: read
      id-token: write

    # このジョブの出力値
    outputs:
      output-name: ${{ steps.step-id.outputs.value }}

    steps:
      - name: ステップ名
        uses: action-name@version
        with:
          parameter: value

      - name: シェルコマンド実行
        run: |
          echo "複数行の"
          echo "コマンド"

      - name: 環境変数設定
        run: echo "VAR_NAME=value" >> $GITHUB_ENV

      - name: 出力値設定
        id: step-id
        run: echo "value=something" >> $GITHUB_OUTPUT

  dependent-job:
    needs: job-name  # 依存関係
    runs-on: ubuntu-latest
    steps:
      - name: 前のジョブの出力を使用
        run: echo "${{ needs.job-name.outputs.output-name }}"
```

---

## 必要な GitHub Actions（公式）

### 1. GCP 認証

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
```

### 2. gcloud CLI セットアップ

```yaml
- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v2
```

### 3. Terraform セットアップ

```yaml
- name: Setup Terraform
  uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: 1.6.6
    terraform_wrapper: false  # Output取得時に重要
```

### 4. コードチェックアウト

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    submodules: recursive  # git submodule がある場合
```

---

## Terraform コマンド例

```yaml
- name: Terraform Init
  run: terraform init
  working-directory: ./terraform/gcp

- name: Terraform Plan
  run: |
    terraform plan \
      -var="project_id=${{ secrets.GCP_PROJECT_ID }}" \
      -var="google_maps_api_key=${{ secrets.GOOGLE_MAPS_API_KEY }}" \
      -out=tfplan
  working-directory: ./terraform/gcp

- name: Terraform Apply
  run: terraform apply -auto-approve tfplan
  working-directory: ./terraform/gcp

- name: Get Terraform Outputs
  id: tf-output
  run: |
    SERVICE_URL=$(terraform output -raw cpp_api_service_url)
    echo "service_url=$SERVICE_URL" >> $GITHUB_OUTPUT
  working-directory: ./terraform/gcp
```

---

## GitHub Secrets 設定

リポジトリの `Settings → Secrets and variables → Actions` で以下を設定:

| Secret 名 | 説明 | 例 |
|-----------|------|-----|
| `GCP_PROJECT_ID` | GCP プロジェクト ID | `my-project-12345` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Provider の完全パス | `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | サービスアカウントのメールアドレス | `deploy-sa@my-project.iam.gserviceaccount.com` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API キー | `AIzaSy...` |

### Workload Identity Provider の取得方法

```bash
# Terraform outputs から取得
cd terraform/gcp
terraform output workload_identity_provider
```

### Service Account の取得方法

```bash
# Terraform outputs から取得
terraform output service_account_email
```

---

## ワークフロー設計パターン

### パターン1: 単一ジョブ（シンプル）

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
      - name: Auth to GCP
      - name: Setup Terraform
      - name: Terraform Init
      - name: Terraform Plan
      - name: Terraform Apply
```

### パターン2: 環境別デプロイ（dev/prod）

```yaml
on:
  push:
    branches:
      - develop    # dev環境
      - main       # prod環境

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Set environment
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "ENVIRONMENT=prod" >> $GITHUB_ENV
          else
            echo "ENVIRONMENT=dev" >> $GITHUB_ENV
          fi

      - name: Terraform Apply
        run: |
          terraform apply -auto-approve \
            -var="environment=${{ env.ENVIRONMENT }}"
```

### パターン3: PR時はplan、マージ後はapply

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init

      - name: Terraform Plan
        if: github.event_name == 'pull_request'
        run: terraform plan

      - name: Terraform Apply
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve
```

### パターン4: マルチジョブ（並列・依存関係）

```yaml
jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    outputs:
      plan-exitcode: ${{ steps.plan.outputs.exitcode }}
    steps:
      - name: Terraform Plan
        id: plan
        run: terraform plan -detailed-exitcode

  terraform-apply:
    needs: terraform-plan
    if: needs.terraform-plan.outputs.plan-exitcode == '2'
    runs-on: ubuntu-latest
    steps:
      - name: Terraform Apply
        run: terraform apply -auto-approve

  notify:
    needs: terraform-apply
    runs-on: ubuntu-latest
    steps:
      - name: Send notification
        run: echo "Deployment complete!"
```

---

## よくある問題と解決方法

### 問題1: Terraform の出力値を取得できない

**悪い例:**
```yaml
- run: terraform output service_url
```

**良い例:**
```yaml
- id: tf-output
  run: |
    SERVICE_URL=$(terraform output -raw cpp_api_service_url)
    echo "service_url=$SERVICE_URL" >> $GITHUB_OUTPUT
```

### 問題2: terraform_wrapper による出力の問題

`hashicorp/setup-terraform` はデフォルトで wrapper を使用し、出力に余計な情報が含まれます。

**解決方法:**
```yaml
- uses: hashicorp/setup-terraform@v3
  with:
    terraform_wrapper: false  # これを追加
```

### 問題3: マルチライン文字列の扱い

```yaml
# HEREDOC を使用
- run: |
    cat <<'EOF' > file.txt
    複数行の
    内容
    変数: ${{ secrets.VALUE }}
    EOF
```

### 問題4: Terraform state のロック

複数のワークフローが同時実行されると state がロックされます。

**解決方法: GCS バックエンド設定**

`terraform/gcp/backend.tf`:
```hcl
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "terraform/state"
  }
}
```

### 問題5: 権限エラー

```yaml
permissions:
  contents: read      # リポジトリの読み取り
  id-token: write     # Workload Identity 認証に必要
  pull-requests: write # PR にコメント投稿する場合
```

---

## Terraform 変数の渡し方

### 方法1: コマンドラインで指定

```yaml
- run: |
    terraform apply -auto-approve \
      -var="project_id=${{ secrets.GCP_PROJECT_ID }}" \
      -var="enable_cloud_build=true" \
      -var="google_maps_api_key=${{ secrets.GOOGLE_MAPS_API_KEY }}"
```

### 方法2: 環境変数（TF_VAR_ プレフィックス）

```yaml
env:
  TF_VAR_project_id: ${{ secrets.GCP_PROJECT_ID }}
  TF_VAR_enable_cloud_build: true
  TF_VAR_google_maps_api_key: ${{ secrets.GOOGLE_MAPS_API_KEY }}

steps:
  - run: terraform apply -auto-approve
```

### 方法3: tfvars ファイルを生成

```yaml
- name: Create terraform.tfvars
  run: |
    cat <<EOF > terraform.tfvars
    project_id = "${{ secrets.GCP_PROJECT_ID }}"
    enable_cloud_build = true
    google_maps_api_key = "${{ secrets.GOOGLE_MAPS_API_KEY }}"
    EOF
  working-directory: ./terraform/gcp

- run: terraform apply -auto-approve
```

---

## このプロジェクト用の考慮事項

### Terraform の enable_cloud_build について

**オプションA: Cloud Build を使用（`enable_cloud_build=true`）**
- Terraform が GitHub からコードをクローンして Docker イメージをビルド
- シンプルだが、初回デプロイに時間がかかる（20-30分）

**オプションB: 事前ビルド（`enable_cloud_build=false`）**
- GitHub Actions で Docker イメージをビルド＆プッシュ
- Terraform には image URL のみ渡す
- より柔軟だが、ワークフローが複雑になる

### ジョブ構成の例

**シンプル版:**
```
terraform-deploy:
  - terraform init
  - terraform plan
  - terraform apply (enable_cloud_build=true)
```

**詳細版:**
```
build-images:
  - Build C++ API Docker image
  - Build Frontend Docker image
  - Push to Artifact Registry

terraform-deploy:
  needs: build-images
  - terraform init
  - terraform plan (with image URLs)
  - terraform apply (enable_cloud_build=false)
```

---

## 参考ドキュメント

- **GitHub Actions 構文**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **google-github-actions/auth**: https://github.com/google-github-actions/auth
- **google-github-actions/setup-gcloud**: https://github.com/google-github-actions/setup-gcloud
- **hashicorp/setup-terraform**: https://github.com/hashicorp/setup-terraform
- **Terraform GitHub Actions**: https://developer.hashicorp.com/terraform/tutorials/automation/github-actions
- **Workload Identity Federation**: https://cloud.google.com/iam/docs/workload-identity-federation

---

## チェックリスト

実装前に確認すべき項目:

- [ ] GitHub Secrets が全て設定されている
- [ ] Workload Identity Federation が設定されている
- [ ] Service Account に必要な権限がある
  - Artifact Registry Writer
  - Cloud Run Admin
  - Cloud SQL Admin
  - Secret Manager Accessor
- [ ] Terraform backend (GCS) が設定されている
- [ ] git submodule が正しくチェックアウトされる設定になっている
- [ ] Docker イメージのビルド方法を決めている（Cloud Build or GitHub Actions）
- [ ] 環境変数（dev/prod）の管理方法を決めている
- [ ] エラー発生時の通知方法を決めている

---

## デバッグのヒント

### ワークフローのログを詳しく見る

```yaml
- name: Debug - Show environment
  run: |
    echo "GitHub ref: ${{ github.ref }}"
    echo "Event name: ${{ github.event_name }}"
    env | sort
```

### Terraform の詳細ログを有効化

```yaml
env:
  TF_LOG: DEBUG
```

### ステップが失敗しても続行

```yaml
- name: Terraform Plan
  continue-on-error: true
  run: terraform plan
```

### 特定のブランチでのみ実行

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: terraform apply -auto-approve
```
