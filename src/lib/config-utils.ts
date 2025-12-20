/**
 * Client-safe configuration utilities
 * This file contains utilities that can be safely imported in client components
 */

import type { ProjectRepository } from "@/types";

/**
 * Migrate legacy config format (project: string) to new format (projects: string[])
 * Use this when loading config from storage that may be in old format.
 */
export function migrateConfigToProjectsArray<T extends Record<string, unknown>>(
  config: T
): T {
  if ("project" in config && !("projects" in config)) {
    const { project, ...rest } = config;
    return {
      ...rest,
      projects: project ? [project as string] : [],
    } as unknown as T;
  }
  return config;
}

/**
 * Migrate legacy config format (repository: string) to new format (repositories: ProjectRepository[])
 * This handles the case where old configs have a single repository string instead of an array.
 *
 * If the old config has a single repository string, we create a ProjectRepository entry
 * for each selected project (since we don't know which project it belonged to).
 * The API will handle 404s gracefully for repos that don't exist in a project.
 */
export function migrateConfigToRepositoriesArray<
  T extends Record<string, unknown>
>(config: T): T {
  // First migrate projects array if needed
  let migrated = migrateConfigToProjectsArray(config);

  // Check if we have old 'repository' string format instead of 'repositories' array
  if ("repository" in migrated && !("repositories" in migrated)) {
    const { repository, ...rest } = migrated;
    const repoStr = repository as string;
    const projects = (rest.projects as string[]) || [];

    // Create ProjectRepository entries - if we have projects, create one entry per project
    // (the API will handle 404s for repos that don't exist in a project)
    // If no projects, create with empty project (will be validated later)
    const repositories: ProjectRepository[] = repoStr
      ? projects.length > 0
        ? projects.map((proj) => ({ project: proj, repository: repoStr }))
        : [{ project: "", repository: repoStr }]
      : [];

    return {
      ...rest,
      repositories,
    } as unknown as T;
  }

  return migrated;
}

/**
 * Full migration: applies both project and repository migrations
 */
export function migrateConfig<T extends Record<string, unknown>>(config: T): T {
  return migrateConfigToRepositoriesArray(migrateConfigToProjectsArray(config));
}
