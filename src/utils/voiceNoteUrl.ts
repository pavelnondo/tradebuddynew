import { API_BASE_URL, API_ORIGIN } from '@/config';

/**
 * Constructs the full URL for a voice note audio file
 * Handles both absolute URLs and relative paths
 */
export function getVoiceNoteAudioUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Use API_ORIGIN if available, otherwise construct from API_BASE_URL
  const baseUrl = API_ORIGIN || API_BASE_URL.replace(/\/api\/?$/, '');
  
  // Ensure URL starts with /
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${baseUrl}${normalizedUrl}`;
}
