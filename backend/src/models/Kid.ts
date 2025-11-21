import { query } from '../database/db';

export interface Kid {
  id: number;
  name: string;
  color: string;
  created_at: Date;
}

export class KidModel {
  static async findAll(): Promise<Kid[]> {
    const result = await query('SELECT * FROM kids ORDER BY created_at ASC');
    return result.rows;
  }

  static async findById(id: number): Promise<Kid | null> {
    const result = await query('SELECT * FROM kids WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(name: string, color: string = '#4CAF50'): Promise<Kid> {
    const result = await query(
      'INSERT INTO kids (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    return result.rows[0];
  }

  static async update(id: number, name: string, color: string): Promise<Kid | null> {
    const result = await query(
      'UPDATE kids SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name, color, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM kids WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
