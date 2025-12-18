# API Response Caching

## Overview

ADO Wrapped implements automatic caching of Azure DevOps API responses to improve development speed and reduce unnecessary API calls during debugging and development.

## How It Works

1. **Request Interception**: When the Azure DevOps client makes a GET or POST request, it first checks if a cached response exists
2. **Cache Key Generation**: A deterministic SHA-256 hash is generated from the URL and all request parameters
3. **Cache Hit**: If found, the cached response is returned immediately without making a network request
4. **Cache Miss**: If not found, the API request is made and the response is cached for future use
5. **Storage**: Responses are stored as JSON files in `.ado-cache/` directory

## Cache Key Structure

Each cache file is named using a hash of:

- Request URL
- All query parameters (sorted alphabetically for consistency)
- For POST requests: request body

Example cache file:

```json
{
  "url": "/_apis/git/repositories/myrepo/commits",
  "params": {
    "api-version": "7.0",
    "searchCriteria.$top": 100,
    "searchCriteria.fromDate": "2024-01-01",
    "searchCriteria.toDate": "2024-12-31"
  },
  "timestamp": "2024-12-17T10:30:00.000Z",
  "data": {
    // Actual API response data
  }
}
```

## Cache Management

### View Cache Statistics

```bash
npm run cache:stats
```

Shows:

- Number of cached entries
- Total size on disk
- Cache directory location

### Clear Cache

```bash
npm run cache:clear
```

Removes all cached responses. Useful when:

- Debugging data transformation issues
- Azure DevOps data has changed (new commits/PRs)
- Testing error handling with different PAT tokens

### Programmatic Control

Disable caching when creating the client:

```typescript
import { AzureDevOpsClient } from "@/lib/azure-devops";

const client = new AzureDevOpsClient({
  organization: "microsoft",
  pat: process.env.ADO_PAT!,
  enableCache: false, // Bypass cache
});
```

## Benefits

1. **Faster Development**: Instant responses for repeated requests
2. **Reduced API Load**: Prevents hitting rate limits during development
3. **Offline Development**: Work with cached data without network access
4. **Cost Efficiency**: Fewer API calls for metered services
5. **Debugging**: Consistent data across test runs

## Cache Behavior

### What is Cached

- ✅ GET requests (commits, pull requests, repository info)
- ✅ POST requests (WIQL queries for work items)
- ✅ All pagination requests
- ✅ Commit detail requests

### What is NOT Cached

- ❌ Authentication errors (401, 403)
- ❌ Not found errors (404)
- ❌ Rate limit errors (429)
- ❌ Server errors (5xx)

## Cache Invalidation

The cache does **not** automatically expire. To ensure fresh data:

1. **Clear cache manually** when you know data has changed
2. **Disable cache** for production API routes (already handled)
3. **Delete specific cache files** from `.ado-cache/` if needed

## Directory Structure

```
.ado-cache/
├── a1b2c3d4e5f6...abc123.json  # Commits request
├── f7e8d9c0b1a2...def456.json  # Pull requests request
├── 1234567890ab...ghi789.json  # Repository info
└── ...
```

## Security Notes

- Cache files contain **API response data** (commits, PRs, etc.)
- **PAT tokens are NOT cached** — they remain in memory only
- `.ado-cache/` is in `.gitignore` — never committed to version control
- Safe to share cache files (no sensitive auth data)

## Implementation Files

| File                             | Purpose                       |
| -------------------------------- | ----------------------------- |
| `src/lib/azure-devops/cache.ts`  | Core caching logic            |
| `src/lib/azure-devops/client.ts` | Client with cache integration |
| `cache-cli.ts`                   | CLI management tool           |

## Troubleshooting

### Cache not working

1. Check that `.ado-cache/` directory exists and is writable
2. Verify `enableCache` is not set to `false`
3. Check console logs for "Cache HIT" or "Cache WRITE" messages

### Stale data

1. Run `npm run cache:clear` to remove all cached responses
2. Delete specific cache files from `.ado-cache/` directory
3. Modify request parameters to generate new cache keys

### Large cache size

Cache files can grow large with many API responses. To reduce size:

```bash
# Clear entire cache
npm run cache:clear

# Or manually remove old cache files
rm .ado-cache/*.json
```

## Examples

### Example: Testing without network

```bash
# First run - makes real API calls and caches responses
npm run test:api

# Subsequent runs - uses cached data (instant)
npm run test:api

# Clear cache to force fresh API calls
npm run cache:clear
npm run test:api
```

### Example: Debugging with consistent data

```typescript
// Development: cache enabled (default)
const client = new AzureDevOpsClient({
  organization: "myorg",
  pat: "mytoken",
});

// Test different aggregation logic with same raw data
const commits = await fetchCommits({
  /* options */
});
// Uses cache - instant response, same data every time
```

### Example: Production API route

```typescript
// Production: cache disabled
export async function GET(request: NextRequest) {
  const client = new AzureDevOpsClient({
    organization: req.query.org,
    pat: req.headers.authorization,
    enableCache: false, // Always fetch fresh data
  });

  // ... rest of handler
}
```

## Future Enhancements

Potential improvements:

- [ ] Time-based cache expiration (TTL)
- [ ] Cache size limits with LRU eviction
- [ ] Per-repository cache isolation
- [ ] Cache compression for large responses
- [ ] Cache warming (pre-fetch common queries)
