/**
 * Configuration loader for Azure DevOps Wrapped
 * Loads and validates configuration from environment variables
 */

import { config as loadEnv } from "dotenv";

// Load .env file if it exists
loadEnv();

export interface AppConfig {
  // Azure DevOps Connection
  organization: string;
  projects: string[]; // Array of project names (supports multiple projects)
  repository: string;
  pat: string;

  // Filtering Options
  userEmail?: string;
  year: number;

  // Feature Flags
  includeCommits: boolean;
  includePullRequests: boolean;
  includeWorkItems: boolean;
  includeBuilds: boolean;

  // Application Settings
  port: number;
  apiVersion: string;
}

/**
 * Parse projects from environment variable
 * Supports both ADO_PROJECTS (comma-separated) and legacy ADO_PROJECT (single)
 */
function parseProjects(): string[] {
  const projectsEnv = process.env.ADO_PROJECTS;
  const legacyProjectEnv = process.env.ADO_PROJECT;

  if (projectsEnv) {
    // New format: comma-separated list
    return projectsEnv
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  } else if (legacyProjectEnv) {
    // Legacy format: single project
    return [legacyProjectEnv.trim()];
  }

  return [];
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  return {
    // Required settings
    organization: process.env.ADO_ORGANIZATION || "",
    projects: parseProjects(),
    repository: process.env.ADO_REPOSITORY || "",
    pat: process.env.ADO_PAT || "",

    // Optional filtering
    userEmail: process.env.ADO_USER_EMAIL || undefined,
    year: parseInt(process.env.ADO_YEAR || new Date().getFullYear().toString()),

    // Feature flags
    includeCommits: process.env.ADO_INCLUDE_COMMITS !== "false",
    includePullRequests: process.env.ADO_INCLUDE_PULL_REQUESTS !== "false",
    includeWorkItems: process.env.ADO_INCLUDE_WORK_ITEMS === "true",
    includeBuilds: process.env.ADO_INCLUDE_BUILDS === "true",

    // App settings
    port: parseInt(process.env.PORT || "3000"),
    apiVersion: process.env.ADO_API_VERSION || "7.0",
  };
}

/**
 * Validate that all required configuration is present
 */
export function validateConfig(config: AppConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.organization) {
    errors.push("ADO_ORGANIZATION is required");
  }

  if (!config.projects || config.projects.length === 0) {
    errors.push("ADO_PROJECTS (or ADO_PROJECT) is required");
  }

  if (!config.repository) {
    errors.push("ADO_REPOSITORY is required");
  }

  if (!config.pat) {
    errors.push("ADO_PAT is required");
  } else if (config.pat === "your-personal-access-token-here") {
    errors.push("ADO_PAT must be set to a valid Personal Access Token");
  }

  if (isNaN(config.year) || config.year < 2000 || config.year > 2100) {
    errors.push("ADO_YEAR must be a valid year");
  }

  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    errors.push("PORT must be a valid port number (1-65535)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Load and validate configuration, or exit with error
 */
export function loadAndValidateConfig(): AppConfig {
  const config = loadConfig();
  const validation = validateConfig(config);

  if (!validation.valid) {
    console.error("❌ Configuration Error:\n");
    validation.errors.forEach((error) => console.error(`   • ${error}`));
    console.error(
      "\n💡 Please check your .env file. Copy .env.example for reference.\n"
    );
    process.exit(1);
  }

  return config;
}

/**
 * Print configuration summary (with PAT masked)
 */
export function printConfig(config: AppConfig): void {
  console.log("📋 Configuration:");
  console.log(`   Organization: ${config.organization}`);
  console.log(`   Projects: ${config.projects.join(", ")}`);
  console.log(`   Repository: ${config.repository}`);
  console.log(
    `   PAT: ${config.pat ? "***" + config.pat.slice(-4) : "(not set)"}`
  );
  console.log(`   Year: ${config.year}`);
  console.log(`   User Filter: ${config.userEmail || "All users"}`);
  console.log(`   Include Commits: ${config.includeCommits}`);
  console.log(`   Include PRs: ${config.includePullRequests}`);
  console.log(`   Include Work Items: ${config.includeWorkItems}`);
  console.log(`   Include Builds: ${config.includeBuilds}`);
  console.log();
}

/**
 * Migrate legacy config format (project: string) to new format (projects: string[])
 * Use this when loading config from storage that may be in old format.
 */
export function migrateConfigToProjectsArray<T extends Record<string, any>>(
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
