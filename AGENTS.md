# AI Agent Instructions for FamilyFlow

## Quick Reference

### Releases

Version is controlled by the `VERSION` file in the main repo root.

To release:
1. Update `VERSION` file with new semantic version (e.g., `1.0.7`)
2. Push to `main`

The workflow will automatically:
- Build and tag all Docker images with that version
- Update `config.yaml` in addon repo
- Add changelog entry and push addon repo

**Required secret:** `PUPLIC_REPO_TOKEN` - PAT with repo access to push to familyflow-addon.

### File Editing Notes

Files in this project sometimes have issues with the Edit tool showing "unexpectedly modified". Use heredoc as fallback:

```bash
cat > "path/to/file.ts" << 'ENDOFFILE'
file content here
ENDOFFILE
```

**Avoid in heredocs:**
- Template literals with `${...}` (bash interprets them)
- Backticks (bash command substitution)
- Use string concatenation instead: `'text' + variable`

### Build Commands

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && ./node_modules/.bin/ng build --configuration production

# Full add-on image (runs in GitHub Actions)
# Triggered automatically on push to main
```

### Testing Locally

Backend has no test suite yet. Frontend can be built to verify compilation:
```bash
cd frontend && npm install && ./node_modules/.bin/ng build
```

## Project Conventions

### Language
- UI text is in **German** (Deutsch)
- Code comments and commits in **English**
- Status names: `zu_erledigen`, `mach_ich_gerade`, `erledigt`

### Styling
- Dark theme with teal accent (#3dd9a8)
- Glass-morphism effects (rgba backgrounds, blur)
- Mobile-first responsive design

### Angular Patterns
- Standalone components (no NgModules)
- Services use `inject()` or constructor injection
- Pipes are standalone and imported per-component

## Two-Repository Setup

| Repo | Purpose | URL |
|------|---------|-----|
| familyflow | Main code, Docker build | github.com/MarcoDroll/familyflow |
| familyflow-addon | HA add-on store listing | github.com/MarcoDroll/familyflow-addon |

The `public-addon/` directory is the addon repo included as a subdirectory (not a git submodule).

**Key insight:** Version is controlled by the `VERSION` file in the main repo. The workflow reads it, builds images with that version, then syncs to the addon repo.

## MQTT Entity Structure

When MQTT is available, these entities are created per child:

```
Device: FamilyFlow - {ChildName}
├── sensor.familyflow_{id}_tasks         "3/5"
├── sensor.familyflow_{id}_todo          "2"
├── sensor.familyflow_{id}_in_progress   "1"
└── binary_sensor.familyflow_{id}_all_done  ON/OFF
```

Attributes on tasks sensor:
- `total_tasks`, `completed_tasks`, `in_progress_tasks`, `todo_tasks`
- `completion_percentage`
- `task_list` (array)
- `last_updated`

## Common Modifications

### Adding a new API endpoint
1. Add route in `backend/src/routes/{resource}.ts`
2. Add method in `backend/src/services/api.service.ts` (frontend)
3. If affects tasks/kids, call `mqttService.onTaskChanged()` or similar

### Adding UI component
1. Create standalone component with `ng generate component`
2. Import CommonModule and any pipes needed
3. Add to parent component's imports array

### Changing task card behavior
- `task-card.component.ts` - Logic and event emitters
- `kid-board.component.ts` - Parent handles status changes
- Remember mobile needs tap-based alternatives to drag-drop
