import { NextRequest, NextResponse } from "next/server";
import { fetchCommits } from "@/lib/azure-devops/commits";
import { fetchPullRequests } from "@/lib/azure-devops/pullRequests";
import { fetchWorkItems } from "@/lib/azure-devops/workItems";
import { aggregateStats } from "@/lib/azure-devops/aggregator";
import { loadConfig, validateConfig } from "@/lib/config";
import { createClient } from "@/lib/azure-devops/client";
import { GitCommit, GitPullRequest, WorkItem } from "@/lib/azure-devops/types";

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
    // Support both 'projects' (comma-separated) and legacy 'project' param
    let projectsParam = searchParams.get("projects");
    let legacyProject = searchParams.get("project");
    let repository = searchParams.get("repository");
    let year = searchParams.get("year");
    let userEmail = searchParams.get("userEmail");

    // Parse projects array from comma-separated string or legacy single project
    let projects: string[] = [];
    if (projectsParam) {
      projects = projectsParam
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    } else if (legacyProject) {
      projects = [legacyProject];
    }

    // If no parameters provided, try to use server-side config from .env
    const useServerConfig =
      !organization && projects.length === 0 && !repository && !year;
    if (useServerConfig) {
      console.log(`[${requestId}] 📁 Loading server-side config from .env`);
      const serverConfig = loadConfig();
      const validation = validateConfig(serverConfig);

      if (validation.valid) {
        pat = pat || serverConfig.pat;
        organization = serverConfig.organization;
        projects = serverConfig.projects;
        repository = serverConfig.repository;
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

    console.log(`[${requestId}] 🔑 PAT present: ${!!pat}`);
    console.log(`[${requestId}] 📋 Parameters:`, {
      organization,
      projects,
      repository,
      year,
      userEmail: userEmail || "(none)",
      source: useServerConfig ? "server-config" : "request-params",
    });

    // Validate required parameters
    if (
      !pat ||
      !organization ||
      projects.length === 0 ||
      !repository ||
      !year
    ) {
      console.error(`[${requestId}] ❌ Missing required parameters`);
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: [
            "pat (Authorization header or .env)",
            "organization",
            "projects (comma-separated)",
            "repository",
            "year",
          ],
        },
        { status: 400 }
      );
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    console.log(
      `[${requestId}] 📊 Fetching stats for ${organization}/${projects.join(
        ", "
      )}/${repository} (${year})`
    );
    console.log(`[${requestId}] 📅 Date range: ${startDate} to ${endDate}`);

    // Note: Caching is DISABLED by default (set ADO_CACHE_ENABLED=true to enable)
    // This avoids disk storage issues in production/serverless environments.
    // For local development, enable caching in .env for faster iteration.

    console.log(
      `[${requestId}] 🔄 Starting parallel data fetch across ${projects.length} project(s)...`
    );
    const fetchStartTime = Date.now();

    // Create client for work items API
    const client = createClient({ organization, pat });

    // Fetch data from all projects in parallel
    // Each project fetches commits, PRs, and work items concurrently
    // Errors for individual projects are silently ignored - we only fail if ALL projects fail
    // Use Sets for efficient deduplication during merge (items may appear in multiple projects)
    const seenCommitIds = new Set<string>();
    const seenPRIds = new Set<string>();
    const seenWorkItemIds = new Set<string>();
    const allCommits: GitCommit[] = [];
    const allPullRequests: GitPullRequest[] = [];
    const allWorkItems: WorkItem[] = [];
    const projectErrors: { project: string; error: string }[] = [];

    // Helper to try fetching commits from master, then main if master fails
    const fetchCommitsWithBranchFallback = async (
      org: string,
      proj: string,
      repo: string,
      patToken: string,
      from: string,
      to: string,
      email?: string
    ): Promise<GitCommit[]> => {
      // Try master first
      try {
        const commits = await fetchCommits({
          organization: org,
          project: proj,
          repository: repo,
          pat: patToken,
          fromDate: from,
          toDate: to,
          userEmail: email,
          branch: "master",
        });
        if (commits.length > 0) {
          return commits;
        }
      } catch {
        // master branch doesn't exist, try main
      }
      // Try main branch
      return fetchCommits({
        organization: org,
        project: proj,
        repository: repo,
        pat: patToken,
        fromDate: from,
        toDate: to,
        userEmail: email,
        branch: "main",
      });
    };

    // Process all projects in parallel with error handling per project
    const projectResults = await Promise.all(
      projects.map(async (project) => {
        console.log(`[${requestId}] 📂 Fetching data for project: ${project}`);

        try {
          // Fetch commits, PRs, and work items in parallel for this project
          // Each fetch is wrapped in its own try-catch to handle partial failures
          const [commitsResult, pullRequestsResult, workItemsResult] =
            await Promise.all([
              fetchCommitsWithBranchFallback(
                organization!,
                project,
                repository!,
                pat!,
                startDate,
                endDate,
                userEmail || undefined
              ).catch((err) => {
                console.warn(
                  `[${requestId}] ⚠️ ${project}: Failed to fetch commits: ${err.message}`
                );
                return [] as GitCommit[];
              }),
              fetchPullRequests({
                organization: organization!,
                project,
                repository: repository!,
                pat: pat!,
                fromDate: startDate,
                toDate: endDate,
                userEmail: userEmail || undefined,
                includeReviewed: true,
              }).catch((err) => {
                console.warn(
                  `[${requestId}] ⚠️ ${project}: Failed to fetch PRs: ${err.message}`
                );
                return [] as GitPullRequest[];
              }),
              fetchWorkItems(client, {
                project,
                year: parseInt(year!),
                userEmail: userEmail || undefined,
              }).catch((err) => {
                console.warn(
                  `[${requestId}] ⚠️ ${project}: Failed to fetch work items: ${err.message}`
                );
                return [] as WorkItem[];
              }),
            ]);

          console.log(
            `[${requestId}] 📈 ${project}: Commits: ${commitsResult.length}, PRs: ${pullRequestsResult.length}, Work Items: ${workItemsResult.length}`
          );

          return {
            project,
            commits: commitsResult,
            pullRequests: pullRequestsResult,
            workItems: workItemsResult,
            success: true,
          };
        } catch (err: any) {
          // Catch any unexpected errors for this project
          console.warn(
            `[${requestId}] ⚠️ ${project}: Project fetch failed: ${err.message}`
          );
          projectErrors.push({ project, error: err.message });
          return {
            project,
            commits: [] as GitCommit[],
            pullRequests: [] as GitPullRequest[],
            workItems: [] as WorkItem[],
            success: false,
          };
        }
      })
    );

    // Merge results from all projects with deduplication during merge
    // This is more memory-efficient than collecting all then deduplicating
    for (const result of projectResults) {
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
    const successfulProjects = projectResults.filter((r) => r.success).length;
    const hasAnyData =
      allCommits.length > 0 ||
      allPullRequests.length > 0 ||
      allWorkItems.length > 0;

    // Log warnings about failed projects but continue if we have data
    if (projectErrors.length > 0) {
      console.warn(
        `[${requestId}] ⚠️ ${projectErrors.length} project(s) had errors:`,
        projectErrors
      );
    }

    // Only fail if ALL projects failed AND we have no data
    if (successfulProjects === 0 && !hasAnyData) {
      console.error(`[${requestId}] ❌ All projects failed to return data`);
      return NextResponse.json(
        {
          error: "No data found in any of the selected projects",
          details:
            projectErrors.length > 0
              ? `Errors: ${projectErrors
                  .map((e) => `${e.project}: ${e.error}`)
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
        repository,
        year: parseInt(year),
        userEmail: userEmail || undefined,
      },
    });

    const aggregateDuration = Date.now() - aggregateStartTime;
    console.log(`[${requestId}] ✅ Stats aggregated in ${aggregateDuration}ms`);
    console.log(
      `[${requestId}] 🎉 Request completed successfully in ${
        Date.now() - requestId
      }ms`
    );

    return NextResponse.json(stats);
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
