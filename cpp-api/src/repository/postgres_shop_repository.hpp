#pragma once
#include "repository/i_repository.hpp"
#include "domain/shop.hpp"
#include "database/connection_pool.hpp"
#include <memory>

namespace repository {

// PostgreSQL実装のShopリポジトリ
class PostgresShopRepository : public IRepository<domain::Shop> {
public:
    explicit PostgresShopRepository(database::ConnectionPool& pool);
    ~PostgresShopRepository() override = default;

    // IRepository interface
    std::expected<std::vector<domain::Shop>, std::string> find_all() override;
    std::expected<std::optional<domain::Shop>, std::string> find_by_id(const std::string& id) override;
    std::expected<domain::Shop, std::string> add(const domain::Shop& entity) override;
    std::expected<domain::Shop, std::string> update(const domain::Shop& entity) override;
    std::expected<bool, std::string> remove(const std::string& id) override;

    // 拡張メソッド（PostgreSQL固有）
    std::expected<std::vector<domain::Shop>, std::string> find_by_region(const std::string& region);
    std::expected<std::vector<domain::Shop>, std::string> find_all_ordered_by_rating();
    std::expected<std::vector<domain::Shop>, std::string> find_by_spice_range(
        int min_spiciness, int max_spiciness
    );

private:
    database::ConnectionPool& pool_;

    // pqxx::row から Shop エンティティへの変換
    domain::Shop row_to_shop(const pqxx::row& row);
};

} // namespace repository
