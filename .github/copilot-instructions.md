# GitHub Copilot Instructions for ADO Wrapped

## Project Overview

Azure DevOps Wrapped is a Next.js 14 web application that generates personalized "year in review" summaries for Azure DevOps users, similar to Spotify Wrapped. Users enter their Azure DevOps organization, project, and repository details along with a Personal Access Token, and the app fetches their activity data to present it in an engaging, animated story-style format.

## Application Flow

1. **Landing Page** (`/`) - User enters configuration (org, project, repo, year, PAT)
2. **Configuration stored** in `sessionStorage` (never persisted server-side)
3. **Wrapped Page** (`/wrapped`) - Fetches stats via `/api/stats` API route
4. **Story Viewer** - Displays animated cards with statistics and visualizations
5. **Export** - Users can download their stats as JSON or Markdown

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
interface WrappedConfig {
  pat: string; // Personal Access Token
  organization: string; // e.g., "microsoft"
  project: string; // e.g., "Teams"
  repository: string; // e.g., "teams-frontend"
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
  workItems: WorkItemStats; // Stub - not yet implemented
  builds: BuildStats; // Stub - not yet implemented
  insights: Insights;
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

- **Commits**: `/{project}/_apis/git/repositories/{repo}/commits`
- **Pull Requests**: `/{project}/_apis/git/pullrequests`
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

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Test API integration
npm run test:api
```

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

- Accepts query params: organization, project, repository, year, userEmail
- Returns `WrappedStats` JSON
- PAT passed via Authorization header

## Future Enhancements (Not Yet Implemented)

- Work Items integration (WIQL queries)
- Build pipeline statistics
- Multi-repository support
- Team analytics
- Historical year-over-year comparison
- Social sharing images
