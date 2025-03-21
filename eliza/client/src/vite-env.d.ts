/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly MODE: string;
    readonly SSR: boolean;
    readonly VITE_USE_MOCK_DATA?: string;
    readonly VITE_ZERION_API_KEY?: string;
    readonly VITE_PRIVY_APP_ID?: string;
    readonly VITE_CROSSMINT_CLIENT_KEY?: string;
    readonly VITE_SERVER_PORT?: string;
    readonly VITE_BACKEND_URL?: string;
    [key: string]: string | boolean | undefined;
  };
}
