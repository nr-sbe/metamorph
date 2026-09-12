// Vite supplies the deployment base; Node-based tests use the site root.
export const ASSET_BASE = `${import.meta.env?.BASE_URL ?? '/'}assets/`;
