# Azure DevOps Wrapped - Task Breakdown

This document contains all tasks required to implement the Azure DevOps Wrapped project. Tasks are organized by phase and can be executed by multiple agents in parallel where dependencies allow.

---

## Configuration

Before starting, copy `.env.example` to `.env` and fill in your Azure DevOps credentials:

```env
# Required settings
ADO_ORGANIZATION=your-organization
ADO_PROJECT=your-project
ADO_REPOSITORY=your-repository
ADO_PAT=your-personal-access-token-here

# Optional settings
ADO_USER_EMAIL=your-email@example.com
ADO_YEAR=2024
ADO_INCLUDE_COMMITS=true
ADO_INCLUDE_PULL_REQUESTS=true
ADO_INCLUDE_WORK_ITEMS=false
ADO_INCLUDE_BUILDS=false
```

> ⚠️ **Important**: `.env` is in `.gitignore` and should NEVER be committed. Only `.env.example` is tracked.

---

## Legend

- **Status**: `[ ]` Not Started | `[~]` In Progress | `[x]` Complete
- **Depends On**: Tasks that must complete before this one can start
- **Parallel Group**: Tasks within the same group can run simultaneously

---

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Initialize Next.js Project

- **Status**: `[ ]`
- **Depends On**: None
- **Parallel Group**: A
- **Description**: Create the Next.js 14 project with TypeScript, Tailwind CSS, and App Router
- **Commands**:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint
  ```
- **Acceptance Criteria**:
  - [ ] Next.js 14 project created with App Router
  - [ ] TypeScript configured
  - [ ] Tailwind CSS configured
  - [ ] ESLint configured
  - [ ] Project runs with `npm run dev`

### Task 1.2: Install Dependencies

- **Status**: `[ ]`
- **Depends On**: 1.1
- **Parallel Group**: B
- **Description**: Install all required npm packages
- **Commands**:
  ```bash
  npm install recharts framer-motion lucide-react axios date-fns
  npm install -D @types/node
  ```
- **Acceptance Criteria**:
  - [ ] recharts installed (charts)
  - [ ] framer-motion installed (animations)
  - [ ] lucide-react installed (icons)
  - [ ] axios installed (HTTP client)
  - [ ] date-fns installed (date utilities)

### Task 1.3: Initialize shadcn/ui

- **Status**: `[ ]`
- **Depends On**: 1.1
- **Parallel Group**: B
- **Description**: Set up shadcn/ui component library
- **Commands**:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card input label tabs progress skeleton toast
  ```
- **Acceptance Criteria**:
  - [ ] shadcn/ui initialized with default config
  - [ ] Required components added (button, card, input, label, tabs, progress, skeleton, toast)
  - [ ] components/ui directory created

### Task 1.4: Create Project Directory Structure

- **Status**: `[ ]`
- **Depends On**: 1.1
- **Parallel Group**: B
- **Description**: Create the folder structure as defined in the plan
- **Directories to Create**:
  ```
  src/app/api/stats/
  src/app/api/export/
  src/components/
  src/lib/azure-devops/
  src/types/
  ```
- **Acceptance Criteria**:
  - [ ] All directories created
  - [ ] .gitkeep files added where needed

### Task 1.5: Create TypeScript Types

- **Status**: `[ ]`
- **Depends On**: 1.4
- **Parallel Group**: C
- **Description**: Define all TypeScript interfaces for the project
- **File**: `src/types/index.ts`
- **Types to Define**:
  - `WrappedConfig` - Configuration input
  - `WrappedStats` - Complete stats response
  - `CommitStats` - Commit statistics
  - `PullRequestStats` - PR statistics
  - `WorkItemStats` - Work item statistics
  - `BuildStats` - Build statistics
  - `Insights` - Generated insights
- **Acceptance Criteria**:
  - [ ] All interfaces defined with proper types
  - [ ] Types exported for use across project

### Task 1.6: Update Next.js Configuration

- **Status**: `[ ]`
- **Depends On**: 1.1
- **Parallel Group**: B
- **Description**: Update next.config.js for optimal API route and deployment configuration
- **File**: `next.config.js`
- **Acceptance Criteria**:
  - [ ] Configuration supports API routes
  - [ ] Production build optimized
  - [ ] Environment variables properly handled

### Task 1.7: Create GitHub Repository

- **Status**: `[ ]`
- **Depends On**: 1.1, 1.2, 1.3
- **Parallel Group**: D
- **Description**: Initialize git and create GitHub repository
- **Commands**:
  ```bash
  git init
  gh repo create azure-devops-wrapped --private --source=. --push
  ```
- **Acceptance Criteria**:
  - [ ] Git repository initialized
  - [ ] GitHub repo created
  - [ ] Initial commit pushed

### Task 1.8: Set Up Deployment Documentation

- **Status**: `[ ]`
- **Depends On**: 1.7
- **Parallel Group**: E
- **Description**: Document deployment options for Vercel and Azure App Service
- **File**: `DEPLOYMENT.md`
- **Acceptance Criteria**:
  - [ ] Vercel deployment instructions added
  - [ ] Azure App Service deployment instructions added
  - [ ] Docker deployment option documented
  - [ ] Environment variable configuration documented

---

## Phase 2: Azure DevOps API Integration

### Task 2.1: Create Azure DevOps API Client

- **Status**: `[ ]`
- **Depends On**: 1.5
- **Parallel Group**: F
- **Description**: Create the base API client for Azure DevOps REST API
- **File**: `src/lib/azure-devops/client.ts`
- **Features**:
  - Base URL construction
  - PAT authentication header
  - Error handling wrapper
  - Rate limiting awareness
- **Acceptance Criteria**:
  - [ ] Client class/functions created
  - [ ] Authentication header properly formatted
  - [ ] Error handling implemented
  - [ ] TypeScript types applied

### Task 2.2: Create Azure DevOps API Types

- **Status**: `[ ]`
- **Depends On**: 1.5
- **Parallel Group**: F
- **Description**: Define TypeScript types for Azure DevOps API responses
- **File**: `src/lib/azure-devops/types.ts`
- **Types**:
  - Commit response types
  - Pull request response types
  - Work item response types
  - Build response types
- **Acceptance Criteria**:
  - [ ] All API response types defined
  - [ ] Proper optional/required fields

### Task 2.3: Implement Commits Fetcher

- **Status**: `[ ]`
- **Depends On**: 2.1, 2.2
- **Parallel Group**: G
- **Description**: Create function to fetch commits from Azure DevOps
- **File**: `src/lib/azure-devops/commits.ts`
- **API Endpoint**: `/{project}/_apis/git/repositories/{repo}/commits`
- **Features**:
  - Date range filtering
  - User email filtering
  - Pagination handling
  - Commit diff stats (additions/deletions)
- **Acceptance Criteria**:
  - [ ] Fetch all commits for date range
  - [ ] Handle pagination (>100 results)
  - [ ] Filter by user email (optional)
  - [ ] Return typed response

### Task 2.4: Implement Pull Requests Fetcher

- **Status**: `[ ]`
- **Depends On**: 2.1, 2.2
- **Parallel Group**: G
- **Description**: Create function to fetch pull requests from Azure DevOps
- **File**: `src/lib/azure-devops/pullRequests.ts`
- **API Endpoint**: `/{project}/_apis/git/pullrequests`
- **Features**:
  - Date range filtering
  - Status filtering (completed, active, abandoned)
  - Include reviews/votes
- **Acceptance Criteria**:
  - [ ] Fetch PRs created in date range
  - [ ] Fetch PRs reviewed by user
  - [ ] Include merge time data
  - [ ] Handle pagination

### Task 2.5: Implement Work Items Fetcher

- **Status**: `[ ]`
- **Depends On**: 2.1, 2.2
- **Parallel Group**: G
- **Description**: Create function to fetch work items from Azure DevOps
- **File**: `src/lib/azure-devops/workItems.ts`
- **API Endpoint**: `/_apis/wit/wiql` (WIQL query)
- **Features**:
  - Query work items by date
  - Filter by assigned user
  - Get work item types and states
- **Acceptance Criteria**:
  - [ ] Execute WIQL queries
  - [ ] Fetch work item details
  - [ ] Handle batch requests (200 item limit)

### Task 2.6: Implement Builds Fetcher

- **Status**: `[ ]`
- **Depends On**: 2.1, 2.2
- **Parallel Group**: G
- **Description**: Create function to fetch build data from Azure DevOps
- **File**: `src/lib/azure-devops/builds.ts`
- **API Endpoint**: `/{project}/_apis/build/builds`
- **Features**:
  - Date range filtering
  - Build status and result
  - Build duration
- **Acceptance Criteria**:
  - [ ] Fetch builds for date range
  - [ ] Include status (succeeded, failed, etc.)
  - [ ] Calculate duration from start/finish times

### Task 2.7: Create Stats Aggregator

- **Status**: `[ ]`
- **Depends On**: 2.3, 2.4, 2.5, 2.6
- **Parallel Group**: H
- **Description**: Create function to aggregate raw data into statistics
- **File**: `src/lib/azure-devops/aggregator.ts`
- **Features**:
  - Commits: by month, day of week, hour
  - Streak calculation
  - PR merge time averages
  - Build success rate
  - Insight generation (personality type)
- **Acceptance Criteria**:
  - [ ] All WrappedStats fields computed
  - [ ] Streak calculation correct
  - [ ] Personality type detection working
  - [ ] Top file extensions extracted

---

## Phase 3: Next.js API Routes

### Task 3.1: Create Stats API Route

- **Status**: `[ ]`
- **Depends On**: 2.7, 1.4
- **Parallel Group**: I
- **Description**: Create the Next.js API route for fetching stats
- **File**: `src/app/api/stats/route.ts`
- **Features**:
  - Accept PAT via Authorization header (Bearer token)
  - Accept org, project, repo, year via URL search params
  - Call Azure DevOps client functions
  - Call aggregator and return stats
  - Error handling with proper HTTP status codes
- **Acceptance Criteria**:
  - [ ] GET endpoint at /api/stats works
  - [ ] Validates required parameters (400 if missing)
  - [ ] Returns WrappedStats JSON on success
  - [ ] Proper error responses (400, 500)
  - [ ] Uses Next.js 14 App Router conventions

### Task 3.2: Create Export API Route (Optional)

- **Status**: `[ ]`
- **Depends On**: 1.4
- **Parallel Group**: I
- **Description**: Create an optional API route for server-side export generation
- **File**: `src/app/api/export/route.ts`
- **Note**: Export is primarily handled client-side, but this provides server alternative
- **Features**:
  - POST endpoint accepting stats data
  - Generate JSON or Markdown based on query param
  - Return file as download
- **Acceptance Criteria**:
  - [ ] Endpoint generates JSON file
  - [ ] Endpoint generates Markdown file
  - [ ] Proper content-type and content-disposition headers
  - [ ] File download works correctly

### Task 3.3: Test API Routes Locally

- **Status**: `[ ]`
- **Depends On**: 3.1
- **Parallel Group**: J
- **Description**: Verify API routes work with local development server
- **Commands**:
  ```bash
  npm run dev
  # Test with curl or Postman
  curl -H "Authorization: Bearer YOUR_PAT" \
    "http://localhost:3000/api/stats?organization=ORG&project=PROJ&repository=REPO&year=2024"
  ```
- **Acceptance Criteria**:
  - [ ] API responds on localhost:3000
  - [ ] Returns valid JSON response
  - [ ] Error handling works as expected
  - [ ] No TypeScript errors

---

## Phase 4: Frontend - Configuration UI

### Task 4.1: Create Landing Page Layout

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: F
- **Description**: Create the main landing page layout
- **File**: `src/app/page.tsx`
- **Features**:
  - Hero section with title
  - Brief description
  - Link/scroll to config form
- **Acceptance Criteria**:
  - [ ] Responsive layout
  - [ ] Tailwind styling applied
  - [ ] Framer Motion entrance animation

### Task 4.2: Create Configuration Form Component

- **Status**: `[ ]`
- **Depends On**: 1.3, 1.5
- **Parallel Group**: F
- **Description**: Create the form for entering ADO credentials and settings
- **File**: `src/components/ConfigForm.tsx`
- **Fields**:
  - PAT token (password input)
  - Organization name
  - Project name
  - Repository name
  - Year selector
  - User email (optional)
- **Features**:
  - Form validation
  - Save to localStorage option
  - Submit triggers stats fetch
- **Acceptance Criteria**:
  - [ ] All fields render correctly
  - [ ] Validation working
  - [ ] localStorage persistence
  - [ ] Loading state on submit

### Task 4.3: Create App Layout

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: F
- **Description**: Create the root layout with global styles and providers
- **File**: `src/app/layout.tsx`
- **Features**:
  - HTML structure
  - Font loading
  - Toast provider
  - Theme setup
- **Acceptance Criteria**:
  - [ ] Layout renders children
  - [ ] Global CSS imported
  - [ ] Meta tags set

### Task 4.4: Create Global Styles

- **Status**: `[ ]`
- **Depends On**: 1.1
- **Parallel Group**: F
- **Description**: Set up global CSS with Tailwind and custom properties
- **File**: `src/app/globals.css`
- **Features**:
  - CSS custom properties for theming
  - Tailwind imports
  - Custom animations
- **Acceptance Criteria**:
  - [ ] Dark/light theme variables
  - [ ] Custom animation keyframes
  - [ ] Base styles applied

---

## Phase 5: Frontend - Stats Dashboard

### Task 5.1: Create Wrapped Page

- **Status**: `[ ]`
- **Depends On**: 4.2, 3.2
- **Parallel Group**: J
- **Description**: Create the main stats dashboard page
- **File**: `src/app/wrapped/page.tsx`
- **Features**:
  - Fetch stats from API
  - Loading state
  - Error handling
  - Pass data to StoryViewer
- **Acceptance Criteria**:
  - [ ] Fetches stats on mount
  - [ ] Shows loading skeleton
  - [ ] Handles errors gracefully
  - [ ] Renders StoryViewer with data

### Task 5.2: Create Story Viewer Component

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: J
- **Description**: Create the swipeable/tappable story container
- **File**: `src/components/StoryViewer.tsx`
- **Features**:
  - Navigate between stat cards
  - Progress indicators
  - Touch/click navigation
  - Keyboard navigation
  - Auto-advance option
- **Acceptance Criteria**:
  - [ ] Shows one card at a time
  - [ ] Progress bar at top
  - [ ] Click left/right to navigate
  - [ ] Arrow key navigation
  - [ ] Smooth transitions

### Task 5.3: Create Stats Card Component

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: J
- **Description**: Create the individual stat card component
- **File**: `src/components/StatsCard.tsx`
- **Features**:
  - Title and value display
  - Icon support
  - Background variants
  - Framer Motion animations
- **Acceptance Criteria**:
  - [ ] Animates on entrance
  - [ ] Multiple style variants
  - [ ] Responsive sizing

### Task 5.4: Create Commit Heatmap Component

- **Status**: `[ ]`
- **Depends On**: 1.2
- **Parallel Group**: J
- **Description**: Create a GitHub-style contribution heatmap
- **File**: `src/components/CommitHeatmap.tsx`
- **Features**:
  - Calendar grid layout
  - Color intensity by count
  - Tooltip on hover
  - Month labels
- **Acceptance Criteria**:
  - [ ] 52 weeks displayed
  - [ ] Color gradient working
  - [ ] Responsive design

### Task 5.5: Create Language/File Type Chart

- **Status**: `[ ]`
- **Depends On**: 1.2
- **Parallel Group**: J
- **Description**: Create a chart showing file type distribution
- **File**: `src/components/LanguageChart.tsx`
- **Features**:
  - Pie or bar chart
  - Top 5-10 extensions
  - Color coding
  - Legends
- **Acceptance Criteria**:
  - [ ] Recharts integration
  - [ ] Responsive sizing
  - [ ] Animation on load

### Task 5.6: Create Time Distribution Chart

- **Status**: `[ ]`
- **Depends On**: 1.2
- **Parallel Group**: J
- **Description**: Create charts for commits by hour and day of week
- **File**: `src/components/TimeDistributionChart.tsx`
- **Features**:
  - Bar chart for hours (0-23)
  - Bar chart for days (Mon-Sun)
  - Highlight peak times
- **Acceptance Criteria**:
  - [ ] Hour chart renders
  - [ ] Day chart renders
  - [ ] Peak highlighted

### Task 5.7: Create PR Stats Component

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: J
- **Description**: Create component to display pull request statistics
- **File**: `src/components/PRStats.tsx`
- **Features**:
  - Created/merged/reviewed counts
  - Average merge time
  - Largest PR highlight
- **Acceptance Criteria**:
  - [ ] All stats displayed
  - [ ] Visual appeal
  - [ ] Animations

### Task 5.8: Create Build Stats Component

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: J
- **Description**: Create component to display build statistics
- **File**: `src/components/BuildStats.tsx`
- **Features**:
  - Success/fail counts
  - Success rate percentage
  - Average duration
- **Acceptance Criteria**:
  - [ ] Stats displayed
  - [ ] Success rate visual (progress ring)
  - [ ] Animations

### Task 5.9: Create Insights/Personality Component

- **Status**: `[ ]`
- **Depends On**: 1.3
- **Parallel Group**: J
- **Description**: Create component for the fun insights section
- **File**: `src/components/InsightsCard.tsx`
- **Features**:
  - Personality type display
  - Fun facts
  - Top achievements
- **Acceptance Criteria**:
  - [ ] Personality badge
  - [ ] Animated reveal
  - [ ] Shareable format

---

## Phase 6: Export Functionality

### Task 6.1: Create Export Utilities

- **Status**: `[ ]`
- **Depends On**: 1.5
- **Parallel Group**: J
- **Description**: Create client-side export functions
- **File**: `src/lib/export.ts`
- **Features**:
  - Export to JSON
  - Export to Markdown
  - Blob download helper
- **Acceptance Criteria**:
  - [ ] JSON export works
  - [ ] Markdown export formatted nicely
  - [ ] File download triggers

### Task 6.2: Create Export Button Component

- **Status**: `[ ]`
- **Depends On**: 6.1, 1.3
- **Parallel Group**: K
- **Description**: Create the export button UI component
- **File**: `src/components/ExportButton.tsx`
- **Features**:
  - Dropdown for format selection
  - JSON and Markdown options
  - Loading state
- **Acceptance Criteria**:
  - [ ] Button renders
  - [ ] Dropdown works
  - [ ] Files download correctly

---

## Phase 7: Polish & Documentation

### Task 7.1: Add Loading Skeletons

- **Status**: `[ ]`
- **Depends On**: 5.1
- **Parallel Group**: L
- **Description**: Add skeleton loading states for all data-dependent components
- **Files**: Various components
- **Acceptance Criteria**:
  - [ ] Config form has loading state
  - [ ] Stats page has skeleton
  - [ ] Charts have loading states

### Task 7.2: Add Error Handling UI

- **Status**: `[ ]`
- **Depends On**: 5.1
- **Parallel Group**: L
- **Description**: Create error boundary and error display components
- **Files**: `src/components/ErrorBoundary.tsx`, `src/components/ErrorDisplay.tsx`
- **Acceptance Criteria**:
  - [ ] Error boundary catches errors
  - [ ] User-friendly error messages
  - [ ] Retry functionality

### Task 7.3: Mobile Responsiveness Testing

- **Status**: `[ ]`
- **Depends On**: All Phase 5 tasks
- **Parallel Group**: M
- **Description**: Test and fix responsive design on mobile devices
- **Acceptance Criteria**:
  - [ ] Works on 320px width
  - [ ] Works on tablet sizes
  - [ ] Touch interactions work
  - [ ] Charts resize properly

### Task 7.4: Add Accessibility Features

- **Status**: `[ ]`
- **Depends On**: All Phase 5 tasks
- **Parallel Group**: M
- **Description**: Ensure WCAG compliance
- **Acceptance Criteria**:
  - [ ] ARIA labels added
  - [ ] Keyboard navigation works
  - [ ] Color contrast meets AA
  - [ ] Screen reader friendly

### Task 7.5: Create README Documentation

- **Status**: `[ ]`
- **Depends On**: All previous tasks
- **Parallel Group**: N
- **Description**: Update README with project documentation
- **File**: `README.md`
- **Sections**:
  - Project overview
  - Features
  - Setup instructions
  - Configuration
  - Deployment
  - Contributing
- **Acceptance Criteria**:
  - [ ] Clear setup instructions
  - [ ] Screenshots included
  - [ ] API documented

### Task 7.6: Create Environment Variables Template

- **Status**: `[ ]`
- **Depends On**: 1.1
- **Parallel Group**: F
- **Description**: Create .env.example file with required variables
- **File**: `.env.example`
- **Acceptance Criteria**:
  - [ ] All env vars documented
  - [ ] Comments explain each var
  - [ ] .env in .gitignore

---

## Dependency Graph

```
Phase 1 (Setup)
├── 1.1 ──┬── 1.2 ──┐
│         ├── 1.3 ──┼── 1.7 ── 1.8
│         ├── 1.4 ──┤
│         ├── 1.5 ──┤
│         └── 1.6 ──┘

Phase 2 (API Integration)
├── 2.1 ──┬── 2.3 ──┐
├── 2.2 ──┼── 2.4 ──┼── 2.7
          ├── 2.5 ──┤
          └── 2.6 ──┘

Phase 3 (Next.js API Routes)
├── 2.7 ── 3.1 ──┬── 3.3
│                └── 3.2

Phase 4 (Config UI)
├── 4.1, 4.2, 4.3, 4.4 (can run in parallel)

Phase 5 (Dashboard)
├── 5.1 ── 5.2 ── 5.3
├── 5.4, 5.5, 5.6 (charts - parallel)
├── 5.7, 5.8 (stats - parallel)
└── 5.9 (insights)

Phase 6 (Export)
├── 6.1 ── 6.2

Phase 7 (Polish)
├── 7.1, 7.2 ── 7.3, 7.4 ── 7.5
```

---

## Agent Assignment Recommendations

| Agent   | Tasks            | Focus Area                      |
| ------- | ---------------- | ------------------------------- |
| Agent 1 | 1.1-1.8, 7.6     | Project Setup & Configuration   |
| Agent 2 | 1.5, 2.1-2.7     | Azure DevOps API Integration    |
| Agent 3 | 3.1-3.3          | Next.js API Routes              |
| Agent 4 | 4.1-4.4          | Frontend Config UI              |
| Agent 5 | 5.1-5.3          | Story Viewer & Core Dashboard   |
| Agent 6 | 5.4-5.6          | Charts & Visualizations         |
| Agent 7 | 5.7-5.9, 6.1-6.2 | Stats Components & Export       |
| Agent 8 | 7.1-7.5          | Testing, Polish & Documentation |

---

## Notes

- PAT tokens should NEVER be logged or stored server-side
- All API calls should handle rate limiting (429 responses)
- Azure DevOps API version: 7.0
- Consider caching API responses in localStorage for development
- Test with real Azure DevOps data early to catch API quirks
