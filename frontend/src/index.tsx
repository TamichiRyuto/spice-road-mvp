import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import md3Theme from './theme/md3Theme';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={md3Theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Service Worker registration for performance optimization
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available');
              // Optionally notify user about update
            }
          });
        }
      });
      
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  });

  // Listen for messages from Service Worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'BACKGROUND_LOCATION_UPDATE') {
      console.log('Background location update received');
      // Handle background location updates if needed
    }
  });
}

// Performance monitoring
reportWebVitals((metric) => {
  // Log performance metrics
  console.log(`Performance ${metric.name}:`, metric.value);
  
  // Optional: Send to analytics
  // gtag('event', metric.name, {
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   non_interaction: true,
  // });
});
