# AI Agent Instructions for FamilyFlow

## Quick Reference

### Automated Releases

Releases are fully automated. Just push to `main` and the workflow will:
1. Auto-increment patch version (1.0.5 → 1.0.6)
2. Build and tag all Docker images
3. Update `config.yaml` in addon repo
4. Add changelog entry and push addon repo

For manual version control, use workflow_dispatch with version_bump option (patch/minor/major).

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

**Key insight:** GitHub Actions workflow in main repo automatically handles versioning. It reads current version from addon repo's config.yaml, increments it, builds images, then updates the addon repo.

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
