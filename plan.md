Got it! Let me update the plan with your constraints. This simplifies things significantly.

---

## Updated Implementation Plan: Azure DevOps Wrapped

### Simplified Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js Static)                    │
│   • Config page: Enter PAT, Org, Project, Repo, Year           │
│   • Stats dashboard with animated cards                         │
│   • Mobile-responsive design                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Azure Static Web Apps (SWA)                     │
│   • Static frontend assets                                      │
│   • Azure Functions (API routes)                                │
│   • Integrated auth (optional future)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Azure Functions (Serverless APIs)                 │
│   • /api/stats - Fetch & aggregate Azure DevOps data           │
│   • /api/export - Save stats to JSON/MD file                   │
│   • PAT passed via header (stored in browser localStorage)     │
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

| Layer           | Technology               | Notes                                           |
| --------------- | ------------------------ | ----------------------------------------------- |
| **Framework**   | Next.js 14 (App Router)  | Static export + API routes via Azure Functions  |
| **Language**    | TypeScript               |                                                 |
| **Styling**     | Tailwind CSS + shadcn/ui |                                                 |
| **Charts**      | **Recharts**             | Good React integration, responsive, lightweight |
| **Animations**  | Framer Motion            | Story-style card transitions                    |
| **Auth**        | PAT token (localStorage) | User provides, stored client-side               |
| **Persistence** | JSON file download       | Export stats as JSON/MD to user's machine       |
| **Hosting**     | Azure Static Web Apps    | Free tier available                             |
| **CI/CD**       | GitHub Actions           | Auto-configured by Azure CLI                    |

---

### CI/CD Setup Plan (Azure CLI + GitHub CLI)

#### Prerequisites

```bash
# Install CLIs if not present
az extension add --name staticwebapp
gh auth login
```

#### Step 1: Create GitHub Repository

```bash
# Create and clone repo
gh repo create azure-devops-wrapped --private --clone
cd azure-devops-wrapped
```

#### Step 2: Create Azure Static Web App

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name rg-devops-wrapped --location westus2

# Create Static Web App linked to GitHub
az staticwebapp create \
  --name swa-devops-wrapped \
  --resource-group rg-devops-wrapped \
  --source https://github.com/<your-username>/azure-devops-wrapped \
  --location "West US 2" \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location ".next" \
  --login-with-github
```

This command:

- Creates the Static Web App resource
- Connects to your GitHub repo
- Auto-generates a GitHub Actions workflow file
- Sets up the deployment token as a GitHub secret

#### Step 3: Verify GitHub Actions Workflow

```bash
# Check the workflow was created
gh workflow list

# View workflow runs
gh run list --workflow=azure-static-web-apps-*.yml
```

#### Step 4: Environment Variables (for API)

```bash
# Set environment variables for the Static Web App
az staticwebapp appsettings set \
  --name swa-devops-wrapped \
  --resource-group rg-devops-wrapped \
  --setting-names \
    AZURE_DEVOPS_DEFAULT_ORG="your-org" \
    AZURE_DEVOPS_DEFAULT_PROJECT="your-project"
```

#### Generated GitHub Actions Workflow

Azure CLI auto-generates this, but here's what it looks like:

```yaml
# .github/workflows/azure-static-web-apps-<random>.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: "api"
          output_location: ".next"
```

---

### Project Structure (Updated)

```
azure-devops-wrapped/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps-*.yml  # Auto-generated
├── api/                                  # Azure Functions
│   ├── stats/
│   │   └── index.ts                     # GET /api/stats
│   ├── host.json
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── app/
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
├── staticwebapp.config.json             # SWA routing config
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

### Azure Function: `/api/stats`

```typescript
// api/stats/index.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { fetchCommits } from "../lib/commits";
import { fetchPullRequests } from "../lib/pullRequests";
import { fetchWorkItems } from "../lib/workItems";
import { fetchBuilds } from "../lib/builds";
import { aggregateStats } from "../lib/aggregator";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  const pat = req.headers["x-azure-devops-pat"];
  const { organization, project, repository, year, userEmail } = req.query;

  if (!pat || !organization || !project || !repository || !year) {
    context.res = {
      status: 400,
      body: { error: "Missing required parameters" },
    };
    return;
  }

  try {
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
        userEmail,
      },
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: stats,
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: error.message },
    };
  }
};

export default httpTrigger;
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

| Phase       | Duration | Deliverables                                                      |
| ----------- | -------- | ----------------------------------------------------------------- |
| **Phase 1** | 2-3 days | Project scaffold, Azure SWA setup, CI/CD pipeline, config form UI |
| **Phase 2** | 2-3 days | Commits API integration, commit stats aggregation, basic charts   |
| **Phase 3** | 2 days   | PR and work items integration, additional stats                   |
| **Phase 4** | 2 days   | Build stats, insights generation, personality detection           |
| **Phase 5** | 2 days   | Story-style UI with animations, JSON/MD export                    |
| **Phase 6** | 1 day    | Polish, mobile testing, documentation                             |

**Total: ~2 weeks**

---

### Quick Start Commands

```bash
# 1. Create the project
npx create-next-app@latest azure-devops-wrapped --typescript --tailwind --app --src-dir

# 2. Add dependencies
cd azure-devops-wrapped
npm install recharts framer-motion lucide-react
npm install -D @types/node

# 3. Initialize shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label tabs

# 4. Create GitHub repo and push
gh repo create azure-devops-wrapped --private --source=. --push

# 5. Create Azure Static Web App
az staticwebapp create \
  --name swa-devops-wrapped \
  --resource-group rg-devops-wrapped \
  --source https://github.com/<username>/azure-devops-wrapped \
  --location "West US 2" \
  --branch main \
  --login-with-github
```
