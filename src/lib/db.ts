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

  // VIP 系统字段：免费试用已用标记 + VIP 到期时间
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'vip_trial_used'
      ) THEN
        ALTER TABLE users ADD COLUMN vip_trial_used BOOLEAN DEFAULT FALSE;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'vip_expires_at'
      ) THEN
        ALTER TABLE users ADD COLUMN vip_expires_at TIMESTAMPTZ;
      END IF;
    END $$;
  `;

  console.log('Database tables initialized');
}

// ---------------------------------------------------------------------------
// 作业系统 Pro 版旁路表：懒建表 + 进程内缓存
//
// initDb() 全项目无调用点，不能依赖它；这里由 /api/homework/pro/meta 首次请求触发，
// 保证 Pro 版部署后无需人工跑 SQL 即可使用。
// 刻意不加外键：线上 tasks 由 scripts/init-db.js 建立且存在 schema 漂移，
// 孤儿 meta 由 GET 时的 JOIN tasks 过滤，行为等价且零 DDL 风险。
// ---------------------------------------------------------------------------
let proMetaReady: Promise<void> | null = null;

export function ensureProMetaTable(): Promise<void> {
  if (!proMetaReady) {
    proMetaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS homework_pro_meta (
          task_id    BIGINT PRIMARY KEY,
          user_id    BIGINT NOT NULL,
          meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
          version    INT NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_hpm_user ON homework_pro_meta(user_id)`;
    })().catch((err) => {
      proMetaReady = null; // 失败允许下次重试
      throw err;
    });
  }
  return proMetaReady;
}
