-- Spice Road MVP Database Schema

-- Drop tables if exists
DROP TABLE IF EXISTS shops CASCADE;

-- Create shops table
CREATE TABLE shops (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    region VARCHAR(100) NOT NULL,
    spiciness INTEGER NOT NULL DEFAULT 50 CHECK (spiciness >= 0 AND spiciness <= 100),
    stimulation INTEGER NOT NULL DEFAULT 50 CHECK (stimulation >= 0 AND stimulation <= 100),
    aroma INTEGER NOT NULL DEFAULT 50 CHECK (aroma >= 0 AND aroma <= 100),
    rating DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_shops_region ON shops(region);
CREATE INDEX idx_shops_rating ON shops(rating DESC);
CREATE INDEX idx_shops_spiciness ON shops(spiciness);
CREATE INDEX idx_shops_location ON shops(latitude, longitude);

-- Insert sample data
INSERT INTO shops (id, name, address, phone, latitude, longitude, region, spiciness, stimulation, aroma, rating, description) VALUES
('shop-001', 'スパイスカレー本舗 渋谷店', '東京都渋谷区道玄坂1-2-3', '03-1234-5678', 35.6595, 139.7004, '渋谷', 75, 80, 85, 4.5, '本格的なスパイスカレーの名店'),
('shop-002', 'カリーハウス 新宿', '東京都新宿区歌舞伎町2-3-4', '03-2345-6789', 35.6938, 139.7036, '新宿', 60, 65, 70, 4.2, 'マイルドで食べやすいカレー'),
('shop-003', 'インドカレー 池袋店', '東京都豊島区西池袋1-5-6', '03-3456-7890', 35.7295, 139.7109, '池袋', 85, 90, 75, 4.7, '激辛カレーの聖地'),
('shop-004', 'スパイシーキッチン 品川', '東京都港区高輪3-13-1', '03-4567-8901', 35.6284, 139.7387, '品川', 55, 60, 65, 4.0, 'オフィス街で人気のカレー店'),
('shop-005', 'カレーの匠 上野店', '東京都台東区上野6-1-6', '03-5678-9012', 35.7074, 139.7745, '上野', 70, 75, 80, 4.4, '伝統的な日本のカレー');
