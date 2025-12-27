#include "database/connection_pool.hpp"
#include <cstdlib>
#include <format>
#include <print>

namespace database {

// DatabaseConfig implementation
std::optional<DatabaseConfig> DatabaseConfig::from_env() {
    const char* host = std::getenv("DB_HOST");
    const char* port_str = std::getenv("DB_PORT");
    const char* database = std::getenv("DB_NAME");
    const char* user = std::getenv("DB_USER");
    const char* password = std::getenv("DB_PASSWORD");

    if (!host || !port_str || !database || !user || !password) {
        return std::nullopt;
    }

    int port = std::atoi(port_str);
    if (port <= 0 || port > 65535) {
        return std::nullopt;
    }

    return DatabaseConfig{
        .host = host,
        .port = port,
        .database = database,
        .user = user,
        .password = password
    };
}

std::string DatabaseConfig::connection_string() const {
    return std::format(
        "host={} port={} dbname={} user={} password={}",
        host, port, database, user, password
    );
}

// Connection implementation
Connection::Connection(std::unique_ptr<pqxx::connection> conn)
    : conn_(std::move(conn)) {}

std::expected<pqxx::result, std::string> Connection::execute(const std::string& query) {
    try {
        pqxx::nontransaction txn(*conn_);
        auto result = txn.exec(query);
        return result;
    } catch (const std::exception& e) {
        return std::unexpected(std::format("Query execution failed: {}", e.what()));
    }
}

std::expected<std::unique_ptr<pqxx::work>, std::string> Connection::begin_transaction() {
    try {
        auto txn = std::make_unique<pqxx::work>(*conn_);
        return txn;
    } catch (const std::exception& e) {
        return std::unexpected(std::format("Transaction start failed: {}", e.what()));
    }
}

bool Connection::is_connected() const {
    return conn_ && conn_->is_open();
}

pqxx::connection& Connection::raw_connection() {
    return *conn_;
}

// ConnectionPool implementation
ConnectionPool::ConnectionPool(DatabaseConfig config, size_t pool_size)
    : config_(std::move(config))
    , pool_size_(pool_size)
    , active_connections_(0) {}

ConnectionPool::ConnectionPool(ConnectionPool&& other) noexcept
    : config_(std::move(other.config_))
    , pool_size_(other.pool_size_)
    , active_connections_(other.active_connections_.load())
    , available_connections_(std::move(other.available_connections_)) {
    other.pool_size_ = 0;
    other.active_connections_ = 0;
}

ConnectionPool& ConnectionPool::operator=(ConnectionPool&& other) noexcept {
    if (this != &other) {
        std::lock_guard<std::mutex> lock1(mutex_, std::adopt_lock);
        std::lock_guard<std::mutex> lock2(other.mutex_, std::adopt_lock);

        config_ = std::move(other.config_);
        pool_size_ = other.pool_size_;
        active_connections_ = other.active_connections_.load();
        available_connections_ = std::move(other.available_connections_);

        other.pool_size_ = 0;
        other.active_connections_ = 0;
    }
    return *this;
}

std::expected<ConnectionPool, std::string> ConnectionPool::create(
    const DatabaseConfig& config,
    size_t pool_size
) {
    if (pool_size == 0) {
        return std::unexpected("Pool size must be greater than 0");
    }

    ConnectionPool pool(config, pool_size);

    if (auto init_result = pool.initialize(); !init_result.has_value()) {
        return std::unexpected(init_result.error());
    }

    return std::move(pool);
}

ConnectionPool::~ConnectionPool() {
    std::lock_guard<std::mutex> lock(mutex_);
    // すべての接続を閉じる
    while (!available_connections_.empty()) {
        available_connections_.pop();
    }
    std::println("ConnectionPool destroyed: {} connections cleaned up", pool_size_);
}

std::expected<std::unique_ptr<pqxx::connection>, std::string>
ConnectionPool::create_connection() {
    try {
        auto conn_str = config_.connection_string();
        auto conn = std::make_unique<pqxx::connection>(conn_str);

        if (!conn->is_open()) {
            return std::unexpected("Failed to open database connection");
        }

        return conn;
    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Connection creation failed: {}", e.what())
        );
    }
}

std::expected<void, std::string> ConnectionPool::initialize() {
    std::lock_guard<std::mutex> lock(mutex_);

    for (size_t i = 0; i < pool_size_; ++i) {
        auto conn_result = create_connection();
        if (!conn_result.has_value()) {
            return std::unexpected(
                std::format("Failed to initialize connection pool: {}",
                           conn_result.error())
            );
        }
        available_connections_.push(std::move(conn_result.value()));
    }

    std::println("ConnectionPool initialized: {} connections created", pool_size_);
    return {};
}

std::expected<Connection, std::string> ConnectionPool::acquire(
    std::chrono::milliseconds timeout
) {
    std::unique_lock<std::mutex> lock(mutex_);

    auto deadline = std::chrono::steady_clock::now() + timeout;

    // 利用可能な接続を待つ
    while (available_connections_.empty()) {
        if (cv_.wait_until(lock, deadline) == std::cv_status::timeout) {
            return std::unexpected("Connection acquisition timeout");
        }
    }

    // 接続を取得
    auto conn = std::move(available_connections_.front());
    available_connections_.pop();
    active_connections_++;

    // 接続が有効かチェック
    if (!conn->is_open()) {
        active_connections_--;
        return std::unexpected("Retrieved connection is not open");
    }

    return Connection(std::move(conn));
}

void ConnectionPool::release(std::unique_ptr<pqxx::connection> conn) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (conn && conn->is_open()) {
        available_connections_.push(std::move(conn));
    }

    active_connections_--;
    cv_.notify_one();
}

size_t ConnectionPool::get_available_connections() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return available_connections_.size();
}

} // namespace database
