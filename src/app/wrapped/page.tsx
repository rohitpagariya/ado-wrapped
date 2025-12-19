"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportToJSON, exportToMarkdown } from "@/lib/export";
import type { WrappedStats } from "@/types";
import type { WrappedConfig } from "@/components/ConfigForm";
import { Download, FileJson, FileText, Check, Loader2 } from "lucide-react";

// Loading step indicator component
function LoadingStepIndicator({
  step,
  isComplete,
  isActive,
}: {
  step: string;
  isComplete: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300
        ${
          isComplete
            ? "bg-green-500 text-white"
            : isActive
            ? "bg-blue-500 text-white animate-pulse"
            : "bg-white/10 text-slate-500"
        }
      `}
      >
        {isComplete ? (
          <Check className="w-4 h-4" />
        ) : isActive ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={`text-sm transition-colors duration-300 ${
          isComplete
            ? "text-green-400"
            : isActive
            ? "text-white"
            : "text-slate-500"
        }`}
      >
        {step}
      </span>
    </div>
  );
}

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
  const [loadingStep, setLoadingStep] = useState<string>("Initializing...");
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Helper to ensure minimum time on each step so users can see progress
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Update step with minimum display time (default 500ms for consistency)
    const updateStep = async (
      step: string,
      progress: number,
      minDelayMs: number = 500
    ) => {
      setLoadingStep(step);
      setLoadingProgress(progress);
      await delay(minDelayMs);
    };

    const fetchStats = async () => {
      try {
        await updateStep("Loading configuration...", 10);

        // Get config from sessionStorage
        const configStr = sessionStorage.getItem("ado-wrapped-config");
        if (!configStr) {
          router.push("/");
          return;
        }

        const config: WrappedConfig = JSON.parse(configStr);

        // Validate that we have required fields including PAT
        // Support both new 'projects' array and legacy 'project' field
        const projects =
          config.projects ||
          ((config as any).project ? [(config as any).project] : []);
        if (
          !config.pat ||
          !config.organization ||
          projects.length === 0 ||
          !config.repository
        ) {
          console.error("Missing required config fields");
          router.push("/");
          return;
        }

        await updateStep("Preparing API request...", 20);

        // Build API URL with query parameters
        // Use 'projects' param with comma-separated values
        const params = new URLSearchParams({
          organization: config.organization,
          projects: projects.join(","),
          repository: config.repository,
          year: config.year.toString(),
        });

        if (config.userEmail) {
          params.append("userEmail", config.userEmail);
        }

        // Fetch stats from API with user's PAT
        const headers: HeadersInit = {
          Authorization: `Bearer ${config.pat}`,
        };

        const url = `/api/stats?${params.toString()}`;

        await updateStep(
          `Fetching data from ${projects.length} project(s)...`,
          40
        );

        console.log(`Fetching stats from ${url}`);

        const response = await fetch(url, { headers });

        await updateStep("Processing response...", 70);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch stats");
        }

        await updateStep("Analyzing your activity...", 80);

        const data: WrappedStats = await response.json();

        await updateStep("Generating your Wrapped...", 90);

        // Final step - show completion briefly before transitioning
        await updateStep("Ready! 🎉", 100);

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
        <div className="w-full max-w-md space-y-6">
          {/* Animated logo/icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center">
            Building Your Wrapped
          </h2>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{loadingStep}</span>
              <span className="text-slate-500">{loadingProgress}%</span>
            </div>
          </div>

          {/* Loading steps indicator */}
          <div className="space-y-3 pt-4">
            <LoadingStepIndicator
              step="Configuration"
              isComplete={loadingProgress >= 20}
              isActive={loadingProgress >= 10 && loadingProgress < 20}
            />
            <LoadingStepIndicator
              step="Fetching commits"
              isComplete={loadingProgress >= 70}
              isActive={loadingProgress >= 20 && loadingProgress < 70}
            />
            <LoadingStepIndicator
              step="Analyzing data"
              isComplete={loadingProgress >= 90}
              isActive={loadingProgress >= 70 && loadingProgress < 90}
            />
            <LoadingStepIndicator
              step="Generating insights"
              isComplete={loadingProgress >= 100}
              isActive={loadingProgress >= 90 && loadingProgress < 100}
            />
          </div>

          <p className="text-slate-500 text-sm text-center">
            This may take a moment for large repositories
          </p>
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
              {stats.meta.organization} /{" "}
              {stats.meta.projects.length === 1
                ? stats.meta.projects[0]
                : `${stats.meta.projects.length} projects`}{" "}
              / {stats.meta.repository}
            </p>
            {stats.meta.projects.length > 1 && (
              <p className="text-slate-500 mt-1 text-xs">
                {stats.meta.projects.join(", ")}
              </p>
            )}
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

              {/* File Change Stats */}
              {(stats.commits.additions > 0 ||
                stats.commits.edits > 0 ||
                stats.commits.deletions > 0) && (
                <>
                  <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 backdrop-blur-sm">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-400">
                      +{stats.commits.additions.toLocaleString()}
                    </h3>
                    <p className="text-emerald-300 text-sm sm:text-base">
                      Files Added
                    </p>
                  </div>

                  {stats.commits.edits > 0 && (
                    <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 backdrop-blur-sm">
                      <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-amber-400">
                        ~{stats.commits.edits.toLocaleString()}
                      </h3>
                      <p className="text-amber-300 text-sm sm:text-base">
                        Files Edited
                      </p>
                    </div>
                  )}

                  <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 backdrop-blur-sm">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-rose-400">
                      -{stats.commits.deletions.toLocaleString()}
                    </h3>
                    <p className="text-rose-300 text-sm sm:text-base">
                      Files Deleted
                    </p>
                  </div>
                </>
              )}
            </>
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

        {/* ==================== PULL REQUESTS SECTION ==================== */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <h2 className="text-xl sm:text-2xl font-bold text-blue-400 flex items-center gap-2">
              <span>🔀</span> Pull Requests
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          </div>

          {/* PR Stats Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 backdrop-blur-sm">
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
                {stats.pullRequests.created}
              </h3>
              <p className="text-blue-300 text-sm sm:text-base">PRs Created</p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 backdrop-blur-sm">
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-400">
                {stats.pullRequests.merged}
              </h3>
              <p className="text-emerald-300 text-sm sm:text-base">
                PRs Merged
              </p>
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
          </div>
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
              {(() => {
                const byMonth = stats.pullRequests.byMonth || {};
                const months = [
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
                const values = months.map((m) => byMonth[m] || 0);
                const maxCount = Math.max(...values, 1);
                // Use percentage-based heights with a fixed max container height
                const maxBarHeight = 120;

                return (
                  <div
                    className="flex items-end gap-2"
                    style={{
                      height: `${maxBarHeight + 40}px`,
                      paddingTop: "24px",
                    }}
                  >
                    {months.map((month) => {
                      const count = byMonth[month] || 0;
                      const barHeight =
                        maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
                      return (
                        <div
                          key={month}
                          className="flex-1 flex flex-col items-center relative"
                        >
                          {/* Count label always visible above bar */}
                          {count > 0 && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 text-slate-300 text-xs font-medium"
                              style={{ bottom: `${barHeight + 20}px` }}
                            >
                              {count}
                            </div>
                          )}
                          <div
                            className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t transition-all hover:from-emerald-500 hover:to-teal-300"
                            style={{
                              height: `${barHeight}px`,
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
                    })}
                  </div>
                );
              })()}
            </div>
            {/* Day of week distribution */}
            <div className="mt-6">
              <p className="text-slate-400 text-sm mb-2">PRs by Day of Week</p>
              {(() => {
                const dayNames = [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ];
                const shortDays = [
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ];
                const values = dayNames.map(
                  (d) => stats.pullRequests.byDayOfWeek?.[d] || 0
                );
                const maxCount = Math.max(...values, 1);
                // Use percentage-based heights with a fixed max container height
                const maxBarHeight = 100;

                return (
                  <div
                    className="flex items-end gap-2"
                    style={{
                      height: `${maxBarHeight + 40}px`,
                      paddingTop: "24px",
                    }}
                  >
                    {shortDays.map((day, idx) => {
                      const fullDay = dayNames[idx];
                      const count =
                        stats.pullRequests.byDayOfWeek?.[fullDay] || 0;
                      const barHeight =
                        maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
                      return (
                        <div
                          key={day}
                          className="flex-1 flex flex-col items-center relative"
                        >
                          {/* Count label always visible above bar */}
                          {count > 0 && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 text-slate-300 text-xs font-medium"
                              style={{ bottom: `${barHeight + 20}px` }}
                            >
                              {count}
                            </div>
                          )}
                          <div
                            className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t transition-all hover:from-cyan-500 hover:to-blue-400"
                            style={{
                              height: `${barHeight}px`,
                            }}
                            title={`${fullDay}: ${count} PRs`}
                          />
                          <span className="text-xs text-slate-500 mt-1">
                            {day.charAt(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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
            <p className="text-xs text-amber-300/60 mt-1">
              {stats.pullRequests.largestPR.filesChanged} files changed
            </p>
          </div>
        )}

        {/* ==================== WORK ITEMS SECTION ==================== */}
        {stats.workItems && stats.workItems.total > 0 && (
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              <h2 className="text-xl sm:text-2xl font-bold text-violet-400 flex items-center gap-2">
                <span>📋</span> Work Items
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            </div>

            {/* Work Items Summary Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 backdrop-blur-sm">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
                  {stats.workItems.total}
                </h3>
                <p className="text-violet-300 text-sm sm:text-base">
                  Work Items Resolved
                </p>
              </div>

              {stats.workItems.bugsFixed > 0 && (
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-600/20 border border-red-500/30 backdrop-blur-sm">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-red-400">
                    🐛 {stats.workItems.bugsFixed}
                  </h3>
                  <p className="text-red-300 text-sm sm:text-base">
                    Bugs Squashed
                  </p>
                </div>
              )}

              {stats.workItems.avgResolutionDays > 0 && (
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border border-indigo-500/30 backdrop-blur-sm">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-indigo-400">
                    ⚡ {stats.workItems.avgResolutionDays.toFixed(1)}d
                  </h3>
                  <p className="text-indigo-300 text-sm sm:text-base">
                    Avg Resolution Time
                  </p>
                </div>
              )}

              {stats.workItems.fastestResolution && (
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 backdrop-blur-sm">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-1 text-green-400">
                    🚀{" "}
                    {stats.workItems.fastestResolution.hours < 24
                      ? `${Math.round(
                          stats.workItems.fastestResolution.hours
                        )}h`
                      : `${Math.round(
                          stats.workItems.fastestResolution.hours / 24
                        )}d`}
                  </h3>
                  <p className="text-green-300 text-sm">Fastest Resolution</p>
                  <p
                    className="text-xs text-green-300/60 mt-1 truncate"
                    title={stats.workItems.fastestResolution.title}
                  >
                    {stats.workItems.fastestResolution.title}
                  </p>
                </div>
              )}
            </div>

            {/* Work Item Types Bar Chart */}
            {Object.keys(stats.workItems.byType || {}).length > 0 && (
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Work Items by Type
                </h3>
                {(() => {
                  const typeEntries = Object.entries(
                    stats.workItems.byType
                  ).sort((a, b) => b[1] - a[1]);
                  const maxCount = Math.max(
                    ...typeEntries.map(([, c]) => c),
                    1
                  );
                  const maxBarHeight = 120;

                  return (
                    <div
                      className="flex items-end gap-3"
                      style={{
                        height: `${maxBarHeight + 60}px`,
                        paddingTop: "24px",
                      }}
                    >
                      {typeEntries.map(([type, count]) => {
                        const barHeight =
                          maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
                        return (
                          <div
                            key={type}
                            className="flex-1 flex flex-col items-center relative min-w-0"
                          >
                            {count > 0 && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 text-slate-300 text-xs font-medium"
                                style={{ bottom: `${barHeight + 40}px` }}
                              >
                                {count}
                              </div>
                            )}
                            <div
                              className="w-full bg-gradient-to-t from-violet-600 to-purple-400 rounded-t transition-all hover:from-violet-500 hover:to-purple-300"
                              style={{
                                height: `${barHeight}px`,
                                minHeight: count > 0 ? "4px" : "0",
                              }}
                              title={`${type}: ${count}`}
                            />
                            <span
                              className="text-xs text-slate-400 mt-2 text-center leading-tight truncate w-full px-1"
                              title={type}
                            >
                              {type.length > 10
                                ? type.substring(0, 8) + "..."
                                : type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Bug Severity Bar Chart */}
            {Object.keys(stats.workItems.bugsBySeverity || {}).length > 0 && (
              <div className="mt-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Bugs by Severity
                </h3>
                {(() => {
                  const severityOrder = [
                    "1 - Critical",
                    "2 - High",
                    "3 - Medium",
                    "4 - Low",
                  ];
                  const severityColors: Record<string, string> = {
                    "1 - Critical": "from-red-600 to-red-400",
                    "2 - High": "from-orange-600 to-orange-400",
                    "3 - Medium": "from-yellow-600 to-yellow-400",
                    "4 - Low": "from-blue-600 to-blue-400",
                  };
                  const severityEntries = Object.entries(
                    stats.workItems.bugsBySeverity
                  ).sort(
                    (a, b) =>
                      severityOrder.indexOf(a[0]) - severityOrder.indexOf(b[0])
                  );
                  const maxCount = Math.max(
                    ...severityEntries.map(([, c]) => c),
                    1
                  );
                  const maxBarHeight = 100;

                  return (
                    <div
                      className="flex items-end gap-4"
                      style={{
                        height: `${maxBarHeight + 60}px`,
                        paddingTop: "24px",
                      }}
                    >
                      {severityEntries.map(([severity, count]) => {
                        const barHeight =
                          maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
                        const colorClass =
                          severityColors[severity] ||
                          "from-gray-600 to-gray-400";
                        const shortLabel = severity.includes(" - ")
                          ? severity.split(" - ")[1]
                          : severity;
                        return (
                          <div
                            key={severity}
                            className="flex-1 flex flex-col items-center relative"
                          >
                            {count > 0 && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 text-slate-300 text-xs font-medium"
                                style={{ bottom: `${barHeight + 40}px` }}
                              >
                                {count}
                              </div>
                            )}
                            <div
                              className={`w-full bg-gradient-to-t ${colorClass} rounded-t transition-all hover:opacity-80`}
                              style={{
                                height: `${barHeight}px`,
                                minHeight: count > 0 ? "4px" : "0",
                              }}
                              title={`${severity}: ${count}`}
                            />
                            <span className="text-xs text-slate-400 mt-2 text-center">
                              {shortLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Top Tags - Separate Card */}
            {stats.workItems.topTags && stats.workItems.topTags.length > 0 && (
              <div className="mt-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  🏷️ Top Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.workItems.topTags
                    .slice(0, 12)
                    .map(({ tag, count }) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-colors"
                      >
                        {tag}{" "}
                        <span className="text-indigo-400/70">({count})</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Work Items by Month Chart */}
            {Object.keys(stats.workItems.byMonth || {}).length > 0 && (
              <div className="mt-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  📅 Work Items by Month
                </h3>
                {(() => {
                  const byMonth = stats.workItems.byMonth || {};
                  const months = [
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
                  const values = months.map((m) => byMonth[m] || 0);
                  const maxCount = Math.max(...values, 1);
                  const maxBarHeight = 120;

                  return (
                    <div
                      className="flex items-end gap-2"
                      style={{
                        height: `${maxBarHeight + 40}px`,
                        paddingTop: "24px",
                      }}
                    >
                      {months.map((month) => {
                        const count = byMonth[month] || 0;
                        const barHeight =
                          maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
                        return (
                          <div
                            key={month}
                            className="flex-1 flex flex-col items-center relative"
                          >
                            {count > 0 && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 text-slate-300 text-xs font-medium"
                                style={{ bottom: `${barHeight + 20}px` }}
                              >
                                {count}
                              </div>
                            )}
                            <div
                              className="w-full bg-gradient-to-t from-violet-600 to-purple-400 rounded-t transition-all hover:from-violet-500 hover:to-purple-300"
                              style={{
                                height: `${barHeight}px`,
                                minHeight: count > 0 ? "4px" : "0",
                              }}
                              title={`${month}: ${count} work items`}
                            />
                            <span className="text-xs text-slate-500 mt-1 hidden sm:block">
                              {month}
                            </span>
                            <span className="text-xs text-slate-500 mt-1 sm:hidden">
                              {month.charAt(0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
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
      </div>
    </div>
  );
}
