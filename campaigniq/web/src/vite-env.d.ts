interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** public base path set by Vite (used to load /public assets such as the map data) */
  readonly BASE_URL: string;
  /** true under `vite` dev server, false in `vite build` output */
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
