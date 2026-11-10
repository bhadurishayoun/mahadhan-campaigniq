import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base: the built site works from any sub-path, e.g. https://<user>.github.io/mahadhan-campaigniq/
  // (the app uses #/ routes, so no server-side routing is needed). Map data loads from ./geo/ the same way.
  base: './',
  server: { host: '0.0.0.0', port: 5173 },
});
