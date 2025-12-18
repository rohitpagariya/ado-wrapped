import {
  format,
  parseISO,
  differenceInDays,
  getDay,
  getHours,
  getMonth,
} from "date-fns";
import { GitCommit } from "./types";
import { GitPullRequest } from "./types";
import {
  WrappedStats,
  CommitStats,
  PullRequestStats,
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

export interface AggregatorInput {
  commits: GitCommit[];
  pullRequests: GitPullRequest[];
  config: {
    organization: string;
    project: string;
    repository: string;
    year: number;
    userEmail?: string;
  };
}

/**
 * Aggregate raw Azure DevOps data into wrapped statistics
 */
export function aggregateStats(input: AggregatorInput): WrappedStats {
  const { commits, pullRequests, config } = input;

  console.log(`\n📊 Aggregating stats for ${config.year}...`);
  console.log(`   Commits: ${commits.length}`);
  console.log(`   Pull Requests: ${pullRequests.length}`);

  return {
    meta: {
      organization: config.organization,
      project: config.project,
      repository: config.repository,
      year: config.year,
      generatedAt: new Date().toISOString(),
      userEmail: config.userEmail,
    },
    commits: aggregateCommitStats(commits),
    pullRequests: aggregatePRStats(pullRequests, config.userEmail),
    workItems: {
      created: 0,
      resolved: 0,
      byType: {},
      topTags: [],
    },
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
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Initialize
  monthNames.forEach((month) => (byMonth[month] = 0));
  dayNames.forEach((day) => (byDayOfWeek[day] = 0));
  for (let i = 0; i < 24; i++) {
    byHour[i] = 0;
  }

  let firstCommitDate = "";
  let lastCommitDate = "";
  const commitMessages: string[] = [];

  for (const commit of commits) {
    const date = parseISO(commit.author.date);

    // Track first and last commit
    if (!firstCommitDate || commit.author.date < firstCommitDate) {
      firstCommitDate = commit.author.date;
    }
    if (!lastCommitDate || commit.author.date > lastCommitDate) {
      lastCommitDate = commit.author.date;
    }

    // By month
    const month = monthNames[getMonth(date)];
    byMonth[month]++;

    // By day of week
    const dayOfWeek = dayNames[getDay(date)];
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

  return {
    created: stats.created,
    merged: stats.merged,
    abandoned: stats.abandoned,
    reviewed: stats.reviewed,
    avgDaysToMerge: Math.round(avgDaysToMerge * 10) / 10, // Round to 1 decimal
    largestPR,
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

  // Common words to filter out
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "was",
    "are",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "merge",
    "merged",
    "pull",
    "request",
    "pr",
    "from",
    "into",
    "branch",
  ]);

  for (const message of messages) {
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

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
 */
function generateInsights(
  commits: GitCommit[],
  prs: GitPullRequest[]
): Insights {
  // Determine personality type based on commit hours
  const personality = determinePersonality(commits);

  // Find busiest month
  const monthCounts = new Map<string, number>();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (const commit of commits) {
    const month = monthNames[getMonth(parseISO(commit.author.date))];
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }

  const busiestMonth =
    Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "Unknown";

  // Find busiest day
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayCounts = new Map<string, number>();

  for (const commit of commits) {
    const day = dayNames[getDay(parseISO(commit.author.date))];
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
    Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;

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
 * Determine personality type based on commit patterns
 */
function determinePersonality(
  commits: GitCommit[]
): "Night Owl" | "Early Bird" | "Nine-to-Fiver" | "Weekend Warrior" {
  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<number, number>();

  for (const commit of commits) {
    const date = parseISO(commit.author.date);
    const hour = getHours(date);
    const day = getDay(date);

    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }

  // Calculate percentages
  const totalCommits = commits.length;
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

  const nightPercentage = (nightCommits / totalCommits) * 100;
  const morningPercentage = (morningCommits / totalCommits) * 100;
  const businessPercentage = (businessHoursCommits / totalCommits) * 100;
  const weekendPercentage = (weekendCommits / totalCommits) * 100;

  // Determine personality
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
