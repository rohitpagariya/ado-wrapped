"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportToJSON, exportToMarkdown } from "@/lib/export";
import type { WrappedStats } from "@/types";
import type { WrappedConfig } from "@/components/ConfigForm";
import { Download, FileJson, FileText } from "lucide-react";

// Format hour to 12-hour format with AM/PM
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// Format ISO date string to readable format
function formatDate(isoString: string): string {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export default function WrappedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get config from sessionStorage
        const configStr = sessionStorage.getItem("ado-wrapped-config");
        if (!configStr) {
          router.push("/");
          return;
        }

        const config: WrappedConfig & { useServerPAT?: boolean } =
          JSON.parse(configStr);

        // Build API URL with query parameters
        // If using server config, don't send params (API will load from .env)
        const params = config.useServerPAT
          ? new URLSearchParams()
          : new URLSearchParams({
              organization: config.organization,
              project: config.project,
              repository: config.repository,
              year: config.year.toString(),
            });

        if (config.userEmail && !config.useServerPAT) {
          params.append("userEmail", config.userEmail);
        }

        // Fetch stats from API
        // If using server PAT, don't send Authorization header
        const headers: HeadersInit = config.useServerPAT
          ? {}
          : {
              Authorization: `Bearer ${config.pat}`,
            };

        const url = config.useServerPAT
          ? "/api/stats"
          : `/api/stats?${params.toString()}`;

        console.log(`Fetching stats from ${url}`, {
          useServerPAT: config.useServerPAT,
        });

        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch stats");
        }

        const data: WrappedStats = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        setError(err.message || "An unexpected error occurred");
        setLoading(false);
        toast({
          title: "Error Loading Stats",
          description: err.message,
          variant: "destructive",
        });
      }
    };

    fetchStats();
  }, [router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/10" />
          <div className="text-center mt-8">
            <p className="text-white text-lg">
              Fetching your Azure DevOps data...
            </p>
            <p className="text-slate-400 text-sm mt-2">
              This may take a minute
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <h1 className="text-3xl font-bold text-white">
            Oops! Something went wrong
          </h1>
          <p className="text-slate-400">{error}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0"
            >
              Back to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header - stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Your {stats.meta.year} Wrapped
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              {stats.meta.organization} / {stats.meta.project} /{" "}
              {stats.meta.repository}
            </p>
          </div>
          <div className="flex gap-2 justify-center sm:justify-end flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                exportToJSON(stats);
                toast({
                  title: "Exported!",
                  description: "Downloaded as JSON",
                });
              }}
            >
              <FileJson className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                exportToMarkdown(stats);
                toast({
                  title: "Exported!",
                  description: "Downloaded as Markdown",
                });
              }}
            >
              <FileText className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Markdown</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => router.push("/")}
            >
              Back
            </Button>
          </div>
        </div>

        {/* Stats Display */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {/* Commits Section */}
          {stats.commits.total > 0 && (
            <>
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-600/20 to-slate-700/20 border border-slate-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
                  {stats.commits.total}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base">
                  Total Commits
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-400">
                  +{stats.commits.additions.toLocaleString()}
                </h3>
                <p className="text-emerald-300 text-sm sm:text-base">
                  Lines Added
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-rose-400">
                  -{stats.commits.deletions.toLocaleString()}
                </h3>
                <p className="text-rose-300 text-sm sm:text-base">
                  Lines Deleted
                </p>
              </div>
            </>
          )}

          {/* Pull Requests Section */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 backdrop-blur-sm">
            <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
              {stats.pullRequests.created}
            </h3>
            <p className="text-blue-300 text-sm sm:text-base">PRs Created</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 backdrop-blur-sm">
            <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-400">
              {stats.pullRequests.merged}
            </h3>
            <p className="text-emerald-300 text-sm sm:text-base">PRs Merged</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-sky-600/20 border border-cyan-500/30 backdrop-blur-sm">
            <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-cyan-400">
              {stats.pullRequests.avgDaysToMergeFormatted || "N/A"}
            </h3>
            <p className="text-cyan-300 text-sm sm:text-base">
              Avg Time to Merge
            </p>
          </div>

          {/* PR Reviewer Stats */}
          {stats.pullRequests.reviewed > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 backdrop-blur-sm">
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-amber-400">
                {stats.pullRequests.reviewed}
              </h3>
              <p className="text-amber-300 text-sm sm:text-base">
                PRs Reviewed
              </p>
            </div>
          )}

          {/* Fastest/Slowest Merge */}
          {stats.pullRequests.fastestMerge && (
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 backdrop-blur-sm">
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-yellow-400">
                ⚡{" "}
                {stats.pullRequests.fastestMerge.hours < 24
                  ? `${Math.round(stats.pullRequests.fastestMerge.hours)}h`
                  : `${Math.round(
                      stats.pullRequests.fastestMerge.hours / 24
                    )}d`}
              </h3>
              <p className="text-yellow-300 text-sm">Fastest Merge</p>
              <p
                className="text-xs text-yellow-300/60 mt-1 truncate"
                title={stats.pullRequests.fastestMerge.title}
              >
                {stats.pullRequests.fastestMerge.title}
              </p>
            </div>
          )}

          {stats.pullRequests.slowestMerge &&
            stats.pullRequests.slowestMerge.days > 0 && (
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-orange-400">
                  🐢 {stats.pullRequests.slowestMerge.days}d
                </h3>
                <p className="text-orange-300 text-sm">Longest Review</p>
                <p
                  className="text-xs text-orange-300/60 mt-1 truncate"
                  title={stats.pullRequests.slowestMerge.title}
                >
                  {stats.pullRequests.slowestMerge.title}
                </p>
              </div>
            )}

          {/* Insights */}
          {stats.insights && (
            <>
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 border border-teal-500/30 backdrop-blur-sm">
                <h3 className="text-xl sm:text-2xl font-bold mb-1 text-teal-400">
                  {stats.insights.personality === "Night Owl" && "🦉 "}
                  {stats.insights.personality === "Early Bird" && "🐦 "}
                  {stats.insights.personality === "Nine-to-Fiver" && "💼 "}
                  {stats.insights.personality === "Weekend Warrior" && "⚔️ "}
                  {stats.insights.personality}
                </h3>
                <p className="text-teal-300 text-sm sm:text-base">
                  Your Code Personality
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-600/20 border border-rose-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-rose-400">
                  📅 {stats.insights.busiestMonth}
                </h3>
                <p className="text-rose-300 text-sm sm:text-base">
                  Busiest Month
                </p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-sky-400">
                  📆 {stats.insights.busiestDay}
                </h3>
                <p className="text-sky-300 text-sm sm:text-base">Busiest Day</p>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-amber-400">
                  ⏰ {formatHour(stats.insights.favoriteCommitHour)}
                </h3>
                <p className="text-amber-300 text-sm sm:text-base">
                  Favorite Coding Hour
                </p>
              </div>
            </>
          )}
        </div>

        {/* PR Activity Timeline */}
        {stats.pullRequests.firstPRDate && (
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4 text-white">
              📈 PR Activity Timeline
            </h3>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-slate-400">First PR</p>
                <p className="font-medium text-white">
                  {formatDate(stats.pullRequests.firstPRDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Last PR</p>
                <p className="font-medium text-white">
                  {formatDate(stats.pullRequests.lastPRDate)}
                </p>
              </div>
            </div>
            {/* Monthly distribution bar chart */}
            <div className="mt-6">
              <p className="text-slate-400 text-sm mb-2">PRs by Month</p>
              <div className="flex items-end gap-1 h-24">
                {Object.entries(stats.pullRequests.byMonth || {}).map(
                  ([month, count]) => {
                    const maxCount = Math.max(
                      ...Object.values(stats.pullRequests.byMonth || {})
                    );
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={month}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t transition-all hover:from-emerald-500 hover:to-teal-300"
                          style={{
                            height: `${height}%`,
                            minHeight: count > 0 ? "4px" : "0",
                          }}
                          title={`${month}: ${count} PRs`}
                        />
                        <span className="text-xs text-slate-500 mt-1 hidden sm:block">
                          {month}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 sm:hidden">
                          {month.charAt(0)}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
            {/* Day of week distribution */}
            <div className="mt-6">
              <p className="text-slate-400 text-sm mb-2">PRs by Day of Week</p>
              <div className="flex items-end gap-1 h-16">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, idx) => {
                    const dayNames = [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ];
                    const fullDay = dayNames[idx];
                    const count =
                      stats.pullRequests.byDayOfWeek?.[fullDay] || 0;
                    const maxCount = Math.max(
                      ...Object.values(stats.pullRequests.byDayOfWeek || {})
                    );
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={day}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t transition-all hover:from-cyan-500 hover:to-blue-400"
                          style={{
                            height: `${height}%`,
                            minHeight: count > 0 ? "4px" : "0",
                          }}
                          title={`${fullDay}: ${count} PRs`}
                        />
                        <span className="text-xs text-slate-500 mt-1">
                          {day.charAt(0)}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* Streak Info - only show if we have commit data */}
        {stats.commits.total > 0 && stats.commits.longestStreak > 0 && (
          <div className="mt-6 sm:mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 backdrop-blur-sm text-center">
            <p className="text-5xl sm:text-6xl font-bold mb-2">🔥</p>
            <h3 className="text-3xl sm:text-4xl font-bold text-orange-400">
              {stats.commits.longestStreak} Days
            </h3>
            <p className="text-orange-300 mt-2">Longest Commit Streak</p>
          </div>
        )}

        {/* Largest PR */}
        {stats.pullRequests.largestPR && (
          <div className="mt-6 sm:mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 backdrop-blur-sm text-center">
            <p className="text-4xl sm:text-5xl font-bold mb-2">🏆</p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-400">
              Largest PR
            </h3>
            <p
              className="text-amber-300/80 mt-2 truncate max-w-md mx-auto text-sm sm:text-base"
              title={stats.pullRequests.largestPR.title}
            >
              {stats.pullRequests.largestPR.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
