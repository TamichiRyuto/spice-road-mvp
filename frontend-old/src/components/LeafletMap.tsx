import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CurryShop } from '../types';

interface LeafletMapProps {
  shops: CurryShop[];
  onShopSelect: (shop: CurryShop) => void;
  selectedShop: CurryShop | null;
  userLocation?: {lat: number, lng: number} | null;
  onCenterOnLocation?: () => void;
}

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LeafletMap = ({ shops, onShopSelect, selectedShop, userLocation, onCenterOnLocation }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  console.log('LeafletMap render - userLocation:', userLocation);

  const goToCurrentLocation = () => {
    console.log('goToCurrentLocation called, userLocation:', userLocation);
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16);
    } else if (onCenterOnLocation) {
      onCenterOnLocation();
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map with user's location if available, otherwise default to Nara
    const defaultCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [34.6762, 135.8328];
    const map = L.map(mapRef.current).setView(defaultCenter, 14);
    mapInstanceRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Create custom icon with JIS X 8341 compliant colors
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #d2691e, #cd853f);
          border: 3px solid #fff8ed;
          border-radius: 50%;
          box-shadow: 0 6px 16px rgba(210, 105, 30, 0.5);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add markers for each shop
    shops.forEach(shop => {
      const marker = L.marker([shop.latitude, shop.longitude], { icon: customIcon })
        .addTo(mapInstanceRef.current!);

      // Create popup content with chart
      const popupContent = document.createElement('div');
      popupContent.style.width = '280px';
      popupContent.style.padding = '16px';
      
      // Use 0-100 scale with 50 as center
      
      popupContent.innerHTML = `
        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; color: #8b4513; font-size: 20px; font-weight: 900; line-height: 1.2; text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.2);">${shop.name}</h3>
          <p style="margin: 0 0 8px 0; color: #5a3429; font-size: 15px; line-height: 1.5; font-weight: 500;">${shop.address}</p>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;" aria-label="評価 ${shop.rating}">
            <div style="
              width: 18px; 
              height: 18px; 
              background: linear-gradient(135deg, #d2691e, #cd853f);
              border: 1px solid rgba(210, 105, 30, 0.4);
              border-radius: 8px;
              box-shadow: 0 3px 6px rgba(210, 105, 30, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #ffffff;
              font-weight: bold;
            " aria-hidden="true">★</div>
            <span style="font-weight: 900; color: #2d1810; font-size: 17px; text-shadow: 1px 1px 2px rgba(45, 24, 16, 0.2);">${shop.rating}</span>
          </div>
          <p style="margin: 0 0 16px 0; color: #5a3429; font-size: 15px; line-height: 1.6; font-weight: 500;">${shop.description || ''}</p>
        </div>
        <div style="display: flex; flex-direction: column; height: 180px;">
          <div style="font-size: 18px; font-weight: 900; margin-bottom: 16px; text-align: center; color: #8b4513; letter-spacing: -0.5px; text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.2);">
            スパイスチャート
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; height: 120px; padding: 0 20px;">
            ${['辛さ', '刺激', '香り'].map((param, index) => {
              const values = [shop.spiceParameters.spiciness, shop.spiceParameters.stimulation, shop.spiceParameters.aroma];
              const value = values[index];
              const normalizedValue = value - 50; // Center at 50
              const barHeight = Math.abs(normalizedValue) * 1.6; // Max 80px height
              const isPositive = normalizedValue >= 0;
              
              return `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                  <div style="display: flex; flex-direction: column; align-items: center; height: 80px; justify-content: ${isPositive ? 'flex-end' : 'flex-start'};">
                    <div style="
                      width: 16px;
                      height: ${barHeight}px;
                      background: linear-gradient(135deg, #d2691e, #cd853f);
                      border: 1px solid rgba(210, 105, 30, 0.4);
                      border-radius: 6px;
                      box-shadow: 0 3px 6px rgba(210, 105, 30, 0.4);
                      ${isPositive ? 'margin-bottom: 2px;' : 'margin-top: 2px;'}
                    "></div>
                    ${isPositive ? '' : '<div style="height: 2px; width: 30px; background: #666666; margin: 1px 0;"></div>'}
                    ${!isPositive ? '' : '<div style="height: 2px; width: 30px; background: #666666; margin: 1px 0;"></div>'}
                  </div>
                  <div style="font-size: 13px; color: #8b4513; margin-top: 8px; text-align: center; line-height: 1.2; font-weight: 900;">
                    ${param}
                  </div>
                  <div style="font-size: 13px; color: #5a3429; margin-top: 2px; font-weight: 800;">
                    ${value}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #5a3429; margin-top: 8px; padding: 0 20px; font-weight: 800;">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        onShopSelect(shop);
      });

      markersRef.current.push(marker);
    });

    // Add user location marker if available
    if (userLocation) {
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
      }

      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #10b981;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 6px;
              height: 6px;
              background: #ffffff;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current);

      userMarker.bindPopup(`
        <div style="padding: 8px; text-align: center;">
          <strong style="color: #10b981;">現在地</strong>
        </div>
      `);

      userMarkerRef.current = userMarker;
    }
  }, [shops, onShopSelect, userLocation]);

  useEffect(() => {
    if (selectedShop && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedShop.latitude, selectedShop.longitude], 16);
    }
  }, [selectedShop]);

  return (
    <>
      <style>
        {`
          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 16px;
            border: 2px solid rgba(184, 128, 87, 0.4);
            box-shadow: 0 25px 35px -5px rgba(45, 24, 16, 0.2), 0 15px 15px -5px rgba(45, 24, 16, 0.1);
            background: rgba(255, 248, 237, 0.98);
            backdrop-filter: blur(15px);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
          }
          .leaflet-container a {
            color: #d2691e;
          }
          .leaflet-container a:focus {
            outline: 2px solid #d2691e;
            outline-offset: 2px;
          }
        `}
      </style>
      <div style={{ position: 'relative' }}>
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '400px', 
            borderRadius: '16px',
            border: '2px solid rgba(184, 128, 87, 0.4)',
            boxShadow: '0 15px 25px -3px rgba(45, 24, 16, 0.15), 0 6px 10px -2px rgba(45, 24, 16, 0.1)' 
          }}
          role="application"
          aria-label="奈良市ならまち周辺のスパイスカレー店マップ"
          tabIndex={0}
        />
        <button
          onClick={goToCurrentLocation}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            backgroundColor: userLocation ? 'rgba(255, 248, 237, 0.95)' : 'rgba(240, 230, 210, 0.95)',
            border: '2px solid rgba(184, 128, 87, 0.4)',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(45, 24, 16, 0.15)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            transition: 'all 0.2s ease-in-out',
            opacity: userLocation ? 1 : 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = userLocation ? 'rgba(210, 105, 30, 0.1)' : 'rgba(210, 105, 30, 0.05)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = userLocation ? 'rgba(255, 248, 237, 0.95)' : 'rgba(240, 230, 210, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={userLocation ? "現在地に移動" : "現在地を取得して移動"}
          aria-label={userLocation ? "現在地に移動" : "現在地を取得して移動"}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={userLocation ? "#d2691e" : "#8b4513"} 
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M6 12h6m6 0h-6"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default LeafletMap;