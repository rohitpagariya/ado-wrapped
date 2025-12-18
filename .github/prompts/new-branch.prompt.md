---
name: new-branch
description: Create a new Git branch by switching to main/master, pulling latest changes, and checking out a new branch
---

# Create New Branch

Please create a new branch following these steps:

1. Check for any uncommitted changes
2. Switch to the default branch (try `main` first, fall back to `master` if it doesn't exist)
3. Pull the latest changes from the remote repository
4. Create a new branch with the name: {{branchName}}

If I haven't provided a branch name, please ask me for one before proceeding.

## Expected Commands

```bash
# Check for uncommitted changes
git status

# Switch to default branch and update
git checkout main && git pull origin main || (git checkout master && git pull origin master)

# Create new branch
git checkout -b <branch-name>
```

Make sure to handle any errors gracefully and inform me if any step fails. If there are uncommitted changes, ask whether to stash them before proceeding.
