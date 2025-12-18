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
  } = options;

  const client = new AzureDevOpsClient({ organization, pat });
  const allPRs: GitPullRequest[] = [];

  try {
    // Get repository ID first
    const repoUrl = `/${project}/_apis/git/repositories/${repository}`;
    const repo = await client.get<any>(repoUrl);
    const repositoryId = repo.id;

    // Fetch PRs created by the user
    const createdPRs = await fetchPRsByStatus(
      client,
      repositoryId,
      fromDate,
      toDate,
      "all",
      userEmail ? { creatorEmail: userEmail } : undefined
    );

    allPRs.push(...createdPRs);

    // Fetch PRs where user was a reviewer (if enabled and userEmail provided)
    if (includeReviewed && userEmail) {
      const reviewedPRs = await fetchPRsByStatus(
        client,
        repositoryId,
        fromDate,
        toDate,
        "all",
        { reviewerEmail: userEmail }
      );

      // Merge and deduplicate
      const prIds = new Set(allPRs.map((pr) => pr.pullRequestId));
      for (const pr of reviewedPRs) {
        if (!prIds.has(pr.pullRequestId)) {
          allPRs.push(pr);
          prIds.add(pr.pullRequestId);
        }
      }
    }

    // Filter by date range (Azure DevOps doesn't support date filtering directly)
    const filteredPRs = allPRs.filter((pr) => {
      const creationDate = new Date(pr.creationDate);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include entire end date
      return creationDate >= from && creationDate <= to;
    });

    console.log(
      `✓ Fetched ${filteredPRs.length} pull requests from ${fromDate} to ${toDate}`
    );
    return filteredPRs;
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    throw new Error(
      `Failed to fetch pull requests: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch PRs by status with optional creator/reviewer filter
 */
async function fetchPRsByStatus(
  client: AzureDevOpsClient,
  repositoryId: string,
  fromDate: string,
  toDate: string,
  status: PullRequestStatus,
  filter?: { creatorEmail?: string; reviewerEmail?: string }
): Promise<GitPullRequest[]> {
  const prs: GitPullRequest[] = [];
  let skip = 0;
  const top = 100;

  while (true) {
    const url = `/_apis/git/repositories/${repositoryId}/pullrequests`;

    const params: Record<string, any> = {
      "searchCriteria.status": status,
      $top: top,
      $skip: skip,
    };

    // Note: Azure DevOps API doesn't support direct email filtering in query params
    // We need to filter after fetching

    const response = await client.get<GitPullRequestResponse>(url, params);

    if (!response.value || response.value.length === 0) {
      break;
    }

    // Apply client-side filtering
    let filteredPRs = response.value;

    if (filter?.creatorEmail) {
      filteredPRs = filteredPRs.filter(
        (pr) =>
          pr.createdBy.uniqueName.toLowerCase() ===
          filter.creatorEmail!.toLowerCase()
      );
    }

    if (filter?.reviewerEmail) {
      filteredPRs = filteredPRs.filter((pr) =>
        pr.reviewers.some(
          (reviewer) =>
            reviewer.uniqueName.toLowerCase() ===
            filter.reviewerEmail!.toLowerCase()
        )
      );
    }

    prs.push(...filteredPRs);

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
