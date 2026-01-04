# スパイスカレー評価マップ

スパイスカレー店を「辛さ」「刺激」「香り」の3パラメータで評価し、GoogleMap上でスペクトル図として表示するWebアプリケーションです。

## 機能

- **3パラメータ評価システム**
  - 辛さ (Spiciness): 0-10
  - 刺激 (Stimulation): 0-10  
  - 香り (Aroma): 0-10

- **スペクトル図表示**: Chart.jsのレーダーチャートで各店舗の特徴を可視化
- **GoogleMap統合**: 店舗位置をマップ上に表示
- **レスポンシブUI**: デスクトップ・モバイル対応

## アーキテクチャ

```
spice-param-app/
├── frontend/          # React + TypeScript フロントエンド
├── api/              # Express.js API サーバー  
├── database/         # JSON データベース
└── docker-compose.yml # Docker構成
```

## Docker Composeでの起動

```bash
# プロジェクトディレクトリに移動
cd spice-param-app

# Docker Composeでビルド・起動
docker-compose up --build

# バックグラウンドで実行する場合
docker-compose up -d --build
```

## アクセス方法

起動後、以下のURLでアクセスできます：

- **フロントエンド**: http://localhost:3000
- **API サーバー**: http://localhost:3001
- **データベース**: http://localhost:8080/shops.json

## 開発環境での実行

### フロントエンド

```bash
cd frontend
npm install
npm start
```

### API サーバー

```bash
cd api
npm install
npm run dev
```

## サンプルデータ

`database/shops.json`に以下の店舗データが含まれています：

- 辛口スパイス亭 (渋谷)
- アロマカレーハウス (新宿) 
- 刺激MAX (池袋)
- マイルドスパイス (品川)
- バランス亭 (銀座)
- 香り工房 (浅草)

## Google Maps API

デモ環境では`DEMO_API_KEY`を使用していますが、実際の地図を表示するには：

1. [Google Cloud Console](https://console.cloud.google.com/)でGoogle Maps JavaScript APIを有効化
2. APIキーを取得
3. `docker-compose.yml`の`REACT_APP_GOOGLE_MAPS_API_KEY`を更新

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Chart.js (レーダーチャート)
- Google Maps JavaScript API

### バックエンド
- Node.js
- Express.js
- TypeScript
- CORS

### インフラ
- Docker & Docker Compose
- Nginx (静的ファイル配信)

## 使い方

1. マップ上のカレー店アイコンをクリック
2. 右側の店舗一覧からカードを選択
3. スペクトル図で各店舗の辛さ・刺激・香りを比較
4. お好みの評価パターンの店舗を発見！

## ライセンス

MIT License