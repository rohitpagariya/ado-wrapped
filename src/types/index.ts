// Configuration input for the application
export interface WrappedConfig {
  pat: string; // Personal Access Token
  organization: string; // e.g., "microsoft"
  project: string; // e.g., "Teams"
  repository: string; // e.g., "teams-frontend"
  year: number; // e.g., 2024
  userEmail?: string; // Optional: filter by specific user
}

// Complete stats response
export interface WrappedStats {
  meta: MetaInfo;
  commits: CommitStats;
  pullRequests: PullRequestStats;
  workItems: WorkItemStats;
  builds: BuildStats;
  insights: Insights;
}

// Metadata about the stats
export interface MetaInfo {
  organization: string;
  project: string;
  repository: string;
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
  created: number;
  resolved: number;
  byType: Record<string, number>; // "Bug": 23, "User Story": 45
  topTags: string[];
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
      "System.ClosedDate"?: string;
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
