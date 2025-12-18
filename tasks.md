# Azure DevOps Wrapped - Future Enhancements

This document tracks potential future improvements for the Azure DevOps Wrapped application.

---

## Legend

- **Priority**: 🔴 High | 🟡 Medium | 🟢 Low
- **Effort**: S (Small) | M (Medium) | L (Large)

---

## Azure DevOps API Extensions

### Work Items Integration

- **Priority**: 🔴 High
- **Effort**: M
- **Description**: Fetch and display work item statistics using WIQL queries
- **API Endpoint**: `/_apis/wit/wiql`
- **Features to add**:
  - Work items created/resolved count
  - Breakdown by type (Bug, User Story, Task, etc.)
  - Top tags used
- **Files to modify**:
  - Create `src/lib/azure-devops/workItems.ts`
  - Update `src/lib/azure-devops/aggregator.ts`
  - Create `src/components/WorkItemStats.tsx`
  - Add card to `StoryViewer.tsx`

### Build Pipeline Statistics

- **Priority**: 🟡 Medium
- **Effort**: M
- **Description**: Show build success rates and durations
- **API Endpoint**: `/{project}/_apis/build/builds`
- **Features to add**:
  - Total builds count
  - Success/failure rate
  - Average build duration
  - Builds triggered by user
- **Files to modify**:
  - Create `src/lib/azure-devops/builds.ts`
  - Update `src/lib/azure-devops/aggregator.ts`
  - Update `src/components/BuildStats.tsx` (currently a stub)

---

## Multi-Repository Support

### Select Multiple Repositories

- **Priority**: 🟡 Medium
- **Effort**: L
- **Description**: Allow users to analyze multiple repositories at once
- **Changes needed**:
  - Update `ConfigForm` to accept multiple repos
  - Aggregate stats across repositories
  - Show per-repo and combined views

### Repository Discovery

- **Priority**: 🟢 Low
- **Effort**: M
- **Description**: Fetch list of available repositories from Azure DevOps
- **API Endpoint**: `/{project}/_apis/git/repositories`
- **Changes needed**:
  - Add repository list fetch
  - Convert repo input to searchable dropdown

---

## Team Analytics

### Team-Wide Statistics

- **Priority**: 🟡 Medium
- **Effort**: L
- **Description**: Generate stats for entire teams, not just individuals
- **Features**:
  - Aggregate stats for all team members
  - Leaderboards (most commits, fastest PR merges)
  - Team productivity trends
  - Collaboration metrics (PRs reviewed for each other)

### Compare Team Members

- **Priority**: 🟢 Low
- **Effort**: M
- **Description**: Side-by-side comparison of developer stats
- **Features**:
  - Select 2-4 team members to compare
  - Radar chart visualization
  - Complementary skill identification

---

## Historical Analysis

### Year-over-Year Comparison

- **Priority**: 🟡 Medium
- **Effort**: M
- **Description**: Compare current year stats with previous years
- **Features**:
  - Show growth/decline percentages
  - Trend charts over multiple years
  - "Your best year ever!" celebrations

### Monthly Trend View

- **Priority**: 🟢 Low
- **Effort**: S
- **Description**: Line charts showing monthly trends within a year
- **Features**:
  - Commits per month trend line
  - PRs per month trend line
  - Identify seasonal patterns

---

## Sharing & Social

### Social Sharing Images

- **Priority**: 🟡 Medium
- **Effort**: M
- **Description**: Generate shareable images for social media
- **Implementation options**:
  - Use `@vercel/og` for server-side image generation
  - Canvas-based client-side generation
- **Features**:
  - Instagram story format
  - Twitter/LinkedIn card format
  - Custom branding options

### PDF Report Generation

- **Priority**: 🟢 Low
- **Effort**: M
- **Description**: Generate downloadable PDF reports
- **Implementation**:
  - Use react-pdf or puppeteer
  - Include all stats and charts
  - Professional formatting

---

## User Experience

### Progressive Web App (PWA)

- **Priority**: 🟢 Low
- **Effort**: S
- **Description**: Add PWA support for offline access
- **Features**:
  - Install to home screen
  - Cache static assets
  - Offline viewing of last fetched stats

### Custom Themes

- **Priority**: 🟢 Low
- **Effort**: S
- **Description**: Let users customize the color scheme
- **Features**:
  - Light/dark mode toggle (partially exists)
  - Custom accent colors
  - Organization branding

### Onboarding Tutorial

- **Priority**: 🟢 Low
- **Effort**: S
- **Description**: Guided tour for first-time users
- **Features**:
  - Explain how to get PAT token
  - Highlight key features
  - Tips for reading stats

---

## Performance & Caching

### API Response Caching

- **Priority**: 🟡 Medium
- **Effort**: M
- **Description**: Cache Azure DevOps API responses
- **Implementation**:
  - Server-side caching with TTL
  - IndexedDB for client-side caching
  - Stale-while-revalidate pattern

### Incremental Data Loading

- **Priority**: 🟢 Low
- **Effort**: M
- **Description**: Show stats as they load instead of waiting for all data
- **Features**:
  - Stream commits as they're fetched
  - Progressive rendering of stats
  - Show skeleton for pending sections

---

## Analytics & Insights

### AI-Powered Insights

- **Priority**: 🟢 Low
- **Effort**: L
- **Description**: Use AI to generate narrative insights
- **Features**:
  - Natural language summary of year
  - Personalized recommendations
  - Pattern recognition in coding habits

### Usage Analytics

- **Priority**: 🟢 Low
- **Effort**: S
- **Description**: Track how users use the app (with consent)
- **Implementation**:
  - Anonymous usage metrics
  - Popular features tracking
  - Error rate monitoring

---

## Testing & Quality

### Unit Tests

- **Priority**: 🟡 Medium
- **Effort**: M
- **Description**: Add comprehensive test coverage
- **Scope**:
  - Azure DevOps client functions
  - Aggregator logic
  - React component tests

### E2E Tests

- **Priority**: 🟢 Low
- **Effort**: M
- **Description**: End-to-end testing with Playwright or Cypress
- **Scope**:
  - Full user flow testing
  - Mock Azure DevOps API
  - Visual regression testing

---

## Contributing

To work on any of these enhancements:

1. Check if there's an open issue for the feature
2. Comment your intent to work on it
3. Follow the patterns in existing code
4. Submit a PR with tests where applicable

See [plan.md](./plan.md) for architecture overview and [.github/copilot-instructions.md](.github/copilot-instructions.md) for coding guidelines.
