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

    // Map to our format with project context
    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      project: project,
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

  // Sort alphabetically by project then by name
  allRepos.sort((a, b) => {
    const projectCompare = a.project.localeCompare(b.project);
    if (projectCompare !== 0) return projectCompare;
    return a.name.localeCompare(b.name);
  });

  console.log(
    `✅ Total: ${allRepos.length} repositories from ${projects.length} project(s)`
  );

  return allRepos;
}
