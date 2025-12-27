#pragma once
#include <string>
#include <chrono>
#include <optional>

namespace domain {

// スパイスパラメータ
struct SpiceParameters {
    int spiciness;   // 辛さ (0-100)
    int stimulation; // 刺激度 (0-100)
    int aroma;       // 香り (0-100)

    SpiceParameters() : spiciness(50), stimulation(50), aroma(50) {}
    SpiceParameters(int s, int st, int a) : spiciness(s), stimulation(st), aroma(a) {}
};

// 店舗エンティティ（PostgreSQLスキーマに対応）
struct Shop {
    std::string id;
    std::string name;
    std::string address;
    std::optional<std::string> phone;
    double latitude;
    double longitude;
    std::string region;
    SpiceParameters spice_params;
    double rating;
    std::optional<std::string> description;
    std::optional<std::string> image_url;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point updated_at;

    // デフォルトコンストラクタ
    Shop() : id(""), latitude(0.0), longitude(0.0), rating(0.0) {}

    // 全フィールドコンストラクタ
    Shop(std::string id, std::string name, std::string address,
         std::optional<std::string> phone = std::nullopt,
         double latitude = 0.0, double longitude = 0.0,
         std::string region = "",
         SpiceParameters spice_params = SpiceParameters(),
         double rating = 0.0,
         std::optional<std::string> description = std::nullopt,
         std::optional<std::string> image_url = std::nullopt)
        : id(std::move(id))
        , name(std::move(name))
        , address(std::move(address))
        , phone(std::move(phone))
        , latitude(latitude)
        , longitude(longitude)
        , region(std::move(region))
        , spice_params(spice_params)
        , rating(rating)
        , description(std::move(description))
        , image_url(std::move(image_url))
        , created_at(std::chrono::system_clock::now())
        , updated_at(std::chrono::system_clock::now()) {}
};

} // namespace domain
