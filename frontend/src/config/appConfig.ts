export const DEFAULT_PRODUCTION_URL = 'https://poster-craft-phi.vercel.app';

/**
 * Returns the public URL used for generating shareable links and QR codes.
 * If running on localhost / local development, defaults to the hosted Vercel domain
 * so that mobile cameras scanning the QR code open the live hosted app.
 */
export function getPublicBaseUrl(): string {
  const envUrl = import.meta.env.VITE_PUBLIC_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // On localhost or loopback addresses, prefer the hosted Vercel production URL
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return DEFAULT_PRODUCTION_URL;
    }
    return origin.replace(/\/$/, '');
  }

  return DEFAULT_PRODUCTION_URL;
}

