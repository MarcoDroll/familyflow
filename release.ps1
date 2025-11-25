# FamilyFlow Manual Release Script (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File release.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "   FamilyFlow Manual Release Script    " -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check we're in the right directory
if (-not (Test-Path "VERSION") -or -not (Test-Path "public-addon")) {
    Write-Host "Error: Must run from the famplan repository root" -ForegroundColor Red
    exit 1
}

# Check Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "Error: Docker is not running" -ForegroundColor Red
    exit 1
}

# Get current version from git tags
$gitTag = git describe --tags --abbrev=0 2>$null
if (-not $gitTag) {
    $gitTag = "v1.0.0"
}
$CURRENT_VERSION = $gitTag -replace '^v', ''
Write-Host "Current version: $CURRENT_VERSION" -ForegroundColor Yellow

# Parse version
$parts = $CURRENT_VERSION -split '\.'
$MAJOR = [int]$parts[0]
$MINOR = [int]$parts[1]
$PATCH = [int]$parts[2]

# Ask for version bump type
Write-Host ""
Write-Host "Select version bump type:"
Write-Host "  1) Patch (bug fixes)      : $CURRENT_VERSION -> $MAJOR.$MINOR.$($PATCH + 1)"
Write-Host "  2) Minor (new features)   : $CURRENT_VERSION -> $MAJOR.$($MINOR + 1).0"
Write-Host "  3) Major (breaking changes): $CURRENT_VERSION -> $($MAJOR + 1).0.0"
Write-Host "  4) Custom version"
Write-Host "  5) Cancel"
Write-Host ""
$choice = Read-Host "Choice [1-5]"

switch ($choice) {
    "1" {
        $PATCH++
    }
    "2" {
        $MINOR++
        $PATCH = 0
    }
    "3" {
        $MAJOR++
        $MINOR = 0
        $PATCH = 0
    }
    "4" {
        $NEW_VERSION = Read-Host "Enter new version (e.g., 1.2.3)"
        if ($NEW_VERSION -notmatch '^\d+\.\d+\.\d+$') {
            Write-Host "Invalid version format" -ForegroundColor Red
            exit 1
        }
        $parts = $NEW_VERSION -split '\.'
        $MAJOR = [int]$parts[0]
        $MINOR = [int]$parts[1]
        $PATCH = [int]$parts[2]
    }
    "5" {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

$NEW_VERSION = "$MAJOR.$MINOR.$PATCH"
Write-Host ""
Write-Host "New version will be: $NEW_VERSION" -ForegroundColor Green
Write-Host ""

# Confirm
$confirm = Read-Host "Continue with release? [y/N]"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Building Docker images..." -ForegroundColor Blue
Write-Host "This may take several minutes..."

$IMAGE_NAME = "marcodroll/familyflow"
$PLATFORMS = "linux/amd64,linux/arm64"

docker buildx build `
    --platform $PLATFORMS `
    --file Dockerfile.addon `
    --tag "${IMAGE_NAME}:${NEW_VERSION}" `
    --tag "${IMAGE_NAME}:latest" `
    --push `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker images built and pushed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Updating VERSION file..." -ForegroundColor Blue
Set-Content -Path "VERSION" -Value $NEW_VERSION
git add VERSION
Write-Host "✓ VERSION file updated" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Updating addon config.yaml..." -ForegroundColor Blue
$CONFIG_FILE = "public-addon/familyflow/config.yaml"

if (-not (Test-Path $CONFIG_FILE)) {
    Write-Host "Error: Config file not found: $CONFIG_FILE" -ForegroundColor Red
    exit 1
}

# Update version in config.yaml
$configContent = Get-Content $CONFIG_FILE
$configContent = $configContent -replace '^version: .*', "version: `"$NEW_VERSION`""
Set-Content -Path $CONFIG_FILE -Value $configContent
Write-Host "✓ config.yaml updated" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Updating CHANGELOG..." -ForegroundColor Blue
$CHANGELOG_FILE = "public-addon/familyflow/CHANGELOG.md"
$DATE = Get-Date -Format "yyyy-MM-dd"

$changelogContent = Get-Content $CHANGELOG_FILE
$newChangelog = @()
$newChangelog += $changelogContent[0]
$newChangelog += ""
$newChangelog += "## [$NEW_VERSION] - $DATE"
$newChangelog += ""
$newChangelog += "### Changed"
$newChangelog += ""
$newChangelog += "- Manual release v$NEW_VERSION"
$newChangelog += ""
$newChangelog += $changelogContent[1..($changelogContent.Length - 1)]

Set-Content -Path $CHANGELOG_FILE -Value $newChangelog
Write-Host "✓ CHANGELOG updated" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Committing and tagging main repo..." -ForegroundColor Blue
git add $CONFIG_FILE $CHANGELOG_FILE
git commit -m "Release v$NEW_VERSION

- Built and pushed Docker images
- Updated addon configuration
- Updated changelog
"

git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"
Write-Host "✓ Main repo committed and tagged" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Committing and tagging public addon repo..." -ForegroundColor Blue
Push-Location public-addon
git add familyflow/config.yaml familyflow/CHANGELOG.md
git commit -m "Release v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"
Pop-Location
Write-Host "✓ Public addon repo committed and tagged" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       Release Complete! 🎉           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Version: $NEW_VERSION"
Write-Host "Docker images:"
Write-Host "  - ${IMAGE_NAME}:${NEW_VERSION}"
Write-Host "  - ${IMAGE_NAME}:latest"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Verify images on Docker Hub: https://hub.docker.com/r/${IMAGE_NAME}"
Write-Host "  2. Check addon repo: https://github.com/MarcoDroll/familyflow-addon"
Write-Host "  3. Users can now update to v$NEW_VERSION in Home Assistant"
Write-Host ""
