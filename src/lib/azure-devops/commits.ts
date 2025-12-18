import { AzureDevOpsClient } from "./client";
import { GitCommit, GitCommitResponse } from "./types";

export interface FetchCommitsOptions {
  organization: string;
  project: string;
  repository: string;
  pat: string;
  fromDate: string; // ISO 8601 format: YYYY-MM-DD
  toDate: string; // ISO 8601 format: YYYY-MM-DD
  userEmail?: string; // Optional: filter by specific user
  includeChangeCounts?: boolean; // Include additions/deletions/edits
  enableCache?: boolean; // Enable response caching (default: true)
}

/**
 * Fetch all commits for a repository within a date range
 */
export async function fetchCommits(
  options: FetchCommitsOptions
): Promise<GitCommit[]> {
  const {
    organization,
    project,
    repository,
    pat,
    fromDate,
    toDate,
    userEmail,
    includeChangeCounts = true,
    enableCache = true,
  } = options;

  console.log(
    `📜 fetchCommits: Starting for ${organization}/${project}/${repository}`
  );
  console.log(
    `📅 Date range: ${fromDate} to ${toDate}, User: ${userEmail || "all"}`
  );

  const client = new AzureDevOpsClient({ organization, pat, enableCache });
  const commits: GitCommit[] = [];
  let skip = 0;
  const top = 100; // Azure DevOps API limit per page
  let pageCount = 0;

  try {
    while (true) {
      pageCount++;
      console.log(`📊 Fetching commits page ${pageCount} (skip: ${skip})...`);
      const url = `/${project}/_apis/git/repositories/${repository}/commits`;

      const params: Record<string, any> = {
        "searchCriteria.fromDate": fromDate,
        "searchCriteria.toDate": toDate,
        "searchCriteria.$top": top,
        "searchCriteria.$skip": skip,
      };

      // Add user email filter if provided
      if (userEmail) {
        params["searchCriteria.author"] = userEmail;
      }

      // Include change counts for additions/deletions/edits
      if (includeChangeCounts) {
        params["searchCriteria.includeStatuses"] = true;
      }

      const response = await client.get<GitCommitResponse>(url, params);

      if (!response.value || response.value.length === 0) {
        console.log(`✅ No more commits found (page ${pageCount})`);
        break; // No more commits
      }

      console.log(
        `✅ Fetched ${response.value.length} commits on page ${pageCount}`
      );

      // Fetch detailed changes for each commit if change counts are needed
      if (includeChangeCounts) {
        console.log(
          `🔍 Fetching details for ${response.value.length} commits...`
        );
        const commitsWithChanges = await Promise.all(
          response.value.map(async (commit) => {
            try {
              return await fetchCommitDetails(
                client,
                project,
                repository,
                commit.commitId
              );
            } catch (error) {
              console.warn(
                `⚠️ Failed to fetch details for commit ${commit.commitId}:`,
                error
              );
              return commit; // Return commit without detailed changes
            }
          })
        );
        commits.push(...commitsWithChanges);
        console.log(`✅ Commit details fetched (total: ${commits.length})`);
      } else {
        commits.push(...response.value);
      }

      // Check if we've fetched all commits
      if (response.value.length < top) {
        console.log(`✅ Last page reached`);
        break; // Last page
      }

      skip += top;
    }

    console.log(
      `🎉 ✓ Fetched total of ${commits.length} commits from ${fromDate} to ${toDate} in ${pageCount} pages`
    );
    return commits;
  } catch (error) {
    console.error(
      `❌ Error fetching commits for ${organization}/${project}/${repository}:`,
      error
    );
    throw new Error(
      `Failed to fetch commits: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch detailed commit information including changes
 */
async function fetchCommitDetails(
  client: AzureDevOpsClient,
  project: string,
  repository: string,
  commitId: string
): Promise<GitCommit> {
  const url = `/${project}/_apis/git/repositories/${repository}/commits/${commitId}`;

  const params = {
    changeCount: 1000, // Get up to 1000 file changes
  };

  const commit = await client.get<GitCommit>(url, params);
  return commit;
}

/**
 * Get commit statistics aggregated by date
 */
export function groupCommitsByDate(
  commits: GitCommit[]
): Map<string, GitCommit[]> {
  const commitsByDate = new Map<string, GitCommit[]>();

  for (const commit of commits) {
    const date = commit.author.date.split("T")[0]; // Extract YYYY-MM-DD

    if (!commitsByDate.has(date)) {
      commitsByDate.set(date, []);
    }

    commitsByDate.get(date)!.push(commit);
  }

  return commitsByDate;
}

/**
 * Calculate total change counts from commits
 */
export function calculateTotalChanges(commits: GitCommit[]): {
  additions: number;
  edits: number;
  deletions: number;
} {
  let additions = 0;
  let edits = 0;
  let deletions = 0;

  for (const commit of commits) {
    if (commit.changeCounts) {
      additions += commit.changeCounts.Add || 0;
      edits += commit.changeCounts.Edit || 0;
      deletions += commit.changeCounts.Delete || 0;
    }
  }

  return { additions, edits, deletions };
}

/**
 * Extract file extensions from commit changes
 */
export function extractFileExtensions(
  commits: GitCommit[]
): Map<string, number> {
  const extensions = new Map<string, number>();

  for (const commit of commits) {
    if (commit.changes) {
      for (const change of commit.changes) {
        if (change.item?.path) {
          const match = change.item.path.match(/\.([^.]+)$/);
          if (match) {
            const ext = match[1].toLowerCase();
            extensions.set(ext, (extensions.get(ext) || 0) + 1);
          }
        }
      }
    }
  }

  return extensions;
}
