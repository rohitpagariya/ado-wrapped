# Debugging Guide

## Viewing Logs

The application now has comprehensive logging throughout the entire data fetching pipeline. Here's how to view and interpret the logs:

### Development Server Logs

When running `npm run dev`, all server-side logs appear in your terminal:

```bash
npm run dev
```

Look for logs like:

```
[1702835400000] 🚀 API Request started
[1702835400000] 🔑 PAT present: true
[1702835400000] 📋 Parameters: { organization: 'microsoft', project: 'vscode', ... }
[1702835400000] 📊 Fetching stats for microsoft/vscode/vscode-repo (2024)
[1702835400000] 📅 Date range: 2024-01-01 to 2024-12-31
[1702835400000] 🔄 Starting parallel data fetch...
📜 fetchCommits: Starting for microsoft/vscode/vscode-repo
📅 Date range: 2024-01-01 to 2024-12-31, User: all
📊 Fetching commits page 1 (skip: 0)...
🌐 GET /_apis/git/repositories/vscode-repo/commits
⚪ Cache MISS for /_apis/git/repositories/vscode-repo/commits
📡 Making API request to Azure DevOps...
✅ API response received in 1234ms
💾 Cache WRITE for /_apis/git/repositories/vscode-repo/commits (45.23 KB)
✅ Fetched 100 commits on page 1
...
```

### Browser Console Logs

Client-side errors may appear in the browser console (F12 → Console tab).

### Log Emoji Key

| Emoji | Meaning                 |
| ----- | ----------------------- |
| 🚀    | Request started         |
| 🔑    | Authentication          |
| 📋    | Parameters              |
| 📊    | Data fetching           |
| 📅    | Date range              |
| 🔄    | Parallel operations     |
| 🌐    | HTTP request            |
| 📡    | Making API call         |
| ✅    | Success                 |
| ❌    | Error                   |
| ⚠️    | Warning                 |
| ⚪    | Cache miss              |
| 💾    | Cache write             |
| 🔍    | Fetching details        |
| 📜    | Commits operation       |
| 🔄    | Pull requests operation |
| 🎉    | Completion              |
| 🔴    | Error response          |

## Common Issues and Logs to Look For

### Issue: "Fetching data" Stuck Forever

**What to check:**

1. **No request started**

   - Missing: `[timestamp] 🚀 API Request started`
   - **Solution:** Check if frontend is calling the API correctly

2. **Request started but hangs**
   Look for where it stops:

   ```
   [timestamp] 🚀 API Request started
   [timestamp] 📋 Parameters: {...}
   [timestamp] 🔄 Starting parallel data fetch...
   // STOPS HERE - no further logs
   ```

   - **Solution:** API request is hanging, check network or credentials

3. **Authentication error**

   ```
   ❌ Azure DevOps API Error: { status: 401 }
   🔑 Authentication failed - check PAT token
   ```

   - **Solution:** PAT token is invalid or expired

4. **Resource not found**

   ```
   ❌ Azure DevOps API Error: { status: 404 }
   ```

   - **Solution:** Organization, project, or repository name is incorrect

5. **Rate limiting**

   ```
   ❌ Azure DevOps API Error: { status: 429 }
   ```

   - **Solution:** Too many requests, wait and retry

6. **Network timeout**
   ```
   ❌ Error fetching commits: timeout of 30000ms exceeded
   ```
   - **Solution:** Network issue or ADO service slow, increase timeout

### Issue: Slow Performance

Look for timing logs:

```
✅ API response received in 5234ms  // Very slow!
✅ Data fetched in 15234ms
✅ Stats aggregated in 234ms
🎉 Request completed successfully in 15500ms
```

If API responses are slow (>3000ms), check:

- Network connection
- Azure DevOps service status
- Repository size (large repos take longer)
- Use cache to speed up subsequent requests

### Issue: Empty or Incorrect Data

Look for:

```
✅ Commits: 0, PRs: 0  // No data returned
```

or

```
🎉 fetchCommits: Fetched total of 0 commits from 2024-01-01 to 2024-12-31
```

**Possible causes:**

- Wrong date range
- No commits in that period
- Incorrect user email filter
- Wrong repository name

## Debugging Workflow

1. **Start dev server with logs visible:**

   ```bash
   npm run dev
   ```

2. **Open the app in browser:**

   ```
   http://localhost:3000
   ```

3. **Fill in the form and submit**

4. **Watch terminal logs** for:

   - Request ID (helps track specific request)
   - Parameters (verify they're correct)
   - API calls (check URLs and timing)
   - Cache behavior (HIT vs MISS)
   - Data counts (commits, PRs)
   - Errors or warnings

5. **If stuck, identify last log message** to see where it stopped

6. **Check browser console** (F12) for client-side errors

## Useful Commands

```bash
# Clear cache to force fresh API calls
npm run cache:clear

# View cache statistics
npm run cache:stats

# Run test API script with full logging
npm run test:api

# Check TypeScript errors
npm run type-check
```

## Log Examples

### Successful Request

```
[1702835400000] 🚀 API Request started
[1702835400000] 🔑 PAT present: true
[1702835400000] 📋 Parameters: {
  organization: 'microsoft',
  project: 'vscode',
  repository: 'vscode',
  year: '2024',
  userEmail: '(none)'
}
[1702835400000] 📊 Fetching stats for microsoft/vscode/vscode (2024)
[1702835400000] 📅 Date range: 2024-01-01 to 2024-12-31
[1702835400000] 🔄 Starting parallel data fetch...
📜 fetchCommits: Starting for microsoft/vscode/vscode
📅 Date range: 2024-01-01 to 2024-12-31, User: all
📊 Fetching commits page 1 (skip: 0)...
🌐 GET /_apis/git/repositories/vscode/commits
✅ Cache HIT for /_apis/git/repositories/vscode/commits (cached: 2024-12-17T10:30:00.000Z)
✅ Fetched 100 commits on page 1
...
🎉 ✓ Fetched total of 245 commits from 2024-01-01 to 2024-12-31 in 3 pages
🔄 fetchPullRequests: Starting for microsoft/vscode/vscode
...
🎉 ✓ Fetched total of 89 pull requests from 2024-01-01 to 2024-12-31
[1702835400000] ✅ Data fetched in 2340ms
[1702835400000] 📈 Commits: 245, PRs: 89
[1702835400000] 🔢 Aggregating statistics...
[1702835400000] ✅ Stats aggregated in 45ms
[1702835400000] 🎉 Request completed successfully in 2385ms
```

### Failed Request (Authentication)

```
[1702835400000] 🚀 API Request started
[1702835400000] 🔑 PAT present: true
[1702835400000] 📋 Parameters: { organization: 'myorg', ... }
[1702835400000] 🔄 Starting parallel data fetch...
📜 fetchCommits: Starting for myorg/myproject/myrepo
🌐 GET /_apis/git/repositories/myrepo/commits
⚪ Cache MISS for /_apis/git/repositories/myrepo/commits
📡 Making API request to Azure DevOps...
❌ Azure DevOps API Error: {
  url: '/_apis/git/repositories/myrepo/commits',
  method: 'get',
  status: 401,
  statusText: 'Unauthorized',
  message: 'Request failed with status code 401'
}
🔴 Response data: { message: 'Invalid PAT token' }
🔑 Authentication failed - check PAT token
[1702835400000] ❌ Stats API error: {
  message: 'Authentication failed. Please check your Personal Access Token (PAT).',
  name: 'Error',
  code: undefined,
  response: 401
}
```

## Tips

- **Keep terminal visible** while testing
- **Request ID helps** track specific requests in logs
- **Look for last successful step** when debugging stuck issues
- **Cache logs show** if you're hitting API or using cache
- **Timing logs help** identify performance bottlenecks
- **Error logs include** full context for debugging

## Need More Help?

If logs don't reveal the issue:

1. Check network tab in browser DevTools (F12 → Network)
2. Verify Azure DevOps PAT token has correct scopes
3. Test PAT token with `npm run test:api`
4. Check Azure DevOps service status
5. Review CORS settings if calling from different domain
