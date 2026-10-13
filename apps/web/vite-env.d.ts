/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_APP_ID: string;
  readonly VITE_FRONTEND_URL: string;
  // Add more as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Si necesitas más variables de entorno, añádelas aquí.
 * Ejemplo:
 * readonly VITE_API_URL: string;
 */