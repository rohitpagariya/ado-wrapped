import { AzureDevOpsClient } from "./client";
import { TeamProject, TeamProjectResponse } from "./types";

/**
 * Fetch all projects in the organization that the user has access to.
 * Uses the Core API: GET /_apis/projects
 */
export async function fetchProjects(
  client: AzureDevOpsClient
): Promise<TeamProject[]> {
  console.log(`\n🏢 fetchProjects: Fetching projects from organization...`);

  try {
    const response = await client.get<TeamProjectResponse>("/_apis/projects", {
      stateFilter: "wellFormed", // Only return projects in good state
      $top: 500, // Max projects to return
    });

    const projects = response.value || [];
    console.log(`✅ Found ${projects.length} projects`);

    // Sort alphabetically by name for better UX
    projects.sort((a, b) => a.name.localeCompare(b.name));

    return projects;
  } catch (error) {
    console.error(`❌ Error fetching projects:`, error);
    throw error;
  }
}
