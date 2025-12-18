Got it! Let me update the plan with your constraints. This simplifies things significantly.

---

## Updated Implementation Plan: Azure DevOps Wrapped

### Simplified Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 14 Full-Stack Application                  │
│                                                                 │
│  Frontend (React/App Router)    Backend (API Routes)           │
│  • Config page                  • /api/stats endpoint           │
│  • Stats dashboard              • /api/export endpoint          │
│  • Animated cards               • Azure DevOps client           │
│  • Mobile responsive            • Stats aggregation             │
│                                                                 │
│  Shared: TypeScript types, utility functions, ADO client       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Deployment (Choose One)                            │
│  • Azure App Service (Node.js runtime)                         │
│  • Vercel (native Next.js hosting)                             │
│  • Docker container (any platform)                              │
│  • Any Node.js hosting service                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Azure DevOps REST API                       │
│   • Single org/project/repo scope                              │
│   • PAT auth via Basic header                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Tech Stack (Final)

| Layer           | Technology                 | Notes                                           |
| --------------- | -------------------------- | ----------------------------------------------- |
| **Framework**   | Next.js 14 (App Router)    | Full-stack with built-in API routes             |
| **Language**    | TypeScript                 |                                                 |
| **Styling**     | Tailwind CSS + shadcn/ui   |                                                 |
| **Charts**      | **Recharts**               | Good React integration, responsive, lightweight |
| **Animations**  | Framer Motion              | Story-style card transitions                    |
| **Auth**        | PAT token (localStorage)   | User provides, stored client-side               |
| **Persistence** | JSON file download         | Export stats as JSON/MD to user's machine       |
| **Hosting**     | Vercel / Azure App Service | Or any Node.js platform                         |
| **CI/CD**       | GitHub Actions             | Standard Next.js deployment                     |

---

### Deployment Options

#### Option 1: Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# For production
vercel --prod
```

Vercel automatically:

- Detects Next.js configuration
- Sets up environment variables through dashboard
- Provides automatic preview deployments for PRs
- Handles scaling and CDN

#### Option 2: Azure App Service

```bash
# Install Azure CLI
az login

# Create resource group
az group create --name rg-devops-wrapped --location eastus

# Create App Service plan (Linux, Node.js)
az appservice plan create \
  --name asp-devops-wrapped \
  --resource-group rg-devops-wrapped \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  --name ado-wrapped \
  --resource-group rg-devops-wrapped \
  --plan asp-devops-wrapped \
  --runtime "NODE:20-lts"

# Configure deployment from GitHub
az webapp deployment source config \
  --name ado-wrapped \
  --resource-group rg-devops-wrapped \
  --repo-url https://github.com/<username>/ado-wrapped \
  --branch main \
  --manual-integration

# Set startup command
az webapp config set \
  --name ado-wrapped \
  --resource-group rg-devops-wrapped \
  --startup-file "npm start"
```

#### Option 3: Docker Container

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ado-wrapped .
docker run -p 3000:3000 ado-wrapped
```

---

### Project Structure (Updated)

```
ado-wrapped/
├── src/
│   ├── app/
│   │   ├── api/                         # Next.js API Routes
│   │   │   ├── stats/
│   │   │   │   └── route.ts            # GET /api/stats
│   │   │   └── export/
│   │   │       └── route.ts            # POST /api/export (optional)
│   │   ├── page.tsx                     # Landing/Config page
│   │   ├── wrapped/
│   │   │   └── page.tsx                 # Stats dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn components
│   │   ├── ConfigForm.tsx               # PAT, org, project, repo input
│   │   ├── StatsCard.tsx                # Individual stat card
│   │   ├── StoryViewer.tsx              # Swipeable container
│   │   ├── CommitHeatmap.tsx            # Contribution calendar
│   │   ├── LanguageChart.tsx            # Pie/bar chart
│   │   ├── TimeDistributionChart.tsx    # Commits by hour/day
│   │   └── ExportButton.tsx             # Download JSON/MD
│   ├── lib/
│   │   ├── azure-devops/
│   │   │   ├── client.ts                # API wrapper
│   │   │   ├── types.ts                 # API response types
│   │   │   ├── commits.ts               # Fetch commits
│   │   │   ├── pullRequests.ts          # Fetch PRs
│   │   │   ├── workItems.ts             # Fetch work items
│   │   │   ├── builds.ts                # Fetch builds
│   │   │   └── aggregator.ts            # Compute stats
│   │   ├── export.ts                    # JSON/MD generation
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

### API Design

#### Configuration Input (Client-Side)

```typescript
interface WrappedConfig {
  pat: string; // Personal Access Token
  organization: string; // e.g., "microsoft"
  project: string; // e.g., "Teams"
  repository: string; // e.g., "teams-frontend"
  year: number; // e.g., 2024
  userEmail?: string; // Optional: filter by specific user
}
```

#### Stats Response

```typescript
interface WrappedStats {
  meta: {
    organization: string;
    project: string;
    repository: string;
    year: number;
    generatedAt: string;
    userEmail?: string;
  };
  commits: {
    total: number;
    additions: number;
    edits: number;
    deletions: number;
    byMonth: Record<string, number>; // "Jan": 45
    byDayOfWeek: Record<string, number>; // "Monday": 120
    byHour: Record<number, number>; // 14: 89 (2PM)
    longestStreak: number; // days
    firstCommitDate: string;
    lastCommitDate: string;
    topCommitMessages: string[]; // Most common words
  };
  pullRequests: {
    created: number;
    merged: number;
    abandoned: number;
    reviewed: number;
    avgDaysToMerge: number;
    largestPR: { id: number; title: string; filesChanged: number };
  };
  workItems: {
    created: number;
    resolved: number;
    byType: Record<string, number>; // "Bug": 23, "User Story": 45
    topTags: string[];
  };
  builds: {
    total: number;
    succeeded: number;
    failed: number;
    successRate: number;
    avgDurationMinutes: number;
  };
  insights: {
    personality: "Night Owl" | "Early Bird" | "Nine-to-Fiver";
    busiestMonth: string;
    busiestDay: string;
    favoriteCommitHour: number;
    topFileExtensions: Array<{ ext: string; count: number }>;
  };
}
```

---

### Next.js API Route: `/api/stats`

```typescript
// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchCommits } from "@/lib/azure-devops/commits";
import { fetchPullRequests } from "@/lib/azure-devops/pullRequests";
import { fetchWorkItems } from "@/lib/azure-devops/workItems";
import { fetchBuilds } from "@/lib/azure-devops/builds";
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
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch all data in parallel
    const [commits, pullRequests, workItems, builds] = await Promise.all([
      fetchCommits(
        pat,
        organization,
        project,
        repository,
        startDate,
        endDate,
        userEmail
      ),
      fetchPullRequests(
        pat,
        organization,
        project,
        repository,
        startDate,
        endDate,
        userEmail
      ),
      fetchWorkItems(pat, organization, project, startDate, endDate, userEmail),
      fetchBuilds(pat, organization, project, startDate, endDate, userEmail),
    ]);

    // Aggregate into stats
    const stats = aggregateStats({
      commits,
      pullRequests,
      workItems,
      builds,
      meta: {
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
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Export Functionality

Instead of server-side file storage, we'll generate downloadable files client-side:

```typescript
// src/lib/export.ts
export function exportToJSON(stats: WrappedStats): void {
  const blob = new Blob([JSON.stringify(stats, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, `devops-wrapped-${stats.meta.year}.json`);
}

export function exportToMarkdown(stats: WrappedStats): void {
  const md = generateMarkdown(stats);
  const blob = new Blob([md], { type: "text/markdown" });
  downloadBlob(blob, `devops-wrapped-${stats.meta.year}.md`);
}

function generateMarkdown(stats: WrappedStats): string {
  return `# Azure DevOps Wrapped ${stats.meta.year}

## 📊 Overview
- **Organization:** ${stats.meta.organization}
- **Project:** ${stats.meta.project}
- **Repository:** ${stats.meta.repository}
- **Generated:** ${stats.meta.generatedAt}

## 💻 Commits
- **Total Commits:** ${stats.commits.total}
- **Lines Added:** ${stats.commits.additions}
- **Lines Deleted:** ${stats.commits.deletions}
- **Longest Streak:** ${stats.commits.longestStreak} days

### Commits by Month
${Object.entries(stats.commits.byMonth)
  .map(([month, count]) => `- ${month}: ${count}`)
  .join("\n")}

## 🔀 Pull Requests
- **Created:** ${stats.pullRequests.created}
- **Merged:** ${stats.pullRequests.merged}
- **Reviewed:** ${stats.pullRequests.reviewed}
- **Avg Days to Merge:** ${stats.pullRequests.avgDaysToMerge.toFixed(1)}

## 🎯 Work Items
- **Created:** ${stats.workItems.created}
- **Resolved:** ${stats.workItems.resolved}

## 🏗️ Builds
- **Total:** ${stats.builds.total}
- **Success Rate:** ${stats.builds.successRate.toFixed(1)}%

## 🌟 Insights
- **You are a:** ${stats.insights.personality}
- **Busiest Month:** ${stats.insights.busiestMonth}
- **Favorite Coding Hour:** ${stats.insights.favoriteCommitHour}:00
`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

### Implementation Phases (Updated)

| Phase       | Duration | Deliverables                                                       |
| ----------- | -------- | ------------------------------------------------------------------ |
| **Phase 1** | 1-2 days | Next.js project setup, dependencies, basic structure               |
| **Phase 2** | 2-3 days | Azure DevOps API client, commits/PRs/work items/builds integration |
| **Phase 3** | 1 day    | Next.js API routes for stats and export endpoints                  |
| **Phase 4** | 2 days   | Configuration UI, landing page, form with validation               |
| **Phase 5** | 3 days   | Stats dashboard, story viewer, charts, visualizations              |
| **Phase 6** | 2 days   | Export functionality, animations, polish, mobile responsiveness    |
| **Phase 7** | 1 day    | Testing, documentation, deployment setup                           |

**Total: ~2 weeks**

---

### Quick Start Commands

```bash
# 1. Clone/navigate to the project
cd ado-wrapped

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Azure DevOps credentials

# 4. Run development server
npm run dev

# 5. Build for production
npm run build

# 6. Start production server locally
npm start

# 7. Deploy to Vercel (easiest)
npm i -g vercel
vercel

# OR deploy to Azure App Service
az webapp up --name ado-wrapped --runtime "NODE:20-lts"
```
