#include "repository/postgres_shop_repository.hpp"
#include <format>
#include <print>

namespace repository {

PostgresShopRepository::PostgresShopRepository(database::ConnectionPool& pool)
    : pool_(pool) {}

domain::Shop PostgresShopRepository::row_to_shop(const pqxx::row& row) {
    domain::Shop shop;

    shop.id = row["id"].as<std::string>();
    shop.name = row["name"].as<std::string>();
    shop.address = row["address"].as<std::string>();
    shop.latitude = row["latitude"].as<double>();
    shop.longitude = row["longitude"].as<double>();
    shop.region = row["region"].as<std::string>();

    // スパイスパラメータ
    shop.spice_params.spiciness = row["spiciness"].as<int>();
    shop.spice_params.stimulation = row["stimulation"].as<int>();
    shop.spice_params.aroma = row["aroma"].as<int>();

    shop.rating = row["rating"].as<double>();

    // オプショナルフィールド
    if (!row["description"].is_null()) {
        shop.description = row["description"].as<std::string>();
    }

    return shop;
}

std::expected<std::vector<domain::Shop>, std::string>
PostgresShopRepository::find_all() {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    const std::string query = R"(
        SELECT id, name, address, latitude, longitude, region,
               spiciness, stimulation, aroma, rating, description,
               created_at, updated_at
        FROM shops
        ORDER BY id
    )";

    auto result = conn.execute(query);
    if (!result.has_value()) {
        return std::unexpected(result.error());
    }

    std::vector<domain::Shop> shops;
    shops.reserve(result.value().size());

    for (const auto& row : result.value()) {
        shops.push_back(row_to_shop(row));
    }

    return shops;
}

std::expected<std::optional<domain::Shop>, std::string>
PostgresShopRepository::find_by_id(const std::string& id) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            SELECT id, name, address, latitude, longitude, region,
                   spiciness, stimulation, aroma, rating, description,
                   created_at, updated_at
            FROM shops
            WHERE id = $1
        )";

        auto result = txn.exec_params(query, id);

        if (result.empty()) {
            return std::optional<domain::Shop>{};
        }

        return row_to_shop(result[0]);

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to find shop by id: {}", e.what())
        );
    }
}

std::expected<domain::Shop, std::string>
PostgresShopRepository::add(const domain::Shop& entity) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            INSERT INTO shops (name, address, latitude, longitude, region,
                             spiciness, stimulation, aroma, rating, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, name, address, latitude, longitude, region,
                     spiciness, stimulation, aroma, rating, description,
                     created_at, updated_at
        )";

        auto result = txn.exec_params(
            query,
            entity.name,
            entity.address,
            entity.latitude,
            entity.longitude,
            entity.region,
            entity.spice_params.spiciness,
            entity.spice_params.stimulation,
            entity.spice_params.aroma,
            entity.rating,
            entity.description
        );

        txn.commit();

        if (result.empty()) {
            return std::unexpected("Failed to insert shop: no rows returned");
        }

        return row_to_shop(result[0]);

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to add shop: {}", e.what())
        );
    }
}

std::expected<domain::Shop, std::string>
PostgresShopRepository::update(const domain::Shop& entity) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            UPDATE shops
            SET name = $2,
                address = $3,
                latitude = $4,
                longitude = $5,
                region = $6,
                spiciness = $7,
                stimulation = $8,
                aroma = $9,
                rating = $10,
                description = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, name, address, latitude, longitude, region,
                     spiciness, stimulation, aroma, rating, description,
                     created_at, updated_at
        )";

        auto result = txn.exec_params(
            query,
            entity.id,
            entity.name,
            entity.address,
            entity.latitude,
            entity.longitude,
            entity.region,
            entity.spice_params.spiciness,
            entity.spice_params.stimulation,
            entity.spice_params.aroma,
            entity.rating,
            entity.description
        );

        txn.commit();

        if (result.empty()) {
            return std::unexpected(
                std::format("Shop with id {} not found", entity.id)
            );
        }

        return row_to_shop(result[0]);

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to update shop: {}", e.what())
        );
    }
}

std::expected<bool, std::string>
PostgresShopRepository::remove(const std::string& id) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = "DELETE FROM shops WHERE id = $1";

        auto result = txn.exec_params(query, id);

        txn.commit();

        return result.affected_rows() > 0;

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to remove shop: {}", e.what())
        );
    }
}

// 拡張メソッド実装

std::expected<std::vector<domain::Shop>, std::string>
PostgresShopRepository::find_by_region(const std::string& region) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            SELECT id, name, address, latitude, longitude, region,
                   spiciness, stimulation, aroma, rating, description,
                   created_at, updated_at
            FROM shops
            WHERE region = $1
            ORDER BY rating DESC
        )";

        auto result = txn.exec_params(query, region);

        std::vector<domain::Shop> shops;
        shops.reserve(result.size());

        for (const auto& row : result) {
            shops.push_back(row_to_shop(row));
        }

        return shops;

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to find shops by region: {}", e.what())
        );
    }
}

std::expected<std::vector<domain::Shop>, std::string>
PostgresShopRepository::find_all_ordered_by_rating() {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    const std::string query = R"(
        SELECT id, name, address, latitude, longitude, region,
               spiciness, stimulation, aroma, rating, description,
               created_at, updated_at
        FROM shops
        ORDER BY rating DESC, id ASC
    )";

    auto result = conn.execute(query);
    if (!result.has_value()) {
        return std::unexpected(result.error());
    }

    std::vector<domain::Shop> shops;
    shops.reserve(result.value().size());

    for (const auto& row : result.value()) {
        shops.push_back(row_to_shop(row));
    }

    return shops;
}

std::expected<std::vector<domain::Shop>, std::string>
PostgresShopRepository::find_by_spice_range(int min_spiciness, int max_spiciness) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            SELECT id, name, address, latitude, longitude, region,
                   spiciness, stimulation, aroma, rating, description,
                   created_at, updated_at
            FROM shops
            WHERE spiciness BETWEEN $1 AND $2
            ORDER BY spiciness DESC, rating DESC
        )";

        auto result = txn.exec_params(query, min_spiciness, max_spiciness);

        std::vector<domain::Shop> shops;
        shops.reserve(result.size());

        for (const auto& row : result) {
            shops.push_back(row_to_shop(row));
        }

        return shops;

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to find shops by spice range: {}", e.what())
        );
    }
}

} // namespace repository
