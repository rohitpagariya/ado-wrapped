import {
  format,
  parseISO,
  differenceInDays,
  differenceInHours,
  getDay,
  getHours,
  getMonth,
} from "date-fns";
import { GitCommit } from "./types";
import { GitPullRequest } from "./types";
import { WorkItem } from "./types";
import {
  WrappedStats,
  CommitStats,
  PullRequestStats,
  WorkItemStats,
  Insights,
} from "../../types";
import {
  groupCommitsByDate,
  calculateTotalChanges,
  extractFileExtensions,
} from "./commits";
import {
  calculateAvgDaysToMerge,
  getPRStatsByStatus,
  findLargestPR,
} from "./pullRequests";
import {
  DAY_NAMES,
  MONTH_NAMES,
  COMMIT_MESSAGE_STOP_WORDS,
} from "../constants";

export interface AggregatorInput {
  commits: GitCommit[];
  pullRequests: GitPullRequest[];
  workItems: WorkItem[];
  config: {
    organization: string;
    projects: string[]; // Changed from project to projects array
    repository: string;
    year: number;
    userEmail?: string;
  };
}

/**
 * Aggregate raw Azure DevOps data into wrapped statistics
 */
export function aggregateStats(input: AggregatorInput): WrappedStats {
  const { commits, pullRequests, workItems, config } = input;

  console.log(`\n📊 Aggregating stats for ${config.year}...`);
  console.log(`   Projects: ${config.projects.join(", ")}`);
  console.log(`   Commits: ${commits.length}`);
  console.log(`   Pull Requests: ${pullRequests.length}`);
  console.log(`   Work Items: ${workItems.length}`);

  return {
    meta: {
      organization: config.organization,
      projects: config.projects,
      repository: config.repository,
      year: config.year,
      generatedAt: new Date().toISOString(),
      userEmail: config.userEmail,
    },
    commits: aggregateCommitStats(commits),
    pullRequests: aggregatePRStats(pullRequests, config.userEmail),
    workItems: aggregateWorkItemStats(workItems),
    builds: {
      total: 0,
      succeeded: 0,
      failed: 0,
      successRate: 0,
      avgDurationMinutes: 0,
    },
    insights: generateInsights(commits, pullRequests),
  };
}

/**
 * Aggregate commit statistics
 */
function aggregateCommitStats(commits: GitCommit[]): CommitStats {
  const byMonth: Record<string, number> = {};
  const byDayOfWeek: Record<string, number> = {};
  const byHour: Record<number, number> = {};

  // Initialize from constants
  MONTH_NAMES.forEach((month) => (byMonth[month] = 0));
  DAY_NAMES.forEach((day) => (byDayOfWeek[day] = 0));
  for (let i = 0; i < 24; i++) {
    byHour[i] = 0;
  }

  let firstCommitDate = "";
  let lastCommitDate = "";
  const commitMessages: string[] = [];
  const commitDates: string[] = []; // Collect all commit dates for heatmap

  for (const commit of commits) {
    const date = parseISO(commit.author.date);

    // Collect date for heatmap (YYYY-MM-DD format)
    commitDates.push(commit.author.date.split("T")[0]);

    // Track first and last commit
    if (!firstCommitDate || commit.author.date < firstCommitDate) {
      firstCommitDate = commit.author.date;
    }
    if (!lastCommitDate || commit.author.date > lastCommitDate) {
      lastCommitDate = commit.author.date;
    }

    // By month
    const month = MONTH_NAMES[getMonth(date)];
    byMonth[month]++;

    // By day of week
    const dayOfWeek = DAY_NAMES[getDay(date)];
    byDayOfWeek[dayOfWeek]++;

    // By hour
    const hour = getHours(date);
    byHour[hour]++;

    // Collect commit messages for word analysis
    if (commit.comment) {
      commitMessages.push(commit.comment);
    }
  }

  // Calculate change counts
  const changes = calculateTotalChanges(commits);

  // Calculate longest streak
  const longestStreak = calculateLongestStreak(commits);

  // Extract top commit message words
  const topCommitMessages = extractTopWords(commitMessages);

  return {
    total: commits.length,
    additions: changes.additions,
    edits: changes.edits,
    deletions: changes.deletions,
    byMonth,
    byDayOfWeek,
    byHour,
    longestStreak,
    firstCommitDate,
    lastCommitDate,
    topCommitMessages,
    commitDates,
  };
}

/**
 * Aggregate pull request statistics
 */
function aggregatePRStats(
  prs: GitPullRequest[],
  userEmail?: string
): PullRequestStats {
  const stats = getPRStatsByStatus(prs, userEmail);
  const avgDaysToMerge = calculateAvgDaysToMerge(prs);
  const largestPR = findLargestPR(prs);

  // Time-based distributions for PRs
  const byMonth: Record<string, number> = {};
  const byDayOfWeek: Record<string, number> = {};
  const byHour: Record<number, number> = {};

  // Initialize from constants
  MONTH_NAMES.forEach((month) => (byMonth[month] = 0));
  DAY_NAMES.forEach((day) => (byDayOfWeek[day] = 0));
  for (let i = 0; i < 24; i++) {
    byHour[i] = 0;
  }

  let firstPRDate = "";
  let lastPRDate = "";
  let totalComments = 0;

  // Track merge times for fastest/slowest
  const mergeTimes: Array<{ id: number; title: string; hours: number }> = [];

  for (const pr of prs) {
    const date = parseISO(pr.creationDate);

    // Track first and last PR
    if (!firstPRDate || pr.creationDate < firstPRDate) {
      firstPRDate = pr.creationDate;
    }
    if (!lastPRDate || pr.creationDate > lastPRDate) {
      lastPRDate = pr.creationDate;
    }

    // By month
    const month = MONTH_NAMES[getMonth(date)];
    byMonth[month]++;

    // By day of week
    const dayOfWeek = DAY_NAMES[getDay(date)];
    byDayOfWeek[dayOfWeek]++;

    // By hour
    const hour = getHours(date);
    byHour[hour]++;

    // Count comments from reviewers (vote count as proxy)
    if (pr.reviewers) {
      totalComments += pr.reviewers.length;
    }

    // Calculate merge time for completed PRs
    if (pr.status === "completed" && pr.closedDate) {
      const created = new Date(pr.creationDate);
      const closed = new Date(pr.closedDate);
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      mergeTimes.push({ id: pr.pullRequestId, title: pr.title, hours });
    }
  }

  // Find fastest and slowest merges
  let fastestMerge: { id: number; title: string; hours: number } | null = null;
  let slowestMerge: { id: number; title: string; days: number } | null = null;

  if (mergeTimes.length > 0) {
    mergeTimes.sort((a, b) => a.hours - b.hours);
    const fastest = mergeTimes[0];
    const slowest = mergeTimes[mergeTimes.length - 1];

    fastestMerge = {
      id: fastest.id,
      title: fastest.title,
      hours: Math.round(fastest.hours * 10) / 10,
    };
    slowestMerge = {
      id: slowest.id,
      title: slowest.title,
      days: Math.round((slowest.hours / 24) * 10) / 10,
    };
  }

  // Format average merge time in human-readable format
  let avgDaysToMergeFormatted = "N/A";
  if (avgDaysToMerge > 0) {
    if (avgDaysToMerge < 1) {
      const hours = Math.round(avgDaysToMerge * 24);
      avgDaysToMergeFormatted = `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(avgDaysToMerge * 10) / 10;
      avgDaysToMergeFormatted = `${days} day${days !== 1 ? "s" : ""}`;
    }
  }

  return {
    created: stats.created,
    merged: stats.merged,
    abandoned: stats.abandoned,
    reviewed: stats.reviewed,
    avgDaysToMerge: Math.round(avgDaysToMerge * 10) / 10,
    avgDaysToMergeFormatted,
    largestPR,
    byMonth,
    byDayOfWeek,
    byHour,
    firstPRDate,
    lastPRDate,
    totalComments,
    fastestMerge,
    slowestMerge,
  };
}

/**
 * Calculate longest commit streak in days
 */
function calculateLongestStreak(commits: GitCommit[]): number {
  if (commits.length === 0) return 0;

  const commitsByDate = groupCommitsByDate(commits);
  const sortedDates = Array.from(commitsByDate.keys()).sort();

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i - 1]);
    const currDate = parseISO(sortedDates[i]);
    const daysDiff = differenceInDays(currDate, prevDate);

    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Extract top words from commit messages
 */
function extractTopWords(messages: string[], topN: number = 10): string[] {
  const wordCounts = new Map<string, number>();

  for (const message of messages) {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) => word.length > 3 && !COMMIT_MESSAGE_STOP_WORDS.has(word)
      );

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

/**
 * Generate fun insights from the data
 * Uses commits as primary source, falls back to PRs if no commits
 */
function generateInsights(
  commits: GitCommit[],
  prs: GitPullRequest[]
): Insights {
  // If we have commits, use them for insights
  if (commits.length > 0) {
    return generateInsightsFromCommits(commits);
  }

  // Fall back to PR data if no commits
  if (prs.length > 0) {
    return generateInsightsFromPRs(prs);
  }

  // No data at all - return defaults
  return {
    personality: "Nine-to-Fiver",
    busiestMonth: "Unknown",
    busiestDay: "Unknown",
    favoriteCommitHour: 12,
    topFileExtensions: [],
  };
}

/**
 * Generate insights from commit data
 */
function generateInsightsFromCommits(commits: GitCommit[]): Insights {
  // Determine personality type based on commit hours
  const personality = determinePersonalityFromDates(
    commits.map((c) => parseISO(c.author.date))
  );

  // Find busiest month
  const monthCounts = new Map<string, number>();
  for (const commit of commits) {
    const month = MONTH_NAMES[getMonth(parseISO(commit.author.date))];
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }
  const busiestMonth =
    Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "Unknown";

  // Find busiest day
  const dayCounts = new Map<string, number>();
  for (const commit of commits) {
    const day = DAY_NAMES[getDay(parseISO(commit.author.date))];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }
  const busiestDay =
    Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "Unknown";

  // Find favorite commit hour
  const hourCounts = new Map<number, number>();
  for (const commit of commits) {
    const hour = getHours(parseISO(commit.author.date));
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const favoriteCommitHour =
    Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;

  // Extract top file extensions
  const extensions = extractFileExtensions(commits);
  const topFileExtensions = Array.from(extensions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ext, count]) => ({ ext, count }));

  return {
    personality,
    busiestMonth,
    busiestDay,
    favoriteCommitHour,
    topFileExtensions,
  };
}

/**
 * Generate insights from PR data when commits are not available
 */
function generateInsightsFromPRs(prs: GitPullRequest[]): Insights {
  // Parse all PR creation dates
  const dates = prs.map((pr) => parseISO(pr.creationDate));

  // Determine personality type based on PR creation hours
  const personality = determinePersonalityFromDates(dates);

  // Find busiest month
  const monthCounts = new Map<string, number>();
  for (const date of dates) {
    const month = MONTH_NAMES[getMonth(date)];
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }
  const busiestMonth =
    Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "Unknown";

  // Find busiest day
  const dayCounts = new Map<string, number>();
  for (const date of dates) {
    const day = DAY_NAMES[getDay(date)];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }
  const busiestDay =
    Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "Unknown";

  // Find favorite hour
  const hourCounts = new Map<number, number>();
  for (const date of dates) {
    const hour = getHours(date);
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const favoriteCommitHour =
    Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;

  return {
    personality,
    busiestMonth,
    busiestDay,
    favoriteCommitHour,
    topFileExtensions: [], // No file extensions from PRs
  };
}

/**
 * Determine personality type based on activity dates
 */
function determinePersonalityFromDates(
  dates: Date[]
): "Night Owl" | "Early Bird" | "Nine-to-Fiver" | "Weekend Warrior" {
  if (dates.length === 0) return "Nine-to-Fiver";

  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<number, number>();

  for (const date of dates) {
    const hour = getHours(date);
    const day = getDay(date);

    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }

  const totalCount = dates.length;
  const nightCommits =
    (hourCounts.get(22) || 0) +
    (hourCounts.get(23) || 0) +
    (hourCounts.get(0) || 0) +
    (hourCounts.get(1) || 0) +
    (hourCounts.get(2) || 0) +
    (hourCounts.get(3) || 0);
  const morningCommits =
    (hourCounts.get(6) || 0) +
    (hourCounts.get(7) || 0) +
    (hourCounts.get(8) || 0);
  const businessHoursCommits = Array.from(
    { length: 8 },
    (_, i) => hourCounts.get(i + 9) || 0
  ).reduce((sum, count) => sum + count, 0);
  const weekendCommits = (dayCounts.get(0) || 0) + (dayCounts.get(6) || 0);

  const nightPercentage = (nightCommits / totalCount) * 100;
  const morningPercentage = (morningCommits / totalCount) * 100;
  const businessPercentage = (businessHoursCommits / totalCount) * 100;
  const weekendPercentage = (weekendCommits / totalCount) * 100;

  if (weekendPercentage > 30) {
    return "Weekend Warrior";
  } else if (nightPercentage > 25) {
    return "Night Owl";
  } else if (morningPercentage > 20) {
    return "Early Bird";
  } else {
    return "Nine-to-Fiver";
  }
}

// ============================================
// Work Item Aggregation
// ============================================

/**
 * Aggregate work item statistics
 */
function aggregateWorkItemStats(workItems: WorkItem[]): WorkItemStats {
  if (workItems.length === 0) {
    return getEmptyWorkItemStats();
  }

  const byType: Record<string, number> = {};
  const byPriority: Record<number, number> = {};
  const byMonth: Record<string, number> = {};
  const bugsBySeverity: Record<string, number> = {};
  const tagCounts: Map<string, number> = new Map();
  const areaCounts: Map<string, number> = new Map();

  // Initialize months
  MONTH_NAMES.forEach((month) => (byMonth[month] = 0));

  let bugsFixed = 0;
  let firstResolvedDate = "";
  let lastResolvedDate = "";
  let totalResolutionHours = 0;
  let resolutionCount = 0;
  let fastestResolution: { id: number; title: string; hours: number } | null =
    null;

  for (const item of workItems) {
    const fields = item.fields;
    const workItemType = fields["System.WorkItemType"];
    // Use ResolvedDate or ClosedDate if available, fall back to ChangedDate
    // Note: These fields use Microsoft.VSTS.Common namespace, not System
    // They may not exist in all Azure DevOps process templates (e.g., Basic process)
    const resolvedDate =
      fields["Microsoft.VSTS.Common.ResolvedDate"] ||
      fields["Microsoft.VSTS.Common.ClosedDate"] ||
      fields["System.ChangedDate"];
    const createdDate = fields["System.CreatedDate"];

    // Count by type
    byType[workItemType] = (byType[workItemType] || 0) + 1;

    // Count bugs
    if (workItemType === "Bug") {
      bugsFixed++;
      const severity = fields["Microsoft.VSTS.Common.Severity"];
      if (severity) {
        bugsBySeverity[severity] = (bugsBySeverity[severity] || 0) + 1;
      }
    }

    // Count by priority
    const priority = fields["Microsoft.VSTS.Common.Priority"];
    if (priority) {
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    }

    // Track resolved date for month distribution and timeline
    if (resolvedDate) {
      const date = parseISO(resolvedDate);
      const month = MONTH_NAMES[getMonth(date)];
      byMonth[month]++;

      // Track first/last resolved dates
      if (!firstResolvedDate || resolvedDate < firstResolvedDate) {
        firstResolvedDate = resolvedDate;
      }
      if (!lastResolvedDate || resolvedDate > lastResolvedDate) {
        lastResolvedDate = resolvedDate;
      }

      // Calculate resolution time
      if (createdDate) {
        const created = parseISO(createdDate);
        const resolved = parseISO(resolvedDate);
        const hours = differenceInHours(resolved, created);

        if (hours >= 0) {
          totalResolutionHours += hours;
          resolutionCount++;

          // Track fastest resolution
          if (!fastestResolution || hours < fastestResolution.hours) {
            fastestResolution = {
              id: item.id,
              title: fields["System.Title"],
              hours,
            };
          }
        }
      }
    }

    // Count tags
    const tags = fields["System.Tags"];
    if (tags) {
      const tagList = tags.split(";").map((t) => t.trim());
      for (const tag of tagList) {
        if (tag) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }

    // Count areas (get last segment of area path for cleaner display)
    const areaPath = fields["System.AreaPath"];
    if (areaPath) {
      const areaSegments = areaPath.split("\\");
      const area = areaSegments[areaSegments.length - 1];
      areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
    }
  }

  // Sort and get top tags
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Sort and get top areas
  const topAreas = Array.from(areaCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count]) => ({ area, count }));

  // Calculate average resolution time in days
  const avgResolutionDays =
    resolutionCount > 0 ? totalResolutionHours / resolutionCount / 24 : 0;

  return {
    total: workItems.length,
    byType,
    byPriority,
    byMonth,
    bugsFixed,
    bugsBySeverity,
    topTags,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10, // Round to 1 decimal
    fastestResolution,
    firstResolvedDate,
    lastResolvedDate,
    topAreas,
  };
}

/**
 * Return empty work item stats when no data
 */
function getEmptyWorkItemStats(): WorkItemStats {
  const byMonth: Record<string, number> = {};
  MONTH_NAMES.forEach((month) => (byMonth[month] = 0));

  return {
    total: 0,
    byType: {},
    byPriority: {},
    byMonth,
    bugsFixed: 0,
    bugsBySeverity: {},
    topTags: [],
    avgResolutionDays: 0,
    fastestResolution: null,
    firstResolvedDate: "",
    lastResolvedDate: "",
    topAreas: [],
  };
}
