// Project-Repository mapping (a repository belongs to exactly one project)
export interface ProjectRepository {
  project: string; // Project name, e.g., "Teams"
  repository: string; // Repository name, e.g., "teams-frontend"
  repositoryId?: string; // Optional: repository ID for API calls
}

// Configuration input for the application
export interface WrappedConfig {
  pat: string; // Personal Access Token
  organization: string; // e.g., "microsoft"
  projects: string[]; // Array of project names, e.g., ["Teams", "Office"]
  repositories: ProjectRepository[]; // Array of project-repo combos
  year: number; // e.g., 2024
  userEmail?: string; // Optional: filter by specific user
}

// Legacy config format for migration (single repository string)
export interface LegacyWrappedConfig {
  pat: string;
  organization: string;
  projects: string[];
  repository: string; // Old format: single repository name
  year: number;
  userEmail?: string;
}

// Complete stats response (server-side, includes all computed fields)
export interface WrappedStats {
  meta: MetaInfo;
  commits: CommitStats;
  pullRequests: PullRequestStats;
  workItems: WorkItemStats;
  builds: BuildStats;
  insights: Insights;
}

// Client-side stats (filtered to only include fields used by UI)
// This is what gets sent from the API to the browser
export interface ClientWrappedStats {
  meta: MetaInfo;
  commits: ClientCommitStats;
  pullRequests: ClientPullRequestStats;
  workItems: WorkItemStats;
  insights: Insights;
}

// Client-side commit stats (excludes unused fields: edits, byMonth, firstCommitDate, lastCommitDate, topCommitMessages)
export interface ClientCommitStats {
  total: number;
  additions: number;
  deletions: number;
  byDayOfWeek: Record<string, number>;
  byHour: Record<number, number>;
  longestStreak: number;
  commitDates: string[];
}

// Client-side PR stats (excludes unused fields: abandoned, byHour, totalComments)
export interface ClientPullRequestStats {
  created: number;
  merged: number;
  reviewed: number;
  avgDaysToMerge: number;
  avgDaysToMergeFormatted: string;
  largestPR: {
    id: number;
    title: string;
    filesChanged: number;
  } | null;
  byMonth: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  firstPRDate: string;
  lastPRDate: string;
  fastestMerge: { id: number; title: string; hours: number } | null;
  slowestMerge: { id: number; title: string; days: number } | null;
}

// Metadata about the stats
export interface MetaInfo {
  organization: string;
  projects: string[]; // Array of project names
  repositories: string[]; // Array of repository names
  year: number;
  generatedAt: string;
  userEmail?: string;
}

// Commit statistics
export interface CommitStats {
  total: number;
  additions: number;
  edits: number;
  deletions: number;
  byMonth: Record<string, number>; // "Jan": 45
  byDayOfWeek: Record<string, number>; // "Monday": 120
  byHour: Record<number, number>; // 14: 89 (2PM)
  longestStreak: number; // days
  firstCommitDate: string;
  lastCommitDate: string;
  topCommitMessages: string[]; // Most common words
  commitDates: string[]; // Array of YYYY-MM-DD dates for heatmap
}

// Pull request statistics
export interface PullRequestStats {
  created: number;
  merged: number;
  abandoned: number;
  reviewed: number;
  avgDaysToMerge: number;
  avgDaysToMergeFormatted: string; // Human readable e.g. "2.5 days" or "4 hours"
  largestPR: {
    id: number;
    title: string;
    filesChanged: number;
  } | null;
  // Time-based distributions
  byMonth: Record<string, number>; // "Jan": 5
  byDayOfWeek: Record<string, number>; // "Monday": 3
  byHour: Record<number, number>; // 14: 2 (2PM)
  // Timeline info
  firstPRDate: string;
  lastPRDate: string;
  // Additional stats
  totalComments: number;
  fastestMerge: { id: number; title: string; hours: number } | null;
  slowestMerge: { id: number; title: string; days: number } | null;
}

// Work item statistics
export interface WorkItemStats {
  // Core counts
  total: number;

  // By type breakdown
  byType: Record<string, number>; // "Bug": 23, "User Story": 45

  // Priority breakdown
  byPriority: Record<number, number>; // 1: 5, 2: 20, 3: 15

  // Time-based distributions
  byMonth: Record<string, number>; // "Jan": 10, "Feb": 8

  // Bug-specific stats
  bugsFixed: number;
  bugsBySeverity: Record<string, number>; // "1 - Critical": 2, "2 - High": 5

  // Tag analysis
  topTags: Array<{ tag: string; count: number }>;

  // Resolution time metrics
  avgResolutionDays: number;
  fastestResolution: {
    id: number;
    title: string;
    hours: number;
  } | null;

  // Timeline
  firstResolvedDate: string;
  lastResolvedDate: string;

  // Area insights
  topAreas: Array<{ area: string; count: number }>;
}

// Build statistics
export interface BuildStats {
  total: number;
  succeeded: number;
  failed: number;
  successRate: number;
  avgDurationMinutes: number;
}

// Generated insights
export interface Insights {
  personality: "Night Owl" | "Early Bird" | "Nine-to-Fiver" | "Weekend Warrior";
  busiestMonth: string;
  busiestDay: string;
  favoriteCommitHour: number;
  topFileExtensions: Array<{
    ext: string;
    count: number;
  }>;
}

// Azure DevOps API response types
export namespace AzureDevOpsAPI {
  // Commit response
  export interface CommitResponse {
    value: Commit[];
    count: number;
  }

  export interface Commit {
    commitId: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    comment: string;
    changeCounts?: {
      Add: number;
      Edit: number;
      Delete: number;
    };
    url: string;
    remoteUrl: string;
  }

  // Pull request response
  export interface PullRequestResponse {
    value: PullRequest[];
    count: number;
  }

  export interface PullRequest {
    pullRequestId: number;
    title: string;
    description: string;
    status: string;
    createdBy: {
      displayName: string;
      uniqueName: string;
      id: string;
    };
    creationDate: string;
    closedDate?: string;
    sourceRefName: string;
    targetRefName: string;
    mergeStatus: string;
    isDraft: boolean;
    reviewers: Reviewer[];
  }

  export interface Reviewer {
    displayName: string;
    uniqueName: string;
    id: string;
    vote: number;
  }

  // Work item response
  export interface WorkItemQueryResponse {
    queryType: string;
    queryResultType: string;
    asOf: string;
    columns: Column[];
    workItems: WorkItemReference[];
  }

  export interface WorkItemReference {
    id: number;
    url: string;
  }

  export interface Column {
    referenceName: string;
    name: string;
    url: string;
  }

  export interface WorkItem {
    id: number;
    rev: number;
    fields: {
      "System.WorkItemType": string;
      "System.Title": string;
      "System.State": string;
      "System.CreatedDate": string;
      "Microsoft.VSTS.Common.ClosedDate"?: string;
      "System.AssignedTo"?: {
        displayName: string;
        uniqueName: string;
      };
      "System.Tags"?: string;
      [key: string]: any;
    };
    url: string;
  }

  // Build response
  export interface BuildResponse {
    value: Build[];
    count: number;
  }

  export interface Build {
    id: number;
    buildNumber: string;
    status: string;
    result: string;
    queueTime: string;
    startTime: string;
    finishTime: string;
    definition: {
      id: number;
      name: string;
    };
    project: {
      id: string;
      name: string;
    };
    requestedFor: {
      displayName: string;
      uniqueName: string;
      id: string;
    };
  }
}
