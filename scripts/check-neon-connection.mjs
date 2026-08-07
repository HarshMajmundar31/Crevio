import pg from "pg";

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Add it to .env and retry.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const result = await client.query("SELECT current_database() AS database, current_user AS role, now() AS connected_at");
    const row = result.rows[0];

    console.log("Neon connection successful.");
    console.log(`Database: ${row.database}`);
    console.log(`Role: ${row.role}`);
    console.log(`Connected At (UTC): ${new Date(row.connected_at).toISOString()}`);
  } catch (error) {
    console.error("Failed to connect to Neon.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
