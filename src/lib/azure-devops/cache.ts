import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), ".ado-cache");

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
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read from cache
 */
export function readCache<T>(
  url: string,
  params?: Record<string, any>
): T | null {
  try {
    const cacheKey = generateCacheKey(url, params);
    const filePath = getCacheFilePath(cacheKey);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const cached = JSON.parse(content);

    console.log(`✓ Cache HIT for ${url}`);
    return cached.data as T;
  } catch (error) {
    console.warn(`Cache read error for ${url}:`, error);
    return null;
  }
}

/**
 * Write to cache
 */
export function writeCache<T>(
  url: string,
  params: Record<string, any> | undefined,
  data: T
): void {
  try {
    ensureCacheDir();

    const cacheKey = generateCacheKey(url, params);
    const filePath = getCacheFilePath(cacheKey);

    const cacheEntry = {
      url,
      params,
      timestamp: new Date().toISOString(),
      data,
    };

    fs.writeFileSync(filePath, JSON.stringify(cacheEntry, null, 2), "utf-8");
    console.log(`✓ Cache WRITE for ${url}`);
  } catch (error) {
    console.warn(`Cache write error for ${url}:`, error);
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
      console.log(`✓ Cleared ${files.length} cache entries`);
    }
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  totalSize: number;
  directory: string;
} {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { entries: 0, totalSize: 0, directory: CACHE_DIR };
    }

    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const stats = fs.statSync(path.join(CACHE_DIR, file));
      totalSize += stats.size;
    }

    return {
      entries: files.length,
      totalSize,
      directory: CACHE_DIR,
    };
  } catch (error) {
    console.warn("Failed to get cache stats:", error);
    return { entries: 0, totalSize: 0, directory: CACHE_DIR };
  }
}
