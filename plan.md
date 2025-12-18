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
│  • Wrapped dashboard (/wrapped) • Azure DevOps client           │
│  • Story-style animations       • Stats aggregation             │
│  • Export functionality                                         │
│                                                                 │
│  Shared: TypeScript types, utility functions                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Azure DevOps REST API                       │
│   • Single org/project/repo scope                              │
│   • PAT auth via Basic header                                   │
│   • Commits and Pull Requests endpoints                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology               | Purpose                               |
| -------------- | ------------------------ | ------------------------------------- |
| **Framework**  | Next.js 14 (App Router)  | Full-stack with built-in API routes   |
| **Language**   | TypeScript               | Type safety                           |
| **Styling**    | Tailwind CSS + shadcn/ui | Utility-first + accessible components |
| **Charts**     | Recharts                 | Data visualization                    |
| **Animations** | Framer Motion            | Story-style card transitions          |
| **Icons**      | Lucide React             | Modern icon library                   |
| **HTTP**       | Axios                    | API requests                          |
| **Dates**      | date-fns                 | Date manipulation                     |

---

## Application Flow

### 1. Configuration (Landing Page)

- User enters Azure DevOps details via `ConfigForm` component
- Required: organization, project, repository, year, PAT
- Optional: user email filter
- Config stored in `sessionStorage` (never server-side)
- Navigates to `/wrapped` on submit

### 2. Data Fetching (API Route)

- `/api/stats` endpoint receives config via query params + Bearer token
- Fetches commits and pull requests in parallel
- Uses pagination for large datasets
- Aggregates into `WrappedStats` response

### 3. Stats Presentation (Story Viewer)

- Animated card-by-card story experience
- Keyboard navigation (arrow keys)
- Touch/swipe support on mobile
- 10 distinct card types:
  - Welcome
  - Total commits
  - Lines of code
  - Commit heatmap
  - Time distribution
  - Language/file types
  - Longest streak
  - Pull requests
  - Insights/personality
  - Finale

### 4. Export

- Client-side JSON/Markdown generation
- Direct file download (no server storage)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page with ConfigForm
│   ├── layout.tsx            # Root layout with Toaster
│   ├── globals.css           # CSS variables and base styles
│   ├── wrapped/page.tsx      # Stats dashboard
│   └── api/stats/route.ts    # Stats API endpoint
├── components/
│   ├── ui/                   # shadcn/ui components
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
- `project` (required)
- `repository` (required)
- `year` (required)
- `userEmail` (optional)

**Headers:**

- `Authorization: Bearer <PAT>`

**Response:** `WrappedStats` JSON object

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

## Deployment Options

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions:

- **Vercel** (recommended) - Zero-config Next.js hosting
- **Azure App Service** - Native Azure integration
- **Docker** - Containerized deployment

---

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm start          # Start production server
npm run type-check # TypeScript validation
npm run test:api   # Test Azure DevOps integration
```
