#!/usr/bin/env node

/**
 * Cache management CLI tool
 *
 * Usage:
 *   npm run cache:stats  - Show cache statistics
 *   npm run cache:clear  - Clear all cached responses
 */

import { clearCache, getCacheStats } from "./src/lib/azure-devops/cache";

const command = process.argv[2];

switch (command) {
  case "stats":
    {
      const stats = getCacheStats();
      console.log("\n📊 ADO Cache Statistics");
      console.log("=".repeat(50));
      console.log(`Directory: ${stats.directory}`);
      console.log(`Entries: ${stats.entries}`);
      console.log(
        `Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB (${(
          stats.totalSize /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
      console.log("=".repeat(50));
      console.log();
    }
    break;

  case "clear":
    {
      console.log("\n🗑️  Clearing ADO cache...");
      clearCache();
      console.log("✓ Cache cleared successfully\n");
    }
    break;

  default:
    console.log("\n📦 ADO Cache Manager");
    console.log("\nUsage:");
    console.log("  npm run cache:stats  - Show cache statistics");
    console.log("  npm run cache:clear  - Clear all cached responses");
    console.log();
    process.exit(1);
}
