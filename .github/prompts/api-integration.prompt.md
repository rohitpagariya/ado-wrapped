# Azure DevOps API Integration

Create or modify Azure DevOps API integration code.

## Instructions

When working with the Azure DevOps REST API:

1. **Authentication** - Use PAT token from environment variables
2. **Error handling** - Handle network errors, auth errors, and API errors
3. **Rate limiting** - Implement retry logic with exponential backoff
4. **Typing** - Define TypeScript interfaces for API responses
5. **Pagination** - Handle paginated responses properly

## API Client Template

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

interface AdoConfig {
  organization: string;
  project: string;
  pat: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

class AzureDevOpsClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: AdoConfig) {
    this.baseUrl = `https://dev.azure.com/${config.organization}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${config.pat}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(endpoint);
      return { data: response.data, error: null };
    } catch (error) {
      const axiosError = error as AxiosError;
      return { 
        data: null, 
        error: axiosError.message || 'API request failed' 
      };
    }
  }
}
```

## Common Endpoints

- **Commits**: `/{project}/_apis/git/repositories/{repoId}/commits?api-version=7.0`
- **Pull Requests**: `/{project}/_apis/git/pullrequests?api-version=7.0`
- **Work Items (WIQL)**: `/{project}/_apis/wit/wiql?api-version=7.0`
- **User Profile**: `/_apis/profile/profiles/me?api-version=7.0`
- **Projects**: `/_apis/projects?api-version=7.0`

## Response Type Examples

```typescript
interface AdoCommit {
  commitId: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  comment: string;
}

interface AdoPullRequest {
  pullRequestId: number;
  title: string;
  status: 'active' | 'completed' | 'abandoned';
  createdBy: {
    displayName: string;
    uniqueName: string;
  };
  creationDate: string;
}

interface AdoWorkItem {
  id: number;
  fields: {
    'System.Title': string;
    'System.State': string;
    'System.WorkItemType': string;
  };
}
```

## Checklist

- [ ] Environment variables used for secrets
- [ ] Proper error handling implemented
- [ ] Response types defined
- [ ] API version specified in requests
- [ ] Pagination handled for list endpoints
