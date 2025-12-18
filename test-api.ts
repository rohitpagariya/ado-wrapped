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
 */

import fs from "fs";
import path from "path";
import {
  fetchCommits,
  fetchPullRequests,
  aggregateStats,
} from "./src/lib/azure-devops";
import { loadAndValidateConfig, printConfig } from "./src/lib/config";
import type { WrappedConfig } from "./src/types";

async function testAPIIntegration() {
  console.log("🧪 Testing Azure DevOps API Integration\n");

  // Load and validate configuration from .env
  const appConfig = loadAndValidateConfig();
  printConfig(appConfig);

  // Convert to WrappedConfig format
  const config: WrappedConfig = {
    organization: appConfig.organization,
    project: appConfig.project,
    repository: appConfig.repository,
    pat: appConfig.pat,
    year: appConfig.year,
    userEmail: appConfig.userEmail,
  };

  try {
    // Define date range
    const fromDate = `${config.year}-01-01`;
    const toDate = `${config.year}-12-31`;

    console.log("📥 Fetching data from Azure DevOps...\n");

    // Fetch commits
    console.log("1️⃣  Fetching commits...");
    const commits = await fetchCommits({
      organization: config.organization,
      project: config.project,
      repository: config.repository,
      pat: config.pat,
      fromDate,
      toDate,
      userEmail: config.userEmail,
      includeChangeCounts: true,
    });

    // Fetch pull requests
    console.log("2️⃣  Fetching pull requests...");
    const pullRequests = await fetchPullRequests({
      organization: config.organization,
      project: config.project,
      repository: config.repository,
      pat: config.pat,
      fromDate,
      toDate,
      userEmail: config.userEmail,
      includeReviewed: true,
    });

    // Aggregate statistics
    console.log("3️⃣  Aggregating statistics...\n");
    const stats = aggregateStats({
      commits,
      pullRequests,
      config: {
        organization: config.organization,
        project: config.project,
        repository: config.repository,
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
