#include "router.hpp"
#include <format>
#include <algorithm>
#include <sstream>

namespace router {

Router::Router(std::shared_ptr<service::ShopService> shop_service,
               std::shared_ptr<service::UserService> user_service,
               std::string shops_json,
               std::string users_json)
    : shop_service_(std::move(shop_service))
    , user_service_(std::move(user_service))
    , shops_json_(std::move(shops_json))
    , users_json_(std::move(users_json)) {}

std::string Router::route(std::string_view request) {
    std::string full_path = extract_path(request);
    std::string method = extract_method(request);

    // クエリパラメータを分離
    auto query_pos = full_path.find('?');
    std::string path = (query_pos != std::string::npos) ? full_path.substr(0, query_pos) : full_path;
    auto query_params = extract_query_params(full_path);

    // OpenAPI準拠のRESTful ルーティング
    // Health & Monitoring endpoints
    if ((path == "/health" || path == "/api/health") && method == "GET") {
        return handle_health();
    }
    else if ((path == "/metrics" || path == "/api/metrics") && method == "GET") {
        return handle_metrics();
    }
    // OpenAPI specification endpoint
    else if (path == "/api/openapi.yaml" && method == "GET") {
        return handle_openapi_spec();
    }
    // Shops endpoints
    else if (path == "/api/shops" && method == "GET") {
        return handle_get_shops(query_params);
    }
    else if (path.starts_with("/api/shops/") && method == "GET") {
        auto shop_id = extract_path_param(path, "/api/shops/");
        if (shop_id) {
            return handle_get_shop_by_id(*shop_id);
        }
    }
    // Users endpoints
    else if (path == "/api/users" && method == "GET") {
        return handle_get_users();
    }
    else if (path == "/api/users" && method == "POST") {
        std::string body = extract_body(request);
        return handle_post_user(body);
    }
    else if (path.starts_with("/api/users/") && method == "GET") {
        auto user_id = extract_path_param(path, "/api/users/");
        if (user_id) {
            return handle_get_user_by_id(*user_id);
        }
    }

    // 404 Not Found
    return handle_not_found();
}

std::string Router::handle_health() {
    return create_json_response(
        R"({"status":"OK","message":"Spice Curry C++26 API Server with stdexec","timestamp":"2024-01-01T00:00:00Z"})"
    );
}

std::string Router::handle_metrics() {
    return create_json_response(
        R"({"api":"C++26","stdexec":"active","async":"sender-receiver","architecture":"clean"})"
    );
}

std::string Router::handle_get_shops(const std::unordered_map<std::string, std::string>& query_params) {
    // TODO: クエリパラメータでフィルタリング (region, minRating)
    // 現在は全件返却
    return create_json_response(shops_json_);
}

std::string Router::handle_get_shop_by_id(const std::string& shop_id) {
    // TODO: JSONから特定のshopを検索
    // 現在は簡易実装
    if (shops_json_.find("\"id\":\"" + shop_id + "\"") != std::string::npos) {
        // 本来はJSONパースして該当shopのみ返すべき
        return create_json_response(shops_json_);
    }
    return create_error_response("Shop not found", 404, "NOT_FOUND");
}

std::string Router::handle_get_users() {
    return create_json_response(users_json_);
}

std::string Router::handle_post_user(std::string_view body) {
    // TODO: ユーザー登録処理実装
    // 現在は簡易レスポンス
    return create_json_response(
        R"({"id":"new-user","username":"testuser","email":"test@example.com","createdAt":"2024-01-01T00:00:00Z"})",
        201
    );
}

std::string Router::handle_get_user_by_id(const std::string& user_id) {
    // TODO: JSONから特定のuserを検索
    if (users_json_.find("\"id\":\"" + user_id + "\"") != std::string::npos) {
        return create_json_response(users_json_);
    }
    return create_error_response("User not found", 404, "NOT_FOUND");
}

std::string Router::handle_openapi_spec() {
    // OpenAPI仕様ファイルを返す (静的ファイルとして読み込むべき)
    return create_response(
        "openapi: 3.0.3\ninfo:\n  title: Spice Curry Nara API\n  version: 1.0.0",
        200,
        "text/yaml"
    );
}

std::string Router::handle_not_found() {
    return create_error_response("Endpoint not found", 404, "NOT_FOUND");
}

const char* Router::status_code_to_string(int code) {
    switch (code) {
        case 200: return "OK";
        case 201: return "Created";
        case 400: return "Bad Request";
        case 404: return "Not Found";
        case 500: return "Internal Server Error";
        default: return "Unknown";
    }
}

std::string Router::create_response(const std::string& body, int status_code, const std::string& content_type) {
    return std::format(
        "HTTP/1.1 {} {}\r\n"
        "Content-Type: {}\r\n"
        "Content-Length: {}\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
        "Connection: close\r\n"
        "\r\n"
        "{}",
        status_code,
        status_code_to_string(status_code),
        content_type,
        body.length(),
        body
    );
}

std::string Router::create_json_response(const std::string& json, int status_code) {
    return create_response(json, status_code, "application/json");
}

std::string Router::create_error_response(const std::string& message, int status_code, const std::string& error_code) {
    std::string json;
    if (error_code.empty()) {
        json = std::format(R"({{"error":"{}"}})", message);
    } else {
        json = std::format(R"({{"error":"{}","code":"{}"}})", message, error_code);
    }
    return create_response(json, status_code, "application/json");
}

std::string Router::extract_path(std::string_view request) {
    // "GET /path HTTP/1.1" の形式から /path を抽出
    size_t start = request.find(' ');
    if (start == std::string_view::npos) return "/";

    start++; // スペースの次の文字
    size_t end = request.find(' ', start);
    if (end == std::string_view::npos) return "/";

    return std::string(request.substr(start, end - start));
}

std::string Router::extract_method(std::string_view request) {
    // "GET /path HTTP/1.1" の形式から GET を抽出
    size_t end = request.find(' ');
    if (end == std::string_view::npos) return "GET";

    return std::string(request.substr(0, end));
}

std::string Router::extract_body(std::string_view request) {
    // HTTPリクエストボディを抽出 (空行の後)
    size_t body_start = request.find("\r\n\r\n");
    if (body_start == std::string_view::npos) {
        body_start = request.find("\n\n");
        if (body_start == std::string_view::npos) {
            return "";
        }
        return std::string(request.substr(body_start + 2));
    }
    return std::string(request.substr(body_start + 4));
}

std::unordered_map<std::string, std::string> Router::extract_query_params(std::string_view path) {
    std::unordered_map<std::string, std::string> params;

    auto query_pos = path.find('?');
    if (query_pos == std::string_view::npos) {
        return params;
    }

    std::string query_string(path.substr(query_pos + 1));
    std::stringstream ss;
    ss.str(query_string);
    std::string pair;

    while (std::getline(ss, pair, '&')) {
        auto eq_pos = pair.find('=');
        if (eq_pos != std::string::npos) {
            std::string key = pair.substr(0, eq_pos);
            std::string value = pair.substr(eq_pos + 1);
            params[key] = value;
        }
    }

    return params;
}

std::optional<std::string> Router::extract_path_param(std::string_view path, std::string_view prefix) {
    if (!path.starts_with(prefix)) {
        return std::nullopt;
    }

    std::string_view param = path.substr(prefix.length());
    // クエリパラメータを除去
    auto query_pos = param.find('?');
    if (query_pos != std::string_view::npos) {
        param = param.substr(0, query_pos);
    }

    if (param.empty()) {
        return std::nullopt;
    }

    return std::string(param);
}

} // namespace router
