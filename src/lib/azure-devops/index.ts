/**
 * Azure DevOps API Integration
 *
 * This module provides functions to fetch and aggregate data from Azure DevOps.
 */

export { AzureDevOpsClient, createClient } from "./client";
export type { AzureDevOpsClientConfig } from "./client";

export {
  fetchCommits,
  groupCommitsByDate,
  calculateTotalChanges,
  extractFileExtensions,
} from "./commits";
export type { FetchCommitsOptions } from "./commits";

export {
  fetchPullRequests,
  calculateAvgDaysToMerge,
  getPRStatsByStatus,
  findLargestPR,
} from "./pullRequests";
export type { FetchPullRequestsOptions } from "./pullRequests";

export { aggregateStats } from "./aggregator";
export type { AggregatorInput } from "./aggregator";

export * from "./types";

// Re-export config loader for convenience
export {
  loadConfig,
  validateConfig,
  loadAndValidateConfig,
  printConfig,
} from "../config";
export type { AppConfig } from "../config";
