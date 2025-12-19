/**
 * Client-safe configuration utilities
 * This file contains utilities that can be safely imported in client components
 */

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
