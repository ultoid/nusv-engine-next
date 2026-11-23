/**
 * Centralized in-memory image cache with off-main-thread texture pre-decoding.
 * Ensures zero-latency GPU rendering when switching tabs or sheets in Tileset and Map editors.
 */

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string | undefined, onLoaded?: () => void): HTMLImageElement | null {
  if (!url || typeof Image === 'undefined') return null;
  const existing = imageCache.get(url);
  if (existing) {
    if (!existing.complete && onLoaded) {
      existing.addEventListener('load', onLoaded, { once: true });
    }
    return existing;
  }

  const img = new Image();
  img.src = url;
  if (onLoaded) {
    img.addEventListener('load', onLoaded, { once: true });
  }
  if (typeof img.decode === 'function') {
    img.decode().catch(() => {
      // Decode error ignored (fallback to natural rasterization)
    });
  }
  imageCache.set(url, img);
  return img;
}

export function preloadImages(urls: (string | undefined)[]) {
  if (typeof Image === 'undefined') return;
  for (const url of urls) {
    if (url) getCachedImage(url);
  }
}
