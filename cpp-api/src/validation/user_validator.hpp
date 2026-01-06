#pragma once
#include <string>
#include <expected>
#include <regex>

namespace validation {

class UserValidator {
public:
    // ユーザー名のバリデーション
    // 3-100文字、英数字とアンダースコアのみ
    static std::expected<void, std::string> validate_username(const std::string& username) {
        if (username.empty() || username.length() < 3) {
            return std::unexpected("Username must be at least 3 characters");
        }
        if (username.length() > 100) {
            return std::unexpected("Username must not exceed 100 characters");
        }

        // 英数字とアンダースコアのみ
        std::regex pattern("^[a-zA-Z0-9_]+$");
        if (!std::regex_match(username, pattern)) {
            return std::unexpected("Username contains invalid characters");
        }

        return {};
    }

    // メールアドレスのバリデーション
    // 1-255文字、RFC 5322準拠（簡易版）
    static std::expected<void, std::string> validate_email(const std::string& email) {
        if (email.empty()) {
            return std::unexpected("Email is required");
        }
        if (email.length() > 255) {
            return std::unexpected("Email must not exceed 255 characters");
        }

        // 簡易的なメールアドレス検証
        std::regex pattern("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
        if (!std::regex_match(email, pattern)) {
            return std::unexpected("Invalid email format");
        }

        return {};
    }

    // スパイス好みパラメータのバリデーション
    // 0-100の範囲チェック
    static std::expected<void, std::string> validate_preference(int value, const std::string& field) {
        if (value < 0 || value > 100) {
            return std::unexpected(field + " must be between 0 and 100");
        }
        return {};
    }

    // 表示名のバリデーション
    // 1-255文字
    static std::expected<void, std::string> validate_display_name(const std::string& name) {
        if (name.empty()) {
            return std::unexpected("Display name is required");
        }
        if (name.length() > 255) {
            return std::unexpected("Display name must not exceed 255 characters");
        }
        return {};
    }

    // 自己紹介のバリデーション
    // 最大10,000文字
    static std::expected<void, std::string> validate_bio(const std::string& bio) {
        if (bio.length() > 10000) {
            return std::unexpected("Bio must not exceed 10,000 characters");
        }
        return {};
    }
};

} // namespace validation
