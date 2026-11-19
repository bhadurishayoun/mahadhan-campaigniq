import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './responsive.css';
import './enhance.css';
import './design-system.css';

/**
 * Layout modes (see README "Responsive layout"):
 *  - < 1200 px  (phones, tablets): no scaling; CSS media queries reflow the screens.
 *  - 1200-1920  (laptops and desktops): native text sizing; responsive layouts reflow.
 *  - > 1920     (large / ultra-wide monitors): scale up modestly to use available space.
 */
const WIDE_WIDTH = 1920;
const MAX_ZOOM = 1.6;
function applyLaptopZoom() {
  const width = window.innerWidth;
  let zoom = 1;
  if (width > WIDE_WIDTH) zoom = Math.max(1, Math.min(MAX_ZOOM, width / WIDE_WIDTH));
  document.documentElement.style.setProperty('--app-zoom', zoom.toFixed(3));
}
applyLaptopZoom();
window.addEventListener('resize', applyLaptopZoom);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
