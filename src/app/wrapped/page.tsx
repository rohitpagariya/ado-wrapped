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
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="text-center text-muted-foreground mt-8">
            <p>Fetching your Azure DevOps data...</p>
            <p className="text-sm mt-2">This may take a minute</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <h1 className="text-3xl font-bold">Oops! Something went wrong</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/")}>Back to Home</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              Your {stats.meta.year} Wrapped
            </h1>
            <p className="text-muted-foreground mt-2">
              {stats.meta.organization} / {stats.meta.project} /{" "}
              {stats.meta.repository}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportToJSON(stats);
                toast({
                  title: "Exported!",
                  description: "Downloaded as JSON",
                });
              }}
            >
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportToMarkdown(stats);
                toast({
                  title: "Exported!",
                  description: "Downloaded as Markdown",
                });
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Markdown
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back
            </Button>
          </div>
        </div>

        {/* Stats Display - Will be enhanced with StoryViewer */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Commits */}
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2">{stats.commits.total}</h3>
            <p className="text-muted-foreground">Total Commits</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2 text-green-500">
              +{stats.commits.additions.toLocaleString()}
            </h3>
            <p className="text-muted-foreground">Lines Added</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2 text-red-500">
              -{stats.commits.deletions.toLocaleString()}
            </h3>
            <p className="text-muted-foreground">Lines Deleted</p>
          </div>

          {/* Pull Requests */}
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2">
              {stats.pullRequests.created}
            </h3>
            <p className="text-muted-foreground">PRs Created</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2">
              {stats.pullRequests.merged}
            </h3>
            <p className="text-muted-foreground">PRs Merged</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2">
              {stats.pullRequests.reviewed}
            </h3>
            <p className="text-muted-foreground">PRs Reviewed</p>
          </div>

          {/* Insights */}
          {stats.insights && (
            <>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-2xl font-bold mb-2">
                  {stats.insights.personality}
                </h3>
                <p className="text-muted-foreground">Your Code Personality</p>
              </div>

              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-2xl font-bold mb-2">
                  {stats.insights.busiestMonth}
                </h3>
                <p className="text-muted-foreground">Busiest Month</p>
              </div>

              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-2xl font-bold mb-2">
                  {stats.insights.favoriteCommitHour}:00
                </h3>
                <p className="text-muted-foreground">Favorite Coding Hour</p>
              </div>
            </>
          )}
        </div>

        {/* Streak Info */}
        {stats.commits.longestStreak > 0 && (
          <div className="mt-8 p-6 rounded-lg border bg-card text-center">
            <p className="text-5xl font-bold mb-2">🔥</p>
            <h3 className="text-3xl font-bold">
              {stats.commits.longestStreak} Days
            </h3>
            <p className="text-muted-foreground mt-2">Longest Commit Streak</p>
          </div>
        )}
      </div>
    </div>
  );
}
