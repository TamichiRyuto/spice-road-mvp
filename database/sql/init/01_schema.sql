-- Spice Road Database Schema
-- PostgreSQL 16

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    region VARCHAR(100) NOT NULL,
    spiciness INTEGER CHECK (spiciness >= 0 AND spiciness <= 100),
    stimulation INTEGER CHECK (stimulation >= 0 AND stimulation <= 100),
    aroma INTEGER CHECK (aroma >= 0 AND aroma <= 100),
    rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shops
CREATE INDEX idx_shops_region ON shops(region);
CREATE INDEX idx_shops_location ON shops(latitude, longitude);
CREATE INDEX idx_shops_rating ON shops(rating DESC);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    pref_spiciness INTEGER CHECK (pref_spiciness >= 0 AND pref_spiciness <= 100),
    pref_stimulation INTEGER CHECK (pref_stimulation >= 0 AND pref_stimulation <= 100),
    pref_aroma INTEGER CHECK (pref_aroma >= 0 AND pref_aroma <= 100),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- User favorite shops (many-to-many)
CREATE TABLE user_favorite_shops (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, shop_id)
);

-- Indexes for user_favorite_shops
CREATE INDEX idx_user_favorite_shops_user ON user_favorite_shops(user_id);
CREATE INDEX idx_user_favorite_shops_shop ON user_favorite_shops(shop_id);

-- User disliked shops (many-to-many)
CREATE TABLE user_disliked_shops (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, shop_id)
);

-- Indexes for user_disliked_shops
CREATE INDEX idx_user_disliked_shops_user ON user_disliked_shops(user_id);
CREATE INDEX idx_user_disliked_shops_shop ON user_disliked_shops(shop_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to shops table
CREATE TRIGGER update_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
