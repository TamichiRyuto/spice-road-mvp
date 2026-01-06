#pragma once
#include "repository/i_repository.hpp"
#include "domain/user.hpp"
#include "database/connection_pool.hpp"
#include <memory>

namespace repository {

// PostgreSQL実装のUserリポジトリ
class PostgresUserRepository : public IRepository<domain::User> {
public:
    explicit PostgresUserRepository(database::ConnectionPool& pool);
    ~PostgresUserRepository() override = default;

    // IRepository interface
    std::expected<std::vector<domain::User>, std::string> find_all() override;
    std::expected<std::optional<domain::User>, std::string> find_by_id(const std::string& id) override;
    std::expected<domain::User, std::string> add(const domain::User& entity) override;
    std::expected<domain::User, std::string> update(const domain::User& entity) override;
    std::expected<bool, std::string> remove(const std::string& id) override;

    // 拡張メソッド（PostgreSQL固有）
    std::expected<std::optional<domain::User>, std::string> find_by_username(const std::string& username);
    std::expected<std::optional<domain::User>, std::string> find_by_email(const std::string& email);

private:
    database::ConnectionPool& pool_;

    // pqxx::row から User エンティティへの変換
    domain::User row_to_user(const pqxx::row& row);
};

} // namespace repository
