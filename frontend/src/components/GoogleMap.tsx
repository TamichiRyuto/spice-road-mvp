import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap as GoogleMapReact, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import './css/GoogleMap.css';
import { CurryShop } from '../types';

interface GoogleMapProps {
  shops: CurryShop[];
  onShopSelect: (shop: CurryShop) => void;
  selectedShop: CurryShop | null;
  userLocation?: {lat: number, lng: number} | null;
  onCenterOnLocation?: () => void;
}

const DEFAULT_CENTER = { lat: 34.6762, lng: 135.8328 }; // Nara
const DEFAULT_ZOOM = 14;
const SELECTED_ZOOM = 16;

const mapContainerStyle = {
  width: '100%',
  height: 'clamp(300px, 50vh, 500px)',
  minHeight: '300px',
  borderRadius: '16px',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const GoogleMap = ({ shops, onShopSelect, selectedShop, userLocation, onCenterOnLocation }: GoogleMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [center, setCenter] = useState(userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : DEFAULT_CENTER);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const goToCurrentLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      mapRef.current.setZoom(SELECTED_ZOOM);
    } else if (onCenterOnLocation) {
      onCenterOnLocation();
    }
  };

  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.panTo({ lat: selectedShop.latitude, lng: selectedShop.longitude });
      mapRef.current.setZoom(SELECTED_ZOOM);
      setActiveMarker(selectedShop.id);
    }
  }, [selectedShop]);

  useEffect(() => {
    if (userLocation) {
      setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [userLocation]);

  const handleMarkerClick = (shop: CurryShop) => {
    setActiveMarker(shop.id);
    onShopSelect(shop);
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="map-error">
        <p>Google Maps API key is not configured.</p>
        <p>Please set REACT_APP_GOOGLE_MAPS_API_KEY in your environment variables.</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMapReact
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={DEFAULT_ZOOM}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Shop Markers */}
          {shops.map(shop => (
            <Marker
              key={shop.id}
              position={{ lat: shop.latitude, lng: shop.longitude }}
              onClick={() => handleMarkerClick(shop)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#d2691e',
                fillOpacity: 1,
                strokeColor: '#fff8ed',
                strokeWeight: 3,
                scale: 12,
              }}
            >
              {activeMarker === shop.id && (
                <InfoWindow
                  position={{ lat: shop.latitude, lng: shop.longitude }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="info-window-content">
                    <strong>{shop.name}</strong>
                    <br />
                    {shop.address}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}

          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 10,
              }}
              title="現在地"
            />
          )}
        </GoogleMapReact>
      </LoadScript>

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

export default GoogleMap;
