# GitHub Copilot Instructions for ADO Wrapped

## Project Overview

ADO Wrapped is a web application that generates personalized "year in review" summaries for Azure DevOps users. It connects to the Azure DevOps REST API to fetch user activity data and presents it in an engaging, visual format.

## Technology Stack

- **Frontend**: React/TypeScript with modern hooks and functional components
- **Backend**: Node.js/Express or Python/FastAPI
- **API Integration**: Azure DevOps REST API
- **Styling**: Tailwind CSS or CSS Modules
- **Testing**: Jest, React Testing Library, pytest

## Code Style Guidelines

### General Principles

- Write clean, readable, and self-documenting code
- Follow DRY (Don't Repeat Yourself) principles
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Add comments only when the code's intent isn't immediately clear

### TypeScript/JavaScript

- Use TypeScript for type safety
- Prefer `const` over `let`, never use `var`
- Use async/await over raw promises
- Destructure objects and arrays when appropriate
- Use optional chaining (`?.`) and nullish coalescing (`??`)

```typescript
// Preferred
const { data, error } = await fetchUserActivity(userId);

// Avoid
fetchUserActivity(userId).then(result => {
  const data = result.data;
  const error = result.error;
});
```

### React Components

- Use functional components with hooks
- Keep components small and composable
- Extract reusable logic into custom hooks
- Use proper prop typing with TypeScript interfaces

```typescript
interface UserStatsProps {
  userId: string;
  year: number;
  onLoad?: () => void;
}

export const UserStats: React.FC<UserStatsProps> = ({ userId, year, onLoad }) => {
  // Component implementation
};
```

### Python (if applicable)

- Follow PEP 8 style guidelines
- Use type hints for function parameters and return values
- Use dataclasses or Pydantic models for data structures
- Prefer f-strings for string formatting

```python
from dataclasses import dataclass

@dataclass
class UserActivity:
    user_id: str
    commits: int
    pull_requests: int
    
def fetch_activity(user_id: str, year: int) -> UserActivity:
    """Fetch user activity from Azure DevOps."""
    pass
```

## Azure DevOps API Patterns

### Authentication

Always use the ADO PAT token from environment variables:

```typescript
const headers = {
  'Authorization': `Basic ${Buffer.from(`:${process.env.ADO_PAT}`).toString('base64')}`,
  'Content-Type': 'application/json'
};
```

### API Endpoints

Common Azure DevOps REST API patterns:

- Organization URL: `https://dev.azure.com/{organization}`
- Project API: `/_apis/projects?api-version=7.0`
- Git Commits: `/{project}/_apis/git/repositories/{repo}/commits`
- Pull Requests: `/{project}/_apis/git/pullrequests`
- Work Items: `/_apis/wit/workitems/{id}`

### Error Handling

Always handle API errors gracefully:

```typescript
try {
  const response = await adoClient.getCommits(userId);
  return { data: response, error: null };
} catch (error) {
  console.error('Failed to fetch commits:', error);
  return { data: null, error: 'Unable to fetch commit data' };
}
```

## Testing Guidelines

- Write unit tests for utility functions and API clients
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for meaningful test coverage, not 100% coverage
- Use descriptive test names that explain the expected behavior

```typescript
describe('UserActivityService', () => {
  it('should return commit count for the specified year', async () => {
    // Test implementation
  });
  
  it('should handle API errors gracefully', async () => {
    // Test implementation
  });
});
```

## Security Best Practices

- Never commit secrets or API tokens
- Always use environment variables for sensitive data
- Validate and sanitize all user inputs
- Use HTTPS for all API communications
- Implement rate limiting for API endpoints

## File Organization

```
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── services/        # API clients and business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── pages/           # Page components (if using Next.js/routing)
└── tests/           # Test files
```

## Common Tasks

When asked to implement features, consider:

1. **Data fetching**: Use the Azure DevOps API client
2. **State management**: Use React hooks or context
3. **Error handling**: Always provide user-friendly error messages
4. **Loading states**: Show appropriate loading indicators
5. **Accessibility**: Ensure components are accessible (ARIA labels, keyboard navigation)
