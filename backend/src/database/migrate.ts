import { initDatabase, exec } from './db';
import path from 'path';

async function migrate() {
  try {
    // Initialize database
    await initDatabase();

    // Create kids table
    exec(`
      CREATE TABLE IF NOT EXISTS kids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#4CAF50',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kid_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'zu_erledigen' CHECK (status IN ('zu_erledigen', 'mach_ich_gerade', 'erledigt')),
        recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'specific_date')),
        recurrence_date TEXT,
        last_reset TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster queries
    exec(`CREATE INDEX IF NOT EXISTS idx_tasks_kid_id ON tasks(kid_id)`);
    exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);

    console.log('Migration completed successfully!');
    console.log('Database location:', path.join(__dirname, '../../data/famplan.db'));
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrate().catch(console.error);
