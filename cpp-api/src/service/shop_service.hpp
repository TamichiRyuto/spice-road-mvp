#pragma once
#include "../repository/json_repository.hpp"
#include "../domain/shop.hpp"
#include <memory>
#include <string>
#include <vector>

namespace service {

// Shop関連のビジネスロジックを担当
class ShopService {
public:
    explicit ShopService(std::shared_ptr<repository::JsonShopRepository> repository);

    // 全店舗取得
    std::expected<std::string, std::string> get_all_shops_json();

    // ID検索
    std::expected<std::string, std::string> get_shop_by_id_json(const std::string& id);

    // 店名検索
    std::expected<std::string, std::string> search_shops_by_name_json(const std::string& name);

    // 辛さレベルで検索
    std::expected<std::string, std::string> search_shops_by_spice_level_json(const std::string& level);

    // 近隣店舗検索（緯度経度ベース）
    std::expected<std::string, std::string> find_nearby_shops_json(double latitude, double longitude, double radius_km);

private:
    std::shared_ptr<repository::JsonShopRepository> repository_;

    // ドメインオブジェクトからJSON文字列への変換
    std::string shops_to_json(const std::vector<domain::Shop>& shops);
    std::string shop_to_json(const domain::Shop& shop);

    // 距離計算（Haversine公式）
    double calculate_distance(double lat1, double lon1, double lat2, double lon2);
};

} // namespace service
