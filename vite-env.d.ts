/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PROJECT_ID?: string;
  readonly VITE_AUTH_BROKER_BASE_URL?: string;
  readonly VITE_RUNTIME_URL?: string;
  readonly VITE_METADATA_TITLE?: string;
  readonly VITE_METADATA_DESCRIPTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __remixerTeardown?: () => void;
}
