import pg from 'pg';

const { Pool } = pg;

const isLocalhost = Boolean(
  process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalhost
    ? false
    : {
        rejectUnauthorized: false,
      },
});

export async function query(text, params = []) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured in Vercel Environment Variables.');
  }
  return pool.query(text, params);
}
