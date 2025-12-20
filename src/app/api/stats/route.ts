import { NextRequest, NextResponse } from "next/server";
import { fetchCommits } from "@/lib/azure-devops/commits";
import { fetchPullRequests } from "@/lib/azure-devops/pullRequests";
import { fetchWorkItems } from "@/lib/azure-devops/workItems";
import { aggregateStats } from "@/lib/azure-devops/aggregator";
import { loadConfig, validateConfig } from "@/lib/config";
import { createClient } from "@/lib/azure-devops/client";
import { GitCommit, GitPullRequest, WorkItem } from "@/lib/azure-devops/types";
import type {
  ProjectRepository,
  WrappedStats,
  ClientWrappedStats,
} from "@/types";

/**
 * Filter server-side stats to only include fields used by the client UI.
 * This reduces the JSON payload sent to the browser.
 */
function filterStatsForClient(stats: WrappedStats): ClientWrappedStats {
  return {
    meta: stats.meta,
    commits: {
      total: stats.commits.total,
      additions: stats.commits.additions,
      deletions: stats.commits.deletions,
      byDayOfWeek: stats.commits.byDayOfWeek,
      byHour: stats.commits.byHour,
      longestStreak: stats.commits.longestStreak,
      commitDates: stats.commits.commitDates,
    },
    pullRequests: {
      created: stats.pullRequests.created,
      merged: stats.pullRequests.merged,
      reviewed: stats.pullRequests.reviewed,
      avgDaysToMerge: stats.pullRequests.avgDaysToMerge,
      avgDaysToMergeFormatted: stats.pullRequests.avgDaysToMergeFormatted,
      largestPR: stats.pullRequests.largestPR,
      byMonth: stats.pullRequests.byMonth,
      byDayOfWeek: stats.pullRequests.byDayOfWeek,
      firstPRDate: stats.pullRequests.firstPRDate,
      lastPRDate: stats.pullRequests.lastPRDate,
      fastestMerge: stats.pullRequests.fastestMerge,
      slowestMerge: stats.pullRequests.slowestMerge,
    },
    workItems: stats.workItems,
    insights: stats.insights,
  };
}

// Type for project-repository combo from request
interface ProjectRepoCombo {
  project: string;
  repository: string;
}

export async function GET(request: NextRequest) {
  const requestId = Date.now();
  console.log(`\n[${requestId}] 🚀 API Request started`);

  try {
    // Get PAT from Authorization header
    const authHeader = request.headers.get("authorization");
    let pat = authHeader?.replace("Bearer ", "");

    // Get parameters from URL search params
    const searchParams = request.nextUrl.searchParams;
    let organization = searchParams.get("organization");
    let projectsParam = searchParams.get("projects");
    // 'repositories' as JSON array of {project, repository} objects
    let repositoriesParam = searchParams.get("repositories");
    let year = searchParams.get("year");
    let userEmail = searchParams.get("userEmail");

    // Parse projects array from comma-separated string
    let projects: string[] = [];
    if (projectsParam) {
      projects = projectsParam
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }

    // Parse repositories array from JSON
    let projectRepos: ProjectRepoCombo[] = [];
    if (repositoriesParam) {
      try {
        console.log(
          `[${requestId}] 📦 Raw repositories param: ${repositoriesParam.substring(
            0,
            200
          )}...`
        );
        projectRepos = JSON.parse(repositoriesParam);
        console.log(
          `[${requestId}] 📦 Parsed ${projectRepos.length} project-repo combinations:`,
          projectRepos
        );
      } catch (e) {
        console.error(
          `[${requestId}] ❌ Failed to parse repositories JSON:`,
          e
        );
        console.error(`[${requestId}] ❌ Raw value: ${repositoriesParam}`);
        return NextResponse.json(
          {
            error: "Invalid repositories format",
            details:
              "repositories must be a JSON array of {project, repository} objects",
          },
          { status: 400 }
        );
      }
    }

    // If no parameters provided, try to use server-side config from .env
    const useServerConfig =
      !organization &&
      projects.length === 0 &&
      projectRepos.length === 0 &&
      !year;
    if (useServerConfig) {
      console.log(`[${requestId}] 📁 Loading server-side config from .env`);
      const serverConfig = loadConfig();
      const validation = validateConfig(serverConfig);

      if (validation.valid) {
        pat = pat || serverConfig.pat;
        organization = serverConfig.organization;
        // Use repositories directly from config - each repo is only queried in its project
        projectRepos = serverConfig.repositories;
        year = serverConfig.year.toString();
        userEmail = userEmail || serverConfig.userEmail || null;
        console.log(`[${requestId}] ✅ Using server config`);
      } else {
        console.error(
          `[${requestId}] ❌ Invalid server config:`,
          validation.errors
        );
      }
    }

    // Derive unique projects from projectRepos if not explicitly provided
    if (projects.length === 0 && projectRepos.length > 0) {
      projects = Array.from(new Set(projectRepos.map((pr) => pr.project)));
    }

    // Derive unique repositories for logging
    const uniqueRepos = Array.from(
      new Set(projectRepos.map((pr) => pr.repository))
    );

    console.log(`[${requestId}] 🔑 PAT present: ${!!pat}`);
    console.log(`[${requestId}] 📋 Parameters:`, {
      organization,
      projects,
      repositories: uniqueRepos,
      projectRepoCombos: projectRepos.length,
      year,
      userEmail: userEmail || "(none)",
      source: useServerConfig ? "server-config" : "request-params",
    });

    // Validate required parameters
    if (!pat || !organization || projectRepos.length === 0 || !year) {
      console.error(`[${requestId}] ❌ Missing required parameters`);
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: [
            "pat (Authorization header or .env)",
            "organization",
            "repositories (JSON array of {project, repository})",
            "year",
          ],
        },
        { status: 400 }
      );
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    console.log(
      `[${requestId}] 📊 Fetching stats for ${organization} - ${projectRepos.length} project-repo combo(s) (${year})`
    );
    console.log(`[${requestId}] 📅 Date range: ${startDate} to ${endDate}`);

    // Note: Caching is DISABLED by default (set ADO_CACHE_ENABLED=true to enable)
    // This avoids disk storage issues in production/serverless environments.
    // For local development, enable caching in .env for faster iteration.

    console.log(
      `[${requestId}] 🔄 Starting parallel data fetch for ${projectRepos.length} project-repo combo(s)...`
    );
    const fetchStartTime = Date.now();

    // Create client for work items API
    const client = createClient({ organization, pat });

    // Fetch data from each project-repository combination
    // KEY OPTIMIZATION: Each repo is only fetched from its correct project
    // (no more trying every repo in every project)
    const seenCommitIds = new Set<string>();
    const seenPRIds = new Set<string>();
    const seenWorkItemIds = new Set<string>();
    const allCommits: GitCommit[] = [];
    const allPullRequests: GitPullRequest[] = [];
    const allWorkItems: WorkItem[] = [];
    const comboErrors: { project: string; repo: string; error: string }[] = [];

    // Track which projects we've already fetched work items from (work items are per-project, not per-repo)
    const projectsWithWorkItems = new Set<string>();

    // Helper to try fetching commits from master, then main, then dev if previous branches fail
    const fetchCommitsWithBranchFallback = async (
      org: string,
      proj: string,
      repo: string,
      patToken: string,
      from: string,
      to: string,
      email?: string
    ): Promise<GitCommit[]> => {
      const branchesToTry = ["master", "main", "dev"];

      for (let i = 0; i < branchesToTry.length; i++) {
        const branch = branchesToTry[i];
        try {
          const commits = await fetchCommits({
            organization: org,
            project: proj,
            repository: repo,
            pat: patToken,
            fromDate: from,
            toDate: to,
            userEmail: email,
            branch: branch,
          });
          if (commits.length > 0) {
            console.log(
              `✅ Found ${commits.length} commits on branch: ${branch}`
            );
            return commits;
          }
        } catch {
          // This branch doesn't exist or failed, try next
          console.log(
            `⚠️ Branch '${branch}' not found or empty, trying next...`
          );
        }
      }

      // All branches failed, return empty array
      console.log(`⚠️ No commits found on any branch (master, main, dev)`);
      return [];
    };

    // Process all project-repo combinations in parallel
    // Each combo only fetches from its specific project (not all projects)
    const comboResults = await Promise.all(
      projectRepos.map(async ({ project, repository }) => {
        console.log(
          `[${requestId}] 📂 Fetching data for ${project}/${repository}`
        );

        try {
          // Determine if we need to fetch work items for this project
          // (work items are per-project, so only fetch once per project)
          const shouldFetchWorkItems = !projectsWithWorkItems.has(project);
          if (shouldFetchWorkItems) {
            projectsWithWorkItems.add(project);
          }

          // Fetch commits and PRs for this specific project-repo combo
          // Work items only fetched once per project (they're not repo-specific)
          const fetchPromises: Promise<any>[] = [
            fetchCommitsWithBranchFallback(
              organization!,
              project,
              repository,
              pat!,
              startDate,
              endDate,
              userEmail || undefined
            ).catch((err) => {
              console.warn(
                `[${requestId}] ⚠️ ${project}/${repository}: Failed to fetch commits: ${err.message}`
              );
              return [] as GitCommit[];
            }),
            fetchPullRequests({
              organization: organization!,
              project,
              repository,
              pat: pat!,
              fromDate: startDate,
              toDate: endDate,
              userEmail: userEmail || undefined,
              includeReviewed: true,
            }).catch((err) => {
              console.warn(
                `[${requestId}] ⚠️ ${project}/${repository}: Failed to fetch PRs: ${err.message}`
              );
              return [] as GitPullRequest[];
            }),
          ];

          // Only add work items fetch if this is the first repo from this project
          if (shouldFetchWorkItems) {
            fetchPromises.push(
              fetchWorkItems(client, {
                project,
                year: parseInt(year!),
                userEmail: userEmail || undefined,
              }).catch((err) => {
                console.warn(
                  `[${requestId}] ⚠️ ${project}: Failed to fetch work items: ${err.message}`
                );
                return [] as WorkItem[];
              })
            );
          }

          const results = await Promise.all(fetchPromises);
          const commitsResult = results[0] as GitCommit[];
          const pullRequestsResult = results[1] as GitPullRequest[];
          const workItemsResult = shouldFetchWorkItems
            ? (results[2] as WorkItem[])
            : [];

          console.log(
            `[${requestId}] 📈 ${project}/${repository}: Commits: ${
              commitsResult.length
            }, PRs: ${pullRequestsResult.length}${
              shouldFetchWorkItems
                ? `, Work Items: ${workItemsResult.length}`
                : ""
            }`
          );

          return {
            project,
            repository,
            commits: commitsResult,
            pullRequests: pullRequestsResult,
            workItems: workItemsResult,
            success: true,
          };
        } catch (err: any) {
          console.warn(
            `[${requestId}] ⚠️ ${project}/${repository}: Fetch failed: ${err.message}`
          );
          comboErrors.push({ project, repo: repository, error: err.message });
          return {
            project,
            repository,
            commits: [] as GitCommit[],
            pullRequests: [] as GitPullRequest[],
            workItems: [] as WorkItem[],
            success: false,
          };
        }
      })
    );

    // Merge results with deduplication
    for (const result of comboResults) {
      for (const commit of result.commits) {
        if (!seenCommitIds.has(commit.commitId)) {
          seenCommitIds.add(commit.commitId);
          allCommits.push(commit);
        }
      }
      for (const pr of result.pullRequests) {
        const prId = pr.pullRequestId.toString();
        if (!seenPRIds.has(prId)) {
          seenPRIds.add(prId);
          allPullRequests.push(pr);
        }
      }
      for (const wi of result.workItems) {
        const wiId = wi.id.toString();
        if (!seenWorkItemIds.has(wiId)) {
          seenWorkItemIds.add(wiId);
          allWorkItems.push(wi);
        }
      }
    }

    // Check if we got any data at all
    const successfulCombos = comboResults.filter((r) => r.success).length;
    const hasAnyData =
      allCommits.length > 0 ||
      allPullRequests.length > 0 ||
      allWorkItems.length > 0;

    // Log warnings about failed combos but continue if we have data
    if (comboErrors.length > 0) {
      console.warn(
        `[${requestId}] ⚠️ ${comboErrors.length} project-repo combo(s) had errors:`,
        comboErrors
      );
    }

    // Only fail if ALL combos failed AND we have no data
    if (successfulCombos === 0 && !hasAnyData) {
      console.error(
        `[${requestId}] ❌ All project-repo combos failed to return data`
      );
      return NextResponse.json(
        {
          error: "No data found in any of the selected repositories",
          details:
            comboErrors.length > 0
              ? `Errors: ${comboErrors
                  .map((e) => `${e.project}/${e.repo}: ${e.error}`)
                  .join("; ")}`
              : "No commits, PRs, or work items found for the specified criteria",
        },
        { status: 404 }
      );
    }

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`[${requestId}] ✅ Data fetched in ${fetchDuration}ms`);
    console.log(
      `[${requestId}] 📈 Total: Commits: ${allCommits.length}, PRs: ${allPullRequests.length}, Work Items: ${allWorkItems.length}`
    );

    // Aggregate into stats
    console.log(`[${requestId}] 🔢 Aggregating statistics...`);
    const aggregateStartTime = Date.now();

    const stats = aggregateStats({
      commits: allCommits,
      pullRequests: allPullRequests,
      workItems: allWorkItems,
      config: {
        organization,
        projects,
        repositories: uniqueRepos,
        year: parseInt(year),
        userEmail: userEmail || undefined,
      },
    });

    const aggregateDuration = Date.now() - aggregateStartTime;
    console.log(`[${requestId}] ✅ Stats aggregated in ${aggregateDuration}ms`);

    // Filter to only include fields used by the client UI
    const clientStats = filterStatsForClient(stats);
    console.log(
      `[${requestId}] 🎉 Request completed successfully in ${
        Date.now() - requestId
      }ms`
    );

    return NextResponse.json(clientStats);
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Stats API error:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      response: error.response?.status,
      stack: error.stack,
    });

    if (error.response) {
      console.error(`[${requestId}] 🌐 HTTP Error Response:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
