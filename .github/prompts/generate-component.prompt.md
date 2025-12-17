# Generate React Component

Create a new React component following our project conventions.

## Instructions

Generate a TypeScript React functional component with:

1. **Props interface** - Define typed props with JSDoc comments
2. **Functional component** - Use `React.FC` with proper typing
3. **Hooks** - Use appropriate React hooks (useState, useEffect, etc.)
4. **Error handling** - Include error boundaries or error states
5. **Loading states** - Handle async operations with loading indicators
6. **Accessibility** - Include ARIA labels and keyboard support

## Template

```typescript
import React, { useState, useEffect } from 'react';

interface {{ComponentName}}Props {
  /** Description of the prop */
  propName: PropType;
}

/**
 * {{ComponentName}} - Brief description of what the component does
 */
export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ propName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Side effects here
  }, [propName]);

  if (isLoading) {
    return <div aria-busy="true">Loading...</div>;
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

## Checklist

- [ ] Props are properly typed
- [ ] Component has meaningful name
- [ ] Loading and error states handled
- [ ] Accessibility attributes included
- [ ] Component is exported
