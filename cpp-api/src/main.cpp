#include <print>
#include <format>
#include <chrono>
#include <csignal>
#include <atomic>
#include <fstream>
#include <sstream>
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
#include "repository/json_repository.hpp"

std::atomic<bool> running{true};

void signal_handler(int signal) {
    std::println("🛑 Received signal {}, shutting down server gracefully...", signal);
    running = false;
}

// Async file loading using stdexec sender/receiver
auto async_load_json_file(exec::static_thread_pool& pool, const std::string& filename) {
    auto sched = pool.get_scheduler();

    return stdexec::starts_on(sched, stdexec::just(filename))
         | stdexec::then([](const std::string& fname) -> std::string {
               std::string paths[] = {
                   "/app/database/" + fname,
                   "../database/" + fname,
                   "database/" + fname
               };

               for (const auto& path : paths) {
                   std::ifstream file(path);
                   if (file.is_open()) {
                       std::stringstream buffer;
                       buffer << file.rdbuf();
                       return buffer.str();
                   }
               }

               // Fallback to empty array
               return "[]";
           });
}

// Pre-load data files at startup
struct PreloadedData {
    std::string shops_json;
    std::string users_json;
};

PreloadedData load_all_data(exec::static_thread_pool& pool) {
    // Load both files concurrently using when_all
    auto work = stdexec::when_all(
        async_load_json_file(pool, "shops.json"),
        async_load_json_file(pool, "users.json")
    );

    auto [shops, users] = stdexec::sync_wait(std::move(work)).value();

    return PreloadedData{
        .shops_json = std::move(shops),
        .users_json = std::move(users)
    };
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
        std::println("🍛 Starting Spice Curry C++26 API Server with Clean Architecture");
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

        // Pre-load data files concurrently at startup
        std::println("📁 Loading data files asynchronously...");
        std::fflush(stdout);

        PreloadedData data = load_all_data(pool);

        std::println("✅ Data files loaded successfully");
        std::fflush(stdout);

        // Initialize application layers (DI)
        std::println("🏗️  Initializing application layers...");
        std::fflush(stdout);

        auto shop_repository = std::make_shared<repository::JsonShopRepository>(pool, data.shops_json);
        auto user_repository = std::make_shared<repository::JsonUserRepository>(pool, data.users_json);

        auto shop_service = std::make_shared<service::ShopService>(shop_repository);
        auto user_service = std::make_shared<service::UserService>(user_repository);

        auto router = std::make_shared<router::Router>(
            shop_service, user_service, data.shops_json, data.users_json
        );

        std::println("✅ Application layers initialized (Clean Architecture)");
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
        std::println("  - GET /api/shops - Shop data");
        std::println("  - GET /api/users - User profiles");
        std::println("⚡ Using stdexec sender/receiver async I/O");
        std::println("🏗️  Architecture: Clean Architecture (Domain/Repository/Service/Router)");

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
