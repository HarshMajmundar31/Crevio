import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../lib/db.mjs';
import { requireAuth } from '../middleware/require-auth.mjs';
import { encryptToken, decryptToken } from '../utils/tokenCrypto.mjs';

const router = Router();

function getSecret() {
  return process.env.STATE_JWT_SECRET || process.env.JWT_SECRET || 'crevio_instagram_state_jwt_secret_2026_9f8e';
}

function getFrontendUrl(req) {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }
  if (req) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  return 'https://crevio.co.in';
}

function getRedirectUri(req) {
  if (process.env.INSTAGRAM_REDIRECT_URI) {
    return process.env.INSTAGRAM_REDIRECT_URI;
  }
  return `${getFrontendUrl(req)}/api/auth/instagram/callback`;
}

/**
 * GET /api/auth/instagram/connect-url
 * Generates signed state JWT and Instagram OAuth authorization URL.
 */
router.get('/auth/instagram/connect-url', requireAuth, (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    const stateToken = jwt.sign(
      {
        userId,
        nonce: crypto.randomUUID(),
      },
      getSecret(),
      { expiresIn: '10m' }
    );

    const appId = process.env.INSTAGRAM_APP_ID || '4248222828762658';
    const redirectUri = getRedirectUri(req);
    
    const authBaseUrl = process.env.INSTAGRAM_AUTH_URL || 'https://api.instagram.com/oauth/authorize';
    const scopes = process.env.INSTAGRAM_SCOPES || 'instagram_business_basic,instagram_business_manage_insights';

    const url = `${authBaseUrl}?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(stateToken)}`;


    return res.json({ url });
  } catch (error) {
    console.error('[GET /connect-url Error]', error);
    return res.status(500).json({ error: 'Failed to generate connect URL' });
  }
});

/**
 * GET /api/auth/instagram/callback
 * Public redirect target for Instagram OAuth authorization code.
 */
router.get('/auth/instagram/callback', async (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  const { code, state, error, error_description } = req.query;

  // 1. Handle user denied access or explicit OAuth error
  if (error || error_description) {
    console.warn('[Instagram Callback] OAuth access denied or error:', error, error_description);
    return res.redirect(`${frontendUrl}/onboarding/creator?instagram=denied`);
  }

  // 2. Validate state parameter
  if (!state) {
    return res.redirect(`${frontendUrl}/onboarding/creator?instagram=error&reason=invalid_state`);
  }

  let decoded;
  try {
    decoded = jwt.verify(state, getSecret());
  } catch (err) {
    console.error('[Instagram Callback] State verification failed:', err?.message);
    return res.redirect(`${frontendUrl}/onboarding/creator?instagram=error&reason=invalid_state`);
  }

  const userId = decoded?.userId;
  if (!userId || !code) {
    return res.redirect(`${frontendUrl}/onboarding/creator?instagram=error&reason=invalid_state`);
  }

  try {
    const appId = process.env.INSTAGRAM_APP_ID || '4248222828762658';
    const appSecret = process.env.INSTAGRAM_APP_SECRET || '';
    const redirectUri = getRedirectUri(req);

    let activeToken = null;
    let expiresInSeconds = 5184000;
    let permissions = [];

    // 3. Dual Token Exchange: Try Facebook Graph API token exchange first
    const fbTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(String(code))}`;
    const fbTokenRes = await fetch(fbTokenUrl);
    const fbTokenData = await fbTokenRes.json();

    if (fbTokenRes.ok && fbTokenData.access_token) {
      activeToken = fbTokenData.access_token;
      expiresInSeconds = fbTokenData.expires_in || 5184000;
    } else {
      // Direct Instagram Token Exchange fallback
      const tokenParams = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: String(code),
      });

      const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams,
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('[Instagram Callback] Token exchange failed (FB & IG):', fbTokenData, tokenData);
        return res.redirect(`${frontendUrl}/onboarding/creator?instagram=error&reason=token_exchange_failed`);
      }

      const shortLivedToken = tokenData.access_token;
      permissions = Array.isArray(tokenData.permissions) ? tokenData.permissions : [];

      // Exchange short-lived for long-lived token
      const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortLivedToken)}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = await longLivedRes.json();

      activeToken = (longLivedRes.ok && longLivedData.access_token) ? longLivedData.access_token : shortLivedToken;
      expiresInSeconds = longLivedData.expires_in || 5184000;
    }

    // 4. Fetch Creator Profile
    let profileData = {
      user_id: `ig_${Date.now()}`,
      username: 'instagram_creator',
      account_type: 'BUSINESS',
      media_count: 0,
      followers_count: 0,
      profile_picture_url: null,
    };

    // Try Graph Instagram me first
    const profileUrl = `https://graph.instagram.com/me?fields=user_id,username,account_type,media_count,followers_count,profile_picture_url&access_token=${encodeURIComponent(activeToken)}`;
    const profileRes = await fetch(profileUrl);
    const igProfile = await profileRes.json();

    if (profileRes.ok && igProfile.user_id) {
      profileData = igProfile;
    } else {
      // Try Facebook Graph accounts fallback
      const fbMeUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,accounts{instagram_business_account{id,username,profile_picture_url,followers_count,media_count}}&access_token=${encodeURIComponent(activeToken)}`;
      const fbMeRes = await fetch(fbMeUrl);
      const fbMeData = await fbMeRes.json();

      const igBusiness = fbMeData?.accounts?.data?.[0]?.instagram_business_account;
      if (igBusiness && igBusiness.id) {
        profileData = {
          user_id: igBusiness.id,
          username: igBusiness.username || fbMeData.name,
          account_type: 'BUSINESS',
          media_count: igBusiness.media_count || 0,
          followers_count: igBusiness.followers_count || 0,
          profile_picture_url: igBusiness.profile_picture_url || null,
        };
      }
    }


    if (!profileData || !profileData.user_id) {
      console.error('[Instagram Callback] Profile fetch failed:', profileData);
      return res.redirect(`${frontendUrl}/onboarding/creator?instagram=error&reason=profile_fetch_failed`);
    }

    // 6. Encrypt token and upsert into database
    const encryptedAccessToken = encryptToken(activeToken);

    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const recordId = `ig_${userId}_${profileData.user_id}`;

    await query(
      `INSERT INTO social_accounts (
        id, user_id, platform, platform_user_id, username, display_name,
        profile_picture_url, account_type, followers_count, media_count,
        access_token_encrypted, token_expires_at, scopes, needs_reconnect,
        connected_at, last_refreshed_at, updated_at
      )
      VALUES ($1, $2, 'instagram', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, FALSE, NOW(), NOW(), NOW())
      ON CONFLICT (user_id, platform) DO UPDATE SET
        platform_user_id = EXCLUDED.platform_user_id,
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        profile_picture_url = EXCLUDED.profile_picture_url,
        account_type = EXCLUDED.account_type,
        followers_count = EXCLUDED.followers_count,
        media_count = EXCLUDED.media_count,
        access_token_encrypted = EXCLUDED.access_token_encrypted,
        token_expires_at = EXCLUDED.token_expires_at,
        scopes = EXCLUDED.scopes,
        needs_reconnect = FALSE,
        last_refreshed_at = NOW(),
        updated_at = NOW()`,
      [
        recordId,
        userId,
        profileData.user_id,
        profileData.username,
        profileData.username,
        profileData.profile_picture_url || null,
        profileData.account_type || 'BUSINESS',
        Number(profileData.followers_count || 0),
        Number(profileData.media_count || 0),
        encryptedAccessToken,
        tokenExpiresAt,
        permissions,
      ]
    );

    // 7. Successful redirect
    return res.redirect(`${frontendUrl}/onboarding/creator?instagram=connected`);
  } catch (err) {
    console.error('[Instagram Callback Error]', err);
    return res.redirect(`${frontendUrl}/onboarding/creator?instagram=error&reason=server_error`);
  }
});

/**
 * GET /api/social/instagram/account
 * Returns connected Instagram profile summary for the current user.
 */
router.get('/social/instagram/account', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    const result = await query(
      `SELECT platform_user_id, username, display_name, profile_picture_url,
              account_type, followers_count, media_count, connected_at, needs_reconnect
       FROM social_accounts
       WHERE user_id = $1 AND platform = 'instagram'
       LIMIT 1`,
      [userId]
    );

    const account = result.rows[0];
    if (!account) {
      return res.json({ connected: false });
    }


    return res.json({
      connected: true,
      platformUserId: account.platform_user_id,
      username: account.username,
      displayName: account.display_name || account.username,
      profilePictureUrl: account.profile_picture_url,
      accountType: account.account_type,
      followersCount: Number(account.followers_count || 0),
      mediaCount: Number(account.media_count || 0),
      connectedAt: account.connected_at,
      needsReconnect: Boolean(account.needs_reconnect),
    });
  } catch (error) {
    console.error('[GET /social/instagram/account Error]', error);
    return res.status(500).json({ error: 'Failed to fetch Instagram account status' });
  }
});

/**
 * GET /api/social/instagram/insights
 * Fetches reach and profile views insights for connected creator.
 */
router.get('/social/instagram/insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    const result = await query(
      `SELECT platform_user_id, access_token_encrypted, needs_reconnect
       FROM social_accounts
       WHERE user_id = $1 AND platform = 'instagram'
       LIMIT 1`,
      [userId]
    );

    const account = result.rows[0];
    if (!account || !account.access_token_encrypted) {
      return res.status(404).json({ connected: false, message: 'Instagram account not connected' });
    }

    if (account.needs_reconnect) {
      return res.json({ available: false, reason: 'Instagram authorization expired. Re-connection required.' });
    }

    const token = decryptToken(account.access_token_encrypted);
    const insightsUrl = `https://graph.instagram.com/${encodeURIComponent(account.platform_user_id)}/insights?metric=reach,profile_views&period=day&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(insightsUrl);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn('[Instagram Insights Warning]', data.error);
      return res.json({
        available: false,
        reason: data.error?.message || 'Insights not available for this account type or current permissions',
      });
    }

    return res.json({
      available: true,
      metrics: data.data || [],
    });
  } catch (error) {
    console.error('[GET /social/instagram/insights Error]', error);
    return res.status(500).json({ available: false, reason: 'Server error retrieving insights' });
  }
});

/**
 * DELETE /api/social/instagram/disconnect
 * Removes social account record for current user.
 */
router.delete('/social/instagram/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context not found' });
    }

    await query(
      `DELETE FROM social_accounts WHERE user_id = $1 AND platform = 'instagram'`,
      [userId]
    );

    return res.status(204).send();
  } catch (error) {
    console.error('[DELETE /social/instagram/disconnect Error]', error);
    return res.status(500).json({ error: 'Failed to disconnect Instagram account' });
  }
});

export default router;
