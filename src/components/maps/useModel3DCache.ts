import { useEffect, useCallback, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { Map3DModel } from './model3DTypes';

// Global cache for preloaded models
const preloadedUrls = new Set<string>();
const loadingPromises = new Map<string, Promise<void>>();

/**
 * Hook for preloading and caching 3D models
 * Improves performance by loading models before they're needed
 */
export function useModel3DCache(models: Map3DModel[]) {
  const previousUrlsRef = useRef<Set<string>>(new Set());

  // Get unique URLs that need to be loaded
  const getNewUrls = useCallback((currentModels: Map3DModel[]): string[] => {
    const currentUrls = new Set(currentModels.map((m) => m.file_url).filter(Boolean));
    const newUrls: string[] = [];

    currentUrls.forEach((url) => {
      if (!preloadedUrls.has(url) && !loadingPromises.has(url)) {
        newUrls.push(url);
      }
    });

    return newUrls;
  }, []);

  // Preload models
  useEffect(() => {
    const newUrls = getNewUrls(models);

    newUrls.forEach((url) => {
      // Create loading promise
      const loadPromise = new Promise<void>((resolve) => {
        try {
          useGLTF.preload(url);
          preloadedUrls.add(url);
          resolve();
        } catch (error) {
          console.warn(`Failed to preload model: ${url}`, error);
          resolve(); // Don't block on errors
        }
      });

      loadingPromises.set(url, loadPromise);

      loadPromise.finally(() => {
        loadingPromises.delete(url);
      });
    });

    // Track current URLs for cleanup
    previousUrlsRef.current = new Set(models.map((m) => m.file_url));
  }, [models, getNewUrls]);

  // Return cache stats for debugging
  return {
    cachedCount: preloadedUrls.size,
    loadingCount: loadingPromises.size,
    isCached: (url: string) => preloadedUrls.has(url),
    isLoading: (url: string) => loadingPromises.has(url),
  };
}

/**
 * Preload a single model URL
 */
export function preloadModel(url: string): Promise<void> {
  if (preloadedUrls.has(url)) {
    return Promise.resolve();
  }

  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }

  const loadPromise = new Promise<void>((resolve) => {
    try {
      useGLTF.preload(url);
      preloadedUrls.add(url);
      resolve();
    } catch (error) {
      console.warn(`Failed to preload model: ${url}`, error);
      resolve();
    }
  });

  loadingPromises.set(url, loadPromise);

  loadPromise.finally(() => {
    loadingPromises.delete(url);
  });

  return loadPromise;
}

/**
 * Clear a model from cache
 */
export function clearModelCache(url: string): void {
  preloadedUrls.delete(url);
  // Note: useGLTF doesn't have a built-in clear method,
  // but removing from our tracking prevents re-preload
}

/**
 * Clear all cached models
 */
export function clearAllModelCache(): void {
  preloadedUrls.clear();
}

/**
 * Get cache statistics
 */
export function getModelCacheStats() {
  return {
    cachedCount: preloadedUrls.size,
    loadingCount: loadingPromises.size,
    cachedUrls: Array.from(preloadedUrls),
  };
}
