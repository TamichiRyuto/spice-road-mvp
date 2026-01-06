# ADR-004: ユーザー登録機能のセキュリティ設計

## ステータス

**Accepted** - 2026-01-07

## コンテキスト

Spice Road MVPアプリケーションにユーザー登録機能を実装するにあたり、セキュリティ要件を明確に定義し、実装方針を決定する必要がある。

### 現行システムの状態

- **フロントエンド**: UserRegistrationForm.tsx実装済み（username, email, displayName, bio, spice preferences）
- **バックエンド**: C++ APIでダミーレスポンス返却のみ（実装前）
- **データベース**: PostgreSQL usersテーブル定義済み（UNIQUE制約、CHECK制約、インデックスあり）

### セキュリティ脅威

1. **SQLインジェクション**: 攻撃者が悪意のあるSQL文を挿入
2. **入力検証不備**: 不正なデータがデータベースに挿入される
3. **情報漏洩**: エラーメッセージから内部情報が露出
4. **シークレット漏洩**: DB_PASSWORDなど機密情報がコードに含まれる
5. **重複登録**: username/email重複時の適切なハンドリング不足

## 決定

**多層防御アプローチによる包括的セキュリティ実装**

### 1. SQLインジェクション対策

#### プリペアドステートメント（必須）

```cpp
// libpqxxのプリペアドステートメント使用
txn.exec_params(
    "INSERT INTO users (username, email, display_name, bio, "
    "pref_spiciness, pref_stimulation, pref_aroma) "
    "VALUES ($1, $2, $3, $4, $5, $6, $7)",
    username, email, display_name, bio,
    spiciness, stimulation, aroma
);
```

**根拠**:
- パラメータバインディングでSQL文とデータを分離
- 全てのユーザー入力をプレースホルダー経由で渡す
- libpqxxが自動的にエスケープ処理を実行

### 2. 入力バリデーション（サーバーサイド）

#### バリデーション仕様

| フィールド | 制約 | 正規表現 |
|-----------|------|---------|
| username | 3-100文字、英数字とアンダースコア | `^[a-zA-Z0-9_]{3,100}$` |
| email | 1-255文字、RFC 5322準拠 | `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| display_name | 1-255文字 | - |
| bio | 0-10,000文字 | - |
| preferences | 0-100の整数 | - |

**実装**:
```cpp
class UserValidator {
    static std::expected<void, std::string> validate_username(const std::string& username);
    static std::expected<void, std::string> validate_email(const std::string& email);
    static std::expected<void, std::string> validate_preference(int value);
};
```

**フロントエンドバリデーションとの関係**:
- フロントエンド: UX向上（即座にフィードバック）
- バックエンド: セキュリティ保証（信頼境界）

### 3. エラーメッセージ制御

#### 情報漏洩防止戦略

```cpp
// ログ: 詳細情報（開発者向け）
std::cerr << "Unique violation: " << e.what() << std::endl;

// クライアント: 汎用メッセージ（ユーザー向け）
return std::unexpected("Registration failed");
```

**エラーコード体系**:

| HTTPステータス | コード | メッセージ | 原因 |
|--------------|-------|----------|------|
| 400 | VALIDATION_ERROR | Invalid input | 入力検証エラー |
| 409 | CONFLICT | Registration failed | username/email重複 |
| 500 | INTERNAL_ERROR | Registration failed | データベースエラー |

### 4. 環境変数管理

#### 現行実装
```cpp
// main.cpp
const char* db_password = std::getenv("DB_PASSWORD");
```

#### セキュリティ強化（本番環境）

**GCP Secret Manager統合（将来）**:
- ローカル: `.env`ファイル（`.gitignore`で除外）
- 開発環境: Secret Manager
- 本番環境: Secret Manager + IAM認証

### 5. CORS設定

#### 現状
```cpp
"Access-Control-Allow-Origin: *"  // 全ドメイン許可（開発用）
```

#### 改善案（将来）
```cpp
std::string get_allowed_origin() {
    const char* allowed = std::getenv("ALLOWED_ORIGINS");
    return allowed ? allowed : "http://localhost:5173";
}
```

**環境別設定**:
- ローカル: `http://localhost:5173`
- 開発: `https://dev.spiceroad.example.com`
- 本番: `https://spiceroad.example.com`

## 実装詳細

### バックエンド構成

1. **UserValidator** (`cpp-api/src/validation/user_validator.hpp`)
   - ヘッダーオンリー実装
   - std::expected<void, std::string>でエラー返却
   - 正規表現による厳密なバリデーション

2. **PostgresUserRepository** (`cpp-api/src/repository/postgres_user_repository.{hpp,cpp}`)
   - IRepository<domain::User>を継承
   - プリペアドステートメントによる全クエリ実行
   - pqxx::unique_violation, pqxx::check_violationの個別ハンドリング
   - RETURNING句でINSERT後のIDとタイムスタンプを取得

3. **UserService** (`cpp-api/src/service/user_service.{hpp,cpp}`)
   - create_user_from_json()メソッド追加
   - nlohmann/jsonによるJSONパース
   - UserValidatorによる検証
   - PostgresUserRepositoryへの委譲

4. **Router** (`cpp-api/src/router/router.cpp`)
   - handle_post_user()実装
   - エラーメッセージ分類（already exists, Validation, その他）
   - 適切なHTTPステータスコード返却（201, 400, 409, 500）

5. **main.cpp** (`cpp-api/src/main.cpp`)
   - PostgresUserRepositoryの初期化
   - UserServiceへの依存性注入
   - Routerへの統合

### フロントエンド改善

1. **位置情報取得エラーハンドリング** (`frontend/src/components/GoogleMap.tsx`)
   - GeolocationPositionError.codeによる詳細分類
   - PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT別メッセージ
   - react-toastifyによる非侵襲的通知
   - タイムアウト時の自動リトライ（最大2回）
   - 精度情報の表示

2. **Toast通知** (`frontend/src/App.tsx`)
   - ToastContainerの追加
   - 位置情報取得成功時の通知
   - エラー時の詳細メッセージ表示

## 根拠

### 1. プリペアドステートメントの必然性

#### SQLインジェクション攻撃例

**脆弱なコード**:
```cpp
std::string query = "INSERT INTO users (username) VALUES ('" + username + "')";
```

**攻撃入力**:
```
username = "admin'); DROP TABLE users; --"
```

**実行されるSQL**:
```sql
INSERT INTO users (username) VALUES ('admin'); DROP TABLE users; --')
```

**プリペアドステートメントの効果**:
```cpp
txn.exec_params("INSERT INTO users (username) VALUES ($1)", username);
// 攻撃文字列は単なる文字列として扱われる
```

### 2. 多層バリデーションの必要性

**フロントエンドバリデーションだけでは不十分な理由**:
1. JavaScriptは簡単に無効化可能
2. 直接API呼び出しでバイパス可能（curl, Postmanなど）
3. ブラウザの開発者ツールで改変可能

**サーバーサイドバリデーションが必須**:
```cpp
// 信頼境界: サーバーサイドで全入力を検証
auto validation = UserValidator::validate_username(username);
if (!validation) {
    return std::unexpected(validation.error());
}
```

### 3. エラーメッセージの情報量制御

#### 悪い例（情報漏洩）
```json
{
  "error": "pqxx::unique_violation: ERROR:  duplicate key value violates unique constraint \"users_username_key\"\nDETAIL:  Key (username)=(admin) already exists.\n"
}
```

**漏洩情報**:
- データベース種類（PostgreSQL）
- テーブル構造（users_username_key）
- 既存データ（admin）

#### 良い例（適切な抽象化）
```json
{
  "error": "Registration failed",
  "code": "CONFLICT"
}
```

## 結果

### メリット

| セキュリティ対策 | 防御する脅威 | 実装コスト | 効果 |
|---------------|-----------|----------|------|
| プリペアドステートメント | SQLインジェクション | 低 | 高 |
| サーバーサイドバリデーション | 不正データ挿入 | 中 | 高 |
| エラーメッセージ制御 | 情報漏洩 | 低 | 中 |
| 環境変数管理 | シークレット漏洩 | 低 | 高 |
| 位置情報エラーハンドリング | UX向上 | 低 | 中 |

### デメリット（許容可能）

| 項目 | 影響 | 軽減策 |
|------|------|-------|
| 実装複雑性 | 開発時間増加 | テンプレート・ヘルパー関数活用 |
| パフォーマンス | わずかなオーバーヘッド | プリペアドステートメントのキャッシュ |

## 実装チェックリスト

### Phase 1: バックエンド実装
- [x] UserValidator実装
- [x] PostgresUserRepository実装
- [x] UserService::create_user_from_json実装
- [x] Router::handle_post_user実装
- [x] main.cppでの統合

### Phase 2: フロントエンド改善
- [x] react-toastifyインストール
- [x] GoogleMap.tsx エラーハンドリング強化
- [x] App.tsx ToastContainer追加

### Phase 3: E2Eテスト（実装推奨）
- [ ] ユーザー登録フローテスト
- [ ] 位置情報取得フローテスト
- [ ] API統合テスト

### Phase 4: デプロイ前チェック
- [ ] 環境変数検証（DB_PASSWORD など）
- [ ] CORS設定（本番ドメイン指定）
- [ ] エラーログ確認（機密情報が含まれていないか）
- [ ] SSL/TLS接続確認

## 参考資料

### セキュリティガイドライン
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

### 技術ドキュメント
- [libpqxx Documentation](https://pqxx.org/development/libpqxx/)
- [PostgreSQL Prepared Statements](https://www.postgresql.org/docs/16/sql-prepare.html)
- [react-toastify Documentation](https://fkhadra.github.io/react-toastify/)

## 承認

- **提案者**: Development Team
- **承認者**: Tech Lead
- **決定日**: 2026-01-07
- **レビュー予定**: 2026-04-07（3ヶ月後）

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2026-01-07 | 初版作成 | Development Team |

---

**注**: このADRはセキュリティ要件を明確に定義し、実装者が判断に迷わないようにすることを目的とする。新たな脅威が発見された場合は、このドキュメントを更新すること。
