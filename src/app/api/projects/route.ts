import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/azure-devops/client";
import { fetchProjects } from "@/lib/azure-devops/projects";

export async function GET(request: NextRequest) {
  const requestId = Date.now();
  console.log(`\n[${requestId}] 🏢 Projects API Request started`);

  try {
    // Get PAT from Authorization header
    const authHeader = request.headers.get("authorization");
    const pat = authHeader?.replace("Bearer ", "");

    // Get organization from query params
    const searchParams = request.nextUrl.searchParams;
    const organization = searchParams.get("organization");

    console.log(`[${requestId}] 🔑 PAT present: ${!!pat}`);
    console.log(`[${requestId}] 📋 Organization: ${organization}`);

    // Validate required parameters
    if (!pat) {
      console.error(`[${requestId}] ❌ Missing PAT`);
      return NextResponse.json(
        { error: "Authorization header with PAT is required" },
        { status: 401 }
      );
    }

    if (!organization) {
      console.error(`[${requestId}] ❌ Missing organization`);
      return NextResponse.json(
        { error: "Organization query parameter is required" },
        { status: 400 }
      );
    }

    // Create client and fetch projects
    const client = createClient({ organization, pat });
    const projects = await fetchProjects(client);

    console.log(`[${requestId}] ✅ Returning ${projects.length} projects`);

    return NextResponse.json({
      count: projects.length,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        state: p.state,
      })),
    });
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Projects API error:`, {
      message: error.message,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: error.message || "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}
