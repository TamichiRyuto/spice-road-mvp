#pragma once
#include "../service/shop_service.hpp"
#include "../service/user_service.hpp"
#include <string>
#include <memory>
#include <string_view>
#include <optional>
#include <unordered_map>

namespace router {

// HTTPリクエストのルーティングとレスポンス生成を担当
// OpenAPI 3.0 準拠のRESTful APIルーター
class Router {
public:
    Router(std::shared_ptr<service::ShopService> shop_service,
           std::shared_ptr<service::UserService> user_service,
           std::string shops_json,
           std::string users_json);

    // HTTPリクエストをルーティングしてレスポンスを生成
    std::string route(std::string_view request);

private:
    std::shared_ptr<service::ShopService> shop_service_;
    std::shared_ptr<service::UserService> user_service_;
    std::string shops_json_;
    std::string users_json_;

    // エンドポイントハンドラー (OpenAPI準拠)
    std::string handle_health();
    std::string handle_metrics();
    std::string handle_get_shops(const std::unordered_map<std::string, std::string>& query_params);
    std::string handle_get_shop_by_id(const std::string& shop_id);
    std::string handle_get_users();
    std::string handle_post_user(std::string_view body);
    std::string handle_get_user_by_id(const std::string& user_id);
    std::string handle_openapi_spec();
    std::string handle_not_found();

    // HTTPレスポンス生成
    std::string create_response(const std::string& body, int status_code = 200, const std::string& content_type = "application/json");
    std::string create_json_response(const std::string& json, int status_code = 200);
    std::string create_error_response(const std::string& message, int status_code = 500, const std::string& error_code = "");

    // リクエストパース
    std::string extract_path(std::string_view request);
    std::string extract_method(std::string_view request);
    std::string extract_body(std::string_view request);
    std::unordered_map<std::string, std::string> extract_query_params(std::string_view path);
    std::optional<std::string> extract_path_param(std::string_view path, std::string_view prefix);

    // ステータスコード変換
    const char* status_code_to_string(int code);
};

} // namespace router
