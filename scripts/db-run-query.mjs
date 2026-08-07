import pg from "pg";

const { Client } = pg;

function assertSafeSql(sql, allowWrite) {
  if (allowWrite) {
    return;
  }

  const normalized = sql.trim().toLowerCase();
  if (!normalized.startsWith("select")) {
    throw new Error("Only SELECT queries are allowed by default. Re-run with --write to allow modifications.");
  }
}

function formatRows(rows) {
  if (rows.length === 0) {
    return "(0 rows)";
  }

  return JSON.stringify(rows, null, 2);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const args = process.argv.slice(2);
  const allowWrite = args.includes("--write");
  const sqlParts = args.filter((arg) => arg !== "--write");
  const sql = sqlParts.join(" ").trim();

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Add it to .env and retry.");
    process.exit(1);
  }

  if (!sql) {
    console.error("No SQL provided. Usage: npm run db:query -- \"SELECT now();\"");
    process.exit(1);
  }

  try {
    assertSafeSql(sql, allowWrite);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const result = await client.query(sql);
    console.log(formatRows(result.rows));
    console.log(`Rows returned: ${result.rowCount ?? 0}`);
  } catch (error) {
    console.error("Query failed.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
