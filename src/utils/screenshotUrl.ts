/**
 * Shared utility for screenshot URLs.
 * Normalizes legacy paths and uses proxy so files from either upload dir can be served.
 */

import { API_ORIGIN } from '@/config';

function normalizeScreenshotPath(url: string): string {
  if (!url || typeof url !== 'string') return '';
  let u = url.trim();
  // Legacy: DB may have /public/lovable-uploads/xxx - serve from /lovable-uploads/
  if (u.includes('/public/lovable-uploads/')) {
    u = u.replace(/\/public\/lovable-uploads\//g, '/lovable-uploads/');
  }
  if (u.startsWith('public/lovable-uploads/')) {
    u = '/lovable-uploads/' + u.slice('public/lovable-uploads/'.length);
  }
  // Ensure leading slash for relative paths
  if (!u.startsWith('/') && !u.startsWith('http')) {
    u = '/' + u;
  }
  return u;
}

/** Returns the full URL for a screenshot. /uploads and /lovable-uploads served by backend. */
export function getScreenshotFullUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const normalized = normalizeScreenshotPath(url);
  if (!normalized) return '';
  if (normalized.startsWith('http')) return normalized;
  const base = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
  const pathPart = normalized.startsWith('/') ? normalized : '/' + normalized;
  return `${base}${pathPart}`;
}
