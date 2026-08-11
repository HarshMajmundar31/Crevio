import cron from 'node-cron';
import { query } from '../lib/db.mjs';
import { decryptToken, encryptToken } from '../utils/tokenCrypto.mjs';

/**
 * Executes a token refresh scan for Instagram long-lived access tokens
 * that are expiring within the next 10 days.
 */
export async function refreshExpiringInstagramTokens() {
  console.log('[Instagram Token Refresh Job] Starting scheduled token refresh scan...');
  try {
    const result = await query(
      `SELECT id, user_id, access_token_encrypted, token_expires_at
       FROM social_accounts
       WHERE platform = 'instagram'
         AND needs_reconnect = FALSE
         AND token_expires_at <= NOW() + INTERVAL '10 days'`
    );

    const expiringAccounts = result.rows || [];
    console.log(`[Instagram Token Refresh Job] Found ${expiringAccounts.length} Instagram account(s) due for refresh.`);

    for (const account of expiringAccounts) {
      try {
        if (!account.access_token_encrypted) continue;

        const currentToken = decryptToken(account.access_token_encrypted);
        const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;

        const response = await fetch(refreshUrl);
        const data = await response.json();

        if (response.ok && data.access_token) {
          const newEncryptedToken = encryptToken(data.access_token);
          const expiresInSeconds = data.expires_in || 5184000; // ~60 days
          const newTokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

          await query(
            `UPDATE social_accounts
             SET access_token_encrypted = $1,
                 token_expires_at = $2,
                 last_refreshed_at = NOW(),
                 needs_reconnect = FALSE,
                 updated_at = NOW()
             WHERE id = $3`,
            [newEncryptedToken, newTokenExpiresAt, account.id]
          );

          console.log(`[Instagram Token Refresh Job] Successfully refreshed token for account ${account.id}.`);
        } else {
          console.warn(`[Instagram Token Refresh Job] Token refresh failed for account ${account.id}:`, data.error?.message || data);
          await query(
            `UPDATE social_accounts
             SET needs_reconnect = TRUE,
                 updated_at = NOW()
             WHERE id = $1`,
            [account.id]
          );
        }
      } catch (accountErr) {
        console.error(`[Instagram Token Refresh Job] Exception refreshing account ${account.id}:`, accountErr);
        await query(
          `UPDATE social_accounts
           SET needs_reconnect = TRUE,
               updated_at = NOW()
           WHERE id = $1`,
          [account.id]
        ).catch(() => {});
      }
    }
  } catch (error) {
    console.error('[Instagram Token Refresh Job Error]', error);
  }
}

/**
 * Initializes the node-cron scheduled task (runs once daily at 02:00 AM).
 */
export function initInstagramTokenRefreshCron() {
  // Cron syntax: 0 2 * * * = Every day at 02:00 AM
  cron.schedule('0 2 * * *', () => {
    refreshExpiringInstagramTokens();
  });
  console.log('[Instagram Token Refresh Cron] Scheduled daily at 02:00 AM');
}
