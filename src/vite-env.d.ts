/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the TLB backend API, e.g. https://tlb-api.reluconsultancy.in */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
