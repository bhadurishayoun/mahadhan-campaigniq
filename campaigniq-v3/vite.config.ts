import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: the build works from any sub-path, e.g. https://<user>.github.io/mahadhan-campaigniq/v3/ (hash routes).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: '0.0.0.0', port: 5174 },
});
