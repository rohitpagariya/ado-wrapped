# GitHub Copilot Instructions for ADO Wrapped

> **Purpose**: This file provides coding guidelines, tech stack details, and common development patterns for AI assistants and developers working on this project.
>
> For architecture and application flow, see [plan.md](../plan.md).  
> For setup and usage, see [README.md](../README.md).

## Project Overview

Azure DevOps Wrapped is a Next.js 14 web application that generates personalized "year in review" summaries for Azure DevOps users, similar to Spotify Wrapped.

## Technology Stack

| Layer             | Technology              | Purpose                          |
| ----------------- | ----------------------- | -------------------------------- |
| **Framework**     | Next.js 14 (App Router) | Full-stack React with API routes |
| **Language**      | TypeScript              | Type safety throughout           |
| **Styling**       | Tailwind CSS            | Utility-first styling            |
| **UI Components** | shadcn/ui + Radix UI    | Accessible component primitives  |
| **Charts**        | Recharts                | Data visualization               |
| **Animations**    | Framer Motion           | Story-style card transitions     |
| **Icons**         | Lucide React            | Modern icon library              |
| **HTTP Client**   | Axios                   | Azure DevOps API requests        |
| **Dates**         | date-fns                | Date manipulation and formatting |

## Project Structure

```
ado-wrapped/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page with config form
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── globals.css               # Global styles and CSS variables
│   │   ├── wrapped/
│   │   │   └── page.tsx              # Stats dashboard page
│   │   └── api/
│   │       └── stats/
│   │           └── route.ts          # GET /api/stats endpoint
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── ConfigForm.tsx            # PAT, org, project, repo input form
│   │   ├── StoryViewer.tsx           # Swipeable story container
│   │   ├── StatsCard.tsx             # Individual stat display card
│   │   ├── CommitHeatmap.tsx         # GitHub-style contribution calendar
│   │   ├── LanguageChart.tsx         # File type pie chart
│   │   ├── TimeDistributionChart.tsx # Commits by hour/day charts
│   │   ├── PRStats.tsx               # Pull request statistics
│   │   ├── WorkItemStats.tsx         # Work item metrics
│   │   ├── WorkItemTypeChart.tsx     # Pie chart by work item type
│   │   ├── BugStats.tsx              # Bug severity breakdown
│   │   ├── TopTagsChart.tsx          # Tag cloud and chart
│   │   ├── BuildStats.tsx            # Build pipeline stats (stub)
│   │   ├── InsightsCard.tsx          # Developer personality insights
│   │   ├── ExportButton.tsx          # Download JSON/Markdown
│   │   ├── ErrorBoundary.tsx         # Error handling wrapper
│   │   └── ErrorDisplay.tsx          # User-friendly error UI
│   ├── lib/
│   │   ├── azure-devops/             # Azure DevOps API integration
│   │   │   ├── client.ts             # Base API client with auth
│   │   │   ├── types.ts              # API response types
│   │   │   ├── commits.ts            # Fetch commits with pagination
│   │   │   ├── pullRequests.ts       # Fetch PRs with filtering
│   │   │   ├── workItems.ts          # Fetch work items via WIQL
│   │   │   ├── aggregator.ts         # Compute stats from raw data
│   │   │   └── index.ts              # Public exports
│   │   ├── export.ts                 # JSON/Markdown generation
│   │   ├── config.ts                 # Configuration utilities
│   │   └── utils.ts                  # General utilities (cn helper)
│   ├── hooks/
│   │   └── use-toast.ts              # Toast notification hook
│   └── types/
│       └── index.ts                  # Application TypeScript types
├── public/                           # Static assets
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies and scripts
```

## Key Types

### Configuration Input

```typescript
interface ProjectRepository {
  project: string; // Project name, e.g., "Teams"
  repository: string; // Repository name, e.g., "teams-frontend"
}

interface WrappedConfig {
  pat: string; // Personal Access Token
  organization: string; // e.g., "microsoft"
  projects: string[]; // Array of project names, e.g., ["Teams", "Office"]
  repositories: ProjectRepository[]; // Array of project-repo combos
  year: number; // e.g., 2024
  userEmail?: string; // Optional: filter by specific user
}
```

### Stats Response

```typescript
interface WrappedStats {
  meta: MetaInfo;
  commits: CommitStats;
  pullRequests: PullRequestStats;
  workItems: WorkItemStats; // Resolved/closed work items
  builds: BuildStats; // Stub - not yet implemented
  insights: Insights;
}

interface WorkItemStats {
  total: number;
  byType: Record<string, number>; // "Bug": 23, "User Story": 45
  byPriority: Record<number, number>;
  byMonth: Record<string, number>;
  bugsFixed: number;
  bugsBySeverity: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  avgResolutionDays: number;
  fastestResolution: { id: number; title: string; hours: number } | null;
  firstResolvedDate: string;
  lastResolvedDate: string;
  topAreas: Array<{ area: string; count: number }>;
}
```

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all files
- Prefer `const` over `let`, never use `var`
- Use async/await over raw promises
- Destructure objects and arrays when appropriate
- Use optional chaining (`?.`) and nullish coalescing (`??`)

```typescript
// Preferred
const { data, error } = await fetchUserActivity(userId);

// Avoid
fetchUserActivity(userId).then((result) => {
  const data = result.data;
  const error = result.error;
});
```

### React Components

- Use functional components with hooks
- Keep components small and composable
- Use proper prop typing with TypeScript interfaces
- Components are in `src/components/`

```typescript
interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  // Component implementation
}
```

### API Routes (Next.js App Router)

- Use route handlers in `src/app/api/`
- Accept PAT via Authorization header (Bearer token)
- Return proper HTTP status codes
- Always validate required parameters

```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const pat = authHeader?.replace("Bearer ", "");
  // Validate and process...
}
```

## Azure DevOps API Integration

### Authentication

PAT tokens are passed via Authorization header and used for Basic auth:

```typescript
const headers = {
  Authorization: `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
  "Content-Type": "application/json",
};
```

### API Endpoints Used

- **Projects**: `/_apis/projects` (list all projects in org)
- **Commits**: `/{project}/_apis/git/repositories/{repo}/commits`
- **Pull Requests**: `/{project}/_apis/git/pullrequests`
- **Work Items (WIQL)**: `/{project}/_apis/wit/wiql`
- **Work Items (Details)**: `/{project}/_apis/wit/workitems`
- **API Version**: 7.0

### Error Handling

The client handles common errors:

- 401: Invalid PAT
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limiting
- 5xx: Server errors

## Security Practices

- **PAT tokens only in sessionStorage** - Never localStorage or server-side
- **No data persistence** on server
- **All API calls authenticated** per-request with user's PAT
- **`.env` in `.gitignore`** - Secrets never committed
- **HTTPS required** for production

## Common Tasks

### Adding a New Visualization Component

1. Create component in `src/components/`
2. Add to story cards array in `StoryViewer.tsx`
3. Handle the new card type in the `renderCard` function

### Extending Azure DevOps Integration

1. Add types to `src/lib/azure-devops/types.ts`
2. Create fetcher function in `src/lib/azure-devops/`
3. Update aggregator to process new data
4. Update `WrappedStats` type in `src/types/index.ts`

### Modifying the Stats API

The API route is at `src/app/api/stats/route.ts`:

- Accepts query params: organization, projects (comma-separated), repository, year, userEmail
- Returns `WrappedStats` JSON
- PAT passed via Authorization header

## AI Agent Guidelines

### For Code Completion

- Always check existing types in `src/types/index.ts` before creating new ones
- Use the existing `cn()` utility from `src/lib/utils.ts` for conditional classes
- Follow the component pattern in `src/components/ui/` for new UI elements
- Import constants from `src/lib/constants.ts` instead of hardcoding values
- Use `StoryCardType` from constants when adding new story cards

### For Debugging

- Start by checking the terminal for emoji-prefixed logs:
  - 🚀 Request start | 🔑 Auth | 📋 Params | 🌐 HTTP calls
  - ✅ Success | ❌ Error | ⚪ Cache miss | ⏰ Cache expired | 💾 Cache write
- Use `npm run cache:clear` if data seems stale
- Use `npm run cache:stats` to check cache size
- Check `get_errors` tool output for TypeScript issues
- Run `npm run type-check` to validate all TypeScript

### For Adding Features

1. Determine if it's API-side (`src/lib/azure-devops/`) or UI-side (`src/components/`)
2. Check if similar patterns exist in the codebase
3. Update types in `src/types/index.ts` first, then implementation
4. Add to `StoryViewer.tsx` cards array if it's a new visualization
5. Update `STORY_CARD_TYPES` in `src/lib/constants.ts` for new card types

### Common Patterns

**Adding a New Stat to the Dashboard:**

1. Add the type to `WrappedStats` in `src/types/index.ts`
2. Populate it in `src/lib/azure-devops/aggregator.ts`
3. Create a visualization component in `src/components/`
4. Add the card type to `STORY_CARD_TYPES` in `src/lib/constants.ts`
5. Add to `StoryViewer.tsx` cards array and `renderCard` function

**Error Handling Pattern:**

```typescript
return NextResponse.json(
  { error: "Human-readable message", code: "ERROR_CODE", details: { ... } },
  { status: 400 }
);
```

### Anti-Patterns to Avoid

- ❌ Don't duplicate types (check `src/types/` first)
- ❌ Don't use raw string colors (use Tailwind classes)
- ❌ Don't skip error handling in API routes
- ❌ Don't hardcode API versions (use `src/lib/constants.ts`)
- ❌ Don't use `var` or non-const declarations unnecessarily
- ❌ Don't use localStorage for sensitive data (PAT should use sessionStorage)

### File Naming Conventions

- Components: PascalCase (e.g., `NewChart.tsx`)
- Utilities: camelCase (e.g., `newHelper.ts`)
- Types: Include in existing files when related to existing types
- Constants: Add to `src/lib/constants.ts` for shared values

### Performance Considerations

- Charts are heavy - consider dynamic imports for new visualizations
- API responses are cached by default (24hr TTL) - disable only when debugging
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations in components
