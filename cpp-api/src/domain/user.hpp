#pragma once
#include <string>
#include <vector>
#include <chrono>
#include <optional>

namespace domain {

// ユーザープリファレンス
struct UserPreferences {
    int spiciness;   // 好みの辛さ (0-100)
    int stimulation; // 好みの刺激度 (0-100)
    int aroma;       // 好みの香り (0-100)

    UserPreferences() : spiciness(50), stimulation(50), aroma(50) {}
    UserPreferences(int s, int st, int a) : spiciness(s), stimulation(st), aroma(a) {}
};

// ユーザーエンティティ（PostgreSQLスキーマに対応）
struct User {
    std::string id;
    std::string username;
    std::string email;
    std::optional<std::string> display_name;
    std::optional<std::string> bio;
    UserPreferences preferences;
    bool is_public;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    // デフォルトコンストラクタ
    User() : id(""), is_public(true) {}

    // 全フィールドコンストラクタ
    User(std::string id, std::string username, std::string email,
         std::optional<std::string> display_name = std::nullopt,
         std::optional<std::string> bio = std::nullopt,
         UserPreferences preferences = UserPreferences(),
         bool is_public = true)
        : id(std::move(id))
        , username(std::move(username))
        , email(std::move(email))
        , display_name(std::move(display_name))
        , bio(std::move(bio))
        , preferences(preferences)
        , is_public(is_public)
        , created_at(std::chrono::system_clock::now())
        , updated_at(std::chrono::system_clock::now()) {}
};

} // namespace domain
