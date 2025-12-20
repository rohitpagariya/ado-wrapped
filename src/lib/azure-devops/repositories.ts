import { AzureDevOpsClient } from "./client";
import { GitRepository } from "./types";

/**
 * Response from Git Repositories API
 */
interface GitRepositoriesResponse {
  value: GitRepository[];
  count: number;
}

/**
 * Repository info with parent project context
 */
export interface RepositoryWithProject {
  id: string;
  name: string;
  project: string;
  defaultBranch?: string;
  size?: number;
  webUrl?: string;
}

/**
 * Fetch all repositories for a specific project.
 * Uses the Git API: GET /{project}/_apis/git/repositories
 *
 * Note: Azure DevOps may return repositories from other projects if they're visible
 * cross-project. We use the actual project info from the API response to ensure
 * correct project attribution.
 */
export async function fetchRepositoriesForProject(
  client: AzureDevOpsClient,
  project: string
): Promise<RepositoryWithProject[]> {
  console.log(`\n📦 fetchRepositories: Fetching repos for project: ${project}`);

  try {
    const response = await client.get<GitRepositoriesResponse>(
      `/${project}/_apis/git/repositories`
    );

    const repos = response.value || [];
    console.log(`✅ Found ${repos.length} repositories in ${project}`);

    // Map to our format - use actual project name from API response if available
    // This handles cases where cross-project visibility shows repos from other projects
    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      project: repo.project?.name || project,
      defaultBranch: repo.defaultBranch,
      size: repo.size,
      webUrl: repo.webUrl,
    }));
  } catch (error) {
    console.error(`❌ Error fetching repositories for ${project}:`, error);
    throw error;
  }
}

/**
 * Fetch repositories from multiple projects and merge into a single list.
 * Each repository includes its parent project name for proper tracking.
 *
 * Deduplicates repositories that may appear across multiple project queries
 * due to cross-project visibility in Azure DevOps.
 */
export async function fetchRepositoriesForProjects(
  client: AzureDevOpsClient,
  projects: string[]
): Promise<RepositoryWithProject[]> {
  console.log(
    `\n📦 fetchRepositoriesForProjects: Fetching repos for ${projects.length} project(s)`
  );

  // Fetch repos from all projects in parallel
  const results = await Promise.all(
    projects.map(async (project) => {
      try {
        return await fetchRepositoriesForProject(client, project);
      } catch (error: any) {
        console.warn(
          `⚠️ Failed to fetch repos for project ${project}: ${error.message}`
        );
        return []; // Return empty array on failure, don't fail the whole request
      }
    })
  );

  // Flatten all repos into a single array
  const allRepos = results.flat();

  // Deduplicate by repository ID (same repo might appear from multiple project queries)
  const uniqueReposMap = new Map<string, RepositoryWithProject>();
  for (const repo of allRepos) {
    // Use repo ID as unique key - same repo in same project will have same ID
    if (!uniqueReposMap.has(repo.id)) {
      uniqueReposMap.set(repo.id, repo);
    }
  }
  const uniqueRepos = Array.from(uniqueReposMap.values());

  // Only include repos from selected projects
  const filteredRepos = uniqueRepos.filter((repo) =>
    projects.includes(repo.project)
  );

  // Sort alphabetically by project then by name
  filteredRepos.sort((a, b) => {
    const projectCompare = a.project.localeCompare(b.project);
    if (projectCompare !== 0) return projectCompare;
    return a.name.localeCompare(b.name);
  });

  console.log(
    `✅ Total: ${filteredRepos.length} unique repositories from ${
      projects.length
    } project(s) (${allRepos.length - filteredRepos.length} duplicates removed)`
  );

  return filteredRepos;
}
