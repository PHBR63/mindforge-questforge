import { useState, useCallback, useEffect } from 'react';

interface CachedAsset {
  id: string;
  name: string;
  blob: Blob;
  url: string; // Object URL for display
  thumbnailUrl: string;
  category: string;
  source: string;
  cachedAt: number;
}

interface AssetCacheMetadata {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: string;
  source: string;
  cachedAt: number;
  size: number;
}

const DB_NAME = 'asset-cache-db';
const STORE_NAME = 'assets';
const METADATA_STORE = 'metadata';
const DB_VERSION = 1;

// Max cache size: 100MB
const MAX_CACHE_SIZE = 100 * 1024 * 1024;

let dbInstance: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        const metaStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        metaStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        metaStore.createIndex('source', 'source', { unique: false });
      }
    };
  });
}

export function useAssetCache() {
  const [cachedAssets, setCachedAssets] = useState<AssetCacheMetadata[]>([]);
  const [cacheSize, setCacheSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load cache metadata on mount
  useEffect(() => {
    loadCacheMetadata();
  }, []);

  const loadCacheMetadata = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(METADATA_STORE, 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const metadata = request.result as AssetCacheMetadata[];
        setCachedAssets(metadata);
        const totalSize = metadata.reduce((sum, item) => sum + item.size, 0);
        setCacheSize(totalSize);
        setIsLoading(false);
      };

      request.onerror = () => {
        console.error('Error loading cache metadata:', request.error);
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Error opening cache DB:', error);
      setIsLoading(false);
    }
  };

  const getCachedAsset = useCallback(async (id: string): Promise<CachedAsset | null> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Create object URL for the blob
            const url = URL.createObjectURL(result.blob);
            resolve({ ...result, url });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }, []);

  const cacheAsset = useCallback(async (
    id: string,
    name: string,
    blob: Blob,
    thumbnailUrl: string,
    category: string,
    source: string
  ): Promise<string> => {
    try {
      const db = await openDB();

      // Check if we need to free space
      const newSize = cacheSize + blob.size;
      if (newSize > MAX_CACHE_SIZE) {
        await evictOldestAssets(newSize - MAX_CACHE_SIZE);
      }

      // Store the asset
      const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
      const assetStore = transaction.objectStore(STORE_NAME);
      const metaStore = transaction.objectStore(METADATA_STORE);

      const cachedAt = Date.now();

      const assetData = {
        id,
        name,
        blob,
        thumbnailUrl,
        category,
        source,
        cachedAt,
      };

      const metadata: AssetCacheMetadata = {
        id,
        name,
        thumbnailUrl,
        category,
        source,
        cachedAt,
        size: blob.size,
      };

      assetStore.put(assetData);
      metaStore.put(metadata);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });

      // Update local state
      setCachedAssets(prev => {
        const filtered = prev.filter(a => a.id !== id);
        return [...filtered, metadata];
      });
      setCacheSize(prev => prev + blob.size);

      // Return object URL
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error caching asset:', error);
      throw error;
    }
  }, [cacheSize]);

  const evictOldestAssets = async (bytesToFree: number) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
      const assetStore = transaction.objectStore(STORE_NAME);
      const metaStore = transaction.objectStore(METADATA_STORE);
      const index = metaStore.index('cachedAt');

      let freedBytes = 0;
      const idsToRemove: string[] = [];

      const cursorRequest = index.openCursor();
      
      await new Promise<void>((resolve) => {
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && freedBytes < bytesToFree) {
            const metadata = cursor.value as AssetCacheMetadata;
            freedBytes += metadata.size;
            idsToRemove.push(metadata.id);
            assetStore.delete(metadata.id);
            metaStore.delete(metadata.id);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });

      setCachedAssets(prev => prev.filter(a => !idsToRemove.includes(a.id)));
      setCacheSize(prev => prev - freedBytes);
    } catch (error) {
      console.error('Error evicting assets:', error);
    }
  };

  const removeFromCache = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
      
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.objectStore(METADATA_STORE).delete(id);

      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => resolve();
      });

      setCachedAssets(prev => {
        const removed = prev.find(a => a.id === id);
        if (removed) {
          setCacheSize(s => s - removed.size);
        }
        return prev.filter(a => a.id !== id);
      });
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
      
      transaction.objectStore(STORE_NAME).clear();
      transaction.objectStore(METADATA_STORE).clear();

      await new Promise<void>((resolve) => {
        transaction.oncomplete = () => resolve();
      });

      setCachedAssets([]);
      setCacheSize(0);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const isAssetCached = useCallback((id: string): boolean => {
    return cachedAssets.some(a => a.id === id);
  }, [cachedAssets]);

  const formatCacheSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    cachedAssets,
    cacheSize,
    formattedCacheSize: formatCacheSize(cacheSize),
    maxCacheSize: MAX_CACHE_SIZE,
    formattedMaxCacheSize: formatCacheSize(MAX_CACHE_SIZE),
    isLoading,
    getCachedAsset,
    cacheAsset,
    removeFromCache,
    clearCache,
    isAssetCached,
  };
}
