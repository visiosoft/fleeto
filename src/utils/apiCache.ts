/**
 * Simple in-memory cache for API responses
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, expiresIn: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiresIn) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.cache.delete(key));
  }
}

export const apiCache = new APICache();

// Run cleanup every 5 minutes
setInterval(() => apiCache.cleanup(), 5 * 60 * 1000);

// Generate cache key from request config
export function generateCacheKey(url: string, params?: any): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}${paramString}`;
}
