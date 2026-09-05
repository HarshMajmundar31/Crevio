import { query } from '../server/lib/db.mjs';

async function cleanupIncompleteUsers() {
  console.log('--- Database Cleanup: Removing Incomplete Onboarding Users ---');

  // 1. Mark seed accounts as onboarded (step 0)
  await query(`UPDATE users SET onboarding_step = 0 WHERE id IN ('a1', 'b1', 'b2')`);
  console.log('Marked seed accounts (a1, b1, b2) as completed onboarding.');

  // 2. Identify users to be removed
  const incompleteResult = await query(
    `SELECT id, full_name, email, role, onboarding_step 
     FROM users 
     WHERE onboarding_step IS NULL OR onboarding_step > 0`
  );

  const usersToDelete = incompleteResult.rows;
  console.log(`Found ${usersToDelete.length} users with incomplete onboarding:`);
  console.table(usersToDelete);

  if (usersToDelete.length === 0) {
    console.log('No incomplete users found. Database is already clean!');
    process.exit(0);
  }

  const idsToDelete = usersToDelete.map((u) => u.id);

  // 3. Delete dependent records first to satisfy FK constraints
  console.log('Cleaning dependent records...');
  
  const safeDelete = async (tableName, sql, params) => {
    try {
      console.log(`Clearing ${tableName}...`);
      await query(sql, params);
    } catch (e) {
      if (e?.code !== '42P01') {
        console.warn(`Warning clearing ${tableName}:`, e?.message || e);
      }
    }
  };

  await safeDelete('campaign_chat_messages', `DELETE FROM campaign_chat_messages WHERE sender_id = ANY($1) OR recipient_id = ANY($1)`, [idsToDelete]);
  await safeDelete('campaign_proof_submissions', `DELETE FROM campaign_proof_submissions WHERE creator_id = ANY($1)`, [idsToDelete]);
  await safeDelete('deliverable_submissions', `DELETE FROM deliverable_submissions WHERE creator_id = ANY($1)`, [idsToDelete]);
  await safeDelete('contract_milestones', `DELETE FROM contract_milestones WHERE contract_id IN (SELECT id FROM contracts WHERE brand_id = ANY($1) OR creator_id = ANY($1))`, [idsToDelete]);
  await safeDelete('contracts', `DELETE FROM contracts WHERE brand_id = ANY($1) OR creator_id = ANY($1)`, [idsToDelete]);
  await safeDelete('application_events', `DELETE FROM application_events WHERE actor_user_id = ANY($1)`, [idsToDelete]);
  await safeDelete('creator_applications', `DELETE FROM creator_applications WHERE creator_id = ANY($1) OR brand_id = ANY($1)`, [idsToDelete]);
  await safeDelete('campaigns', `DELETE FROM campaigns WHERE brand_id = ANY($1)`, [idsToDelete]);
  await safeDelete('social_accounts', `DELETE FROM social_accounts WHERE user_id = ANY($1)`, [idsToDelete]);
  await safeDelete('social_verification_logs', `DELETE FROM social_verification_logs WHERE user_id = ANY($1)`, [idsToDelete]);
  await safeDelete('wallets', `DELETE FROM wallets WHERE user_id = ANY($1)`, [idsToDelete]);
  await safeDelete('brand_profiles', `DELETE FROM brand_profiles WHERE user_id = ANY($1)`, [idsToDelete]);
  await safeDelete('creator_profiles', `DELETE FROM creator_profiles WHERE user_id = ANY($1)`, [idsToDelete]);
  await safeDelete('workspaces', `DELETE FROM workspaces WHERE user_id = ANY($1)`, [idsToDelete]);

  // 4. Delete the incomplete users
  const deleteResult = await query(
    `DELETE FROM users WHERE id = ANY($1) RETURNING id, email`,
    [idsToDelete]
  );

  console.log(`Successfully removed ${deleteResult.rowCount} incomplete users from database!`);

  // 5. Output remaining users
  const remainingResult = await query(
    `SELECT id, full_name, email, role, onboarding_step FROM users ORDER BY created_at DESC`
  );
  console.log('\n--- Remaining Users in Database (Completed Onboarding Only) ---');
  console.table(remainingResult.rows);

  process.exit(0);
}

cleanupIncompleteUsers().catch((err) => {
  console.error('Cleanup Error:', err);
  process.exit(1);
});
