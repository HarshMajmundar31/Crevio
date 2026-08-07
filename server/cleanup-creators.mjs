import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runCleanup() {
  try {
    console.log('[CleanupScript] Connecting to PostgreSQL database...');

    // 1. Delete campaign applications submitted by creators
    const appResult = await pool.query("DELETE FROM campaign_applications WHERE creator_id IN (SELECT id FROM users WHERE role = 'creator')");
    console.log(`[CleanupScript] Deleted ${appResult.rowCount} campaign applications.`);

    // 2. Delete contracts associated with creators
    const contractResult = await pool.query("DELETE FROM contracts WHERE creator_id IN (SELECT id FROM users WHERE role = 'creator')");
    console.log(`[CleanupScript] Deleted ${contractResult.rowCount} contracts.`);

    // 3. Delete workspace members associated with creators
    const memberResult = await pool.query("DELETE FROM workspace_members WHERE user_id IN (SELECT id FROM users WHERE role = 'creator')");
    console.log(`[CleanupScript] Deleted ${memberResult.rowCount} workspace member records.`);

    // 4. Delete creator users
    const userResult = await pool.query("DELETE FROM users WHERE role = 'creator' RETURNING id, email, full_name");
    console.log(`[CleanupScript] Successfully deleted ${userResult.rowCount} creator users from database:`);
    if (userResult.rows.length === 0) {
      console.log(' - No creator users found in database.');
    } else {
      userResult.rows.forEach((u) => console.log(` - Deleted: ${u.full_name} (${u.email}) [ID: ${u.id}]`));
    }

    console.log('[CleanupScript] Database cleanup completed successfully!');
  } catch (error) {
    console.error('[CleanupScript] Error during database cleanup:', error);
  } finally {
    await pool.end();
  }
}

void runCleanup();
