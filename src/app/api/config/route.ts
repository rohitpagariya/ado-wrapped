import { NextResponse } from "next/server";
import { loadConfig, validateConfig } from "@/lib/config";

/**
 * GET /api/config
 * Returns server-side configuration status and values (without sensitive data)
 */
export async function GET() {
  try {
    const config = loadConfig();
    const validation = validateConfig(config);

    // Don't send PAT to client for security
    return NextResponse.json({
      hasConfig: validation.valid,
      config: validation.valid
        ? {
            organization: config.organization,
            projects: config.projects,
            repository: config.repository,
            year: config.year,
            userEmail: config.userEmail,
          }
        : null,
      errors: validation.errors,
    });
  } catch (error: any) {
    console.error("Config API error:", error);
    return NextResponse.json(
      {
        hasConfig: false,
        config: null,
        errors: [error.message || "Failed to load configuration"],
      },
      { status: 500 }
    );
  }
}
