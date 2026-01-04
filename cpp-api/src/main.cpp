#include <print>
#include <format>
#include <chrono>
#include <csignal>
#include <atomic>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <fcntl.h>
#include <memory>
#include <cstdlib>
#include <string>

// stdexec headers
#include <stdexec/execution.hpp>
#include <exec/static_thread_pool.hpp>

// Application層
#include "router/router.hpp"
#include "service/shop_service.hpp"
#include "service/user_service.hpp"
#include "repository/postgres_shop_repository.hpp"
#include "database/connection_pool.hpp"

std::atomic<bool> running{true};

void signal_handler(int signal) {
    std::println("Received signal {}, shutting down server gracefully...", signal);
    running = false;
}

// Async request handling using sender/receiver pattern
auto async_handle_request(exec::static_thread_pool& pool, int client_socket,
                          std::shared_ptr<router::Router> router) {
    auto sched = pool.get_scheduler();

    return stdexec::starts_on(sched, stdexec::just(client_socket))
         | stdexec::then([router](int sock) -> std::pair<int, std::string> {
               char buffer[4096];
               ssize_t bytes_read = recv(sock, buffer, sizeof(buffer) - 1, 0);

               std::string http_response;

               if (bytes_read > 0) {
                   buffer[bytes_read] = '\0';
                   std::string request(buffer);

                   // Routerを使ってリクエスト処理
                   http_response = router->route(request);
               }

               return std::make_pair(sock, http_response);
           })
         | stdexec::then([](std::pair<int, std::string> result) {
               auto [sock, response] = result;
               send(sock, response.c_str(), response.length(), 0);
               close(sock);
               return sock;
           });
}

int main() {
    try {
        std::println("🍛 Starting Spice Curry C++26 API Server with PostgreSQL");
        std::fflush(stdout);

        signal(SIGINT, signal_handler);
        signal(SIGTERM, signal_handler);

        // Create thread pool with hardware concurrency threads
        const auto num_threads = std::thread::hardware_concurrency();
        std::println("🔧 Creating thread pool with {} threads...", num_threads);
        std::fflush(stdout);

        exec::static_thread_pool pool(num_threads);
        std::println("🔧 Thread pool initialized successfully");
        std::fflush(stdout);

        // Initialize PostgreSQL connection pool
        std::println("🗄️  Initializing PostgreSQL connection pool...");
        std::fflush(stdout);

        auto db_config = database::DatabaseConfig::from_env();
        if (!db_config.has_value()) {
            std::println("❌ Failed to load database configuration from environment");
            std::println("   Required environment variables:");
            std::println("   - DB_HOST (default: localhost)");
            std::println("   - DB_PORT (default: 5432)");
            std::println("   - DB_NAME (default: spice_road)");
            std::println("   - DB_USER (default: postgres)");
            std::println("   - DB_PASSWORD (required)");
            return 1;
        }

        auto connection_pool_result = database::ConnectionPool::create(db_config.value(), 10);
        if (!connection_pool_result.has_value()) {
            std::println("❌ Failed to create connection pool: {}", connection_pool_result.error());
            return 1;
        }

        auto connection_pool = std::move(connection_pool_result.value());
        std::println("✅ PostgreSQL connection pool initialized (size: {})", connection_pool.get_pool_size());
        std::fflush(stdout);

        // Initialize application layers (DI)
        std::println("🏗️  Initializing application layers...");
        std::fflush(stdout);

        auto shop_repository = std::make_shared<repository::PostgresShopRepository>(connection_pool);
        auto shop_service = std::make_shared<service::ShopService>(shop_repository);

        // Note: UserRepository is not yet implemented for PostgreSQL
        // For now, we'll pass nullptr for user_service
        auto router = std::make_shared<router::Router>(
            shop_service, nullptr, "", ""
        );

        std::println("✅ Application layers initialized (Clean Architecture + PostgreSQL)");
        std::fflush(stdout);

        // Socket setup
        std::println("🔌 Creating socket...");
        std::fflush(stdout);

        int server_socket = socket(AF_INET, SOCK_STREAM, 0);
        if (server_socket < 0) {
            std::println("❌ Failed to create socket");
            return 1;
        }

        int opt = 1;
        setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        // Set socket to non-blocking mode
        int flags = fcntl(server_socket, F_GETFL, 0);
        fcntl(server_socket, F_SETFL, flags | O_NONBLOCK);

        // Read port from environment variable (Cloud Run requirement)
        // Priority: PORT > API_PORT > default 8080
        int port = 8080;
        const char* port_env = std::getenv("PORT");
        if (!port_env) {
            port_env = std::getenv("API_PORT");
        }
        if (port_env) {
            try {
                port = std::stoi(std::string(port_env));
            } catch (...) {
                std::println("⚠️  Invalid port value, using default 8080");
            }
        }

        sockaddr_in server_addr{};
        server_addr.sin_family = AF_INET;
        server_addr.sin_addr.s_addr = INADDR_ANY;
        server_addr.sin_port = htons(port);

        std::println("🔌 Binding to port {}...", port);
        std::fflush(stdout);

        if (bind(server_socket, (sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
            std::println("❌ Failed to bind to port {}", port);
            close(server_socket);
            return 1;
        }

        if (listen(server_socket, 128) < 0) {
            std::println("❌ Failed to listen on socket");
            close(server_socket);
            return 1;
        }

        std::println("🚀 C++26 API Server running on 0.0.0.0:{}", port);
        std::fflush(stdout);
        std::println("📊 Available endpoints:");
        std::println("  - GET /health - Health check");
        std::println("  - GET /metrics - Performance metrics");
        std::println("  - GET /api/shops - Shop data (PostgreSQL)");
        std::println("⚡ Using stdexec sender/receiver async I/O");
        std::println("🏗️  Architecture: Clean Architecture (Domain/Repository/Service/Router)");
        std::println("🗄️  Database: PostgreSQL with connection pool");

        while (running) {
            sockaddr_in client_addr{};
            socklen_t client_len = sizeof(client_addr);

            int client_socket = accept(server_socket, (sockaddr*)&client_addr, &client_len);
            if (client_socket >= 0) {
                // Launch async request handling using sender/receiver
                auto request_sender = async_handle_request(pool, client_socket, router);
                stdexec::start_detached(std::move(request_sender));
            }

            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        }

        close(server_socket);
        std::println("✅ Server stopped gracefully");

    } catch (const std::exception& e) {
        std::println("❌ Server failed: {}", e.what());
        return 1;
    }

    return 0;
}
