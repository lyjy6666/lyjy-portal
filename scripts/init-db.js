require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGSERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        due_date TIMESTAMPTZ,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      )
    `;
    console.log('tasks table: OK');

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_vip BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('users table: OK');

    // VIP 系统字段迁移：免费试用已用标记 + VIP 到期时间
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
    console.log('vip columns: OK');

    console.log('Database initialized successfully!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
