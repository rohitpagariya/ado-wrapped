/**
 * Test script for Azure DevOps API integration
 *
 * This script tests the complete flow:
 * 1. Load configuration from .env file
 * 2. Fetch commits and pull requests
 * 3. Aggregate statistics
 * 4. Display results
 *
 * Usage: npm run test:api
 *
 * Note: API responses are automatically cached to .ado-cache/
 * - First run: Makes real API calls and caches responses
 * - Subsequent runs: Uses cached data (instant)
 * - Clear cache: npm run cache:clear
 */

import fs from "fs";
import path from "path";
import {
  fetchCommits,
  fetchPullRequests,
  fetchWorkItems,
  aggregateStats,
  createClient,
} from "./src/lib/azure-devops";
import { loadAndValidateConfig, printConfig } from "./src/lib/config";
import type { WrappedConfig } from "./src/types";

async function testAPIIntegration() {
  console.log("🧪 Testing Azure DevOps API Integration\n");

  // Load and validate configuration from .env
  const appConfig = loadAndValidateConfig();
  printConfig(appConfig);

  // Use first project for single-project API calls
  const project = appConfig.projects[0];

  // Build repositories array from legacy single repository config
  const repositories = appConfig.projects.map((p) => ({
    project: p,
    repository: appConfig.repository,
  }));

  // Convert to WrappedConfig format
  const config: WrappedConfig = {
    organization: appConfig.organization,
    projects: appConfig.projects,
    repositories: repositories,
    pat: appConfig.pat,
    year: appConfig.year,
    userEmail: appConfig.userEmail,
  };

  try {
    // Define date range
    const fromDate = `${config.year}-01-01`;
    const toDate = `${config.year}-12-31`;

    console.log("📥 Fetching data from Azure DevOps...\n");

    // Use first project-repo combo for single-repo test
    const firstRepo = config.repositories[0];

    // Fetch commits (only from master branch)
    console.log("1️⃣  Fetching commits from master branch...");
    const commits = await fetchCommits({
      organization: config.organization,
      project: firstRepo.project,
      repository: firstRepo.repository,
      pat: config.pat,
      fromDate,
      toDate,
      userEmail: config.userEmail,
      branch: "master",
    });

    // Fetch pull requests (only completed PRs to master)
    console.log("2️⃣  Fetching pull requests merged to master...");
    const pullRequests = await fetchPullRequests({
      organization: config.organization,
      project: firstRepo.project,
      repository: firstRepo.repository,
      pat: config.pat,
      fromDate,
      toDate,
      userEmail: config.userEmail,
      includeReviewed: true,
    });

    // Fetch work items (resolved/closed assigned to user)
    console.log("3️⃣  Fetching work items...");
    const client = createClient({
      organization: config.organization,
      pat: config.pat,
    });
    const workItems = await fetchWorkItems(client, {
      project: project,
      year: config.year,
      userEmail: config.userEmail,
    });

    // Aggregate statistics
    console.log("4️⃣  Aggregating statistics...\n");
    const stats = aggregateStats({
      commits,
      pullRequests,
      workItems,
      config: {
        organization: config.organization,
        projects: config.projects,
        repositories: config.repositories.map((r) => r.repository),
        year: config.year,
        userEmail: config.userEmail,
      },
    });

    // Display results
    console.log("✅ Success! Here are your stats:\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 COMMIT STATISTICS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Total Commits: ${stats.commits.total}`);
    console.log(`Lines Added: ${stats.commits.additions}`);
    console.log(`Lines Edited: ${stats.commits.edits}`);
    console.log(`Lines Deleted: ${stats.commits.deletions}`);
    console.log(`Longest Streak: ${stats.commits.longestStreak} days`);
    console.log(`First Commit: ${stats.commits.firstCommitDate}`);
    console.log(`Last Commit: ${stats.commits.lastCommitDate}`);

    console.log("\n📅 Commits by Month:");
    Object.entries(stats.commits.byMonth)
      .filter(([_, count]) => (count as number) > 0)
      .forEach(([month, count]) => {
        console.log(
          `   ${month}: ${"█".repeat(Math.min(count as number, 50))} ${count}`
        );
      });

    console.log("\n📅 Commits by Day of Week:");
    Object.entries(stats.commits.byDayOfWeek)
      .filter(([_, count]) => (count as number) > 0)
      .forEach(([day, count]) => {
        console.log(
          `   ${day.padEnd(10)}: ${"█".repeat(
            Math.min(count as number, 50)
          )} ${count}`
        );
      });

    console.log("\n⏰ Top Commit Hours:");
    Object.entries(stats.commits.byHour)
      .filter(([_, count]) => (count as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .forEach(([hour, count]) => {
        console.log(
          `   ${hour.toString().padStart(2, "0")}:00 - ${"█".repeat(
            Math.min(count as number, 50)
          )} ${count}`
        );
      });

    console.log("\n💬 Top Commit Keywords:");
    stats.commits.topCommitMessages.forEach((word: string, i: number) => {
      console.log(`   ${i + 1}. ${word}`);
    });

    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("🔀 PULL REQUEST STATISTICS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Created: ${stats.pullRequests.created}`);
    console.log(`Merged: ${stats.pullRequests.merged}`);
    console.log(`Abandoned: ${stats.pullRequests.abandoned}`);
    console.log(`Reviewed: ${stats.pullRequests.reviewed}`);
    console.log(
      `Avg Days to Merge: ${stats.pullRequests.avgDaysToMerge.toFixed(1)}`
    );

    if (stats.pullRequests.largestPR) {
      console.log(`\n🏆 Largest PR: #${stats.pullRequests.largestPR.id}`);
      console.log(`   Title: ${stats.pullRequests.largestPR.title}`);
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("🌟 INSIGHTS");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Personality: ${stats.insights.personality}`);
    console.log(`Busiest Month: ${stats.insights.busiestMonth}`);
    console.log(`Busiest Day: ${stats.insights.busiestDay}`);
    console.log(
      `Favorite Commit Hour: ${stats.insights.favoriteCommitHour}:00`
    );

    console.log("\n📁 Top File Types:");
    stats.insights.topFileExtensions.forEach(
      ({ ext, count }: { ext: string; count: number }, i: number) => {
        console.log(`   ${i + 1}. .${ext} - ${count} changes`);
      }
    );

    console.log(
      "\n═══════════════════════════════════════════════════════════\n"
    );

    // Save results to file
    const outputPath = path.join(process.cwd(), `wrapped-${config.year}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
    console.log(`💾 Full results saved to: ${outputPath}\n`);

    console.log("✅ All tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);

    if (error instanceof Error) {
      console.error(`\nError details: ${error.message}\n`);

      if (error.message.includes("Authentication failed")) {
        console.error(
          "💡 Tip: Check that your PAT is valid and has the correct permissions."
        );
        console.error(
          "   Required scopes: Code (Read), Pull Request Threads (Read)\n"
        );
      } else if (error.message.includes("Resource not found")) {
        console.error(
          "💡 Tip: Verify your organization, project, and repository names in config.json\n"
        );
      }
    }

    process.exit(1);
  }
}

// Run the test
testAPIIntegration();
