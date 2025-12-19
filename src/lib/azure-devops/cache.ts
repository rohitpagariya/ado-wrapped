import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { DEFAULT_CACHE_TTL_HOURS } from "../constants";

const CACHE_DIR = path.join(process.cwd(), ".ado-cache");

/**
 * Check if disk caching is enabled via environment variable.
 *
 * Caching is DISABLED by default to avoid:
 * - Memory pressure from in-memory caches (risk of OOM crashes)
 * - Disk storage accumulation in production (Vercel/serverless)
 *
 * Set ADO_CACHE_ENABLED=true to enable file-based caching (recommended for local development only)
 */
export function isCacheEnabled(): boolean {
  const envValue = process.env.ADO_CACHE_ENABLED?.toLowerCase();
  return envValue === "true" || envValue === "1";
}

/**
 * Cache entry structure with optional expiration
 */
interface CacheEntry<T> {
  url: string;
  params?: Record<string, any>;
  timestamp: string;
  expiresAt?: string;
  data: T;
}

/**
 * Generate a deterministic cache key based on request parameters
 */
function generateCacheKey(
  url: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);

  const cacheKeyData = {
    url,
    params: sortedParams,
  };

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(cacheKeyData))
    .digest("hex");

  return hash;
}

/**
 * Get file path for cache entry
 */
function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

/**
 * Check if a cache entry has expired
 */
function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read from disk cache with optional TTL check
 * @param url - The URL that was cached
 * @param params - The request parameters
 * @param ttlHours - Time-to-live in hours (default: 24). Set to 0 to ignore expiration.
 */
export function readCache<T>(
  url: string,
  params?: Record<string, any>,
  ttlHours: number = DEFAULT_CACHE_TTL_HOURS
): T | null {
  // Caching disabled by default
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const cacheKey = generateCacheKey(url, params);
    const filePath = getCacheFilePath(cacheKey);

    if (!fs.existsSync(filePath)) {
      console.log(`⚪ Cache MISS for ${url}`);
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const cached: CacheEntry<T> = JSON.parse(content);

    // Check expiration if TTL is set
    if (ttlHours > 0 && isExpired(cached.expiresAt)) {
      console.log(`⏰ Cache EXPIRED for ${url} (expired: ${cached.expiresAt})`);
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore deletion errors
      }
      return null;
    }

    console.log(`✅ Cache HIT for ${url} (cached: ${cached.timestamp})`);
    return cached.data;
  } catch (error) {
    console.error(`❌ Cache read error for ${url}:`, error);
    return null;
  }
}

/**
 * Write to disk cache with optional TTL
 * @param url - The URL being cached
 * @param params - The request parameters
 * @param data - The data to cache
 * @param ttlHours - Time-to-live in hours (default: 24). Set to 0 for no expiration.
 */
export function writeCache<T>(
  url: string,
  params: Record<string, any> | undefined,
  data: T,
  ttlHours: number = DEFAULT_CACHE_TTL_HOURS
): void {
  // Caching disabled by default
  if (!isCacheEnabled()) {
    return;
  }

  try {
    ensureCacheDir();

    const cacheKey = generateCacheKey(url, params);
    const filePath = getCacheFilePath(cacheKey);

    const now = new Date();
    const expiresAt =
      ttlHours > 0
        ? new Date(now.getTime() + ttlHours * 60 * 60 * 1000).toISOString()
        : undefined;

    const cacheEntry: CacheEntry<T> = {
      url,
      params,
      timestamp: now.toISOString(),
      expiresAt,
      data,
    };

    const jsonStr = JSON.stringify(cacheEntry, null, 2);
    fs.writeFileSync(filePath, jsonStr, "utf-8");
    const sizeKB = (jsonStr.length / 1024).toFixed(2);
    console.log(`💾 Cache WRITE for ${url} (${sizeKB} KB)`);
  } catch (error) {
    console.error(`❌ Cache write error for ${url}:`, error);
  }
}

/**
 * Clear all disk cache files
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
      console.log(`✓ Cleared ${files.length} cache entries`);
    } else {
      console.log(`✓ Cache directory does not exist, nothing to clear`);
    }
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  enabled: boolean;
  entries: number;
  totalSize: number;
  directory: string;
} {
  const enabled = isCacheEnabled();

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { enabled, entries: 0, totalSize: 0, directory: CACHE_DIR };
    }

    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const stats = fs.statSync(path.join(CACHE_DIR, file));
      totalSize += stats.size;
    }

    return {
      enabled,
      entries: files.length,
      totalSize,
      directory: CACHE_DIR,
    };
  } catch (error) {
    console.warn("Failed to get cache stats:", error);
    return { enabled, entries: 0, totalSize: 0, directory: CACHE_DIR };
  }
}
