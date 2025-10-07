#pragma once
#include <string>
#include <vector>

namespace domain {

struct Shop {
    std::string id;
    std::string name;
    std::string address;
    std::string phone;
    std::string description;
    std::vector<std::string> spice_levels;
    double latitude;
    double longitude;
    double rating;
    std::string image_url;

    // デフォルトコンストラクタ
    Shop() = default;

    // 全フィールドコンストラクタ
    Shop(std::string id, std::string name, std::string address,
         std::string phone, std::string description,
         std::vector<std::string> spice_levels,
         double latitude, double longitude,
         double rating, std::string image_url)
        : id(std::move(id))
        , name(std::move(name))
        , address(std::move(address))
        , phone(std::move(phone))
        , description(std::move(description))
        , spice_levels(std::move(spice_levels))
        , latitude(latitude)
        , longitude(longitude)
        , rating(rating)
        , image_url(std::move(image_url)) {}
};

} // namespace domain
