import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './responsive.css';
import './enhance.css';

/**
 * Layout modes (see README "Responsive layout"):
 *  - < 1200 px  (phones, tablets): no scaling; CSS media queries reflow the screens.
 *  - 1200-1535  (laptops): the 1536 px desktop layout is scaled down proportionally.
 *  - 1536-1920  (desktops): native size, content fills the width.
 *  - > 1920     (large / ultra-wide monitors): the 1920 px layout is scaled up so panels don't stretch.
 */
const RESPONSIVE_BELOW = 1200;
const DESIGN_WIDTH = 1536;
const WIDE_WIDTH = 1920;
const MAX_ZOOM = 1.6;
function applyLaptopZoom() {
  const width = window.innerWidth;
  let zoom = 1;
  if (width >= RESPONSIVE_BELOW && width < DESIGN_WIDTH) zoom = width / DESIGN_WIDTH;
  else if (width > WIDE_WIDTH) zoom = Math.min(MAX_ZOOM, width / WIDE_WIDTH);
  document.documentElement.style.setProperty('--app-zoom', zoom.toFixed(3));
}
applyLaptopZoom();
window.addEventListener('resize', applyLaptopZoom);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
