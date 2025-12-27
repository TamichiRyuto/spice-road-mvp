#include "shop_service.hpp"
#include <format>
#include <cmath>
#include <numbers>

namespace service {

ShopService::ShopService(std::shared_ptr<repository::IRepository<domain::Shop>> repository)
    : repository_(std::move(repository)) {}

std::expected<std::string, std::string> ShopService::get_all_shops_json() {
    auto result = repository_->find_all();
    if (!result) {
        return std::unexpected(result.error());
    }
    return shops_to_json(result.value());
}

std::expected<std::string, std::string> ShopService::get_shop_by_id_json(const std::string& id) {
    auto result = repository_->find_by_id(id);
    if (!result) {
        return std::unexpected(result.error());
    }

    if (!result.value().has_value()) {
        return std::unexpected("Shop not found");
    }

    return shop_to_json(result.value().value());
}

std::expected<std::string, std::string> ShopService::search_shops_by_name_json(const std::string& name) {
    // Get all shops and filter by name
    auto all_shops_result = repository_->find_all();
    if (!all_shops_result) {
        return std::unexpected(all_shops_result.error());
    }

    std::vector<domain::Shop> filtered_shops;
    for (const auto& shop : all_shops_result.value()) {
        if (shop.name.find(name) != std::string::npos) {
            filtered_shops.push_back(shop);
        }
    }

    return shops_to_json(filtered_shops);
}

std::expected<std::string, std::string> ShopService::search_shops_by_spice_level_json(const std::string& level) {
    // Parse level and filter shops by spiciness
    int spice_level = 0;
    try {
        spice_level = std::stoi(level);
    } catch (...) {
        return std::unexpected("Invalid spice level");
    }

    auto all_shops_result = repository_->find_all();
    if (!all_shops_result) {
        return std::unexpected(all_shops_result.error());
    }

    std::vector<domain::Shop> filtered_shops;
    for (const auto& shop : all_shops_result.value()) {
        if (shop.spice_params.spiciness >= spice_level) {
            filtered_shops.push_back(shop);
        }
    }

    return shops_to_json(filtered_shops);
}

std::expected<std::string, std::string> ShopService::find_nearby_shops_json(
    double latitude, double longitude, double radius_km) {

    auto all_shops_result = repository_->find_all();
    if (!all_shops_result) {
        return std::unexpected(all_shops_result.error());
    }

    std::vector<domain::Shop> nearby_shops;
    for (const auto& shop : all_shops_result.value()) {
        double distance = calculate_distance(latitude, longitude, shop.latitude, shop.longitude);
        if (distance <= radius_km) {
            nearby_shops.push_back(shop);
        }
    }

    return shops_to_json(nearby_shops);
}

std::string ShopService::shops_to_json(const std::vector<domain::Shop>& shops) {
    std::string json = "[";
    for (size_t i = 0; i < shops.size(); ++i) {
        if (i > 0) json += ",";
        json += shop_to_json(shops[i]);
    }
    json += "]";
    return json;
}

std::string ShopService::shop_to_json(const domain::Shop& shop) {
    return std::format(
        R"({{"id":"{}","name":"{}","address":"{}","phone":"{}","latitude":{},"longitude":{},"region":"{}","spiciness":{},"stimulation":{},"aroma":{},"rating":{},"description":"{}","image_url":"{}"}})",
        shop.id, shop.name, shop.address,
        shop.phone.value_or(""),
        shop.latitude, shop.longitude, shop.region,
        shop.spice_params.spiciness, shop.spice_params.stimulation, shop.spice_params.aroma,
        shop.rating,
        shop.description.value_or(""),
        shop.image_url.value_or("")
    );
}

double ShopService::calculate_distance(double lat1, double lon1, double lat2, double lon2) {
    const double R = 6371.0; // 地球の半径（km）

    double phi1 = lat1 * std::numbers::pi / 180.0;
    double phi2 = lat2 * std::numbers::pi / 180.0;
    double delta_phi = (lat2 - lat1) * std::numbers::pi / 180.0;
    double delta_lambda = (lon2 - lon1) * std::numbers::pi / 180.0;

    double a = std::sin(delta_phi / 2.0) * std::sin(delta_phi / 2.0) +
               std::cos(phi1) * std::cos(phi2) *
               std::sin(delta_lambda / 2.0) * std::sin(delta_lambda / 2.0);

    double c = 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));

    return R * c;
}

} // namespace service
