#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   FamilyFlow Manual Release Script    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check we're in the right directory
if [ ! -f "VERSION" ] || [ ! -d "public-addon" ]; then
    echo -e "${RED}Error: Must run from the famplan repository root${NC}"
    exit 1
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Get current version from git tags
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v1.0.0")
CURRENT_VERSION=${CURRENT_VERSION#v}  # Remove 'v' prefix
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Parse version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Ask for version bump type
echo ""
echo "Select version bump type:"
echo "  1) Patch (bug fixes)      : ${CURRENT_VERSION} -> ${MAJOR}.${MINOR}.$((PATCH + 1))"
echo "  2) Minor (new features)   : ${CURRENT_VERSION} -> ${MAJOR}.$((MINOR + 1)).0"
echo "  3) Major (breaking changes): ${CURRENT_VERSION} -> $((MAJOR + 1)).0.0"
echo "  4) Custom version"
echo "  5) Cancel"
echo ""
read -p "Choice [1-5]: " choice

case $choice in
    1)
        PATCH=$((PATCH + 1))
        ;;
    2)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    3)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    4)
        read -p "Enter new version (e.g., 1.2.3): " NEW_VERSION
        if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}Invalid version format${NC}"
            exit 1
        fi
        IFS='.' read -r MAJOR MINOR PATCH <<< "$NEW_VERSION"
        ;;
    5)
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo ""
echo -e "${GREEN}New version will be: ${NEW_VERSION}${NC}"
echo ""

# Confirm
read -p "Continue with release? [y/N]: " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1: Building Docker images...${NC}"
echo "This may take several minutes..."

# Build for multiple platforms
PLATFORMS="linux/amd64,linux/arm64"
IMAGE_NAME="marcodroll/familyflow"

docker buildx build \
    --platform $PLATFORMS \
    --file Dockerfile.addon \
    --tag "${IMAGE_NAME}:${NEW_VERSION}" \
    --tag "${IMAGE_NAME}:latest" \
    --push \
    .

echo -e "${GREEN}✓ Docker images built and pushed${NC}"

echo ""
echo -e "${BLUE}Step 2: Updating VERSION file...${NC}"
echo "$NEW_VERSION" > VERSION
git add VERSION
echo -e "${GREEN}✓ VERSION file updated${NC}"

echo ""
echo -e "${BLUE}Step 3: Updating addon config.yaml...${NC}"
CONFIG_FILE="public-addon/familyflow/config.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Config file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Update version in config.yaml
sed -i "s/^version: .*/version: \"${NEW_VERSION}\"/" "$CONFIG_FILE"
echo -e "${GREEN}✓ config.yaml updated${NC}"

echo ""
echo -e "${BLUE}Step 4: Updating CHANGELOG...${NC}"
CHANGELOG_FILE="public-addon/familyflow/CHANGELOG.md"
DATE=$(date +%Y-%m-%d)

# Create temp file with new entry
{
    head -1 "$CHANGELOG_FILE"
    echo ""
    echo "## [${NEW_VERSION}] - ${DATE}"
    echo ""
    echo "### Changed"
    echo ""
    echo "- Manual release v${NEW_VERSION}"
    echo ""
    tail -n +2 "$CHANGELOG_FILE"
} > "${CHANGELOG_FILE}.tmp"

mv "${CHANGELOG_FILE}.tmp" "$CHANGELOG_FILE"
echo -e "${GREEN}✓ CHANGELOG updated${NC}"

echo ""
echo -e "${BLUE}Step 5: Committing and tagging main repo...${NC}"
git add "$CONFIG_FILE" "$CHANGELOG_FILE"
git commit -m "Release v${NEW_VERSION}

- Built and pushed Docker images
- Updated addon configuration
- Updated changelog
"

git tag "v${NEW_VERSION}"
git push origin main
git push origin "v${NEW_VERSION}"
echo -e "${GREEN}✓ Main repo committed and tagged${NC}"

echo ""
echo -e "${BLUE}Step 6: Committing and tagging public addon repo...${NC}"
cd public-addon
git add familyflow/config.yaml familyflow/CHANGELOG.md
git commit -m "Release v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
git push origin main
git push origin "v${NEW_VERSION}"
cd ..
echo -e "${GREEN}✓ Public addon repo committed and tagged${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}       Release Complete! 🎉           ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Version: ${NEW_VERSION}"
echo "Docker images:"
echo "  - ${IMAGE_NAME}:${NEW_VERSION}"
echo "  - ${IMAGE_NAME}:latest"
echo ""
echo "Next steps:"
echo "  1. Verify images on Docker Hub: https://hub.docker.com/r/${IMAGE_NAME}"
echo "  2. Check addon repo: https://github.com/MarcoDroll/familyflow-addon"
echo "  3. Users can now update to v${NEW_VERSION} in Home Assistant"
echo ""
