/**
 * 作业系统 Pro 版旁路表初始化（幂等，可重复执行）。
 *
 * 用法：node scripts/init-homework-pro-db.js
 * 一般不需要手动跑 —— /api/homework/pro/meta 首次被调用时会通过
 * src/lib/db.ts 的 ensureProMetaTable() 自动建表。此脚本仅供运维预建/排查。
 */
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error('缺少 DATABASE_URL，请先配置 .env.local');
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  // 刻意不加外键：线上 tasks 表由 scripts/init-db.js 建立，存在 schema 漂移
  // （建表时没有 user_id 列），加外键可能因主键/权限问题失败。
  // 孤儿行由 GET /pro/meta 的 JOIN tasks 过滤，无需 CASCADE。
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
  console.log('homework_pro_meta 已就绪');
}

main().catch((err) => {
  console.error('初始化失败:', err);
  process.exit(1);
});
