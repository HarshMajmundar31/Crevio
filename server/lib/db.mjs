import pg from 'pg';

const { Pool } = pg;

const isLocalhost = Boolean(
  process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
);

let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured in Environment Variables.');
    }
    poolInstance = new Pool({
      connectionString,
      ssl: isLocalhost
        ? false
        : {
            rejectUnauthorized: false,
          },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return poolInstance;
}

export async function query(text, params = []) {
  const pool = getPool();
  return pool.query(text, params);
}
