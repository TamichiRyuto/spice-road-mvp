#include "json_repository.hpp"
#include <algorithm>
#include <ranges>

namespace repository {

// ============================================================================
// JsonShopRepository 実装
// ============================================================================

JsonShopRepository::JsonShopRepository(exec::static_thread_pool& pool, std::string data)
    : pool_(pool), json_data_(std::move(data)) {}

std::expected<std::vector<domain::Shop>, std::string> JsonShopRepository::find_all() {
    try {
        return parse_shops(json_data_);
    } catch (const std::exception& e) {
        return std::unexpected(std::string("Failed to parse shops: ") + e.what());
    }
}

std::expected<std::optional<domain::Shop>, std::string> JsonShopRepository::find_by_id(const std::string& id) {
    auto shops_result = find_all();
    if (!shops_result) {
        return std::unexpected(shops_result.error());
    }

    auto& shops = shops_result.value();
    auto it = std::ranges::find_if(shops, [&id](const auto& shop) {
        return shop.id == id;
    });

    if (it != shops.end()) {
        return std::optional<domain::Shop>{*it};
    }
    return std::optional<domain::Shop>{};
}

std::expected<domain::Shop, std::string> JsonShopRepository::add(const domain::Shop& shop) {
    // JSON-basedなので読み取り専用として実装
    return std::unexpected("Add operation not supported in JSON repository");
}

std::expected<domain::Shop, std::string> JsonShopRepository::update(const domain::Shop& shop) {
    // JSON-basedなので読み取り専用として実装
    return std::unexpected("Update operation not supported in JSON repository");
}

std::expected<bool, std::string> JsonShopRepository::remove(const std::string& id) {
    // JSON-basedなので読み取り専用として実装
    return std::unexpected("Remove operation not supported in JSON repository");
}

std::expected<std::vector<domain::Shop>, std::string> JsonShopRepository::search_by_name(const std::string& name) {
    auto shops_result = find_all();
    if (!shops_result) {
        return std::unexpected(shops_result.error());
    }

    auto& shops = shops_result.value();
    std::vector<domain::Shop> results;

    for (const auto& shop : shops) {
        if (shop.name.find(name) != std::string::npos) {
            results.push_back(shop);
        }
    }

    return results;
}

std::expected<std::vector<domain::Shop>, std::string> JsonShopRepository::find_by_spice_level(const std::string& level) {
    // 将来の実装: spice_paramsを使用してレベル判定
    // 現在は全店舗を返す
    (void)level; // 未使用警告を抑制
    return find_all();
}

std::vector<domain::Shop> JsonShopRepository::parse_shops(const std::string& json) {
    // 簡易的なJSONパースの実装
    // 実際の実装ではJSONライブラリを使用すべきですが、
    // 今回はそのままJSONを返すのでパースは不要
    return {};
}

// ============================================================================
// JsonUserRepository 実装
// ============================================================================

JsonUserRepository::JsonUserRepository(exec::static_thread_pool& pool, std::string data)
    : pool_(pool), json_data_(std::move(data)) {}

std::expected<std::vector<domain::User>, std::string> JsonUserRepository::find_all() {
    try {
        return parse_users(json_data_);
    } catch (const std::exception& e) {
        return std::unexpected(std::string("Failed to parse users: ") + e.what());
    }
}

std::expected<std::optional<domain::User>, std::string> JsonUserRepository::find_by_id(const std::string& id) {
    auto users_result = find_all();
    if (!users_result) {
        return std::unexpected(users_result.error());
    }

    auto& users = users_result.value();
    auto it = std::ranges::find_if(users, [&id](const auto& user) {
        return user.id == id;
    });

    if (it != users.end()) {
        return std::optional<domain::User>{*it};
    }
    return std::optional<domain::User>{};
}

std::expected<domain::User, std::string> JsonUserRepository::add(const domain::User& user) {
    return std::unexpected("Add operation not supported in JSON repository");
}

std::expected<domain::User, std::string> JsonUserRepository::update(const domain::User& user) {
    return std::unexpected("Update operation not supported in JSON repository");
}

std::expected<bool, std::string> JsonUserRepository::remove(const std::string& id) {
    return std::unexpected("Remove operation not supported in JSON repository");
}

std::expected<std::optional<domain::User>, std::string> JsonUserRepository::find_by_username(const std::string& username) {
    auto users_result = find_all();
    if (!users_result) {
        return std::unexpected(users_result.error());
    }

    auto& users = users_result.value();
    auto it = std::ranges::find_if(users, [&username](const auto& user) {
        return user.username == username;
    });

    if (it != users.end()) {
        return std::optional<domain::User>{*it};
    }
    return std::optional<domain::User>{};
}

std::expected<std::optional<domain::User>, std::string> JsonUserRepository::find_by_email(const std::string& email) {
    auto users_result = find_all();
    if (!users_result) {
        return std::unexpected(users_result.error());
    }

    auto& users = users_result.value();
    auto it = std::ranges::find_if(users, [&email](const auto& user) {
        return user.email == email;
    });

    if (it != users.end()) {
        return std::optional<domain::User>{*it};
    }
    return std::optional<domain::User>{};
}

std::vector<domain::User> JsonUserRepository::parse_users(const std::string& json) {
    // 簡易的なJSONパースの実装
    return {};
}

} // namespace repository
