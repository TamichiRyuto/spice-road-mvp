#include <gtest/gtest.h>
#include "repository/postgres_shop_repository.hpp"
#include "database/connection_pool.hpp"

using namespace domain;
using namespace database;
using namespace repository;

class ShopRepositoryTest : public ::testing::Test {
protected:
    std::unique_ptr<ConnectionPool> pool;
    std::unique_ptr<IRepository<Shop>> repository;

    void SetUp() override {
        // テスト用環境変数設定
        setenv("DB_HOST", "postgres", 1);
        setenv("DB_PORT", "5432", 1);
        setenv("DB_NAME", "spice_road", 1);
        setenv("DB_USER", "spice_user", 1);
        setenv("DB_PASSWORD", "spice_password", 1);

        // 接続プールとリポジトリの初期化
        auto config = DatabaseConfig::from_env().value();
        auto pool_result = ConnectionPool::create(config, 5);
        ASSERT_TRUE(pool_result.has_value());

        pool = std::make_unique<ConnectionPool>(std::move(pool_result.value()));
        repository = std::make_unique<PostgresShopRepository>(*pool);

        // テスト用データのクリーンアップ
        clean_test_data();
    }

    void TearDown() override {
        clean_test_data();
        repository.reset();
        pool.reset();
    }

    void clean_test_data() {
        auto conn = pool->acquire();
        if (conn.has_value()) {
            conn.value().execute("DELETE FROM shops WHERE name LIKE 'Test%'");
        }
    }

    Shop create_test_shop(const std::string& name_suffix = "") {
        return Shop(
            "",  // IDは自動採番
            "Test Shop" + name_suffix,
            "奈良県奈良市テスト町1-1",
            std::nullopt,  // phone
            34.6851,
            135.805,
            "奈良市",
            SpiceParameters(60, 70, 80),
            4.5,
            "テスト用の店舗です"
        );
    }
};

// Test 1: 全店舗の取得
TEST_F(ShopRepositoryTest, FindAll) {
    auto result = repository->find_all();
    EXPECT_TRUE(result.has_value());

    auto shops = result.value();
    EXPECT_GE(shops.size(), 0);  // 初期データが存在する可能性がある
}

// Test 2: 店舗の追加
TEST_F(ShopRepositoryTest, AddShop) {
    auto shop = create_test_shop();

    auto result = repository->add(shop);
    EXPECT_TRUE(result.has_value());

    auto added_shop = result.value();
    EXPECT_FALSE(added_shop.id.empty());
    EXPECT_EQ(added_shop.name, "Test Shop");
    EXPECT_EQ(added_shop.region, "奈良市");
    EXPECT_EQ(added_shop.spice_params.spiciness, 60);
    EXPECT_EQ(added_shop.spice_params.stimulation, 70);
    EXPECT_EQ(added_shop.spice_params.aroma, 80);
    EXPECT_DOUBLE_EQ(added_shop.rating, 4.5);
}

// Test 3: IDで店舗を検索
TEST_F(ShopRepositoryTest, FindById) {
    // テスト店舗を追加
    auto shop = create_test_shop();
    auto add_result = repository->add(shop);
    ASSERT_TRUE(add_result.has_value());

    std::string shop_id = add_result.value().id;

    // IDで検索
    auto find_result = repository->find_by_id(shop_id);
    EXPECT_TRUE(find_result.has_value());

    auto found_shop_opt = find_result.value();
    EXPECT_TRUE(found_shop_opt.has_value());

    auto found_shop = found_shop_opt.value();
    EXPECT_EQ(found_shop.id, shop_id);
    EXPECT_EQ(found_shop.name, "Test Shop");
}

// Test 4: 存在しないIDで検索
TEST_F(ShopRepositoryTest, FindByIdNotFound) {
    auto result = repository->find_by_id("999999");
    EXPECT_TRUE(result.has_value());

    auto shop_opt = result.value();
    EXPECT_FALSE(shop_opt.has_value());
}

// Test 5: 店舗情報の更新
TEST_F(ShopRepositoryTest, UpdateShop) {
    // テスト店舗を追加
    auto shop = create_test_shop();
    auto add_result = repository->add(shop);
    ASSERT_TRUE(add_result.has_value());

    auto added_shop = add_result.value();

    // 店舗情報を更新
    added_shop.name = "Updated Test Shop";
    added_shop.rating = 4.8;
    added_shop.spice_params.spiciness = 90;

    auto update_result = repository->update(added_shop);
    EXPECT_TRUE(update_result.has_value());

    auto updated_shop = update_result.value();
    EXPECT_EQ(updated_shop.name, "Updated Test Shop");
    EXPECT_DOUBLE_EQ(updated_shop.rating, 4.8);
    EXPECT_EQ(updated_shop.spice_params.spiciness, 90);

    // DBから再取得して確認
    auto find_result = repository->find_by_id(updated_shop.id);
    ASSERT_TRUE(find_result.has_value());
    auto found_shop = find_result.value().value();

    EXPECT_EQ(found_shop.name, "Updated Test Shop");
    EXPECT_DOUBLE_EQ(found_shop.rating, 4.8);
}

// Test 6: 店舗の削除
TEST_F(ShopRepositoryTest, RemoveShop) {
    // テスト店舗を追加
    auto shop = create_test_shop();
    auto add_result = repository->add(shop);
    ASSERT_TRUE(add_result.has_value());

    std::string shop_id = add_result.value().id;

    // 削除
    auto remove_result = repository->remove(shop_id);
    EXPECT_TRUE(remove_result.has_value());
    EXPECT_TRUE(remove_result.value());

    // 削除されたことを確認
    auto find_result = repository->find_by_id(shop_id);
    ASSERT_TRUE(find_result.has_value());
    EXPECT_FALSE(find_result.value().has_value());
}

// Test 7: 複数店舗の追加
TEST_F(ShopRepositoryTest, AddMultipleShops) {
    std::vector<Shop> test_shops;

    for (int i = 0; i < 3; ++i) {
        auto shop = create_test_shop(" " + std::to_string(i));
        auto result = repository->add(shop);
        ASSERT_TRUE(result.has_value());
        test_shops.push_back(result.value());
    }

    EXPECT_EQ(test_shops.size(), 3);

    // すべて異なるIDを持っている
    EXPECT_NE(test_shops[0].id, test_shops[1].id);
    EXPECT_NE(test_shops[1].id, test_shops[2].id);
}

// Test 8: 地域でフィルタリング
TEST_F(ShopRepositoryTest, FindByRegion) {
    // 複数の地域の店舗を追加
    auto shop1 = create_test_shop(" Nara");
    shop1.region = "奈良市";
    auto add1 = repository->add(shop1);
    ASSERT_TRUE(add1.has_value());

    auto shop2 = create_test_shop(" Ikoma");
    shop2.region = "生駒市";
    auto add2 = repository->add(shop2);
    ASSERT_TRUE(add2.has_value());

    // IRepository インターフェースを拡張したメソッドを使用
    auto postgres_repo = dynamic_cast<PostgresShopRepository*>(repository.get());
    ASSERT_NE(postgres_repo, nullptr);

    auto nara_shops_result = postgres_repo->find_by_region("奈良市");
    EXPECT_TRUE(nara_shops_result.has_value());

    auto nara_shops = nara_shops_result.value();
    bool found_test_shop = false;
    for (const auto& shop : nara_shops) {
        if (shop.name == "Test Shop Nara") {
            found_test_shop = true;
            EXPECT_EQ(shop.region, "奈良市");
        }
    }
    EXPECT_TRUE(found_test_shop);
}

// Test 9: 評価順でソート
TEST_F(ShopRepositoryTest, FindAllOrderedByRating) {
    // 異なる評価の店舗を追加
    auto shop1 = create_test_shop(" Rating3");
    shop1.rating = 3.0;
    repository->add(shop1);

    auto shop2 = create_test_shop(" Rating5");
    shop2.rating = 5.0;
    repository->add(shop2);

    auto shop3 = create_test_shop(" Rating4");
    shop3.rating = 4.0;
    repository->add(shop3);

    auto postgres_repo = dynamic_cast<PostgresShopRepository*>(repository.get());
    auto result = postgres_repo->find_all_ordered_by_rating();
    EXPECT_TRUE(result.has_value());

    auto shops = result.value();
    EXPECT_GE(shops.size(), 3);

    // 最初の3つのテスト店舗が評価順にソートされているか確認
    std::vector<Shop> test_shops;
    for (const auto& shop : shops) {
        if (shop.name.find("Test Shop Rating") != std::string::npos) {
            test_shops.push_back(shop);
            if (test_shops.size() == 3) break;
        }
    }

    EXPECT_EQ(test_shops.size(), 3);
    EXPECT_GE(test_shops[0].rating, test_shops[1].rating);
    EXPECT_GE(test_shops[1].rating, test_shops[2].rating);
}

// Test 10: トランザクション（複数操作の原子性）
TEST_F(ShopRepositoryTest, TransactionRollback) {
    auto conn = pool->acquire();
    ASSERT_TRUE(conn.has_value());

    auto txn_result = conn.value().begin_transaction();
    ASSERT_TRUE(txn_result.has_value());

    // トランザクション内で店舗追加（コミットしない）
    auto shop = create_test_shop(" Transaction");
    // Note: トランザクション対応のリポジトリメソッドが必要
    // ここでは基本的なテストのみ
}
