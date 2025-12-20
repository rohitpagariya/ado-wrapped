import { AzureDevOpsClient } from "./client";
import {
  GitPullRequest,
  GitPullRequestResponse,
  PullRequestStatus,
  GitPullRequestIteration,
  GitPullRequestIterationResponse,
} from "./types";

export interface FetchPullRequestsOptions {
  organization: string;
  project: string;
  repository: string;
  pat: string;
  fromDate: string; // ISO 8601 format: YYYY-MM-DD
  toDate: string; // ISO 8601 format: YYYY-MM-DD
  userEmail?: string; // Optional: filter by specific user
  includeReviewed?: boolean; // Include PRs where user was a reviewer
  enableCache?: boolean; // Enable response caching (default: true)
}

/**
 * Fetch all pull requests for a repository within a date range
 */
export async function fetchPullRequests(
  options: FetchPullRequestsOptions
): Promise<GitPullRequest[]> {
  const {
    organization,
    project,
    repository,
    pat,
    fromDate,
    toDate,
    userEmail,
    includeReviewed = true,
    enableCache = true,
  } = options;

  console.log(
    `🔄 fetchPullRequests: Starting for ${organization}/${project}/${repository}`
  );
  console.log(
    `📅 Date range: ${fromDate} to ${toDate}, User: ${userEmail || "REQUIRED"}`
  );

  // Require userEmail to prevent fetching all users' PRs
  if (!userEmail) {
    const error =
      "userEmail is required to fetch pull requests. Cannot proceed without a specific user filter.";
    console.error(`❌ ${error}`);
    throw new Error(error);
  }

  const client = new AzureDevOpsClient({ organization, pat, enableCache });
  const allPRs: GitPullRequest[] = [];

  try {
    // Get repository ID first
    console.log(`📦 Fetching repository info...`);
    const repoUrl = `/${project}/_apis/git/repositories/${repository}`;
    const repo = await client.get<any>(repoUrl);
    console.log(`✅ Repository ID: ${repo.id}`);
    const repositoryId = repo.id;

    // Resolve user email to ID for server-side filtering (REQUIRED)
    console.log(
      `🔍 Resolving user email '${userEmail}' to ID for server-side filtering...`
    );
    const creatorId = await resolveUserEmailToId(
      client,
      organization,
      userEmail
    );

    if (!creatorId) {
      const error = `Failed to resolve user email '${userEmail}' to Azure DevOps user ID. Cannot proceed without server-side filtering. See detailed error messages above.`;
      console.error(`❌ ${error}`);
      throw new Error(error);
    }

    console.log(`✅ Successfully resolved user ID: ${creatorId}`);

    // Fetch completed PRs to main branches (master, main, dev) created by the specific user
    // Uses server-side filtering by user ID (required for efficiency)
    // Try multiple target branches in order of preference
    const branchesToTry = ["master", "main", "dev"];

    for (const branch of branchesToTry) {
      console.log(
        `📝 Fetching completed PRs to ${branch} branch by user ${userEmail} (ID: ${creatorId})...`
      );
      try {
        const createdPRs = await fetchPRsByStatus(
          client,
          repositoryId,
          fromDate,
          toDate,
          "completed", // Only completed PRs
          `refs/heads/${branch}`, // Target branch
          creatorId // Server-side filter by creator ID (REQUIRED)
        );
        console.log(
          `✅ Found ${createdPRs.length} completed PRs to ${branch} by this user`
        );
        allPRs.push(...createdPRs);
      } catch (err) {
        console.log(`⚠️ Could not fetch PRs for branch '${branch}': ${err}`);
      }
    }

    // Skip reviewed PRs fetching - only interested in user's own PRs to main branches
    // This dramatically reduces data transfer

    // Filter by date range (Azure DevOps doesn't support date filtering directly)
    console.log(`📅 Filtering PRs by date range...`);
    const filteredPRs = allPRs.filter((pr) => {
      const creationDate = new Date(pr.creationDate);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include entire end date
      return creationDate >= from && creationDate <= to;
    });
    console.log(
      `✅ ${filteredPRs.length} PRs in date range (filtered ${
        allPRs.length - filteredPRs.length
      })`
    );

    console.log(
      `🎉 ✓ Fetched total of ${filteredPRs.length} pull requests from ${fromDate} to ${toDate}`
    );
    return filteredPRs;
  } catch (error) {
    console.error(
      `❌ Error fetching pull requests for ${organization}/${project}/${repository}:`,
      error
    );
    throw new Error(
      `Failed to fetch pull requests: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Resolve user email to Azure DevOps user ID for server-side filtering
 * REQUIRED for efficient PR fetching - must succeed or we fetch too much data
 *
 * NOTE: The Identities API uses a different base URL (vssps.dev.azure.com)
 * See: https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities
 */
async function resolveUserEmailToId(
  client: AzureDevOpsClient,
  organization: string,
  email: string
): Promise<string | undefined> {
  console.log(`🔍 Attempting to resolve user email: ${email}`);
  console.log(
    `   Using Identities API: https://vssps.dev.azure.com/${organization}/_apis/identities`
  );

  try {
    // Use the VSSPS API endpoint for Identities (different base URL)
    const url = `/_apis/identities`;
    const params = {
      searchFilter: "General",
      filterValue: email,
      queryMembership: "None",
    };

    console.log(`   Parameters:`, JSON.stringify(params, null, 2));
    // Use getVssps instead of get - this calls vssps.dev.azure.com
    const response = await client.getVssps<{ value: any[] }>(url, params);

    console.log(
      `   API Response: ${
        response.value ? response.value.length : 0
      } identities found`
    );

    if (response.value && response.value.length > 0) {
      const userId = response.value[0].id;
      console.log(`   ✅ Found user ID: ${userId}`);
      console.log(
        `   User info:`,
        JSON.stringify(
          {
            id: response.value[0].id,
            displayName: response.value[0].properties?.DisplayName?.$value,
            mail: response.value[0].properties?.Mail?.$value,
          },
          null,
          2
        )
      );
      return userId;
    } else {
      console.error(`   ❌ No identities found for email: ${email}`);
      console.log(`   Response:`, JSON.stringify(response, null, 2));
    }
  } catch (error: any) {
    console.error(`   ❌ Identities API failed with error:`);
    console.error(`   Status: ${error.response?.status || "unknown"}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Full error:`, error.response?.data || error);

    if (error.response?.status === 401) {
      console.error(`   → PAT token is invalid or expired`);
    } else if (error.response?.status === 403) {
      console.error(`   → PAT token lacks required permissions`);
      console.error(`   → Required scope: "Identity (read)" or "vso.identity"`);
      console.error(
        `   → Go to: https://dev.azure.com/${organization}/_usersSettings/tokens`
      );
      console.error(`   → Create new token with scope: Identity (read)`);
    } else if (error.response?.status === 404) {
      console.error(
        `   → Identities API endpoint not found - check organization name`
      );
    }
  }

  console.error(`\nCRITICAL: Cannot resolve user email to ID`);
  console.error(`   Without a user ID, we cannot use server-side filtering`);
  console.error(
    `   This would require fetching ALL PRs and filtering client-side`
  );
  console.error(`\n   Possible solutions:`);
  console.error(`   1. Ensure PAT has "Identity (read)" permission`);
  console.error(
    `   2. Verify email '${email}' matches Azure DevOps profile email`
  );
  console.error(`   3. Check if user exists in organization '${organization}'`);

  return undefined;
}

/**
 * Fetch PRs by status with creator ID filter and target branch
 * Uses server-side filtering ONLY - creatorId is required
 */
async function fetchPRsByStatus(
  client: AzureDevOpsClient,
  repositoryId: string,
  fromDate: string,
  toDate: string,
  status: PullRequestStatus,
  targetBranch: string, // e.g., "refs/heads/master" - REQUIRED
  creatorId: string // REQUIRED - user ID for server-side filtering
): Promise<GitPullRequest[]> {
  const prs: GitPullRequest[] = [];
  let skip = 0;
  const top = 100;

  console.log(
    `🌐 Fetching PRs with server-side filters: status=${status}, branch=${targetBranch}, creatorId=${creatorId}`
  );

  while (true) {
    const url = `/_apis/git/repositories/${repositoryId}/pullrequests`;

    const params: Record<string, any> = {
      "searchCriteria.status": status,
      "searchCriteria.targetRefName": targetBranch,
      "searchCriteria.creatorId": creatorId,
      $top: top,
      $skip: skip,
    };

    console.log(`🌐 API Request: ${url} with skip=${skip}`);
    const response = await client.get<GitPullRequestResponse>(url, params);

    if (!response.value || response.value.length === 0) {
      console.log(
        `✅ No more PRs to fetch (got ${response.value?.length || 0} results)`
      );
      break;
    }

    console.log(
      `✅ Fetched ${response.value.length} PRs in this batch (all from specific user)`
    );

    // All filtering is done server-side - no client-side filtering needed
    prs.push(...response.value);

    if (response.value.length < top) {
      break;
    }

    skip += top;
  }

  return prs;
}

/**
 * Fetch the number of files changed in a pull request
 */
export async function fetchPRFileCount(
  client: AzureDevOpsClient,
  repositoryId: string,
  pullRequestId: number
): Promise<number> {
  try {
    const url = `/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations`;
    const response = await client.get<GitPullRequestIterationResponse>(url);

    if (response.value && response.value.length > 0) {
      // Get the last iteration
      const lastIteration = response.value[response.value.length - 1];
      return lastIteration.changeList?.length || 0;
    }

    return 0;
  } catch (error) {
    console.warn(`Failed to fetch file count for PR ${pullRequestId}`);
    return 0;
  }
}

/**
 * Calculate average days to merge for completed PRs
 */
export function calculateAvgDaysToMerge(prs: GitPullRequest[]): number {
  const completedPRs = prs.filter(
    (pr) => pr.status === "completed" && pr.closedDate
  );

  if (completedPRs.length === 0) {
    return 0;
  }

  const totalDays = completedPRs.reduce((sum, pr) => {
    const created = new Date(pr.creationDate);
    const closed = new Date(pr.closedDate!);
    const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays / completedPRs.length;
}

/**
 * Get PR statistics by status
 */
export function getPRStatsByStatus(
  prs: GitPullRequest[],
  userEmail?: string
): {
  created: number;
  merged: number;
  abandoned: number;
  reviewed: number;
} {
  let created = 0;
  let merged = 0;
  let abandoned = 0;
  let reviewed = 0;

  for (const pr of prs) {
    // Count created PRs
    if (
      userEmail &&
      pr.createdBy.uniqueName.toLowerCase() === userEmail.toLowerCase()
    ) {
      created++;

      if (pr.status === "completed") {
        merged++;
      } else if (pr.status === "abandoned") {
        abandoned++;
      }
    }

    // Count reviewed PRs (where user was a reviewer but not creator)
    if (
      userEmail &&
      pr.createdBy.uniqueName.toLowerCase() !== userEmail.toLowerCase()
    ) {
      const wasReviewer = pr.reviewers.some(
        (reviewer) =>
          reviewer.uniqueName.toLowerCase() === userEmail.toLowerCase()
      );
      if (wasReviewer) {
        reviewed++;
      }
    }
  }

  // If no user filter, count all
  if (!userEmail) {
    created = prs.length;
    merged = prs.filter((pr) => pr.status === "completed").length;
    abandoned = prs.filter((pr) => pr.status === "abandoned").length;
  }

  return { created, merged, abandoned, reviewed };
}

/**
 * Find the largest PR by title/description heuristic
 * (Since we'd need to fetch iterations for accurate file count, we use a simple heuristic)
 */
export function findLargestPR(prs: GitPullRequest[]): {
  id: number;
  title: string;
  filesChanged: number;
} | null {
  if (prs.length === 0) {
    return null;
  }

  // Sort by description length as a proxy for size
  const sorted = [...prs].sort((a, b) => {
    const aSize = (a.description?.length || 0) + (a.title?.length || 0);
    const bSize = (b.description?.length || 0) + (b.title?.length || 0);
    return bSize - aSize;
  });

  const largest = sorted[0];

  return {
    id: largest.pullRequestId,
    title: largest.title,
    filesChanged: 0, // Would need separate API call to get accurate count
  };
}
