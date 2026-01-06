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

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.panTo({ lat: selectedShop.latitude, lng: selectedShop.longitude });
      mapRef.current.setZoom(SELECTED_ZOOM);
      setActiveMarker(selectedShop.id);
    }
  }, [selectedShop]);

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
