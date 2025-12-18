import { NextRequest, NextResponse } from "next/server";
import { fetchCommits } from "@/lib/azure-devops/commits";
import { fetchPullRequests } from "@/lib/azure-devops/pullRequests";
import { aggregateStats } from "@/lib/azure-devops/aggregator";

export async function GET(request: NextRequest) {
  try {
    // Get PAT from Authorization header
    const authHeader = request.headers.get("authorization");
    const pat = authHeader?.replace("Bearer ", "");

    // Get parameters from URL search params
    const searchParams = request.nextUrl.searchParams;
    const organization = searchParams.get("organization");
    const project = searchParams.get("project");
    const repository = searchParams.get("repository");
    const year = searchParams.get("year");
    const userEmail = searchParams.get("userEmail");

    // Validate required parameters
    if (!pat || !organization || !project || !repository || !year) {
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
      `Fetching stats for ${organization}/${project}/${repository} (${year})`
    );

    // Note: Caching is enabled by default (enableCache: true)
    // This is beneficial even in production as identical requests
    // (same org/project/repo/year) return cached data instantly.
    // To disable: add enableCache: false to fetch options below

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

    // Aggregate into stats
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

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Stats API error:", error);
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
