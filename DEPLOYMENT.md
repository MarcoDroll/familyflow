# FamilyFlow Deployment Guide

This guide covers deploying FamilyFlow on your Asustor NAS using Portainer with pre-built Docker images.

## Overview

FamilyFlow uses **GitHub Actions** to automatically build and publish Docker images to **GitHub Container Registry (ghcr.io)** with semantic versioning.

## Prerequisites

- Asustor NAS with Docker installed
- Portainer installed and accessible
- GitHub account (for accessing container registry)

## Semantic Versioning

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version: Incompatible API changes
- **MINOR** version: New functionality (backwards compatible)
- **PATCH** version: Bug fixes (backwards compatible)

Format: `v1.2.3` (e.g., `v1.0.0`, `v1.2.5`)

---

## Creating a New Release

### 1. Make Your Changes

```bash
cd /path/to/familyflow
# Make your code changes
git add .
git commit -m "Description of changes"
git push
```

### 2. Create and Push a Version Tag

```bash
# For a new feature (minor version bump)
git tag v1.1.0

# For a bug fix (patch version bump)
git tag v1.0.1

# For breaking changes (major version bump)
git tag v2.0.0

# Push the tag to trigger the build
git push origin v1.1.0
```

### 3. GitHub Actions Builds Images

Once you push a tag, GitHub Actions will:
- ✅ Build backend Docker image
- ✅ Build frontend Docker image
- ✅ Push to GitHub Container Registry
- ✅ Tag as both version number AND `latest`

View progress at: https://github.com/MarcoDroll/familyflow/actions

### 4. Images Are Published

After ~5-10 minutes, images are available at:
- `ghcr.io/marcodroll/familyflow-backend:v1.1.0`
- `ghcr.io/marcodroll/familyflow-backend:latest`
- `ghcr.io/marcodroll/familyflow-frontend:v1.1.0`
- `ghcr.io/marcodroll/familyflow-frontend:latest`

---

## Initial Deployment on Asustor NAS

### Option 1: Deploy via Portainer (Recommended)

1. **Open Portainer**
   - Navigate to `http://your-nas-ip:9000`

2. **Create New Stack**
   - Go to **Stacks** → **+ Add stack**
   - Name: `familyflow`

3. **Choose Deployment Method**

   **Method A: Repository (Easiest)**
   - Build method: **Repository**
   - Repository URL: `https://github.com/MarcoDroll/familyflow`
   - Repository reference: `refs/heads/main`
   - Compose path: `docker-compose.yml`
   - Click **Deploy the stack**

   **Method B: Web Editor**
   - Build method: **Web editor**
   - Copy contents of `docker-compose.yml` from GitHub
   - Click **Deploy the stack**

4. **Wait for Images to Pull**
   - Portainer will pull pre-built images (~1-2 minutes)
   - Much faster than building! ⚡

5. **Access Your App**
   - Open `http://your-nas-ip` in browser
   - PIN: `8956`

### Option 2: Deploy via SSH

```bash
# SSH into your Asustor NAS
ssh admin@your-nas-ip

# Create directory
mkdir -p /volume1/docker/familyflow
cd /volume1/docker/familyflow

# Download docker-compose.yml
wget https://raw.githubusercontent.com/MarcoDroll/familyflow/main/docker-compose.yml

# Download nginx config
mkdir -p nginx
wget -O nginx/nginx.conf https://raw.githubusercontent.com/MarcoDroll/familyflow/main/nginx/nginx.conf

# Deploy
docker-compose up -d
```

---

## Updating to New Version

### Method 1: Update via Portainer (GUI)

1. **Go to Stacks** in Portainer
2. Click your **familyflow** stack
3. Click **Editor** tab
4. Change image tags to new version (optional):
   ```yaml
   backend:
     image: ghcr.io/marcodroll/familyflow-backend:v1.1.0  # Specific version
   ```
   Or keep `:latest` to always get the newest
5. Click **Update the stack**
6. Check **Re-pull image and redeploy**
7. Click **Update**

### Method 2: Update via SSH

```bash
cd /volume1/docker/familyflow
docker-compose pull
docker-compose up -d
```

---

## Configuration

### Change Port

If port 80 is already in use, edit `docker-compose.yml`:

```yaml
nginx:
  ports:
    - "8080:80"  # Change 8080 to your preferred port
```

### Use Specific Version

Instead of `:latest`, pin to specific version:

```yaml
services:
  backend:
    image: ghcr.io/marcodroll/familyflow-backend:v1.0.0
  frontend:
    image: ghcr.io/marcodroll/familyflow-frontend:v1.0.0
```

### Environment Variables

Add custom environment variables in Portainer:
- Go to **Stacks** → Click stack → **Editor**
- Add under `backend` service:

```yaml
backend:
  environment:
    PORT: 3000
    NODE_ENV: production
    # Add custom vars here
```

---

## Useful Commands

### View Running Containers
```bash
docker ps | grep familyflow
```

### View Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker logs familyflow-backend -f
docker logs familyflow-frontend -f
docker logs familyflow-nginx -f
```

### Restart Containers
```bash
docker-compose restart
```

### Stop & Remove
```bash
docker-compose down
```

### Check Database
```bash
docker exec -it familyflow-backend ls -la /app/data/
```

---

## Troubleshooting

### Images Won't Pull (Authentication Error)

GitHub Container Registry requires authentication for private repos:

1. **Create Personal Access Token**
   - GitHub → Settings → Developer settings
   - Personal access tokens → Tokens (classic)
   - Generate new token with `read:packages` scope

2. **Login in Portainer**
   - Registries → Add registry
   - Name: GitHub Container Registry
   - URL: `ghcr.io`
   - Username: Your GitHub username
   - Password: Your Personal Access Token

3. **Re-deploy Stack**

### Container Fails to Start

Check logs:
```bash
docker logs familyflow-backend
docker logs familyflow-frontend
```

### Port Already in Use

Change port in `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"
```

### Database Permission Issues

```bash
docker exec -it familyflow-backend chown -R node:node /app/data
docker-compose restart backend
```

---

## Development vs Production

### Production (Pre-built Images)
Use `docker-compose.yml` - pulls images from ghcr.io

### Local Development (Build from Source)
Use `docker-compose.dev.yml`:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

## Making Your First Release

```bash
# Initial release
git tag v1.0.0
git push origin v1.0.0

# Watch build at: https://github.com/MarcoDroll/familyflow/actions
# Deploy in Portainer after ~5-10 minutes
```

---

## Security Note

The default PIN is **8956**. To change it:
1. Edit `frontend/src/app/components/pin-entry/pin-entry.component.ts`
2. Change line 19: `private readonly correctPin = 'YOUR_NEW_PIN';`
3. Commit, tag, and push
4. Update deployment

---

## Support

- **Repository**: https://github.com/MarcoDroll/familyflow
- **Issues**: https://github.com/MarcoDroll/familyflow/issues
- **Container Registry**: https://github.com/MarcoDroll/familyflow/pkgs/container/familyflow-backend
