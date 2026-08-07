import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const sqlPath = process.argv[2];

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Add it to .env and retry.');
    process.exit(1);
  }

  if (!sqlPath) {
    console.error('Missing SQL file path. Usage: node --env-file=.env scripts/db-apply-sql.mjs database/crevio_schema.sql');
    process.exit(1);
  }

  const sql = await readFile(sqlPath, 'utf8');
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    await client.query(sql);
    console.log(`Applied SQL file: ${sqlPath}`);
  } catch (error) {
    console.error(`Failed to apply SQL file: ${sqlPath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
