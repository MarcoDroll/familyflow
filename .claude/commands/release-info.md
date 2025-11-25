---
description: Show current release information and status
---

# Release Information

Display current version information and release status for FamilyFlow.

## Information to gather and display:

1. **Current Version:**
   - Get from `git describe --tags --abbrev=0`
   - Get from `VERSION` file
   - Get from `public-addon/familyflow/config.yaml`
   - Verify all three match

2. **Latest Docker Images:**
   - Check Docker Hub for latest tag
   - Show available image tags
   - Display: `https://hub.docker.com/r/marcodroll/familyflow/tags`

3. **Git Status:**
   - Show uncommitted changes in main repo
   - Show uncommitted changes in public-addon
   - Display last commit message
   - Show recent tags

4. **Release Readiness:**
   - Check if Docker is running
   - Check if buildx is available
   - Check if user is logged into Docker Hub
   - Verify public-addon submodule is present and up to date

5. **Recent Releases:**
   - List last 5 git tags with dates
   - Show what changed in each (from CHANGELOG.md)

## Display format:

```
FamilyFlow Release Status
========================

Current Version: 1.0.14
Docker Images:
  - marcodroll/familyflow:1.0.14
  - marcodroll/familyflow:latest

Repository Status:
  Main Repo: ✓ Clean
  Addon Repo: ✓ Clean
  
Release Tools:
  Docker: ✓ Running
  Buildx: ✓ Available
  Docker Hub: ✓ Logged in

Recent Releases:
  v1.0.14 - 2025-01-24 - Fix API URL configuration
  v1.0.13 - 2025-01-24 - Add database backup mechanism
  v1.0.12 - 2025-01-24 - Add overdue task tracking

Ready to release: ✓ YES
```

## Commands to run:

```bash
# Version info
git describe --tags --abbrev=0
cat VERSION
grep "^version:" public-addon/familyflow/config.yaml

# Git status
git status --short
cd public-addon && git status --short

# Docker status
docker info
docker buildx ls
docker images marcodroll/familyflow

# Recent tags
git tag --sort=-creatordate | head -5
```
