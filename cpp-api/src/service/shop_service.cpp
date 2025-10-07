#include "shop_service.hpp"
#include <format>
#include <cmath>
#include <numbers>

namespace service {

ShopService::ShopService(std::shared_ptr<repository::JsonShopRepository> repository)
    : repository_(std::move(repository)) {}

std::expected<std::string, std::string> ShopService::get_all_shops_json() {
    // リポジトリから全データ取得は現在のJSONベースでは不要なので
    // 直接JSON文字列を返す実装に変更する必要があるが、
    // 今回は単純にリポジトリのJSON文字列を返す
    return std::unexpected("Not implemented yet");
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
    auto result = repository_->search_by_name(name);
    if (!result) {
        return std::unexpected(result.error());
    }

    return shops_to_json(result.value());
}

std::expected<std::string, std::string> ShopService::search_shops_by_spice_level_json(const std::string& level) {
    auto result = repository_->find_by_spice_level(level);
    if (!result) {
        return std::unexpected(result.error());
    }

    return shops_to_json(result.value());
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
        R"({{"id":"{}","name":"{}","address":"{}","phone":"{}","description":"{}","latitude":{},"longitude":{},"rating":{},"image_url":"{}"}})",
        shop.id, shop.name, shop.address, shop.phone, shop.description,
        shop.latitude, shop.longitude, shop.rating, shop.image_url
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
