import pg from 'pg';

const { Pool } = pg;

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS login_attempts (
    ip_hash TEXT PRIMARY KEY,
    window_started_at BIGINT NOT NULL,
    attempts INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS complaints_user_idx ON complaints(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints(status, created_at DESC);
  CREATE TABLE IF NOT EXISTS complaint_updates (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    note TEXT NOT NULL DEFAULT '',
    changed_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS evidence (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    storage_name TEXT NOT NULL UNIQUE,
    size BIGINT NOT NULL
  );
`;

export async function openPostgresDatabase(connectionString) {
  if (!connectionString) throw new Error('DATABASE_URL is required for the hosted database.');
  const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  try {
    await pool.query(schema);
  } catch (error) {
    await pool.end();
    throw error;
  }

  pool.transaction = async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  return pool;
}
