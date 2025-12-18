# Phase 2: Azure DevOps API Integration - Testing Guide

## Overview

Phase 2 has been completed! The following components have been implemented:

- ✅ Azure DevOps API Client with authentication
- ✅ TypeScript types for API responses
- ✅ Commits API fetcher with pagination
- ✅ Pull Requests API fetcher with filtering
- ✅ Stats aggregator with insights generation
- ✅ End-to-end test script

## Testing the Integration

### Step 1: Set up your configuration

1. Copy the example configuration:

   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and fill in your Azure DevOps credentials:

   ```env
   # Required settings
   ADO_ORGANIZATION=your-organization
   ADO_PROJECT=your-project
   ADO_REPOSITORY=your-repository
   ADO_PAT=your-personal-access-token-here

   # Optional settings
   ADO_USER_EMAIL=your-email@example.com
   ADO_YEAR=2024
   ADO_INCLUDE_COMMITS=true
   ADO_INCLUDE_PULL_REQUESTS=true
   ```

3. **Important**:
   - Ensure your PAT has the following permissions:
     - Code (Read)
     - Pull Request Threads (Read)
   - Never commit your `.env` file (it's in `.gitignore`)

### Step 2: Run the test

```bash
npm run test:api
```

This will:

1. Load your configuration from `.env` file
2. Fetch all commits and pull requests for the specified year
3. Aggregate statistics
4. Display a formatted report in the console
5. Save the full results to `wrapped-{year}.json`

### Expected Output

The test script will show:

```
🧪 Testing Azure DevOps API Integration

📋 Configuration:
   Organization: your-org
   Project: your-project
   Repository: your-repo
   Year: 2024
   User Email: your-email@example.com

📥 Fetching data from Azure DevOps...

1️⃣  Fetching commits...
✓ Fetched 234 commits from 2024-01-01 to 2024-12-31

2️⃣  Fetching pull requests...
✓ Fetched 45 pull requests from 2024-01-01 to 2024-12-31

3️⃣  Aggregating statistics...

📊 Aggregating stats for 2024...
   Commits: 234
   Pull Requests: 45

✅ Success! Here are your stats:

═══════════════════════════════════════════════════════════
📊 COMMIT STATISTICS
═══════════════════════════════════════════════════════════
Total Commits: 234
Lines Added: 12,345
Lines Edited: 3,456
Lines Deleted: 2,789
Longest Streak: 12 days
...
```

## What Gets Tested

### 1. API Client

- ✅ Base URL construction
- ✅ PAT authentication (Basic auth)
- ✅ Error handling (401, 403, 404, 429, 5xx)
- ✅ Request/response handling

### 2. Commits Fetcher

- ✅ Date range filtering
- ✅ User email filtering
- ✅ Pagination (handles >100 commits)
- ✅ Change counts (additions/edits/deletions)
- ✅ File extension extraction

### 3. Pull Requests Fetcher

- ✅ Date range filtering
- ✅ User filtering (creator and reviewer)
- ✅ Status filtering (completed, abandoned, active)
- ✅ Merge time calculation
- ✅ Pagination

### 4. Stats Aggregator

- ✅ Commits by month/day/hour
- ✅ Longest streak calculation
- ✅ PR merge time averages
- ✅ Personality detection
- ✅ Top file extensions
- ✅ Top commit keywords

## Troubleshooting

### Authentication Error

```
❌ Authentication failed. Please check your Personal Access Token (PAT).
```

**Solution**: Verify your PAT is valid and has the correct permissions.

### Resource Not Found

```
❌ Resource not found. Please verify your organization, project, and repository names.
```

**Solution**: Check that the org/project/repo names in `.env` are correct and properly formatted.

### Rate Limit

```
❌ Rate limit exceeded. Please retry after 60 seconds.
```

**Solution**: Wait and retry. Azure DevOps has rate limits.

### No Data Returned

If you get 0 commits or PRs:

- Verify the year in `.env` (ADO_YEAR)
- Check if the repository had activity in that year
- If using ADO_USER_EMAIL, verify the email matches what's in Azure DevOps

## Implementation Details

### Files Created

```
src/lib/azure-devops/
├── client.ts           # Base API client with auth and error handling
├── types.ts            # TypeScript types for API responses
├── commits.ts          # Commits fetcher with pagination
├── pullRequests.ts     # Pull requests fetcher
├── aggregator.ts       # Stats aggregation logic
└── index.ts            # Public exports
```

### Key Features

#### Client (`client.ts`)

- Axios-based HTTP client
- Automatic PAT authentication via Basic Auth
- Comprehensive error handling with user-friendly messages
- Rate limit detection (429 responses)
- Configurable API version (default: 7.0)

#### Commits Fetcher (`commits.ts`)

- Fetches all commits with automatic pagination
- Filters by date range and user email
- Retrieves detailed change counts (Add/Edit/Delete)
- Extracts file extensions for insights
- Handles large repositories efficiently

#### Pull Requests Fetcher (`pullRequests.ts`)

- Fetches PRs by creator and reviewer
- Filters by date range and status
- Calculates average merge time
- Identifies largest PRs
- Deduplicates results

#### Aggregator (`aggregator.ts`)

- Groups commits by month, day of week, and hour
- Calculates longest commit streak
- Generates personality type (Night Owl, Early Bird, etc.)
- Extracts top commit keywords
- Identifies top file types

## Next Steps

After successful testing:

1. ✅ Phase 2 is complete
2. ➡️ Move to Phase 3: Azure Functions API endpoints
3. ➡️ Move to Phase 4: Frontend UI components

## API Reference

### fetchCommits()

```typescript
await fetchCommits({
  organization: string,
  project: string,
  repository: string,
  pat: string,
  fromDate: string, // YYYY-MM-DD
  toDate: string, // YYYY-MM-DD
  userEmail: string,
  includeChangeCounts: boolean,
});
```

### fetchPullRequests()

```typescript
await fetchPullRequests({
  organization: string,
  project: string,
  repository: string,
  pat: string,
  fromDate: string, // YYYY-MM-DD
  toDate: string, // YYYY-MM-DD
  userEmail: string,
  includeReviewed: boolean,
});
```

### aggregateStats()

```typescript
aggregateStats({
  commits: GitCommit[],
  pullRequests: GitPullRequest[],
  config: {
    organization: string,
    project: string,
    repository: string,
    year: number,
    userEmail?: string
  }
})
```
