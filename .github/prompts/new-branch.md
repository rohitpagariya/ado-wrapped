---
title: Create New Branch
description: Switch to main/master, pull latest changes, and create a new branch
---

# Create New Branch

Please create a new branch following these steps:

1. Switch to the main branch (try `main` first, fall back to `master` if it doesn't exist)
2. Fetch the latest changes from the remote repository
3. Pull the latest changes to update the local main/master branch
4. Create a new branch with the name: {{branchName}}

If I haven't provided a branch name, please ask me for one before proceeding.

## Expected Commands

```bash
git checkout main || git checkout master
git fetch
git pull
git checkout -b <branch-name>
```

Make sure to handle any errors gracefully and inform me if any step fails.
