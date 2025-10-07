#include "user_service.hpp"
#include <format>

namespace service {

UserService::UserService(std::shared_ptr<repository::JsonUserRepository> repository)
    : repository_(std::move(repository)) {}

std::expected<std::string, std::string> UserService::get_all_users_json() {
    return std::unexpected("Not implemented yet");
}

std::expected<std::string, std::string> UserService::get_user_by_id_json(const std::string& id) {
    auto result = repository_->find_by_id(id);
    if (!result) {
        return std::unexpected(result.error());
    }

    if (!result.value().has_value()) {
        return std::unexpected("User not found");
    }

    return user_to_json(result.value().value());
}

std::expected<std::string, std::string> UserService::get_user_by_username_json(const std::string& username) {
    auto result = repository_->find_by_username(username);
    if (!result) {
        return std::unexpected(result.error());
    }

    if (!result.value().has_value()) {
        return std::unexpected("User not found");
    }

    return user_to_json(result.value().value());
}

std::expected<std::string, std::string> UserService::get_user_by_email_json(const std::string& email) {
    auto result = repository_->find_by_email(email);
    if (!result) {
        return std::unexpected(result.error());
    }

    if (!result.value().has_value()) {
        return std::unexpected("User not found");
    }

    return user_to_json(result.value().value());
}

std::expected<std::string, std::string> UserService::create_user_json(
    const std::string& username, const std::string& email, const std::string& preferred_spice_level) {

    // 将来の拡張: データベースへの書き込み実装
    return std::unexpected("Create user not supported in JSON repository");
}

std::string UserService::users_to_json(const std::vector<domain::User>& users) {
    std::string json = "[";
    for (size_t i = 0; i < users.size(); ++i) {
        if (i > 0) json += ",";
        json += user_to_json(users[i]);
    }
    json += "]";
    return json;
}

std::string UserService::user_to_json(const domain::User& user) {
    return std::format(
        R"({{"id":"{}","username":"{}","email":"{}","preferred_spice_level":"{}"}})",
        user.id, user.username, user.email, user.preferred_spice_level
    );
}

} // namespace service
