# API Response Caching - Quick Reference

## What Changed

✅ **Automatic caching** for all Azure DevOps API responses  
✅ **Transparent** — no code changes needed in existing code  
✅ **Development-friendly** — instant responses for repeated requests  
✅ **Configurable** — can be disabled per-request or globally

## Files Added/Modified

### New Files

- `src/lib/azure-devops/cache.ts` — Core caching implementation
- `cache-cli.ts` — CLI tool for cache management
- `CACHING.md` — Comprehensive caching documentation

### Modified Files

- `src/lib/azure-devops/client.ts` — Added cache integration to GET/POST methods
- `src/lib/azure-devops/commits.ts` — Added `enableCache` option
- `src/lib/azure-devops/pullRequests.ts` — Added `enableCache` option
- `src/lib/azure-devops/index.ts` — Export cache utilities
- `src/app/api/stats/route.ts` — Added caching comment
- `test-api.ts` — Added caching documentation
- `package.json` — Added cache management scripts
- `.gitignore` — Added `.ado-cache/` directory
- `README.md` — Added caching section

## How to Use

### View Cache Statistics

```bash
npm run cache:stats
```

### Clear Cache

```bash
npm run cache:clear
```

### Disable Caching (if needed)

```typescript
const commits = await fetchCommits({
  organization: "myorg",
  project: "myproject",
  repository: "myrepo",
  pat: "mytoken",
  fromDate: "2024-01-01",
  toDate: "2024-12-31",
  enableCache: false, // Disable caching
});
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure DevOps Client                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────┐
                              │                             │
                         GET/POST Request            Is Cache Enabled?
                              │                             │
                              │                            Yes
                              │                             │
                              ▼                             ▼
                    ┌──────────────────┐         ┌──────────────────┐
                    │ Generate Cache   │         │   Check Cache    │
                    │ Key (SHA-256)    │         │                  │
                    └──────────────────┘         └──────────────────┘
                              │                             │
                              │                   ┌─────────┴─────────┐
                              │                   │                   │
                              │                 Hit                  Miss
                              │                   │                   │
                              │                   ▼                   ▼
                              │          ┌──────────────┐    ┌──────────────┐
                              │          │ Return from  │    │  Make API    │
                              │          │    Cache     │    │   Request    │
                              │          └──────────────┘    └──────────────┘
                              │                                      │
                              │                                      │
                              │                                      ▼
                              │                           ┌──────────────────┐
                              │                           │  Write to Cache  │
                              │                           │  (.ado-cache/)   │
                              │                           └──────────────────┘
                              │                                      │
                              └──────────────────────────────────────┘
                                             │
                                             ▼
                                    Return Response Data
```

## Cache Key Generation

For a request like:

```
GET /_apis/git/repositories/myrepo/commits?api-version=7.0&searchCriteria.fromDate=2024-01-01
```

Cache key is SHA-256 hash of:

```json
{
  "url": "/_apis/git/repositories/myrepo/commits",
  "params": {
    "api-version": "7.0",
    "searchCriteria.fromDate": "2024-01-01"
  }
}
```

Result: `a1b2c3d4e5f6...abc123.json`

## Benefits

| Benefit                    | Description                              |
| -------------------------- | ---------------------------------------- |
| 🚀 **Faster Development**  | Instant responses for repeated API calls |
| 💰 **Reduced Costs**       | Fewer API calls = lower rate limit usage |
| 🐛 **Easier Debugging**    | Consistent data across test runs         |
| 🌐 **Offline Development** | Work with cached data without network    |
| ⚡ **Better UX**           | Faster page loads for identical requests |

## When Cache is Used

✅ Development with `npm run dev`  
✅ Testing with `npm run test:api`  
✅ Production API routes (for identical requests)  
✅ All GET requests (commits, PRs, repos)  
✅ All POST requests (WIQL queries)

## When Cache is NOT Used

❌ When explicitly disabled: `enableCache: false`  
❌ For authentication errors (401, 403)  
❌ For not found errors (404)  
❌ For rate limit errors (429)

## Examples

### Example 1: Development Speed

```bash
# First run - makes API calls (slow)
time npm run test:api
# Real: 15.2s

# Clear cache and run again
npm run cache:clear
time npm run test:api
# Real: 15.1s

# Run with cache (instant!)
time npm run test:api
# Real: 0.8s  ⚡️
```

### Example 2: Debugging Data Issues

```bash
# Make changes to aggregation logic
# vim src/lib/azure-devops/aggregator.ts

# Test with cached data (instant feedback)
npm run test:api

# If you need fresh data
npm run cache:clear && npm run test:api
```

### Example 3: Production Caching

User requests: `GET /api/stats?org=microsoft&project=vscode&repo=vscode&year=2024`

- First request: Fetches from Azure DevOps, caches response (~15s)
- Subsequent identical requests: Returns from cache (<1s)
- Different user/repo: Makes new API call

## File Structure

```
.ado-cache/
├── a1b2c3d4e5f6...abc123.json  # Cached commits request
├── f7e8d9c0b1a2...def456.json  # Cached PRs request
├── 1234567890ab...ghi789.json  # Cached repo info
└── ...
```

Each file contains:

```json
{
  "url": "/_apis/git/repositories/myrepo/commits",
  "params": {
    /* request params */
  },
  "timestamp": "2024-12-17T10:30:00.000Z",
  "data": {
    /* actual API response */
  }
}
```

## Configuration

### Environment-Based Control

Add to `.env` (optional):

```bash
# Disable caching globally
ADO_CACHE_ENABLED=false
```

Then update client:

```typescript
const enableCache = process.env.ADO_CACHE_ENABLED !== "false";
const client = new AzureDevOpsClient({
  organization,
  pat,
  enableCache,
});
```

### Per-Request Control

```typescript
// Cache enabled (default)
await fetchCommits({ /* options */ });

// Cache disabled for this request
await fetchCommits({
  /* options */,
  enableCache: false
});
```

## Troubleshooting

### Problem: Getting stale data

**Solution:** Clear cache with `npm run cache:clear`

### Problem: Cache files taking up disk space

**Solution:**

```bash
npm run cache:stats  # Check size
npm run cache:clear  # Remove all
```

### Problem: Can't tell if cache is working

**Solution:** Look for console logs:

- `✓ Cache HIT for <url>` — Using cached data
- `✓ Cache WRITE for <url>` — Storing new data

### Problem: Need to bypass cache once

**Solution:**

```typescript
// Option 1: Disable for single request
await fetchCommits({ ...options, enableCache: false });

// Option 2: Delete specific cache file
// Find file in .ado-cache/ and delete it
```

## Next Steps

1. ✅ Run `npm run type-check` to verify (already passed)
2. ✅ Test with `npm run test:api`
3. 📊 Check cache stats: `npm run cache:stats`
4. 🧹 Clear when needed: `npm run cache:clear`
5. 📖 Read full docs: [CACHING.md](CACHING.md)

## Summary

You now have a fully functional caching layer that:

- Automatically caches all Azure DevOps API responses
- Dramatically speeds up development and testing
- Reduces API load and rate limiting issues
- Requires zero code changes to existing code
- Can be easily controlled via configuration

Happy coding! 🚀
