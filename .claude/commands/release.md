---
description: Run the FamilyFlow release script to build and publish a new version
---

# FamilyFlow Release Command

Execute the manual release script to build, tag, and publish a new version of FamilyFlow.

## Steps to perform:

1. **Check prerequisites:**
   - Verify Docker is running: `docker info`
   - Verify buildx is available: `docker buildx ls`
   - Check Docker Hub login status
   - Verify public-addon submodule is present

2. **Get current version:**
   - Run `git describe --tags --abbrev=0` to get the current version
   - Parse the version number (remove 'v' prefix)
   - Display current version to user

3. **Ask user for version bump type:**
   - Use AskUserQuestion tool to prompt:
     - Option 1: Patch (bug fixes)
     - Option 2: Minor (new features)
     - Option 3: Major (breaking changes)
     - Option 4: Custom version
     - Option 5: Cancel
   - Calculate the new version based on their choice
   - If custom, ask them to provide the version number

4. **Confirm with user:**
   - Show the new version that will be created
   - Use AskUserQuestion tool to confirm they want to proceed

5. **Execute the release script:**
   - On Windows: Run `powershell -ExecutionPolicy Bypass -File release.ps1` with the version choice
   - On Linux/Mac: Run `./release.sh` with the version choice
   - Monitor the output and report progress to the user

6. **Handle the script's prompts:**
   - The script will ask for version bump type - pass the user's choice
   - The script will ask for confirmation - pass "y"
   - Monitor for any errors during:
     - Docker build
     - Git operations
     - File updates

7. **Report results:**
   - Show the final version number
   - Display Docker Hub links
   - Display GitHub repo links
   - Remind user to verify the release

## Important Notes:

- The script builds for multiple platforms (amd64, arm64) which takes 5-10 minutes
- All git operations must succeed or the release should be rolled back
- If any step fails, provide clear error messages and recovery steps
- The script updates both the main repo and the public-addon submodule

## Error Handling:

If Docker build fails:
- Check if Docker Desktop is running
- Verify buildx is configured: `docker buildx create --use --name mybuilder`
- Check Docker Hub credentials: `docker login`

If git push fails:
- Pull latest changes: `git pull --rebase`
- Check credentials are configured
- Verify remote URLs are correct

If the script fails midway:
- Check which step failed
- Recommend manual cleanup if needed
- Provide recovery commands
