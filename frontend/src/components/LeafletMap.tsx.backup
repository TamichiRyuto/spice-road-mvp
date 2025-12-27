import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './css/LeafletMap.css';
import { CurryShop } from '../types';

interface LeafletMapProps {
  shops: CurryShop[];
  onShopSelect: (shop: CurryShop) => void;
  selectedShop: CurryShop | null;
  userLocation?: {lat: number, lng: number} | null;
  onCenterOnLocation?: () => void;
}

const DEFAULT_CENTER: [number, number] = [34.6762, 135.8328]; // Nara
const DEFAULT_ZOOM = 14;
const SELECTED_ZOOM = 16;
const RESIZE_DELAY = 100;

const SHOP_ICON = L.divIcon({
  className: 'custom-div-icon',
  html: '<div class="shop-marker"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const USER_ICON = L.divIcon({
  className: 'user-location-icon',
  html: '<div class="user-marker"><div class="user-marker-dot"></div></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const LeafletMap = ({ shops, onShopSelect, selectedShop, userLocation, onCenterOnLocation }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const goToCurrentLocation = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], SELECTED_ZOOM);
    } else if (onCenterOnLocation) {
      onCenterOnLocation();
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : DEFAULT_CENTER;
    const map = L.map(mapRef.current).setView(center, DEFAULT_ZOOM);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const handleResize = () => {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), RESIZE_DELAY);
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, RESIZE_DELAY);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker));
    markersRef.current = [];

    shops.forEach(shop => {
      const marker = L.marker([shop.latitude, shop.longitude], { icon: SHOP_ICON })
        .addTo(mapInstanceRef.current!);

      marker.bindPopup(`<strong>${shop.name}</strong><br>${shop.address}`, {
        className: 'custom-popup'
      });

      marker.on('click', () => onShopSelect(shop));

      markersRef.current.push(marker);
    });

    if (userLocation) {
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
      }

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: USER_ICON })
        .addTo(mapInstanceRef.current);

      userMarker.bindPopup('<div class="user-location-popup">現在地</div>');

      userMarkerRef.current = userMarker;
    }
  }, [shops, onShopSelect, userLocation]);

  useEffect(() => {
    if (selectedShop && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedShop.latitude, selectedShop.longitude], SELECTED_ZOOM);
    }
  }, [selectedShop]);

  return (
    <div className="map-wrapper">
        <div
          ref={mapRef}
          className="map-container"
          role="application"
          aria-label="奈良市ならまち周辺のスパイスカレー店マップ"
          tabIndex={0}
        />
        <button
          onClick={goToCurrentLocation}
          className={`location-btn ${!userLocation ? 'disabled' : ''}`}
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
  );
};

export default LeafletMap;