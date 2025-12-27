#pragma once
#include <string>
#include <memory>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <expected>
#include <optional>
#include <chrono>
#include <pqxx/pqxx>

namespace database {

// データベース接続設定
struct DatabaseConfig {
    std::string host;
    int port;
    std::string database;
    std::string user;
    std::string password;

    // 環境変数から設定を読み込む
    static std::optional<DatabaseConfig> from_env();

    // 接続文字列を生成
    std::string connection_string() const;
};

// RAII ラッパーでPostgreSQL接続を管理
class Connection {
public:
    explicit Connection(std::unique_ptr<pqxx::connection> conn);
    ~Connection() = default;

    // コピー禁止、ムーブ可能
    Connection(const Connection&) = delete;
    Connection& operator=(const Connection&) = delete;
    Connection(Connection&&) noexcept = default;
    Connection& operator=(Connection&&) noexcept = default;

    // クエリ実行
    std::expected<pqxx::result, std::string> execute(const std::string& query);

    // トランザクション開始
    std::expected<std::unique_ptr<pqxx::work>, std::string> begin_transaction();

    // 接続状態確認
    bool is_connected() const;

    // 生の接続オブジェクトへのアクセス（必要時のみ）
    pqxx::connection& raw_connection();

private:
    std::unique_ptr<pqxx::connection> conn_;
};

// コネクションプール
class ConnectionPool {
public:
    // プールの作成
    static std::expected<ConnectionPool, std::string> create(
        const DatabaseConfig& config,
        size_t pool_size
    );

    ~ConnectionPool();

    // コピー禁止、ムーブ可能
    ConnectionPool(const ConnectionPool&) = delete;
    ConnectionPool& operator=(const ConnectionPool&) = delete;
    ConnectionPool(ConnectionPool&& other) noexcept;
    ConnectionPool& operator=(ConnectionPool&& other) noexcept;

    // 接続を取得（タイムアウト付き）
    std::expected<Connection, std::string> acquire(
        std::chrono::milliseconds timeout = std::chrono::milliseconds(5000)
    );

    // 統計情報
    size_t get_pool_size() const { return pool_size_; }
    size_t get_active_connections() const { return active_connections_; }
    size_t get_available_connections() const;

private:
    ConnectionPool(DatabaseConfig config, size_t pool_size);

    // 新しい接続を作成
    std::expected<std::unique_ptr<pqxx::connection>, std::string> create_connection();

    // プールを初期化
    std::expected<void, std::string> initialize();

    // 接続を返却（RAIIパターンで自動）
    void release(std::unique_ptr<pqxx::connection> conn);

    DatabaseConfig config_;
    size_t pool_size_;
    std::atomic<size_t> active_connections_;

    mutable std::mutex mutex_;
    std::condition_variable cv_;
    std::queue<std::unique_ptr<pqxx::connection>> available_connections_;

    friend class Connection;
};

} // namespace database
