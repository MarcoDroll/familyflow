# FamilyFlow - Project Guide for Claude

## Project Overview

FamilyFlow is a family task planner and reward system designed as a Home Assistant add-on. It helps families manage chores and tasks for children with a kid-friendly interface.

## Architecture

- **Backend**: Node.js/Express with TypeScript, SQLite database (sql.js)
- **Frontend**: Angular 17+ standalone components
- **Deployment**: Docker container for Home Assistant add-on (aarch64/Raspberry Pi)

## Repository Structure

```
famplan/                    # Main repository (MarcoDroll/familyflow)
├── backend/               # Node.js API server
├── frontend/              # Angular frontend
├── addon/                 # Add-on startup scripts
├── Dockerfile.addon       # Combined Docker image for HA add-on
├── public-addon/          # Submodule → MarcoDroll/familyflow-addon
│   └── familyflow/
│       ├── config.yaml    # HA add-on configuration (VERSION HERE)
│       ├── CHANGELOG.md   # User-facing changelog
│       └── icon.png/logo.png
└── .github/workflows/     # CI/CD workflows
```

## Versioning & Release Process

### IMPORTANT: Tag Both Repos

The Docker build workflow reads version from **git tags in the main repo**, not from config.yaml.

**Correct release process:**
1. Update `public-addon/familyflow/config.yaml` with new version
2. Update `public-addon/familyflow/CHANGELOG.md`
3. Commit and push both repos
4. Tag **BOTH** repos with the same version:
   ```bash
   cd D:/dev/famplan
   git tag v1.0.X && git push origin v1.0.X

   cd public-addon
   git tag v1.0.X && git push origin v1.0.X
   ```

**Why both repos need tags:**
- Main repo tag triggers GitHub Actions workflow
- Workflow extracts version from `refs/tags/vX.X.X`
- Without main repo tag, image gets tagged as "latest" instead of version number
- Addon repo tag is for HA add-on store version tracking

## Key Technical Details

### Home Assistant Add-on
- Ingress enabled on port 8099
- Data persisted to `/config/famplan.db` (mapped via `addon_config:rw`)
- MQTT auto-discovery via Supervisor API (requires `hassio_api: true`)
- Base href must be `./` (relative) for ingress compatibility

### MQTT Integration
- Entities auto-discovered when Mosquitto broker is available
- Sensors per child:
  - `sensor.familyflow_{child}_tasks` - Task completion ratio (e.g., "3/5")
  - `sensor.familyflow_{child}_overdue` - Number of overdue tasks
  - `sensor.familyflow_{child}_in_progress` - Tasks in progress count
  - `sensor.familyflow_{child}_todo` - Todo tasks count
  - `binary_sensor.familyflow_{child}_all_done` - ON when all tasks complete
  - `binary_sensor.familyflow_{child}_has_overdue` - ON when tasks are overdue
- Task attributes include `scheduled_time` for automation triggers
- Overdue detection: Tasks with `scheduled_time` < current time and status ≠ "erledigt"
- Supervisor token automatically injected when `hassio_api: true`
- See `homeassistant-automation-examples.yaml` for notification automation examples

### Mobile Support
- HTML5 drag-and-drop doesn't work on touch devices
- Task cards have tap-to-reveal action buttons as alternative
- CSS media queries detect touch devices: `@media (hover: none) and (pointer: coarse)`

### URLs in Descriptions
- LinkifyPipe converts URLs to clickable anchor tags
- Links use `onclick="event.stopPropagation()"` to prevent card toggle

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Image tagged "latest" not version | Missing tag in main repo | Tag main repo with version |
| Data lost after update | DB in wrong path | Use `DB_PATH=/config/famplan.db` |
| Empty UI in HA | Wrong base href | Use `<base href="./">` |
| Mobile can't move tasks | No touch events | Use tap-to-reveal buttons |
| MQTT not connecting | Missing hassio_api | Set `hassio_api: true` in config.yaml |

## Task Status Flow

German status names used in database:
- `zu_erledigen` → To Do (red)
- `mach_ich_gerade` → In Progress (yellow)
- `erledigt` → Done (teal/green)
