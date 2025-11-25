import initSqlJs, { Database } from 'sql.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

let db: Database;
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/famplan.db');

// Initialize SQL.js database
export async function initDatabase() {
  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Run migrations to ensure tables exist
  runMigrations();

  return db;
}

// Create tables if they don't exist
function runMigrations() {
  // Create kids table
  db.run(`
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#4CAF50',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tasks table
  db.run(`
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

  // Add scheduled_time column if it doesn't exist (migration)
  try {
    db.run(`ALTER TABLE tasks ADD COLUMN scheduled_time TEXT`);
    saveDatabase();
  } catch (e) {
    // Column already exists, ignore error
  }

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_kid_id ON tasks(kid_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);

  // Save after migrations
  saveDatabase();

  console.log('Database migrations completed');
}

// Save database to disk
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Convert SQLite parameters from PostgreSQL style ($1, $2) to SQLite style (?, ?)
function convertQuery(text: string, params?: any[]): { sql: string; params: any[] } {
  const sql = text.replace(/\$(\d+)/g, () => '?');
  return { sql, params: params || [] };
}

// Helper to convert sql.js results to rows array
function convertResults(results: any[]): any[] {
  if (!results || results.length === 0) return [];

  const rows: any[] = [];
  results.forEach(result => {
    if (result.values && result.values.length > 0) {
      result.values.forEach((row: any[]) => {
        const rowObj: any = {};
        result.columns.forEach((col: string, index: number) => {
          rowObj[col] = row[index];
        });
        rows.push(rowObj);
      });
    }
  });

  return rows;
}

// Wrapper to provide pg-like interface
export const query = async (text: string, params?: any[]) => {
  if (!db) {
    await initDatabase();
  }

  const { sql, params: sqlParams } = convertQuery(text, params);

  try {
    if (text.trim().toUpperCase().includes('RETURNING')) {
      // Handle INSERT/UPDATE/DELETE with RETURNING clause
      const returningMatch = text.match(/RETURNING\s+\*/i);
      if (returningMatch) {
        const mainQuery = text.substring(0, returningMatch.index).trim();
        const { sql: mainSql, params: mainParams } = convertQuery(mainQuery, params);

        db.run(mainSql, mainParams);
        saveDatabase();

        // Get the last inserted/updated row
        if (text.trim().toUpperCase().startsWith('INSERT')) {
          const tableName = extractTableName(text);
          const results = db.exec(`SELECT * FROM ${tableName} WHERE id = last_insert_rowid()`);
          const rows = convertResults(results);
          return { rows, rowCount: rows.length };
        } else if (text.trim().toUpperCase().startsWith('UPDATE')) {
          const tableName = extractTableName(text);
          const whereClause = extractWhereClause(text);

          // Extract WHERE parameters - for UPDATE queries, WHERE clause uses the last parameter(s)
          // e.g., UPDATE tasks SET status = $1 WHERE id = $2 -> we need only $2 for WHERE
          const whereParams = extractWhereParams(text, params);

          const selectSql = `SELECT * FROM ${tableName} ${whereClause}`;
          const { sql: selectConverted, params: selectParams } = convertQuery(selectSql, whereParams);
          const results = db.exec(selectConverted, selectParams);
          const rows = convertResults(results);
          return { rows, rowCount: rows.length };
        }
      }
    }

    if (text.trim().toUpperCase().startsWith('SELECT')) {
      const results = db.exec(sql, sqlParams);
      const rows = convertResults(results);
      return { rows, rowCount: rows.length };
    } else {
      db.run(sql, sqlParams);
      saveDatabase();
      return { rows: [], rowCount: db.getRowsModified() };
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

// Execute raw SQL (for migrations)
export function exec(sql: string) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  db.exec(sql);
  saveDatabase();
}

function extractTableName(query: string): string {
  const insertMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
  if (insertMatch) return insertMatch[1];

  const updateMatch = query.match(/UPDATE\s+(\w+)/i);
  if (updateMatch) return updateMatch[1];

  const deleteMatch = query.match(/DELETE\s+FROM\s+(\w+)/i);
  if (deleteMatch) return deleteMatch[1];

  return '';
}

function extractWhereClause(query: string): string {
  const whereMatch = query.match(/WHERE\s+.+?(?=RETURNING|$)/i);
  return whereMatch ? whereMatch[0] : '';
}

function extractWhereParams(query: string, params?: any[]): any[] {
  if (!params) return [];

  // Count how many SET parameters there are
  const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
  if (!setMatch) return params;

  // Count the number of $N placeholders in the SET clause
  const setClause = setMatch[1];
  const setParamCount = (setClause.match(/\$\d+/g) || []).length;

  // Return only the parameters after the SET parameters (for WHERE clause)
  return params.slice(setParamCount);
}

export function getDatabase() {
  return db;
}

export default { initDatabase, query, exec, getDatabase };
