import { NextRequest, NextResponse } from "next/server";
import { fetchCommits } from "@/lib/azure-devops/commits";
import { fetchPullRequests } from "@/lib/azure-devops/pullRequests";
import { aggregateStats } from "@/lib/azure-devops/aggregator";

export async function GET(request: NextRequest) {
  const requestId = Date.now();
  console.log(`\n[${requestId}] 🚀 API Request started`);
  
  try {
    // Get PAT from Authorization header
    const authHeader = request.headers.get("authorization");
    const pat = authHeader?.replace("Bearer ", "");
    console.log(`[${requestId}] 🔑 PAT present: ${!!pat}`);

    // Get parameters from URL search params
    const searchParams = request.nextUrl.searchParams;
    const organization = searchParams.get("organization");
    const project = searchParams.get("project");
    const repository = searchParams.get("repository");
    const year = searchParams.get("year");
    const userEmail = searchParams.get("userEmail");
    
    console.log(`[${requestId}] 📋 Parameters:`, {
      organization,
      project,
      repository,
      year,
      userEmail: userEmail || '(none)'
    });

    // Validate required parameters
    if (!pat || !organization || !project || !repository || !year) {
      console.error(`[${requestId}] ❌ Missing required parameters`);
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: [
            "pat (Authorization header)",
            "organization",
            "project",
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
      `[${requestId}] 📊 Fetching stats for ${organization}/${project}/${repository} (${year})`
    );
    console.log(`[${requestId}] 📅 Date range: ${startDate} to ${endDate}`);

    // Note: Caching is enabled by default (enableCache: true)
    // This is beneficial even in production as identical requests
    // (same org/project/repo/year) return cached data instantly.
    // To disable: add enableCache: false to fetch options below

    console.log(`[${requestId}] 🔄 Starting parallel data fetch...`);
    const fetchStartTime = Date.now();

    // Fetch all data in parallel
    const [commits, pullRequests] = await Promise.all([
      fetchCommits({
        organization,
        project,
        repository,
        pat,
        fromDate: startDate,
        toDate: endDate,
        userEmail: userEmail || undefined,
        includeChangeCounts: true,
        // enableCache: true, // default
      }),
      fetchPullRequests({
        organization,
        project,
        repository,
        pat,
        fromDate: startDate,
        toDate: endDate,
        userEmail: userEmail || undefined,
        includeReviewed: true,
        // enableCache: true, // default
      }),
    ]);

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`[${requestId}] ✅ Data fetched in ${fetchDuration}ms`);
    console.log(`[${requestId}] 📈 Commits: ${commits.length}, PRs: ${pullRequests.length}`);

    // Aggregate into stats
    console.log(`[${requestId}] 🔢 Aggregating statistics...`);
    const aggregateStartTime = Date.now();
    
    const stats = aggregateStats({
      commits,
      pullRequests,
      config: {
        organization,
        project,
        repository,
        year: parseInt(year),
        userEmail: userEmail || undefined,
      },
    });

    const aggregateDuration = Date.now() - aggregateStartTime;
    console.log(`[${requestId}] ✅ Stats aggregated in ${aggregateDuration}ms`);
    console.log(`[${requestId}] 🎉 Request completed successfully in ${Date.now() - requestId}ms`);

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
