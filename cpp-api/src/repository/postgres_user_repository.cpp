#include "repository/postgres_user_repository.hpp"
#include <format>
#include <print>
#include <iostream>

namespace repository {

PostgresUserRepository::PostgresUserRepository(database::ConnectionPool& pool)
    : pool_(pool) {}

domain::User PostgresUserRepository::row_to_user(const pqxx::row& row) {
    domain::User user;

    user.id = row["id"].as<std::string>();
    user.username = row["username"].as<std::string>();
    user.email = row["email"].as<std::string>();

    // オプショナルフィールド
    if (!row["display_name"].is_null()) {
        user.display_name = row["display_name"].as<std::string>();
    }

    if (!row["bio"].is_null()) {
        user.bio = row["bio"].as<std::string>();
    }

    // スパイス好みパラメータ
    if (!row["pref_spiciness"].is_null()) {
        user.preferences.spiciness = row["pref_spiciness"].as<int>();
    }
    if (!row["pref_stimulation"].is_null()) {
        user.preferences.stimulation = row["pref_stimulation"].as<int>();
    }
    if (!row["pref_aroma"].is_null()) {
        user.preferences.aroma = row["pref_aroma"].as<int>();
    }

    user.is_public = row["is_public"].as<bool>();

    return user;
}

std::expected<std::vector<domain::User>, std::string>
PostgresUserRepository::find_all() {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    const std::string query = R"(
        SELECT id, username, email, display_name, bio,
               pref_spiciness, pref_stimulation, pref_aroma,
               is_public, created_at, updated_at
        FROM users
        ORDER BY id
    )";

    auto result = conn.execute(query);
    if (!result.has_value()) {
        return std::unexpected(result.error());
    }

    std::vector<domain::User> users;
    users.reserve(result.value().size());

    for (const auto& row : result.value()) {
        users.push_back(row_to_user(row));
    }

    return users;
}

std::expected<std::optional<domain::User>, std::string>
PostgresUserRepository::find_by_id(const std::string& id) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            SELECT id, username, email, display_name, bio,
                   pref_spiciness, pref_stimulation, pref_aroma,
                   is_public, created_at, updated_at
            FROM users
            WHERE id = $1
        )";

        auto result = txn.exec_params(query, id);

        if (result.empty()) {
            return std::optional<domain::User>{};
        }

        return row_to_user(result[0]);

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to find user by id: {}", e.what())
        );
    }
}

std::expected<domain::User, std::string>
PostgresUserRepository::add(const domain::User& user) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        // プリペアドステートメント（SQLインジェクション対策）
        const std::string query = R"(
            INSERT INTO users (username, email, display_name, bio,
                             pref_spiciness, pref_stimulation, pref_aroma, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at, updated_at
        )";

        auto result = txn.exec_params(
            query,
            user.username,
            user.email,
            user.display_name.value_or(""),
            user.bio.value_or(""),
            user.preferences.spiciness,
            user.preferences.stimulation,
            user.preferences.aroma,
            user.is_public
        );

        txn.commit();

        if (result.empty()) {
            return std::unexpected("Insert failed: no rows returned");
        }

        // 挿入されたユーザーを返す
        domain::User inserted_user = user;
        inserted_user.id = result[0]["id"].as<std::string>();

        return inserted_user;

    } catch (const pqxx::unique_violation& e) {
        // UNIQUE制約違反（username or email重複）
        // ログには詳細、クライアントには汎用メッセージ
        std::cerr << "Unique violation: " << e.what() << std::endl;
        return std::unexpected("User already exists");

    } catch (const pqxx::check_violation& e) {
        // CHECK制約違反（preferences範囲外）
        std::cerr << "Check violation: " << e.what() << std::endl;
        return std::unexpected("Invalid data: values out of range");

    } catch (const pqxx::sql_error& e) {
        // その他のSQLエラー
        std::cerr << "SQL error: " << e.what() << std::endl;
        return std::unexpected("Database error occurred");

    } catch (const std::exception& e) {
        std::cerr << "Unexpected error: " << e.what() << std::endl;
        return std::unexpected("Internal server error");
    }
}

std::expected<domain::User, std::string>
PostgresUserRepository::update(const domain::User& user) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            UPDATE users
            SET username = $2, email = $3, display_name = $4, bio = $5,
                pref_spiciness = $6, pref_stimulation = $7, pref_aroma = $8,
                is_public = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, username, email, display_name, bio,
                      pref_spiciness, pref_stimulation, pref_aroma,
                      is_public, created_at, updated_at
        )";

        auto result = txn.exec_params(
            query,
            user.id,
            user.username,
            user.email,
            user.display_name.value_or(""),
            user.bio.value_or(""),
            user.preferences.spiciness,
            user.preferences.stimulation,
            user.preferences.aroma,
            user.is_public
        );

        txn.commit();

        if (result.empty()) {
            return std::unexpected("Update failed: user not found");
        }

        return row_to_user(result[0]);

    } catch (const pqxx::unique_violation& e) {
        std::cerr << "Unique violation: " << e.what() << std::endl;
        return std::unexpected("User already exists");

    } catch (const pqxx::sql_error& e) {
        std::cerr << "SQL error: " << e.what() << std::endl;
        return std::unexpected("Database error occurred");

    } catch (const std::exception& e) {
        std::cerr << "Unexpected error: " << e.what() << std::endl;
        return std::unexpected("Internal server error");
    }
}

std::expected<bool, std::string>
PostgresUserRepository::remove(const std::string& id) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = "DELETE FROM users WHERE id = $1";
        auto result = txn.exec_params(query, id);

        txn.commit();

        return result.affected_rows() > 0;

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to remove user: {}", e.what())
        );
    }
}

std::expected<std::optional<domain::User>, std::string>
PostgresUserRepository::find_by_username(const std::string& username) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            SELECT id, username, email, display_name, bio,
                   pref_spiciness, pref_stimulation, pref_aroma,
                   is_public, created_at, updated_at
            FROM users
            WHERE username = $1
        )";

        auto result = txn.exec_params(query, username);

        if (result.empty()) {
            return std::optional<domain::User>{};
        }

        return row_to_user(result[0]);

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to find user by username: {}", e.what())
        );
    }
}

std::expected<std::optional<domain::User>, std::string>
PostgresUserRepository::find_by_email(const std::string& email) {
    auto conn_result = pool_.acquire();
    if (!conn_result.has_value()) {
        return std::unexpected(conn_result.error());
    }

    auto& conn = conn_result.value();

    try {
        pqxx::work txn(conn.raw_connection());

        const std::string query = R"(
            SELECT id, username, email, display_name, bio,
                   pref_spiciness, pref_stimulation, pref_aroma,
                   is_public, created_at, updated_at
            FROM users
            WHERE email = $1
        )";

        auto result = txn.exec_params(query, email);

        if (result.empty()) {
            return std::optional<domain::User>{};
        }

        return row_to_user(result[0]);

    } catch (const std::exception& e) {
        return std::unexpected(
            std::format("Failed to find user by email: {}", e.what())
        );
    }
}

} // namespace repository
