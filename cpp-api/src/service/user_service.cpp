#include "user_service.hpp"
#include "../validation/user_validator.hpp"
#include <format>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace service {

UserService::UserService(std::shared_ptr<repository::JsonUserRepository> repository)
    : json_repository_(std::move(repository)), postgres_repository_(nullptr) {}

UserService::UserService(std::shared_ptr<repository::PostgresUserRepository> repository)
    : json_repository_(nullptr), postgres_repository_(std::move(repository)) {}

std::expected<std::string, std::string> UserService::get_all_users_json() {
    return std::unexpected("Not implemented yet");
}

std::expected<std::string, std::string> UserService::get_user_by_id_json(const std::string& id) {
    if (postgres_repository_) {
        auto result = postgres_repository_->find_by_id(id);
        if (!result) {
            return std::unexpected(result.error());
        }
        if (!result.value().has_value()) {
            return std::unexpected("User not found");
        }
        return user_to_json(result.value().value());
    } else if (json_repository_) {
        auto result = json_repository_->find_by_id(id);
        if (!result) {
            return std::unexpected(result.error());
        }
        if (!result.value().has_value()) {
            return std::unexpected("User not found");
        }
        return user_to_json(result.value().value());
    }
    return std::unexpected("No repository available");
}

std::expected<std::string, std::string> UserService::get_user_by_username_json(const std::string& username) {
    if (postgres_repository_) {
        auto result = postgres_repository_->find_by_username(username);
        if (!result) {
            return std::unexpected(result.error());
        }
        if (!result.value().has_value()) {
            return std::unexpected("User not found");
        }
        return user_to_json(result.value().value());
    } else if (json_repository_) {
        auto result = json_repository_->find_by_username(username);
        if (!result) {
            return std::unexpected(result.error());
        }
        if (!result.value().has_value()) {
            return std::unexpected("User not found");
        }
        return user_to_json(result.value().value());
    }
    return std::unexpected("No repository available");
}

std::expected<std::string, std::string> UserService::get_user_by_email_json(const std::string& email) {
    if (postgres_repository_) {
        auto result = postgres_repository_->find_by_email(email);
        if (!result) {
            return std::unexpected(result.error());
        }
        if (!result.value().has_value()) {
            return std::unexpected("User not found");
        }
        return user_to_json(result.value().value());
    } else if (json_repository_) {
        auto result = json_repository_->find_by_email(email);
        if (!result) {
            return std::unexpected(result.error());
        }
        if (!result.value().has_value()) {
            return std::unexpected("User not found");
        }
        return user_to_json(result.value().value());
    }
    return std::unexpected("No repository available");
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
        R"({{"id":"{}","username":"{}","email":"{}","spiciness":{},"stimulation":{},"aroma":{}}})",
        user.id, user.username, user.email,
        user.preferences.spiciness, user.preferences.stimulation, user.preferences.aroma
    );
}

std::expected<std::string, std::string> UserService::create_user_from_json(const std::string& json_body) {
    if (!postgres_repository_) {
        return std::unexpected("PostgreSQL repository not available");
    }

    // 1. JSONパース
    auto user_result = parse_user_json(json_body);
    if (!user_result) {
        return std::unexpected("Invalid JSON: " + user_result.error());
    }

    domain::User user = user_result.value();

    // 2. バリデーション
    auto validation_result = validate_user(user);
    if (!validation_result) {
        return std::unexpected("Validation failed: " + validation_result.error());
    }

    // 3. データベース挿入
    auto insert_result = postgres_repository_->add(user);
    if (!insert_result) {
        return std::unexpected(insert_result.error());
    }

    // 4. 成功レスポンス生成
    return user_to_json(insert_result.value());
}

std::expected<domain::User, std::string> UserService::parse_user_json(const std::string& json_body) {
    try {
        auto j = json::parse(json_body);

        domain::User user;

        // 必須フィールド
        if (!j.contains("username") || !j["username"].is_string()) {
            return std::unexpected("Missing or invalid 'username' field");
        }
        user.username = j["username"].get<std::string>();

        if (!j.contains("email") || !j["email"].is_string()) {
            return std::unexpected("Missing or invalid 'email' field");
        }
        user.email = j["email"].get<std::string>();

        // オプショナルフィールド
        if (j.contains("displayName") && j["displayName"].is_string()) {
            user.display_name = j["displayName"].get<std::string>();
        }

        if (j.contains("bio") && j["bio"].is_string()) {
            user.bio = j["bio"].get<std::string>();
        }

        // スパイス好みパラメータ
        if (j.contains("preferences") && j["preferences"].is_object()) {
            auto prefs = j["preferences"];

            if (prefs.contains("spiceParameters") && prefs["spiceParameters"].is_object()) {
                auto spice_params = prefs["spiceParameters"];

                if (spice_params.contains("spiciness") && spice_params["spiciness"].is_number_integer()) {
                    user.preferences.spiciness = spice_params["spiciness"].get<int>();
                }
                if (spice_params.contains("stimulation") && spice_params["stimulation"].is_number_integer()) {
                    user.preferences.stimulation = spice_params["stimulation"].get<int>();
                }
                if (spice_params.contains("aroma") && spice_params["aroma"].is_number_integer()) {
                    user.preferences.aroma = spice_params["aroma"].get<int>();
                }
            }
        }

        // デフォルト値
        user.is_public = true;

        return user;

    } catch (const json::parse_error& e) {
        return std::unexpected(std::format("JSON parse error: {}", e.what()));
    } catch (const json::type_error& e) {
        return std::unexpected(std::format("JSON type error: {}", e.what()));
    } catch (const std::exception& e) {
        return std::unexpected(std::format("Unexpected error: {}", e.what()));
    }
}

std::expected<void, std::string> UserService::validate_user(const domain::User& user) {
    // ユーザー名のバリデーション
    auto username_validation = validation::UserValidator::validate_username(user.username);
    if (!username_validation) {
        return std::unexpected(username_validation.error());
    }

    // メールアドレスのバリデーション
    auto email_validation = validation::UserValidator::validate_email(user.email);
    if (!email_validation) {
        return std::unexpected(email_validation.error());
    }

    // 表示名のバリデーション（オプショナル）
    if (user.display_name.has_value()) {
        auto display_name_validation = validation::UserValidator::validate_display_name(user.display_name.value());
        if (!display_name_validation) {
            return std::unexpected(display_name_validation.error());
        }
    }

    // 自己紹介のバリデーション（オプショナル）
    if (user.bio.has_value()) {
        auto bio_validation = validation::UserValidator::validate_bio(user.bio.value());
        if (!bio_validation) {
            return std::unexpected(bio_validation.error());
        }
    }

    // スパイス好みパラメータのバリデーション
    auto spiciness_validation = validation::UserValidator::validate_preference(
        user.preferences.spiciness, "Spiciness"
    );
    if (!spiciness_validation) {
        return std::unexpected(spiciness_validation.error());
    }

    auto stimulation_validation = validation::UserValidator::validate_preference(
        user.preferences.stimulation, "Stimulation"
    );
    if (!stimulation_validation) {
        return std::unexpected(stimulation_validation.error());
    }

    auto aroma_validation = validation::UserValidator::validate_preference(
        user.preferences.aroma, "Aroma"
    );
    if (!aroma_validation) {
        return std::unexpected(aroma_validation.error());
    }

    return {};
}

} // namespace service
