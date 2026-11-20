require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS anniversary_capsules (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        unlock_at DATE NOT NULL DEFAULT '2027-08-04',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('anniversary_capsules: OK');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
