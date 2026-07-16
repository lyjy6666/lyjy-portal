import { sql } from './db';

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  due_date?: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string | null;
}

export class TaskManager {
  async createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const rows = await sql`
      INSERT INTO tasks (text, completed, due_date, is_pinned, updated_at)
      VALUES (${data.text}, ${data.completed}, ${data.due_date || null}, ${data.is_pinned}, NOW())
      RETURNING *
    `;
    return rows[0] as Task;
  }

  async getAllTasks(): Promise<Task[]> {
    const rows = await sql`
      SELECT * FROM tasks
      ORDER BY is_pinned DESC, id DESC
    `;
    return rows as Task[];
  }

  async getTaskById(id: number): Promise<Task | null> {
    const rows = await sql`
      SELECT * FROM tasks WHERE id = ${id}
    `;
    return (rows[0] as Task) || null;
  }

  async updateTask(id: number, data: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task | null> {
    // 动态构建 SET 子句
    const sets: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.text !== undefined) { sets.push(`text = $${paramIndex++}`); values.push(data.text); }
    if (data.completed !== undefined) { sets.push(`completed = $${paramIndex++}`); values.push(data.completed); }
    if (data.due_date !== undefined) { sets.push(`due_date = $${paramIndex++}`); values.push(data.due_date); }
    if (data.is_pinned !== undefined) { sets.push(`is_pinned = $${paramIndex++}`); values.push(data.is_pinned); }

    sets.push(`updated_at = NOW()`);

    if (sets.length === 1) return null; // 只有 updated_at，没有实际更新

    values.push(id);
    const setClause = sets.join(', ');

    const rows = await sql.query(
      `UPDATE tasks SET ${setClause} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return (rows[0] as Task) || null;
  }

  async deleteTask(id: number): Promise<boolean> {
    await sql`DELETE FROM tasks WHERE id = ${id}`;
    return true;
  }

  async toggleTaskCompleted(id: number): Promise<Task | null> {
    const rows = await sql`
      UPDATE tasks
      SET completed = NOT completed, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return (rows[0] as Task) || null;
  }

  async toggleTaskPinned(id: number): Promise<Task | null> {
    const rows = await sql`
      UPDATE tasks
      SET is_pinned = NOT is_pinned, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return (rows[0] as Task) || null;
  }
}

export const taskManager = new TaskManager();
