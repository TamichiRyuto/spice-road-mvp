import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap as GoogleMapReact, Marker, InfoWindow } from '@react-google-maps/api';
import './css/GoogleMap.css';
import { CurryShop } from '../types';

interface GoogleMapProps {
  shops: CurryShop[];
  onShopSelect: (shop: CurryShop) => void;
  selectedShop: CurryShop | null;
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

const GoogleMap = ({ shops, onShopSelect, selectedShop }: GoogleMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const createLocationControl = useCallback((map: google.maps.Map) => {
    const controlButton = document.createElement('button');

    // Style the button to match Google Maps controls
    controlButton.style.backgroundColor = '#fff';
    controlButton.style.border = '0';
    controlButton.style.borderRadius = '2px';
    controlButton.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    controlButton.style.cursor = 'pointer';
    controlButton.style.marginRight = '10px';
    controlButton.style.marginTop = '10px';
    controlButton.style.padding = '0';
    controlButton.style.width = '40px';
    controlButton.style.height = '40px';
    controlButton.title = '現在地を表示';
    controlButton.type = 'button';

    // Add icon to button
    const icon = document.createElement('div');
    icon.style.width = '18px';
    icon.style.height = '18px';
    icon.style.margin = '11px';
    icon.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'/%3E%3C/svg%3E")`;
    icon.style.backgroundSize = 'contain';
    icon.style.backgroundRepeat = 'no-repeat';
    icon.style.backgroundPosition = 'center';
    controlButton.appendChild(icon);

    // Add click handler
    controlButton.addEventListener('click', () => {
      // Show loading state
      icon.style.opacity = '0.5';

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            setUserLocation(pos);
            map.panTo(pos);
            map.setZoom(16);

            // Reset icon state
            icon.style.opacity = '1';
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('位置情報の取得に失敗しました。ブラウザの設定を確認してください。');
            icon.style.opacity = '1';
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        alert('このブラウザは位置情報に対応していません。');
        icon.style.opacity = '1';
      }
    });

    return controlButton;
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Add custom location control
    const locationControl = createLocationControl(map);
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(locationControl);
  }, [createLocationControl]);

  const onUnmount = useCallback(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.panTo({ lat: selectedShop.latitude, lng: selectedShop.longitude });
      mapRef.current.setZoom(SELECTED_ZOOM);
      setActiveMarker(selectedShop.id);
    }
  }, [selectedShop]);

  // Update user location marker
  useEffect(() => {
    if (userLocation && mapRef.current) {
      // Remove old marker if exists
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      // Create new marker for user location
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 10,
        },
        title: '現在地',
        zIndex: 1000,
      });
    }
  }, [userLocation]);

  const handleMarkerClick = (shop: CurryShop) => {
    setActiveMarker(shop.id);
    onShopSelect(shop);
  };

  return (
    <div className="map-wrapper">
      <GoogleMapReact
        mapContainerStyle={mapContainerStyle}
        center={DEFAULT_CENTER}
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
      </GoogleMapReact>
    </div>
  );
};

export default GoogleMap;
