/**
 * Azure DevOps REST API response types
 * Based on API version 7.0
 */

// Common pagination response wrapper
export interface ApiCollectionResponse<T> {
  count: number;
  value: T[];
}

// ============================================
// Git Commits
// ============================================

export interface GitCommit {
  commitId: string;
  author: GitUserDate;
  committer: GitUserDate;
  comment: string;
  commentTruncated?: boolean;
  changeCounts?: ChangeCountDictionary;
  changes?: GitChange[];
  url: string;
  remoteUrl: string;
  parents?: string[];
  push?: GitPushRef;
}

export interface GitUserDate {
  name: string;
  email: string;
  date: string;
}

export interface ChangeCountDictionary {
  Add?: number;
  Edit?: number;
  Delete?: number;
}

export interface GitChange {
  item?: GitItem;
  changeType: string;
}

export interface GitItem {
  path: string;
  url?: string;
}

export interface GitPushRef {
  pushId: number;
  date: string;
}

export type GitCommitResponse = ApiCollectionResponse<GitCommit>;

// ============================================
// Pull Requests
// ============================================

export interface GitPullRequest {
  pullRequestId: number;
  codeReviewId: number;
  status: PullRequestStatus;
  createdBy: IdentityRef;
  creationDate: string;
  closedDate?: string;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  mergeStatus: PullRequestAsyncStatus;
  isDraft: boolean;
  mergeId?: string;
  lastMergeSourceCommit?: GitCommitRef;
  lastMergeTargetCommit?: GitCommitRef;
  lastMergeCommit?: GitCommitRef;
  reviewers: IdentityRefWithVote[];
  url: string;
  repository?: GitRepository;
  completionOptions?: GitPullRequestCompletionOptions;
  completionQueueTime?: string;
}

export type PullRequestStatus =
  | "notSet"
  | "active"
  | "abandoned"
  | "completed"
  | "all";

export type PullRequestAsyncStatus =
  | "notSet"
  | "queued"
  | "conflicts"
  | "succeeded"
  | "rejectedByPolicy"
  | "failure";

export interface IdentityRef {
  displayName: string;
  url?: string;
  id: string;
  uniqueName: string;
  imageUrl?: string;
  descriptor?: string;
}

export interface IdentityRefWithVote extends IdentityRef {
  vote: number;
  reviewerUrl?: string;
  votedFor?: IdentityRefWithVote[];
  isContainer?: boolean;
}

export interface GitCommitRef {
  commitId: string;
  url?: string;
}

export interface GitRepository {
  id: string;
  name: string;
  url: string;
  project?: TeamProjectReference;
  defaultBranch?: string;
  size?: number;
  remoteUrl?: string;
  sshUrl?: string;
  webUrl?: string;
}

export interface TeamProjectReference {
  id: string;
  name: string;
  description?: string;
  url?: string;
  state?: string;
  revision?: number;
  visibility?: string;
  lastUpdateTime?: string;
}

export interface GitPullRequestCompletionOptions {
  deleteSourceBranch?: boolean;
  mergeCommitMessage?: string;
  squashMerge?: boolean;
  mergeStrategy?: string;
  bypassPolicy?: boolean;
  bypassReason?: string;
  transitionWorkItems?: boolean;
  autoCompleteIgnoreConfigIds?: number[];
}

export type GitPullRequestResponse = ApiCollectionResponse<GitPullRequest>;

// ============================================
// Pull Request Iterations (for file changes)
// ============================================

export interface GitPullRequestIteration {
  id: number;
  description?: string;
  author: IdentityRef;
  createdDate: string;
  updatedDate: string;
  sourceRefCommit: GitCommitRef;
  targetRefCommit: GitCommitRef;
  commonRefCommit: GitCommitRef;
  hasMoreCommits?: boolean;
  changeList?: GitPullRequestChange[];
}

export interface GitPullRequestChange {
  changeTrackingId: number;
  changeId: number;
  item?: GitItem;
  changeType: string;
}

export type GitPullRequestIterationResponse =
  ApiCollectionResponse<GitPullRequestIteration>;

// ============================================
// Query Parameters
// ============================================

export interface CommitQueryParams {
  searchCriteria?: {
    fromDate?: string;
    toDate?: string;
    itemPath?: string;
    user?: string;
    fromCommitId?: string;
    toCommitId?: string;
    author?: string;
    committer?: string;
    includeLinks?: boolean;
    showOldestCommitsFirst?: boolean;
    $top?: number;
    $skip?: number;
  };
  includeStatuses?: boolean;
}

export interface PullRequestQueryParams {
  searchCriteria?: {
    repositoryId?: string;
    creatorId?: string;
    reviewerId?: string;
    status?: PullRequestStatus;
    targetRefName?: string;
    sourceRefName?: string;
    includeLinks?: boolean;
    minTime?: string;
    maxTime?: string;
  };
  top?: number;
  skip?: number;
}
