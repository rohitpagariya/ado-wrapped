import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/azure-devops/client";
import { fetchRepositoriesForProjects } from "@/lib/azure-devops/repositories";

export async function GET(request: NextRequest) {
  const requestId = Date.now();
  console.log(`\n[${requestId}] 📦 Repositories API Request started`);

  try {
    // Get PAT from Authorization header
    const authHeader = request.headers.get("authorization");
    const pat = authHeader?.replace("Bearer ", "");

    // Get parameters from query params
    const searchParams = request.nextUrl.searchParams;
    const organization = searchParams.get("organization");
    const projectsParam = searchParams.get("projects");

    // Parse projects from comma-separated string
    const projects = projectsParam
      ? projectsParam
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    console.log(`[${requestId}] 🔑 PAT present: ${!!pat}`);
    console.log(`[${requestId}] 📋 Organization: ${organization}`);
    console.log(`[${requestId}] 📋 Projects: ${projects.join(", ")}`);

    // Validate required parameters
    if (!pat) {
      console.error(`[${requestId}] ❌ Missing PAT`);
      return NextResponse.json(
        {
          error: "Authorization header with PAT is required",
          code: "MISSING_PAT",
          required: ["Authorization header (Bearer token)"],
        },
        { status: 401 }
      );
    }

    if (!organization) {
      console.error(`[${requestId}] ❌ Missing organization`);
      return NextResponse.json(
        {
          error: "Organization query parameter is required",
          code: "MISSING_ORGANIZATION",
          required: ["organization"],
        },
        { status: 400 }
      );
    }

    if (projects.length === 0) {
      console.error(`[${requestId}] ❌ Missing projects`);
      return NextResponse.json(
        {
          error: "Projects query parameter is required",
          code: "MISSING_PROJECTS",
          required: ["projects (comma-separated)"],
        },
        { status: 400 }
      );
    }

    // Create client and fetch repositories from all projects
    const client = createClient({ organization, pat });
    const repositories = await fetchRepositoriesForProjects(client, projects);

    console.log(
      `[${requestId}] ✅ Returning ${repositories.length} repositories from ${projects.length} project(s)`
    );

    return NextResponse.json({
      count: repositories.length,
      repositories: repositories.map((r) => ({
        id: r.id,
        name: r.name,
        project: r.project,
        defaultBranch: r.defaultBranch,
        webUrl: r.webUrl,
      })),
    });
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Repositories API error:`, {
      message: error.message,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: error.message || "Failed to fetch repositories",
        code: "REPOSITORIES_FETCH_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
