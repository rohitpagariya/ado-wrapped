# Azure DevOps Wrapped 🎁

> Your year in code - discover insights, stats, and achievements from your Azure DevOps repositories

Azure DevOps Wrapped is a Next.js web application that generates personalized "year in review" summaries for Azure DevOps users. It connects to the Azure DevOps REST API to fetch user activity data and presents it in an engaging, visual format similar to Spotify Wrapped.

## ✨ Features

- **📊 Comprehensive Statistics**: View commit counts, line changes, pull request metrics, and more
- **🎨 Beautiful Visualizations**: Interactive charts and graphs for your coding activity
- **🔥 Streak Tracking**: See your longest commit streaks and consistency patterns
- **🌙 Personality Insights**: Discover if you're a "Night Owl", "Early Bird", or "Nine-to-Fiver"
- **📈 Time Analytics**: Analyze your coding patterns by hour, day, and month
- **📥 Export Options**: Download your stats as JSON or Markdown
- **🔒 Privacy First**: Your PAT and data never leave your browser or the server session
- **📱 Mobile Responsive**: Works beautifully on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- An Azure DevOps account with a Personal Access Token (PAT)
- Access to an Azure DevOps organization, project, and repository

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ado-wrapped.git
   cd ado-wrapped
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Creating an Azure DevOps Personal Access Token (PAT)

1. Sign in to your Azure DevOps organization
2. Go to **User Settings** → **Personal Access Tokens**
3. Click **New Token**
4. Configure the token:
   - **Name**: ADO Wrapped
   - **Expiration**: Choose a duration
   - **Scopes**: Select the following:
     - **Code**: Read
     - **Pull Requests**: Read
     - **Work Items**: Read (optional)
     - **Build**: Read (optional)
5. Click **Create** and copy the token immediately (you won't be able to see it again)

### Using the Application

1. Open the application
2. Fill in the configuration form:
   - **Personal Access Token**: Your Azure DevOps PAT
   - **Organization**: Your Azure DevOps organization name (e.g., "microsoft")
   - **Project**: Your project name (e.g., "vscode")
   - **Repository**: Your repository name (e.g., "vscode")
   - **Year**: The year you want to analyze (e.g., 2024)
   - **User Email** (optional): Filter by specific user email
3. Click **Generate My Wrapped**
4. Wait for the data to be fetched and aggregated
5. View your stats and export them if desired

## 📁 Project Structure

```
ado-wrapped/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── stats/
│   │   │       └── route.ts          # Next.js API route for stats
│   │   ├── page.tsx                   # Landing page with config form
│   │   ├── wrapped/
│   │   │   └── page.tsx               # Stats dashboard page
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css                # Global styles
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   └── ConfigForm.tsx             # Configuration form
│   ├── lib/
│   │   ├── azure-devops/
│   │   │   ├── client.ts              # Azure DevOps API client
│   │   │   ├── commits.ts             # Commits fetcher
│   │   │   ├── pullRequests.ts        # Pull requests fetcher
│   │   │   ├── aggregator.ts          # Stats aggregation
│   │   │   └── types.ts               # API types
│   │   ├── export.ts                  # Export utilities
│   │   └── utils.ts                   # Utility functions
│   └── types/
│       └── index.ts                   # TypeScript types
├── public/                            # Static assets
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
└── package.json                       # Dependencies and scripts
```

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

## 🌐 Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm i -g vercel
vercel
```

Follow the prompts and your app will be live in minutes!

### Deploy to Azure App Service

1. **Install Azure CLI** (if not already installed)

2. **Login to Azure**

   ```bash
   az login
   ```

3. **Create an App Service**

   ```bash
   az group create --name rg-ado-wrapped --location eastus

   az appservice plan create \
     --name asp-ado-wrapped \
     --resource-group rg-ado-wrapped \
     --is-linux \
     --sku B1

   az webapp create \
     --name ado-wrapped \
     --resource-group rg-ado-wrapped \
     --plan asp-ado-wrapped \
     --runtime "NODE:20-lts"
   ```

4. **Deploy from GitHub**
   ```bash
   az webapp deployment source config \
     --name ado-wrapped \
     --resource-group rg-ado-wrapped \
     --repo-url https://github.com/yourusername/ado-wrapped \
     --branch main \
     --manual-integration
   ```

### Deploy with Docker

```dockerfile
# Build the image
docker build -t ado-wrapped .

# Run the container
docker run -p 3000:3000 ado-wrapped
```

## 📊 API Reference

### GET /api/stats

Fetches and aggregates statistics from Azure DevOps.

**Headers:**

- `Authorization: Bearer <PAT>`

**Query Parameters:**

- `organization` (required): Azure DevOps organization name
- `project` (required): Project name
- `repository` (required): Repository name
- `year` (required): Year to analyze
- `userEmail` (optional): Filter by user email

**Response:**

```json
{
  "meta": {
    "organization": "string",
    "project": "string",
    "repository": "string",
    "year": 2024,
    "generatedAt": "2024-12-17T10:00:00Z"
  },
  "commits": {
    "total": 150,
    "additions": 5000,
    "deletions": 2000,
    "longestStreak": 14,
    "byMonth": { "1": 10, "2": 15, ... },
    "byDayOfWeek": { "Monday": 30, ... },
    "byHour": { "9": 10, "10": 15, ... }
  },
  "pullRequests": {
    "created": 25,
    "merged": 20,
    "reviewed": 30
  },
  "insights": {
    "personality": "Night Owl",
    "busiestMonth": "November",
    "favoriteCommitHour": 14
  }
}
```

## 🛡️ Security & Privacy

- **No Data Storage**: Your PAT and statistics are never stored on the server
- **Session Only**: Configuration is stored in browser sessionStorage and cleared when you close the tab
- **Direct API Calls**: All Azure DevOps API calls go directly through the Next.js API route
- **No Tracking**: No analytics or tracking of any kind

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Spotify Wrapped](https://www.spotify.com/wrapped/)
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the [Azure DevOps REST API documentation](https://docs.microsoft.com/en-us/rest/api/azure/devops/)

---

Made with ❤️ for the Azure DevOps community
