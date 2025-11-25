# Manual Release Process

This repository includes scripts for manually building and releasing new versions of FamilyFlow.

## Prerequisites

1. **Docker** must be installed and running
2. **Docker Buildx** must be configured for multi-platform builds:
   ```bash
   docker buildx create --use --name mybuilder
   ```
3. **Git** must be configured with your credentials
4. **Docker Hub** login:
   ```bash
   docker login
   ```
5. **Public addon repo** must be cloned as a submodule at `public-addon/`

## Release Scripts

### For Linux/Mac/Git Bash (Windows):
```bash
./release.sh
```

### For Windows PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File release.ps1
```

## What the Script Does

1. **Gets current version** from git tags
2. **Prompts for version bump type**:
   - Patch (1.0.0 → 1.0.1) - Bug fixes
   - Minor (1.0.0 → 1.1.0) - New features
   - Major (1.0.0 → 2.0.0) - Breaking changes
   - Custom - Enter any version
3. **Builds Docker images** for linux/amd64 and linux/arm64
4. **Pushes images** to Docker Hub:
   - `marcodroll/familyflow:X.Y.Z`
   - `marcodroll/familyflow:latest`
5. **Updates VERSION file** in main repo
6. **Updates config.yaml** in addon repo with new version
7. **Updates CHANGELOG.md** with release entry
8. **Commits and tags** both repositories
9. **Pushes** all changes and tags to GitHub

## Example Usage

```bash
$ ./release.sh

========================================
   FamilyFlow Manual Release Script    
========================================

Current version: 1.0.14

Select version bump type:
  1) Patch (bug fixes)      : 1.0.14 -> 1.0.15
  2) Minor (new features)   : 1.0.14 -> 1.1.0
  3) Major (breaking changes): 1.0.14 -> 2.0.0
  4) Custom version
  5) Cancel

Choice [1-5]: 1

New version will be: 1.0.15

Continue with release? [y/N]: y

Step 1: Building Docker images...
[Docker build output...]
✓ Docker images built and pushed

Step 2: Updating VERSION file...
✓ VERSION file updated

Step 3: Updating addon config.yaml...
✓ config.yaml updated

Step 4: Updating CHANGELOG...
✓ CHANGELOG updated

Step 5: Committing and tagging main repo...
✓ Main repo committed and tagged

Step 6: Committing and tagging public addon repo...
✓ Public addon repo committed and tagged

========================================
       Release Complete! 🎉           
========================================

Version: 1.0.15
Docker images:
  - marcodroll/familyflow:1.0.15
  - marcodroll/familyflow:latest
```

## Verifying the Release

After running the script:

1. **Check Docker Hub**: https://hub.docker.com/r/marcodroll/familyflow
   - Verify tags: `1.0.15` and `latest`
   - Check build date and platforms

2. **Check GitHub repositories**:
   - Main repo: https://github.com/MarcoDroll/familyflow
   - Addon repo: https://github.com/MarcoDroll/familyflow-addon
   - Verify tags and commits appear

3. **Test in Home Assistant**:
   - Go to Settings → Add-ons → Check for updates
   - Update should show version 1.0.15
   - Install and verify functionality

## Troubleshooting

### Docker build fails
```bash
# Check Docker is running
docker info

# Check buildx is available
docker buildx ls

# Create new builder if needed
docker buildx create --use --name mybuilder
```

### Push fails (authentication)
```bash
# Login to Docker Hub
docker login

# Verify credentials
docker info | grep Username
```

### Git push fails
```bash
# Check you're logged in
git config user.name
git config user.email

# Check remote URLs
git remote -v

# Pull latest changes first
git pull --rebase
```

### Submodule not found
```bash
# Initialize submodule
git submodule update --init --recursive

# Or clone manually
cd public-addon
git clone https://github.com/MarcoDroll/familyflow-addon.git .
```

## Manual Process (Without Script)

If you need to do it manually:

```bash
# 1. Set version
NEW_VERSION="1.0.15"

# 2. Build and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --file Dockerfile.addon \
  --tag marcodroll/familyflow:${NEW_VERSION} \
  --tag marcodroll/familyflow:latest \
  --push \
  .

# 3. Update VERSION file
echo "$NEW_VERSION" > VERSION

# 4. Update config.yaml
cd public-addon/familyflow
sed -i "s/^version: .*/version: \"${NEW_VERSION}\"/" config.yaml

# 5. Update CHANGELOG.md (manually edit)
nano CHANGELOG.md

# 6. Commit and tag
cd ../../
git add VERSION public-addon/familyflow/config.yaml public-addon/familyflow/CHANGELOG.md
git commit -m "Release v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
git push origin main
git push origin "v${NEW_VERSION}"

# 7. Commit addon repo
cd public-addon
git add familyflow/config.yaml familyflow/CHANGELOG.md
git commit -m "Release v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
git push origin main
git push origin "v${NEW_VERSION}"
```

## CI/CD Workflow

Note: The repository also has automated releases via GitHub Actions when you push to `main`:
- Automatically increments patch version
- Builds and pushes Docker images
- Updates addon repository

The manual release scripts are useful when you want:
- Control over version numbers (minor/major bumps)
- Local testing before pushing
- Quick releases without waiting for CI/CD
- Override the automatic versioning
