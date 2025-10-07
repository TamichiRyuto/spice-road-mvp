#pragma once
#include <string>
#include <vector>
#include <optional>
#include <expected>

namespace repository {

// リポジトリの共通インターフェース（テンプレート）
template<typename T>
class IRepository {
public:
    virtual ~IRepository() = default;

    // 全データ取得
    virtual std::expected<std::vector<T>, std::string> find_all() = 0;

    // ID検索
    virtual std::expected<std::optional<T>, std::string> find_by_id(const std::string& id) = 0;

    // データ追加
    virtual std::expected<T, std::string> add(const T& entity) = 0;

    // データ更新
    virtual std::expected<T, std::string> update(const T& entity) = 0;

    // データ削除
    virtual std::expected<bool, std::string> remove(const std::string& id) = 0;
};

} // namespace repository
