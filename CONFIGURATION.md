# Configuration Guide

## Overview

ADO Wrapped uses environment variables for configuration. This approach is:

- ✅ **Secure**: Sensitive data like PAT tokens never get committed
- ✅ **Simple**: One file to manage all settings
- ✅ **Standard**: Works seamlessly with Azure Static Web Apps and other hosting platforms
- ✅ **Flexible**: Easy to override for different environments

## Quick Start

1. **Copy the example file:**

   ```bash
   copy .env.example .env
   ```

2. **Edit `.env` with your credentials:**

   ```env
   ADO_ORGANIZATION=your-organization
   ADO_PROJECT=your-project
   ADO_REPOSITORY=your-repository
   ADO_PAT=your-pat-token-here
   ```

3. **Test the configuration:**
   ```bash
   npm run test:api
   ```

## Required Variables

| Variable           | Description                                                      | Example       |
| ------------------ | ---------------------------------------------------------------- | ------------- |
| `ADO_ORGANIZATION` | Your Azure DevOps organization name                              | `microsoft`   |
| `ADO_PROJECT`      | Project name to analyze                                          | `vscode`      |
| `ADO_REPOSITORY`   | Repository name to analyze                                       | `vscode-main` |
| `ADO_PAT`          | Personal Access Token with Code (Read) and PR (Read) permissions | `abc123...`   |

### Getting Your Personal Access Token (PAT)

1. Go to `https://dev.azure.com/{your-organization}/_usersSettings/tokens`
2. Click "New Token"
3. Set a name (e.g., "ADO Wrapped")
4. Select these scopes:
   - **Code**: Read
   - **Pull Request Threads**: Read
5. Click "Create"
6. Copy the token and paste it into your `.env` file

⚠️ **Important**: Save your PAT immediately - you won't be able to see it again!

## Optional Variables

### Filtering

| Variable         | Description                   | Default      | Example            |
| ---------------- | ----------------------------- | ------------ | ------------------ |
| `ADO_USER_EMAIL` | Filter by specific user email | All users    | `john@contoso.com` |
| `ADO_YEAR`       | Year to analyze               | Current year | `2024`             |

### Feature Flags

| Variable                    | Description                              | Default |
| --------------------------- | ---------------------------------------- | ------- |
| `ADO_INCLUDE_COMMITS`       | Include commit data                      | `true`  |
| `ADO_INCLUDE_PULL_REQUESTS` | Include PR data                          | `true`  |
| `ADO_INCLUDE_WORK_ITEMS`    | Include work items (not yet implemented) | `false` |
| `ADO_INCLUDE_BUILDS`        | Include builds (not yet implemented)     | `false` |

### Application Settings

| Variable          | Description              | Default |
| ----------------- | ------------------------ | ------- |
| `PORT`            | Development server port  | `3000`  |
| `ADO_API_VERSION` | Azure DevOps API version | `7.0`   |

## Example Configurations

### Analyze All Users

```env
ADO_ORGANIZATION=contoso
ADO_PROJECT=MainProject
ADO_REPOSITORY=web-app
ADO_PAT=your-token-here
ADO_YEAR=2024
```

### Analyze Specific User

```env
ADO_ORGANIZATION=contoso
ADO_PROJECT=MainProject
ADO_REPOSITORY=web-app
ADO_PAT=your-token-here
ADO_YEAR=2024
ADO_USER_EMAIL=jane.doe@contoso.com
```

### Production Deployment

For Azure Static Web Apps or other platforms, set these as application settings or environment variables in your hosting platform's dashboard.

## Security Best Practices

### ✅ DO:

- Keep `.env` file in `.gitignore` (already configured)
- Use a dedicated PAT with minimal required permissions
- Set an expiration date on your PAT
- Rotate your PAT periodically
- Use different PATs for development and production

### ❌ DON'T:

- Commit `.env` to version control
- Share your PAT with others
- Use PATs with admin or write permissions
- Store PATs in code or documentation
- Reuse PATs across multiple applications

## Programmatic Usage

### Load Configuration

```typescript
import { loadAndValidateConfig } from "./src/lib/config";

const config = loadAndValidateConfig();
// Exits with error if configuration is invalid
```

### Manual Validation

```typescript
import { loadConfig, validateConfig } from "./src/lib/config";

const config = loadConfig();
const validation = validateConfig(config);

if (!validation.valid) {
  console.error("Configuration errors:", validation.errors);
}
```

### Print Configuration (Safe)

```typescript
import { printConfig } from "./src/lib/config";

printConfig(config);
// Prints config with PAT masked: ADO_PAT: ***4f2a
```

## Troubleshooting

### "Configuration Error: ADO_PAT is required"

**Solution**: Copy `.env.example` to `.env` and set your PAT token.

### "Authentication failed"

**Possible causes**:

- PAT token is expired
- PAT token doesn't have required permissions
- PAT token is invalid

**Solution**: Generate a new PAT with Code (Read) and Pull Request Threads (Read) permissions.

### "Resource not found"

**Possible causes**:

- Organization, project, or repository name is incorrect
- Repository is in a different project
- You don't have access to the repository

**Solution**: Verify the names match exactly what's shown in Azure DevOps URL.

### Environment Variables Not Loading

**Possible causes**:

- `.env` file is in the wrong location (should be in project root)
- File is named incorrectly (must be `.env`, not `env` or `.env.txt`)

**Solution**: Ensure `.env` is in `c:\code\work\ado-wrapped\.env`

## Migration from config.json

If you were using the old `config.json` format, here's how to migrate:

**Old (`config.json`):**

```json
{
  "azureDevOps": {
    "organization": "contoso",
    "project": "MainProject",
    "repository": "web-app",
    "pat": "abc123...",
    "userEmail": "user@contoso.com"
  },
  "settings": {
    "year": 2024
  }
}
```

**New (`.env`):**

```env
ADO_ORGANIZATION=contoso
ADO_PROJECT=MainProject
ADO_REPOSITORY=web-app
ADO_PAT=abc123...
ADO_USER_EMAIL=user@contoso.com
ADO_YEAR=2024
```

Then delete your `config.json` file as it's no longer needed.
