import { neon } from '@neondatabase/serverless';

// 获取 Neon 数据库连接字符串
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Please set it in .env.local');
}

// 创建 Neon SQL 查询客户端
export const sql = neon(connectionString || '');

// 检查数据库是否已配置
export function isDbConfigured(): boolean {
  return !!connectionString;
}

// 初始化数据库表（首次使用时调用）
export async function initDb() {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGSERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      due_date TIMESTAMPTZ,
      is_pinned BOOLEAN DEFAULT FALSE,
      user_id BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    )
  `;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE tasks ADD COLUMN user_id BIGINT;
      END IF;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_vip BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log('Database tables initialized');
}
