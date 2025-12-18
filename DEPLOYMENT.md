# Deployment Guide

This guide covers various deployment options for Azure DevOps Wrapped.

## Table of Contents

- [Vercel (Recommended)](#vercel-recommended)
- [Azure App Service](#azure-app-service)
- [Docker Container](#docker-container)
- [Environment Variables](#environment-variables)

---

## Vercel (Recommended)

Vercel provides the easiest deployment experience for Next.js applications with zero configuration.

### Prerequisites

- Vercel account (free tier available)
- GitHub account with repository access

### Deployment Steps

#### Option 1: Using Vercel Dashboard (Easiest)

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**

   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration
   - Click "Deploy"

3. **Done!** Your app is now live at `https://your-project.vercel.app`

#### Option 2: Using Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   # Development deployment
   vercel

   # Production deployment
   vercel --prod
   ```

### Post-Deployment

- Your app will be available at `https://your-project-name.vercel.app`
- Every push to `main` branch triggers automatic deployment
- Preview deployments are created for pull requests

### Custom Domain

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

---

## Azure App Service

Deploy to Azure App Service for tight integration with Azure DevOps.

### Prerequisites

- Azure account with active subscription
- Azure CLI installed (`az`)

### Deployment Steps

#### 1. Login to Azure

```bash
az login
```

#### 2. Create Resource Group

```bash
az group create \
  --name rg-devops-wrapped \
  --location eastus
```

#### 3. Create App Service Plan

```bash
az appservice plan create \
  --name asp-devops-wrapped \
  --resource-group rg-devops-wrapped \
  --is-linux \
  --sku B1
```

#### 4. Create Web App

```bash
az webapp create \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped \
  --plan asp-devops-wrapped \
  --runtime "NODE:20-lts"
```

#### 5. Configure Deployment

**Option A: Deploy from Local Git**

```bash
# Configure local Git deployment
az webapp deployment source config-local-git \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped

# Add Azure remote
git remote add azure <GIT_URL>

# Deploy
git push azure main
```

**Option B: Deploy from GitHub**

```bash
az webapp deployment source config \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped \
  --repo-url https://github.com/yourusername/ado-wrapped \
  --branch main \
  --manual-integration
```

#### 6. Configure Startup Command

```bash
az webapp config set \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped \
  --startup-file "npm start"
```

#### 7. Set Build Configuration

```bash
# Enable build automation
az webapp config appsettings set \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Access Your App

Your app will be available at: `https://ado-wrapped-app.azurewebsites.net`

### Configure Custom Domain

1. Go to Azure Portal
2. Navigate to your App Service
3. Select "Custom domains"
4. Add and verify your domain
5. Configure SSL/TLS binding

---

## Docker Container

Deploy as a Docker container to any platform supporting containers.

### Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t ado-wrapped .

# Run container
docker run -p 3000:3000 ado-wrapped
```

### Deploy to Azure Container Instances

```bash
# Create container registry
az acr create \
  --resource-group rg-devops-wrapped \
  --name adowrappedacr \
  --sku Basic

# Login to registry
az acr login --name adowrappedacr

# Tag and push image
docker tag ado-wrapped adowrappedacr.azurecr.io/ado-wrapped:latest
docker push adowrappedacr.azurecr.io/ado-wrapped:latest

# Deploy container
az container create \
  --resource-group rg-devops-wrapped \
  --name ado-wrapped-container \
  --image adowrappedacr.azurecr.io/ado-wrapped:latest \
  --dns-name-label ado-wrapped \
  --ports 3000
```

### Deploy to AWS ECS

1. Push image to Amazon ECR
2. Create ECS cluster
3. Define task definition
4. Create service

### Deploy to Google Cloud Run

```bash
# Build and deploy in one command
gcloud run deploy ado-wrapped \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Environment Variables

### Production Environment Variables

No environment variables are required for the application to run. All configuration is provided by users through the web interface.

However, you may want to configure:

#### Optional: Custom Configuration

Create a `.env.production` file (not committed to git):

```env
# Optional: Default organization (pre-fills form)
NEXT_PUBLIC_DEFAULT_ORG=your-org

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Platform-Specific Configuration

#### Vercel

Set environment variables in Project Settings > Environment Variables

#### Azure App Service

```bash
az webapp config appsettings set \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped \
  --settings SETTING_NAME=value
```

#### Docker

Pass environment variables when running container:

```bash
docker run -p 3000:3000 \
  -e SETTING_NAME=value \
  ado-wrapped
```

---

## CI/CD Pipeline

### GitHub Actions (Vercel)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### Azure DevOps Pipeline

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: "ubuntu-latest"

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "20.x"
    displayName: "Install Node.js"

  - script: |
      npm ci
      npm run build
    displayName: "Install and Build"

  - task: AzureWebApp@1
    inputs:
      azureSubscription: "Azure-Subscription"
      appName: "ado-wrapped-app"
      package: "."
    displayName: "Deploy to Azure App Service"
```

---

## Monitoring and Logs

### Vercel

- View logs in Vercel Dashboard
- Real-time function logs
- Performance analytics included

### Azure App Service

```bash
# Stream logs
az webapp log tail \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped

# Download logs
az webapp log download \
  --name ado-wrapped-app \
  --resource-group rg-devops-wrapped
```

### Docker

```bash
# View container logs
docker logs <container-id>

# Follow logs
docker logs -f <container-id>
```

---

## Troubleshooting

### Build Failures

1. **Check Node.js version**: Ensure Node.js 18+ is being used
2. **Clear build cache**: Try `npm run build` locally first
3. **Check dependencies**: Run `npm ci` to ensure clean install

### Runtime Errors

1. **Check logs** in your deployment platform
2. **Verify API routes** are accessible
3. **Test locally** with `npm run build && npm start`

### Performance Issues

1. **Enable caching** for static assets
2. **Use CDN** for global distribution
3. **Optimize images** in the public folder

---

## Security Considerations

### Important Notes

- Never commit `.env` files containing secrets
- PAT tokens are only used client-side and never stored server-side
- All API calls use user-provided credentials
- No user data is persisted on the server

### Recommended Security Headers

Configure security headers in `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};
```

---

## Support

For deployment issues:

1. Check the [GitHub Issues](https://github.com/yourusername/ado-wrapped/issues)
2. Review the [README.md](./README.md) for general setup
3. Contact the maintainers

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
