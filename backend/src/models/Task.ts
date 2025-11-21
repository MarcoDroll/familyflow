import { query } from '../database/db';

export type TaskStatus = 'zu_erledigen' | 'mach_ich_gerade' | 'erledigt';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'specific_date';

export interface Task {
  id: number;
  kid_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  recurrence_type: RecurrenceType;
  recurrence_date: Date | null;
  last_reset: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class TaskModel {
  static async findAll(): Promise<Task[]> {
    const result = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
  }

  static async findByKidId(kidId: number): Promise<Task[]> {
    const result = await query(
      'SELECT * FROM tasks WHERE kid_id = $1 ORDER BY created_at DESC',
      [kidId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<Task | null> {
    const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(
    kidId: number,
    title: string,
    description: string | null = null,
    recurrenceType: RecurrenceType = 'none',
    recurrenceDate: Date | null = null
  ): Promise<Task> {
    const result = await query(
      `INSERT INTO tasks (kid_id, title, description, recurrence_type, recurrence_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [kidId, title, description, recurrenceType, recurrenceDate]
    );
    return result.rows[0];
  }

  static async updateStatus(id: number, status: TaskStatus): Promise<Task | null> {
    const result = await query(
      "UPDATE tasks SET status = $1, updated_at = datetime('now') WHERE id = $2 RETURNING *",
      [status, id]
    );
    return result.rows[0] || null;
  }

  static async update(
    id: number,
    title: string,
    description: string | null,
    recurrenceType: RecurrenceType,
    recurrenceDate: Date | null
  ): Promise<Task | null> {
    const result = await query(
      `UPDATE tasks
       SET title = $1, description = $2, recurrence_type = $3, recurrence_date = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [title, description, recurrenceType, recurrenceDate, id]
    );
    return result.rows[0] || null;
  }

  static async resetTask(id: number): Promise<Task | null> {
    const result = await query(
      `UPDATE tasks
       SET status = 'zu_erledigen', last_reset = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getTasksToReset(): Promise<Task[]> {
    const now = new Date().toISOString();
    const result = await query(
      `SELECT * FROM tasks
       WHERE status = 'erledigt'
       AND recurrence_type != 'none'
       AND (
         (recurrence_type = 'daily' AND (last_reset IS NULL OR date(last_reset) < date('now')))
         OR (recurrence_type = 'weekly' AND (last_reset IS NULL OR datetime(last_reset) < datetime('now', '-7 days')))
         OR (recurrence_type = 'monthly' AND (last_reset IS NULL OR datetime(last_reset) < datetime('now', '-1 month')))
         OR (recurrence_type = 'specific_date' AND recurrence_date IS NOT NULL AND recurrence_date <= $1)
       )`,
      [now]
    );
    return result.rows;
  }
}
