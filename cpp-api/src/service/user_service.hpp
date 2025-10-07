#pragma once
#include "../repository/json_repository.hpp"
#include "../domain/user.hpp"
#include <memory>
#include <string>
#include <vector>

namespace service {

// User関連のビジネスロジックを担当
class UserService {
public:
    explicit UserService(std::shared_ptr<repository::JsonUserRepository> repository);

    // 全ユーザー取得
    std::expected<std::string, std::string> get_all_users_json();

    // ID検索
    std::expected<std::string, std::string> get_user_by_id_json(const std::string& id);

    // ユーザー名検索
    std::expected<std::string, std::string> get_user_by_username_json(const std::string& username);

    // メールアドレス検索
    std::expected<std::string, std::string> get_user_by_email_json(const std::string& email);

    // ユーザー追加（将来の拡張用）
    std::expected<std::string, std::string> create_user_json(const std::string& username,
                                                               const std::string& email,
                                                               const std::string& preferred_spice_level);

private:
    std::shared_ptr<repository::JsonUserRepository> repository_;

    // ドメインオブジェクトからJSON文字列への変換
    std::string users_to_json(const std::vector<domain::User>& users);
    std::string user_to_json(const domain::User& user);
};

} // namespace service
