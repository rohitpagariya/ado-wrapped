# Efficient Cross-Organization Data Fetching: Design Document

> **Purpose**: End-to-end design for optimizing Azure DevOps data fetching to minimize API calls while discovering user activity across all organizations, projects, and repositories.
>
> **Date**: December 2024  
> **Status**: Proposed

---

## Executive Summary

This document outlines the end-to-end design for optimizing Azure DevOps data fetching to minimize API calls while discovering user activity across all organizations, projects, and repositories. The key insight is leveraging **organization-level APIs** for work items (WIQL) and **project-level APIs** for pull requests, reducing API calls from O(repositories) to O(organizations) + O(projects).

**Target reduction**: From 500+ API calls to ~65 calls for a user with 3 orgs, 30 projects, and 500 repos.

---

## Table of Contents

1. [Azure DevOps APIs Available](#part-1-azure-devops-apis-available)
2. [API Call Optimization Strategy](#part-2-api-call-optimization-strategy)
3. [Implementation Changes](#part-3-implementation-changes)
4. [API Route Changes](#part-4-api-route-changes)
5. [UI Changes](#part-5-ui-changes)
6. [Data Flow Summary](#part-6-data-flow-summary)
7. [Implementation Checklist](#part-7-implementation-checklist)
8. [Risks and Mitigations](#part-8-risks-and-mitigations)
9. [Appendix: WIQL Query Reference](#appendix-wiql-query-reference)

---

## Part 1: Azure DevOps APIs Available

### 1.1 Discovery APIs (No Organization Required)

These APIs use `app.vssps.visualstudio.com` as the base URL and don't require knowing the organization upfront.

| API | Endpoint | Purpose | Response |
|-----|----------|---------|----------|
| **Profile** | `GET https://app.vssps.visualstudio.com/_apis/profile/profiles/me` | Get current user info | `{ id, displayName, emailAddress, publicAlias }` |
| **Accounts** | `GET https://app.vssps.visualstudio.com/_apis/accounts?memberId={userId}` | List all organizations user belongs to | `{ value: [{ accountId, accountName, accountUri }] }` |

**Authentication**: Same Basic auth pattern with PAT.

### 1.2 Organization-Level APIs

| API | Endpoint | Purpose | Key Filters |
|-----|----------|---------|-------------|
| **Projects** | `GET https://dev.azure.com/{org}/_apis/projects` | List all projects in org | `stateFilter=wellFormed`, `$top=500` |
| **WIQL (Cross-Project)** | `POST https://dev.azure.com/{org}/_apis/wit/wiql` | Query work items across ALL projects | WIQL query with `EVER [AssignedTo]`, date range |

### 1.3 Project-Level APIs

| API | Endpoint | Purpose | Key Filters |
|-----|----------|---------|-------------|
| **Pull Requests** | `GET https://dev.azure.com/{org}/{project}/_apis/git/pullrequests` | Get all PRs across ALL repos in project | `searchCriteria.creatorId`, `searchCriteria.status`, `searchCriteria.targetRefName`, date range |
| **Repositories** | `GET https://dev.azure.com/{org}/{project}/_apis/git/repositories` | List all repos in project | None |

### 1.4 Repository-Level APIs (Current Approach - Expensive)

| API | Endpoint | Purpose |
|-----|----------|---------|
| **Commits** | `GET https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repo}/commits` | Commits for a single repo |

### 1.5 PR API Response Details

The project-level Pull Requests API returns detailed information including target branch:

```typescript
interface GitPullRequest {
  pullRequestId: number;
  status: 'active' | 'completed' | 'abandoned';
  createdBy: { id: string; displayName: string; };
  creationDate: string;
  closedDate?: string;
  title: string;
  sourceRefName: string;    // e.g., "refs/heads/feature/my-feature"
  targetRefName: string;    // e.g., "refs/heads/main" - THE MERGE TARGET
  repository?: {
    id: string;
    name: string;
    project: { name: string; };
  };
  // ... other fields
}
```

**Key Fields for Discovery**:
- `targetRefName`: Which branch the PR was merged into (e.g., `refs/heads/main`)
- `repository.id` / `repository.name`: Which repo this PR belongs to
- `createdBy.id`: Who created the PR (for filtering)
- `status`: Whether it was merged (`completed`) or abandoned

---

## Part 2: API Call Optimization Strategy

### 2.1 Current vs Optimized Call Count

| Resource | Current Approach | Optimized Approach | Savings |
|----------|------------------|-------------------|---------|
| User Profile | N/A (manual input) | 1 call | New |
| Organizations | N/A (manual input) | 1 call | New |
| Projects | 1 per org | 1 per org | Same |
| **Work Items** | 1 per project (30) | **1 per org (3)** | **90%** |
| **PRs (discovery)** | 1 per repo (500) | **2 per project (60)** | **88%** |
| Commits | 1 per repo (500) | 1 per active repo (~50) | **90%** |
| **Total** | ~1,060 calls | ~115 calls | **~89%** |

### 2.2 Discovery Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DISCOVERY PHASE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [1] Profile API ─────────────────────────────────────────► User ID     │
│      app.vssps.visualstudio.com/_apis/profile/profiles/me    (1 call)   │
│                                                                          │
│  [2] Accounts API ────────────────────────────────────────► Org List    │
│      app.vssps.visualstudio.com/_apis/accounts?memberId=X    (1 call)   │
│                                                                          │
│  [3] Projects API (per org) ──────────────────────────────► Project List│
│      dev.azure.com/{org}/_apis/projects                      (N calls)  │
│                                                                          │
│  [4] PR API (per project) ────────────────────────────────► Active Repos│
│      dev.azure.com/{org}/{project}/_apis/git/pullrequests   (P×2 calls)│
│      Filters: creatorId, status=completed, targetRefName=main/master    │
│      Returns: repository.id for each PR → unique repos with activity    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FETCH PHASE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [5] Org-Level WIQL ──────────────────────────────────────► Work Items  │
│      POST dev.azure.com/{org}/_apis/wit/wiql                 (N calls)  │
│      Query: All projects, user assigned, date range                     │
│      + Batch fetch details (200 per call)                               │
│                                                                          │
│  [6] Project-Level PR Fetch ──────────────────────────────► Full PRs    │
│      dev.azure.com/{org}/{project}/_apis/git/pullrequests   (P calls)  │
│      Already have this data from discovery!                              │
│                                                                          │
│  [7] Commits (active repos only) ─────────────────────────► Commits     │
│      dev.azure.com/{org}/{project}/_apis/git/repos/{repo}/commits       │
│      Only for repos identified in step [4]                  (R calls)   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Implementation Changes

### 3.1 New Module: `src/lib/azure-devops/discovery.ts`

```typescript
// New types
interface UserProfile {
  id: string;
  displayName: string;
  emailAddress: string;
  publicAlias: string;
}

interface Organization {
  accountId: string;
  accountName: string;
  accountUri: string;
}

interface DiscoveryResult {
  profile: UserProfile;
  organizations: OrganizationDiscovery[];
  stats: {
    totalOrgs: number;
    totalProjects: number;
    totalActiveRepos: number;
    apiCallsMade: number;
  };
}

interface OrganizationDiscovery {
  name: string;
  projects: ProjectDiscovery[];
}

interface ProjectDiscovery {
  name: string;
  activeRepositories: RepositoryInfo[];  // Repos with user PRs
}

interface RepositoryInfo {
  id: string;
  name: string;
  defaultBranch: string;
}

// New functions
async function fetchUserProfile(pat: string): Promise<UserProfile>;
async function fetchOrganizations(pat: string, userId: string): Promise<Organization[]>;
async function discoverActiveRepositories(
  pat: string, 
  organization: string, 
  project: string, 
  userId: string,
  year: number
): Promise<RepositoryInfo[]>;
async function discoverAll(pat: string, year: number): Promise<DiscoveryResult>;
```

### 3.2 New Global API Client

Add to `src/lib/azure-devops/client.ts`:

```typescript
// New: Global client for app.vssps.visualstudio.com (no org required)
export class GlobalAzureDevOpsClient {
  private client: AxiosInstance;
  
  constructor(pat: string) {
    this.client = axios.create({
      baseURL: 'https://app.vssps.visualstudio.com',
      headers: {
        Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      timeout: API_TIMEOUT_MS,
    });
  }
  
  async getProfile(): Promise<UserProfile>;
  async getOrganizations(memberId: string): Promise<Organization[]>;
}
```

### 3.3 Updated Work Items Fetcher: `src/lib/azure-devops/workItems.ts`

**Current**: Queries per-project with `[System.TeamProject] = 'ProjectName'`

**New**: Add organization-level function:

```typescript
// New function for org-level work item fetch
export async function fetchWorkItemsForOrganization(
  client: AzureDevOpsClient,
  options: {
    year: number;
    userEmail: string;
    // No project param - queries all projects
  }
): Promise<WorkItem[]> {
  
  // WIQL query WITHOUT project filter
  const wiqlQuery = `
    SELECT [System.Id], [System.TeamProject], [System.WorkItemType], ...
    FROM WorkItems
    WHERE [System.State] IN ('Resolved', 'Closed', 'Done', 'Completed')
      AND NOT [System.Reason] CONTAINS 'Rejected'
      AND EVER [System.AssignedTo] = '${userEmail}'
      AND [System.ChangedDate] >= '${year}-01-01'
      AND [System.ChangedDate] <= '${year}-12-31'
    ORDER BY [System.ChangedDate] DESC
  `;
  
  // POST to org-level endpoint (no project in path)
  const queryResult = await client.post<WorkItemQueryResult>(
    `/_apis/wit/wiql`,  // Note: no /{project}/ prefix
    { query: wiqlQuery }
  );
  
  // Batch fetch details...
  return workItems;
}
```

### 3.4 Updated Pull Requests Fetcher: `src/lib/azure-devops/pullRequests.ts`

**Current**: Queries per-repository

**New**: Add project-level function:

```typescript
// New function for project-level PR fetch (all repos in project)
export async function fetchPullRequestsForProject(
  client: AzureDevOpsClient,
  options: {
    project: string;
    userId: string;      // Pre-resolved user UUID
    year: number;
    targetBranches?: string[];  // Default: ['main', 'master']
  }
): Promise<{
  pullRequests: GitPullRequest[];
  activeRepositoryIds: Set<string>;  // Repos with user PRs
}> {
  
  const { project, userId, year, targetBranches = ['main', 'master'] } = options;
  const allPRs: GitPullRequest[] = [];
  const activeRepoIds = new Set<string>();
  
  for (const branch of targetBranches) {
    // Project-level endpoint (no repo in path)
    const url = `/${project}/_apis/git/pullrequests`;
    const params = {
      'searchCriteria.creatorId': userId,
      'searchCriteria.status': 'completed',
      'searchCriteria.targetRefName': `refs/heads/${branch}`,
      '$top': 1000,
    };
    
    const response = await client.get<GitPullRequestResponse>(url, params);
    
    // Filter by year (client-side, API doesn't support date filter)
    const yearPRs = response.value.filter(pr => {
      const closedYear = new Date(pr.closedDate).getFullYear();
      return closedYear === year;
    });
    
    // Collect unique repos
    for (const pr of yearPRs) {
      if (pr.repository?.id) {
        activeRepoIds.add(pr.repository.id);
      }
    }
    
    allPRs.push(...yearPRs);
  }
  
  return {
    pullRequests: deduplicatePRs(allPRs),
    activeRepositoryIds: activeRepoIds,
  };
}
```

### 3.5 Updated Aggregator: `src/lib/azure-devops/aggregator.ts`

**No changes required** to the aggregator logic. It already accepts arrays of commits, PRs, and work items and computes stats from them. The optimization is in *how* we fetch the data, not how we aggregate it.

---

## Part 4: API Route Changes

### 4.1 New Discovery Endpoint: `src/app/api/discover/route.ts`

```typescript
// GET /api/discover
// Query params: year (optional, defaults to current year)
// Headers: Authorization: Bearer <PAT>
// Response: DiscoveryResult

export async function GET(request: NextRequest) {
  const pat = request.headers.get('authorization')?.replace('Bearer ', '');
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  
  // 1. Get user profile
  const globalClient = new GlobalAzureDevOpsClient(pat);
  const profile = await globalClient.getProfile();
  
  // 2. Get organizations
  const orgs = await globalClient.getOrganizations(profile.id);
  
  // 3. For each org, get projects
  // 4. For each project, use PR API to find active repos
  const result = await discoverAll(pat, year);
  
  return NextResponse.json(result);
}
```

### 4.2 Updated Stats Endpoint: `src/app/api/stats/route.ts`

**Current flow**:
1. Receive org, projects[], repositories[] as params
2. Fetch commits/PRs for each repo in parallel
3. Fetch work items for each project
4. Aggregate and return

**New flow** (backward compatible):

```typescript
export async function GET(request: NextRequest) {
  // ... existing param parsing ...
  
  // NEW: If no repositories specified, use discovery to find active repos
  let effectiveRepositories = repositories;
  if (!repositories || repositories.length === 0) {
    const discovery = await discoverActiveReposForProjects(
      pat, organization, projects, userEmail, year
    );
    effectiveRepositories = discovery.repositories;
  }
  
  // NEW: Use org-level work item fetch instead of per-project
  const workItemsPromises = [...new Set(projects)].map(project =>
    fetchWorkItemsForOrganization(client, { year, userEmail })
  );
  // Actually, we only need ONE call per org now!
  const workItems = await fetchWorkItemsForOrganization(client, { year, userEmail });
  
  // NEW: Use project-level PR fetch instead of per-repo
  const prResults = await Promise.all(
    projects.map(project => 
      fetchPullRequestsForProject(client, { project, userId, year })
    )
  );
  const allPRs = prResults.flatMap(r => r.pullRequests);
  const activeRepoIds = new Set(prResults.flatMap(r => [...r.activeRepositoryIds]));
  
  // Commits still per-repo, but only for ACTIVE repos
  const commitsPromises = effectiveRepositories
    .filter(repo => activeRepoIds.has(repo.id) || activeRepoIds.size === 0)
    .map(repo => fetchCommits(...));
  
  // ... rest of aggregation unchanged ...
}
```

### 4.3 API Contract Changes

**No breaking changes to response contract.** The `WrappedStats` and `ClientWrappedStats` interfaces remain identical. Changes are purely internal to how data is fetched.

| Endpoint | Request Changes | Response Changes |
|----------|-----------------|------------------|
| `GET /api/stats` | Optional: `repositories` param becomes optional (auto-discovered if missing) | None |
| `GET /api/discover` | **NEW ENDPOINT** | Returns `DiscoveryResult` |
| `GET /api/projects` | None | None |
| `GET /api/repositories` | None | None |

---

## Part 5: UI Changes

### 5.1 Scope

**The existing UI stays the same.** The stats display, story viewer, charts, and export functionality are unchanged.

### 5.2 Optional Enhancement: Auto-Discovery Mode

If desired, the `ConfigForm.tsx` could be enhanced with a "Discover" button:

```
┌─────────────────────────────────────────────────────────────────┐
│  Azure DevOps Wrapped                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PAT Token: [••••••••••••••••••••]                              │
│                                                                  │
│  Year: [2024 ▼]                                                 │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────────────────┐           │
│  │ 🔍 Discover All │  │ Manual Configuration ▼      │           │
│  └─────────────────┘  └─────────────────────────────┘           │
│                                                                  │
│  [Generate Wrapped]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

But this is **optional** — the current manual selection flow continues to work.

---

## Part 6: Data Flow Summary

### 6.1 Work Items (Optimized)

```
┌──────────────┐     ┌─────────────────────────────┐     ┌───────────────┐
│   Browser    │────►│  GET /api/stats             │────►│  Aggregator   │
│              │     │  (PAT, org, year, email)    │     │               │
└──────────────┘     └─────────────┬───────────────┘     └───────────────┘
                                   │
                     ┌─────────────▼───────────────┐
                     │  POST /{org}/_apis/wit/wiql │  ◄── 1 call per org
                     │  (No project filter)        │
                     └─────────────┬───────────────┘
                                   │
                     ┌─────────────▼───────────────┐
                     │  Work items from ALL        │
                     │  projects in org            │
                     │  with [System.TeamProject]  │
                     │  field identifying source   │
                     └─────────────────────────────┘
```

### 6.2 Pull Requests (Optimized)

```
┌──────────────┐     ┌─────────────────────────────┐     ┌───────────────┐
│   Browser    │────►│  GET /api/stats             │────►│  Aggregator   │
│              │     │  (PAT, org, projects, ...)  │     │               │
└──────────────┘     └─────────────┬───────────────┘     └───────────────┘
                                   │
                     ┌─────────────▼───────────────┐
                     │  For each project:          │
                     │  GET /{project}/_apis/git/  │  ◄── 1-2 calls/project
                     │      pullrequests           │
                     │  (filters: creatorId,       │
                     │   status, targetRefName)    │
                     └─────────────┬───────────────┘
                                   │
                     ┌─────────────▼───────────────┐
                     │  PRs from ALL repos in      │
                     │  project with repository.id │
                     │  and repository.name        │
                     └─────────────────────────────┘
```

### 6.3 Active Repository Discovery (New)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SIDE EFFECT OF PR FETCH                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  PR Response contains:                                                │
│  {                                                                    │
│    pullRequestId: 12345,                                             │
│    repository: {                                                      │
│      id: "abc-123",        ◄── Extract this!                         │
│      name: "frontend",     ◄── And this!                             │
│      project: { name: "Teams" }                                      │
│    },                                                                │
│    targetRefName: "refs/heads/main",                                 │
│    ...                                                                │
│  }                                                                    │
│                                                                       │
│  Collect unique repository.id values                                 │
│  → These are the ACTIVE repos (repos with user PRs)                  │
│  → Only fetch commits from these repos                               │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Implementation Checklist

### Phase 1: Global Discovery Client
- [ ] Create `GlobalAzureDevOpsClient` class in `client.ts`
- [ ] Add `fetchUserProfile()` function
- [ ] Add `fetchOrganizations()` function
- [ ] Add types: `UserProfile`, `Organization`

### Phase 2: Organization-Level Work Items
- [ ] Add `fetchWorkItemsForOrganization()` in `workItems.ts`
- [ ] Update WIQL query to remove project filter
- [ ] Add `[System.TeamProject]` to SELECT fields
- [ ] Update stats route to use org-level fetch

### Phase 3: Project-Level Pull Requests
- [ ] Add `fetchPullRequestsForProject()` in `pullRequests.ts`
- [ ] Return both PRs and active repository IDs
- [ ] Update stats route to use project-level fetch
- [ ] Filter commit fetching to active repos only

### Phase 4: Discovery Endpoint (Optional)
- [ ] Create `src/app/api/discover/route.ts`
- [ ] Implement full discovery flow
- [ ] Add caching for discovery results

### Phase 5: Testing
- [ ] Test with single org, single project
- [ ] Test with multiple orgs
- [ ] Test with large project (many repos)
- [ ] Verify API call count reduction
- [ ] Verify response matches existing contract

---

## Part 8: Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Org-level WIQL may have different pagination limits | Test with large datasets; implement batching if needed |
| Project-level PR API may not support all filter combinations | Fall back to per-repo fetch if filters fail |
| Rate limiting on parallel org calls | Implement p-limit (concurrency: 3-5) |
| User may have PRs as reviewer but not creator | Add second call with `reviewerId` filter if desired |
| Some repos may have direct pushes without PRs | Accept 80-90% coverage or add optional commit probe |

---

## Appendix: WIQL Query Reference

### Current (Per-Project)

```sql
SELECT [System.Id], [System.WorkItemType], [System.Title], ...
FROM WorkItems
WHERE [System.TeamProject] = 'MyProject'          -- ← Limits to one project
  AND [System.State] IN ('Resolved', 'Closed', 'Done', 'Completed')
  AND EVER [System.AssignedTo] = 'user@email.com'
  AND [System.ChangedDate] >= '2024-01-01'
  AND [System.ChangedDate] <= '2024-12-31'
```

### New (Organization-Wide)

```sql
SELECT [System.Id], [System.TeamProject], [System.WorkItemType], [System.Title], ...
FROM WorkItems
WHERE [System.State] IN ('Resolved', 'Closed', 'Done', 'Completed')
  AND EVER [System.AssignedTo] = 'user@email.com'
  AND [System.ChangedDate] >= '2024-01-01'
  AND [System.ChangedDate] <= '2024-12-31'
-- No TeamProject filter → returns from ALL projects
-- Added TeamProject to SELECT → know which project each item came from
```

---

## Appendix: Project-Level PR API Parameters

The project-level Pull Requests API supports server-side filtering:

```
GET https://dev.azure.com/{org}/{project}/_apis/git/pullrequests?api-version=7.0
```

| Parameter | Description | Example |
|-----------|-------------|---------|
| `searchCriteria.creatorId` | Filter by PR creator UUID | `abc-123-def` |
| `searchCriteria.reviewerId` | Filter by reviewer UUID | `abc-123-def` |
| `searchCriteria.status` | Filter by status | `completed`, `active`, `abandoned`, `all` |
| `searchCriteria.targetRefName` | Filter by target branch | `refs/heads/main` |
| `searchCriteria.sourceRefName` | Filter by source branch | `refs/heads/feature/x` |
| `$top` | Max results per page | `1000` |
| `$skip` | Pagination offset | `0` |

**Note**: Date filtering (`minTime`/`maxTime`) is NOT supported server-side. Date filtering must be done client-side after fetching results.

---

## Appendix: API Base URLs

| Purpose | Base URL | Auth Required |
|---------|----------|---------------|
| Main APIs (projects, repos, PRs, commits) | `https://dev.azure.com/{organization}` | PAT (Basic) |
| Identity APIs (user resolution) | `https://vssps.dev.azure.com/{organization}` | PAT (Basic) |
| **Profile/Accounts (Global)** | `https://app.vssps.visualstudio.com` | PAT (Basic) |
| User Entitlements | `https://vsaex.dev.azure.com/{organization}` | PAT (Basic) |

The **Profile/Accounts** APIs are the key enablers for auto-discovery — they don't require knowing the organization upfront.
