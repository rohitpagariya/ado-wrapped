/**
 * Application-wide constants
 * Centralized location for magic numbers and strings
 */

// Azure DevOps API versions
export const API_VERSION = "7.0";
export const VSSPS_API_VERSION = "7.1";

// API client settings
export const DEFAULT_TIMEOUT_MS = 30000;
export const PAGINATION_PAGE_SIZE = 100;

// Cache settings
export const DEFAULT_CACHE_TTL_HOURS = 24;

// Time-related constants
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTH_NAMES = [
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
] as const;

// Ordered days for display (week starts Monday)
export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// Story card types for type safety
export const STORY_CARD_TYPES = [
  "welcome",
  "commits-total",
  "lines-of-code",
  "heatmap",
  "time-distribution",
  "languages",
  "streak",
  "pull-requests",
  "work-items-total",
  "work-items-types",
  "bugs-fixed",
  "resolution-speed",
  "top-tags",
  "insights",
  "finale",
] as const;

export type StoryCardType = (typeof STORY_CARD_TYPES)[number];

// Developer personality types
export const PERSONALITY_TYPES = [
  "Night Owl",
  "Early Bird",
  "Nine-to-Fiver",
  "Weekend Warrior",
] as const;

export type PersonalityType = (typeof PERSONALITY_TYPES)[number];

// Commit message stop words for filtering
export const COMMIT_MESSAGE_STOP_WORDS = new Set([
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
