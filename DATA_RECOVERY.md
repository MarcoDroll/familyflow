# FamilyFlow Data Recovery Guide

## If Your Data Was Lost After an Update

### Quick Check: Is there a backup?

1. SSH into your Home Assistant or use the Terminal add-on
2. Check for database backups:
   ```bash
   ls -lh /config/famplan.db*
   ```

You should see:
- `/config/famplan.db` - Current database
- `/config/famplan.db.backup` - Automatic backup (created before migrations)

### Restore from Backup

If the backup exists and is not empty:

```bash
# Stop the FamilyFlow add-on first (via Home Assistant UI)

# Check backup size
ls -lh /config/famplan.db.backup

# If backup has data (size > 10KB), restore it:
cp /config/famplan.db.backup /config/famplan.db

# Restart the FamilyFlow add-on
```

### What Caused the Data Loss?

The issue was in the database migration code for adding the `scheduled_time` column:

**Problem:** The migration caught ALL errors (including database corruption) and ignored them, potentially saving a corrupted in-memory database back to disk.

**Fixed in this version:**
- Migration now checks if column exists before attempting ALTER TABLE
- Database is automatically backed up before running migrations
- Better error logging to diagnose issues
- Migration errors no longer silently corrupt the database

### Prevention for Future Updates

Starting with this update, FamilyFlow automatically backs up your database to `/config/famplan.db.backup` before running any migrations.

**Best practice:**
1. Before updating, manually backup your database:
   ```bash
   cp /config/famplan.db /config/famplan.db.manual-backup
   ```

2. After updating, verify your data is intact before making changes

3. If data is missing, restore from backup immediately

### If No Backup Exists

Unfortunately, if the database was overwritten and no backup exists, the data cannot be recovered. You will need to:

1. Stop the FamilyFlow add-on
2. Remove the corrupted database:
   ```bash
   rm /config/famplan.db
   ```
3. Restart the add-on (it will create a fresh database)
4. Re-enter your children and tasks

### Check Database Integrity

To verify your database is healthy:

```bash
# Install sqlite3 if needed
apk add sqlite

# Check database
sqlite3 /config/famplan.db "PRAGMA integrity_check;"

# Should output: ok

# Check tables exist
sqlite3 /config/famplan.db ".tables"

# Should show: kids  tasks

# Check data exists
sqlite3 /config/famplan.db "SELECT COUNT(*) FROM kids;"
sqlite3 /config/famplan.db "SELECT COUNT(*) FROM tasks;"
```

### Get Help

If you need assistance:
1. Check the add-on logs in Home Assistant
2. Report the issue at: https://github.com/MarcoDroll/familyflow/issues
3. Include:
   - Addon log output
   - Database file sizes (`ls -lh /config/famplan.db*`)
   - Previous version number you updated from
