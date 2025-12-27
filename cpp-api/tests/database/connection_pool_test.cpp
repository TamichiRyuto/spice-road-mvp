#include <gtest/gtest.h>
#include "database/connection_pool.hpp"
#include <thread>
#include <vector>

using namespace database;

class ConnectionPoolTest : public ::testing::Test {
protected:
    void SetUp() override {
        // テスト用環境変数
        setenv("DB_HOST", "postgres", 1);
        setenv("DB_PORT", "5432", 1);
        setenv("DB_NAME", "spice_road", 1);
        setenv("DB_USER", "spice_user", 1);
        setenv("DB_PASSWORD", "spice_password", 1);
    }

    void TearDown() override {
        // 環境変数のクリーンアップ
        unsetenv("DB_HOST");
        unsetenv("DB_PORT");
        unsetenv("DB_NAME");
        unsetenv("DB_USER");
        unsetenv("DB_PASSWORD");
    }
};

// Test 1: 接続プールの初期化
TEST_F(ConnectionPoolTest, InitializeConnectionPool) {
    auto config = DatabaseConfig::from_env();
    EXPECT_TRUE(config.has_value());

    auto pool_result = ConnectionPool::create(config.value(), 5);
    EXPECT_TRUE(pool_result.has_value());

    auto& pool = pool_result.value();
    EXPECT_EQ(pool.get_pool_size(), 5);
    EXPECT_EQ(pool.get_active_connections(), 0);
}

// Test 2: 接続の取得と返却
TEST_F(ConnectionPoolTest, AcquireAndReleaseConnection) {
    auto config = DatabaseConfig::from_env().value();
    auto pool = ConnectionPool::create(config, 3).value();

    // 接続を取得
    auto conn_result = pool.acquire();
    EXPECT_TRUE(conn_result.has_value());

    EXPECT_EQ(pool.get_active_connections(), 1);
    EXPECT_EQ(pool.get_available_connections(), 2);

    {
        auto conn = std::move(conn_result.value());
        // 接続を使用
        EXPECT_TRUE(conn.is_connected());
    }

    // 接続が自動的に返却される（RAIIパターン）
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    EXPECT_EQ(pool.get_active_connections(), 0);
    EXPECT_EQ(pool.get_available_connections(), 3);
}

// Test 3: 複数の接続を同時取得
TEST_F(ConnectionPoolTest, MultipleConnectionsAcquisition) {
    auto config = DatabaseConfig::from_env().value();
    auto pool = ConnectionPool::create(config, 5).value();

    std::vector<Connection> connections;

    // 3つの接続を取得
    for (int i = 0; i < 3; ++i) {
        auto conn_result = pool.acquire();
        EXPECT_TRUE(conn_result.has_value());
        connections.push_back(std::move(conn_result.value()));
    }

    EXPECT_EQ(pool.get_active_connections(), 3);
    EXPECT_EQ(pool.get_available_connections(), 2);

    // すべて解放
    connections.clear();
    std::this_thread::sleep_for(std::chrono::milliseconds(10));

    EXPECT_EQ(pool.get_active_connections(), 0);
    EXPECT_EQ(pool.get_available_connections(), 5);
}

// Test 4: プールサイズを超える接続リクエスト
TEST_F(ConnectionPoolTest, ExceedPoolSize) {
    auto config = DatabaseConfig::from_env().value();
    auto pool = ConnectionPool::create(config, 2).value();

    auto conn1 = pool.acquire();
    auto conn2 = pool.acquire();

    EXPECT_TRUE(conn1.has_value());
    EXPECT_TRUE(conn2.has_value());

    // 3つ目の接続はタイムアウト（1秒待機）
    auto start = std::chrono::steady_clock::now();
    auto conn3 = pool.acquire(std::chrono::seconds(1));
    auto end = std::chrono::steady_clock::now();

    EXPECT_FALSE(conn3.has_value());
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    EXPECT_GE(duration.count(), 900); // 最低900ms待機
}

// Test 5: 接続のヘルスチェック
TEST_F(ConnectionPoolTest, ConnectionHealthCheck) {
    auto config = DatabaseConfig::from_env().value();
    auto pool = ConnectionPool::create(config, 3).value();

    auto conn_result = pool.acquire();
    EXPECT_TRUE(conn_result.has_value());

    auto& conn = conn_result.value();
    EXPECT_TRUE(conn.is_connected());

    // 簡単なクエリでヘルスチェック
    auto result = conn.execute("SELECT 1");
    EXPECT_TRUE(result.has_value());
}

// Test 6: マルチスレッド環境での接続取得
TEST_F(ConnectionPoolTest, ConcurrentAccess) {
    auto config = DatabaseConfig::from_env().value();
    auto pool = ConnectionPool::create(config, 10).value();

    std::atomic<int> success_count{0};
    std::atomic<int> failure_count{0};

    auto worker = [&]() {
        for (int i = 0; i < 10; ++i) {
            auto conn = pool.acquire();
            if (conn.has_value()) {
                success_count++;
                // 簡単なクエリを実行
                auto result = conn.value().execute("SELECT 1");
                EXPECT_TRUE(result.has_value());
                std::this_thread::sleep_for(std::chrono::milliseconds(10));
            } else {
                failure_count++;
            }
        }
    };

    // 5つのスレッドで並行アクセス
    std::vector<std::thread> threads;
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back(worker);
    }

    for (auto& t : threads) {
        t.join();
    }

    EXPECT_GT(success_count, 0);
    std::cout << "Success: " << success_count << ", Failure: " << failure_count << std::endl;
}

// Test 7: 無効な接続設定でのエラーハンドリング
TEST_F(ConnectionPoolTest, InvalidConfiguration) {
    DatabaseConfig invalid_config{
        .host = "invalid_host",
        .port = 5432,
        .database = "invalid_db",
        .user = "invalid_user",
        .password = "invalid_pass"
    };

    auto pool_result = ConnectionPool::create(invalid_config, 3);
    EXPECT_FALSE(pool_result.has_value());
    EXPECT_FALSE(pool_result.error().empty());
}

// Test 8: 接続プールの破棄時の適切なクリーンアップ
TEST_F(ConnectionPoolTest, ProperCleanupOnDestruction) {
    auto config = DatabaseConfig::from_env().value();

    {
        auto pool = ConnectionPool::create(config, 5).value();
        auto conn1 = pool.acquire();
        auto conn2 = pool.acquire();

        EXPECT_EQ(pool.get_active_connections(), 2);
        // プールがスコープを抜けると自動的にすべての接続が閉じられる
    }

    // 新しいプールを作成できる（前のプールの接続が正しくクリーンアップされた証拠）
    auto new_pool = ConnectionPool::create(config, 5);
    EXPECT_TRUE(new_pool.has_value());
}
