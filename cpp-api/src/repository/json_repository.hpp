#pragma once
#include "i_repository.hpp"
#include "../domain/shop.hpp"
#include "../domain/user.hpp"
#include <exec/static_thread_pool.hpp>
#include <string>
#include <memory>

namespace repository {

// JSONファイルベースのShopリポジトリ
class JsonShopRepository : public IRepository<domain::Shop> {
public:
    JsonShopRepository(exec::static_thread_pool& pool, std::string data);

    std::expected<std::vector<domain::Shop>, std::string> find_all() override;
    std::expected<std::optional<domain::Shop>, std::string> find_by_id(const std::string& id) override;
    std::expected<domain::Shop, std::string> add(const domain::Shop& shop) override;
    std::expected<domain::Shop, std::string> update(const domain::Shop& shop) override;
    std::expected<bool, std::string> remove(const std::string& id) override;

    // 検索機能
    std::expected<std::vector<domain::Shop>, std::string> search_by_name(const std::string& name);
    std::expected<std::vector<domain::Shop>, std::string> find_by_spice_level(const std::string& level);

private:
    exec::static_thread_pool& pool_;
    std::string json_data_;

    std::vector<domain::Shop> parse_shops(const std::string& json);
};

// JSONファイルベースのUserリポジトリ
class JsonUserRepository : public IRepository<domain::User> {
public:
    JsonUserRepository(exec::static_thread_pool& pool, std::string data);

    std::expected<std::vector<domain::User>, std::string> find_all() override;
    std::expected<std::optional<domain::User>, std::string> find_by_id(const std::string& id) override;
    std::expected<domain::User, std::string> add(const domain::User& user) override;
    std::expected<domain::User, std::string> update(const domain::User& user) override;
    std::expected<bool, std::string> remove(const std::string& id) override;

    // ユーザー検索機能
    std::expected<std::optional<domain::User>, std::string> find_by_username(const std::string& username);
    std::expected<std::optional<domain::User>, std::string> find_by_email(const std::string& email);

private:
    exec::static_thread_pool& pool_;
    std::string json_data_;

    std::vector<domain::User> parse_users(const std::string& json);
};

} // namespace repository
