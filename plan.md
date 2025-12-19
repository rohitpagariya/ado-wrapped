# Azure DevOps Wrapped - Implementation Plan

This document describes the architecture and implementation of Azure DevOps Wrapped.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 14 Full-Stack Application                  │
│                                                                 │
│  Frontend (React/App Router)    Backend (API Routes)           │
│  • Landing page (/)             • /api/stats endpoint           │
│  • Wrapped dashboard (/wrapped) • /api/projects endpoint        │
│  • Story-style animations       • Azure DevOps client           │
│  • Export functionality         • Stats aggregation             │
│                                                                 │
│  Shared: TypeScript types, utility functions                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Azure DevOps REST API                       │
│   • Multi-project support (aggregate across projects)          │
│   • PAT auth via Basic header                                   │
│   • Commits, Pull Requests, and Work Items endpoints            │
└─────────────────────────────────────────────────────────────────┘
```

> See [.github/copilot-instructions.md](.github/copilot-instructions.md) for complete tech stack details.

---

## Application Flow

### 1. Configuration (Landing Page)

- User enters Azure DevOps details via `ConfigForm` component
- Required: organization, projects (one or more), repository, year, PAT
- Optional: user email filter
- Config stored in `sessionStorage` (never server-side)
- Navigates to `/wrapped` on submit

### 2. Data Fetching (API Route)

- `/api/stats` endpoint receives config via query params + Bearer token
- Fetches commits, pull requests, and work items in parallel
- Uses pagination for large datasets
- Aggregates into `WrappedStats` response

### 3. Stats Presentation (Story Viewer)

- Animated card-by-card story experience
- Keyboard navigation (arrow keys)
- Touch/swipe support on mobile
- 15 distinct card types:
  - Welcome
  - Total commits
  - Lines of code
  - Commit heatmap
  - Time distribution
  - Language/file types
  - Longest streak
  - Pull requests
  - Work items total
  - Work item types
  - Bugs fixed
  - Resolution speed
  - Top tags
  - Insights/personality
  - Finale

### 4. Export

- Client-side JSON/Markdown generation
- Direct file download (no server storage)

---

## Key Directories

```
src/
├── app/                      # Next.js App Router (pages & API routes)
├── components/               # React components (UI, charts, stats)
├── lib/azure-devops/         # Azure DevOps API client & aggregation
│   ├── ConfigForm.tsx        # User configuration input
│   ├── StoryViewer.tsx       # Animated story container
│   ├── StatsCard.tsx         # Reusable stat display
│   ├── CommitHeatmap.tsx     # GitHub-style calendar
│   ├── LanguageChart.tsx     # Pie chart for file types
│   ├── TimeDistributionChart.tsx  # Bar charts
│   ├── PRStats.tsx           # Pull request metrics
│   ├── InsightsCard.tsx      # Personality insights
│   ├── ExportButton.tsx      # Download functionality
│   ├── ErrorBoundary.tsx     # Error handling
│   └── ErrorDisplay.tsx      # User-friendly errors
├── lib/
│   ├── azure-devops/
│   │   ├── client.ts         # API client with auth
│   │   ├── types.ts          # API response types
│   │   ├── commits.ts        # Commits fetcher
│   │   ├── pullRequests.ts   # PRs fetcher
│   │   ├── workItems.ts      # Work items fetcher (WIQL)
│   │   ├── aggregator.ts     # Stats computation
│   │   └── index.ts          # Public exports
│   ├── export.ts             # JSON/Markdown generation
│   ├── config.ts             # Config utilities
│   └── utils.ts              # General utilities
├── hooks/
│   └── use-toast.ts          # Toast notifications
└── types/
    └── index.ts              # Application types
```

---

## API Design

### Stats Endpoint: `GET /api/stats`

**Query Parameters:**

- `organization` (required)
- `projects` (required) - comma-separated list of project names
- `project` (legacy, optional) - single project name (for backwards compatibility)
- `repository` (required)
- `year` (required)
- `userEmail` (optional)

**Headers:**

- `Authorization: Bearer <PAT>`

**Response:** `WrappedStats` JSON object

### Projects Endpoint: `GET /api/projects`

Fetches all projects in an organization that the user has access to.

**Query Parameters:**

- `organization` (required)

**Headers:**

- `Authorization: Bearer <PAT>`

**Response:**
```json
{
  "count": 5,
  "projects": [
    { "id": "...", "name": "ProjectName", "description": "...", "state": "wellFormed" }
  ]
}
```

---

## Statistics Computed

### Commit Stats

- Total count
- Lines added/edited/deleted
- Distribution by month, day of week, hour
- Longest commit streak
- First and last commit dates
- Top commit message keywords

### Pull Request Stats

- Created, merged, abandoned counts
- PRs reviewed
- Average days to merge
- Largest PR (by files changed)

### Work Item Stats

- Total resolved/closed count
- Breakdown by type (Bug, Task, User Story, etc.)
- Breakdown by priority
- Bugs fixed with severity breakdown
- Average resolution time (days)
- Fastest resolution
- Top tags used
- Monthly distribution

### Insights

- Developer personality (Night Owl, Early Bird, etc.)
- Busiest month and day
- Favorite commit hour
- Top file extensions

---

## Security Model

1. **PAT tokens** - Only stored in browser sessionStorage
2. **No server persistence** - All data fetched on demand
3. **Per-request auth** - PAT sent with each API call
4. **Client-side export** - No data leaves the browser

---

## References

- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel, Azure, and Docker instructions
- **Development**: See README.md for available npm scripts
- **Roadmap**: See [tasks.md](tasks.md) for planned enhancements
