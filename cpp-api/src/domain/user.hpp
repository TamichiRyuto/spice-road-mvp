#pragma once
#include <string>
#include <vector>

namespace domain {

struct User {
    std::string id;
    std::string username;
    std::string email;
    std::string preferred_spice_level;
    std::vector<std::string> favorite_shop_ids;
    std::vector<std::string> visited_shop_ids;

    // デフォルトコンストラクタ
    User() = default;

    // 全フィールドコンストラクタ
    User(std::string id, std::string username, std::string email,
         std::string preferred_spice_level,
         std::vector<std::string> favorite_shop_ids,
         std::vector<std::string> visited_shop_ids)
        : id(std::move(id))
        , username(std::move(username))
        , email(std::move(email))
        , preferred_spice_level(std::move(preferred_spice_level))
        , favorite_shop_ids(std::move(favorite_shop_ids))
        , visited_shop_ids(std::move(visited_shop_ids)) {}
};

} // namespace domain
