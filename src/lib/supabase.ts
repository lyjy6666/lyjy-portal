// 兼容层：已从 Supabase 迁移到 Neon PostgreSQL
// 此文件保留以避免破坏旧导入，实际数据库操作请使用 @/lib/db
export { sql, isDbConfigured, initDb } from './db';

// 兼容旧代码中可能存在的 validateSupabaseEnv 调用
export const validateSupabaseEnv = () => {
  if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set.\n\n' +
      'Please set DATABASE_URL in your .env.local file.\n' +
      'Get your connection string from https://neon.tech'
    );
  }
};
