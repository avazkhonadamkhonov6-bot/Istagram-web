/** Shared default for the team's API; .env.local can select a local backend. */
export const DEFAULT_BACKEND_URL = "https://istagram-web.onrender.com";
export const REALTIME_URL = process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_BACKEND_URL;
