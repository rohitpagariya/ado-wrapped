/**
 * Example: Cache Demonstration
 *
 * This script demonstrates the caching behavior by making the same
 * API request twice and showing the performance difference.
 *
 * Usage: tsx cache-example.ts
 */

import {
  AzureDevOpsClient,
  getCacheStats,
  clearCache,
} from "./src/lib/azure-devops";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function demonstrateCaching() {
  console.log("\n🧪 Cache Demonstration\n");

  // Validate required env vars
  const org = process.env.ADO_ORGANIZATION;
  const reposEnv = process.env.ADO_REPOSITORIES;
  const pat = process.env.ADO_PAT;

  // Parse first project/repo pair from ADO_REPOSITORIES
  let project: string | undefined;
  let repo: string | undefined;
  if (reposEnv) {
    const firstPair = reposEnv.split(",")[0]?.trim();
    if (firstPair) {
      const [p, ...repoParts] = firstPair.split("/");
      project = p?.trim();
      repo = repoParts.join("/")?.trim();
    }
  }

  if (!org || !project || !repo || !pat) {
    console.error("❌ Missing required environment variables:");
    console.error(
      "   ADO_ORGANIZATION, ADO_REPOSITORIES (project/repo format), ADO_PAT"
    );
    console.error("\nPlease create a .env file with these values.");
    process.exit(1);
  }

  console.log("📊 Initial Cache Stats:");
  let stats = getCacheStats();
  console.log(
    `   Entries: ${stats.entries}, Size: ${(stats.totalSize / 1024).toFixed(
      2
    )} KB\n`
  );

  // Clear cache for clean test
  console.log("🧹 Clearing cache for clean test...\n");
  clearCache();

  // Create client with caching enabled
  const client = new AzureDevOpsClient({
    organization: org,
    pat: pat,
    enableCache: true,
  });

  const url = `/${project}/_apis/git/repositories/${repo}`;

  try {
    // First request - will fetch from API
    console.log("1️⃣  First Request (no cache):");
    const start1 = Date.now();
    const repo1 = await client.get<any>(url);
    const time1 = Date.now() - start1;
    console.log(`   ✓ Fetched repository: ${repo1.name}`);
    console.log(`   ⏱️  Time: ${time1}ms\n`);

    // Second request - will use cache
    console.log("2️⃣  Second Request (with cache):");
    const start2 = Date.now();
    const repo2 = await client.get<any>(url);
    const time2 = Date.now() - start2;
    console.log(`   ✓ Fetched repository: ${repo2.name}`);
    console.log(`   ⏱️  Time: ${time2}ms\n`);

    // Show performance improvement
    const improvement = (((time1 - time2) / time1) * 100).toFixed(1);
    console.log(`⚡ Cache Performance:`);
    console.log(`   First request:  ${time1}ms`);
    console.log(`   Second request: ${time2}ms`);
    console.log(`   Speed up:       ${improvement}% faster\n`);

    // Show cache stats
    stats = getCacheStats();
    console.log("📊 Final Cache Stats:");
    console.log(`   Entries: ${stats.entries}`);
    console.log(`   Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Location: ${stats.directory}\n`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run demonstration
demonstrateCaching().catch(console.error);
