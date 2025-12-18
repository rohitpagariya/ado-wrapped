# Azure DevOps Wrapped 🎁

Your year in code — discover insights, stats, and achievements from your Azure DevOps repositories.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## What is this?

Azure DevOps Wrapped generates personalized "year in review" summaries for Azure DevOps users, similar to Spotify Wrapped. Enter your Azure DevOps details, and get beautiful visualizations of your commits, pull requests, coding patterns, and developer personality insights.

**Key Features:**

- 📊 Commit and PR statistics with interactive charts
- 🔥 Streak tracking and time-of-day patterns
- 🌙 Developer personality insights (Night Owl, Early Bird, etc.)
- 📥 Export to JSON or Markdown
- 🔒 Privacy-first: your PAT never leaves your session

---

## Quick Start

### Prerequisites

- Node.js 18+
- Azure DevOps account with a [Personal Access Token (PAT)](#getting-a-pat)

### Run Locally

```bash
# Clone and install
git clone https://github.com/yourusername/ado-wrapped.git
cd ado-wrapped
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

#### Two Usage Modes:

**1. Auto-Configuration (Recommended for Development)**

Fill in all required values in `.env`:

```bash
# Copy example and edit with your values
cp .env.example .env
# Edit .env with your ADO_ORGANIZATION, ADO_PROJECT, ADO_REPOSITORY, ADO_PAT, ADO_YEAR
```

When all values are present, the app will:

- ✅ Skip the landing page form
- ✅ Automatically fetch and display stats
- ✅ Use server-side PAT (never sent to browser)

**2. Manual Configuration (Default)**

If `.env` is missing or incomplete:

- ❌ Shows the configuration form on landing page
- 👤 Users enter their own PAT and details
- 🔒 PAT stored only in browser session

### Getting a PAT

1. Go to Azure DevOps → **User Settings** → **Personal Access Tokens**
2. Click **New Token**
3. Set scopes: **Code (Read)** and **Pull Requests (Read)**
4. Copy the token (you won't see it again)

---

## Using the App

1. **Enter your details** on the landing page:

   - Organization, Project, Repository
   - Year to analyze
   - Your PAT (stored only in browser session)

2. **View your Wrapped** — swipe or use arrow keys to navigate through stats cards

3. **Export** — download your stats as JSON or Markdown

---

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run test:api     # Test Azure DevOps integration
npm run cache:stats  # Show cache statistics
npm run cache:clear  # Clear API response cache
```

### API Response Caching

To speed up development and reduce API load, all Azure DevOps API responses are automatically cached to `.ado-cache/` directory as JSON files. The cache is:

- **Enabled by default** for all API requests
- **Keyed** by URL and request parameters (deterministic)
- **Transparent** — same response whether cached or fresh
- **Persistent** across development sessions
- **Git-ignored** (not committed to repo)

**Cache management:**

```bash
# View cache statistics
npm run cache:stats

# Clear all cached responses (useful when debugging data issues)
npm run cache:clear
```

To disable caching programmatically, set `enableCache: false` when creating the Azure DevOps client:

```typescript
const client = new AzureDevOpsClient({
  organization: "myorg",
  pat: "mytoken",
  enableCache: false, // Disable caching
});
```

### Debugging

If the app gets stuck on "Fetching data" or you encounter errors, comprehensive logging is built in:

**View logs in your terminal** running `npm run dev`:

```
[1702835400000] 🚀 API Request started
[1702835400000] 🔑 PAT present: true
[1702835400000] 📋 Parameters: { organization: 'microsoft', ... }
📜 fetchCommits: Starting for microsoft/vscode/vscode-repo
🌐 GET /_apis/git/repositories/vscode-repo/commits
✅ Cache HIT for /_apis/git/repositories/vscode-repo/commits
✅ API response received in 1234ms
🎉 Request completed successfully in 2385ms
```

**Common Issues:**

| Issue                 | Log to Look For                    | Solution                          |
| --------------------- | ---------------------------------- | --------------------------------- |
| Stuck on loading      | Last log before it stops           | Check network/credentials         |
| Authentication failed | `❌ 401` or `🔑 Authentication`    | Verify PAT token                  |
| Resource not found    | `❌ 404`                           | Check org/project/repo names      |
| Rate limiting         | `❌ 429`                           | Wait and retry, or use cache      |
| Slow performance      | `⏱️ API response received in XXms` | Large repo or network issue       |
| Empty data            | `Commits: 0, PRs: 0`               | Check date range and user filters |

**Emoji Log Key:** 🚀 Request | 🔑 Auth | 📋 Params | 🌐 HTTP | ✅ Success | ❌ Error | ⚪ Cache miss | 💾 Cache write | 🎉 Complete

### Project Structure

```
src/
├── app/              # Next.js App Router pages and API
├── components/       # React components (UI, charts, stats)
├── lib/azure-devops/ # Azure DevOps API client
├── hooks/            # Custom React hooks
└── types/            # TypeScript types
```

See [plan.md](plan.md) for architecture details.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the [coding guidelines](.github/copilot-instructions.md)
4. Run `npm run type-check` to ensure no TypeScript errors
5. Submit a Pull Request

### Future Enhancements

Check [tasks.md](tasks.md) for planned features like:

- Work Items integration
- Build pipeline statistics
- Multi-repository support
- Team analytics

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:

- **Vercel** (recommended)
- **Azure App Service**
- **Docker**

---

## Documentation

| Document                                                           | Description                             |
| ------------------------------------------------------------------ | --------------------------------------- |
| [plan.md](plan.md)                                                 | Architecture and implementation details |
| [tasks.md](tasks.md)                                               | Future enhancements and roadmap         |
| [DEPLOYMENT.md](DEPLOYMENT.md)                                     | Deployment guides                       |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Coding guidelines                       |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Made with ❤️ for the Azure DevOps community
