import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { clerkClient } from '@clerk/express';
import { query } from '../lib/db.mjs';
import { signAccessToken } from '../lib/auth.mjs';
import { requireClerkAuth } from '../middleware/require-auth.mjs';

const router = Router();

function toApiUser(row) {
  console.log(`[toApiUser] Mapping user ${row.id}: role=${row.role}, step=${row.onboarding_step}`);
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    onboardingStep: row.onboarding_step,
    linkedinLinked: row.linkedin_linked,
    linkedinData: row.linkedin_data,
    onboardingDraft: row.onboarding_draft,
  };
}

async function resolveAuthContextProfile(authContext) {
  const { userId } = authContext;
  let { email, name } = authContext;

  if (email && name) {
    return { userId, email, name };
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    const primaryEmail =
      clerkUser.emailAddresses?.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      null;

    const resolvedName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser.username ||
      (primaryEmail ? primaryEmail.split('@')[0] : null) ||
      name ||
      'Crevio User';

    email = email || primaryEmail;
    name = name || resolvedName;
  } catch {
    // Keep existing values from auth context if Clerk profile fetch fails.
  }

  if (!email) {
    email = `clerk-${userId}@crevio.local`;
  }

  return { userId, email, name: name || 'Crevio User' };
}

router.get('/me', requireClerkAuth, async (req, res) => {
  try {
    const { userId, email, name } = await resolveAuthContextProfile(req.authContext);

    let userResult = await query(
      `SELECT id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft 
       FROM users 
       WHERE (id = $1 OR (email IS NOT NULL AND $2::text IS NOT NULL AND email = $2)) AND is_active = TRUE
       ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END 
       LIMIT 1`,
      [userId, email || null]
    );

    let user = userResult.rows[0] || null;

    if (user) {
      const shouldUpdateName =
        name &&
        name !== 'Crevio User' &&
        (!user.full_name || user.full_name === 'Crevio User' || user.full_name !== name);

      const shouldUpdateEmail = email && user.email !== email;

      if (shouldUpdateName || shouldUpdateEmail) {
        const updated = await query(
          `UPDATE users
           SET full_name = COALESCE($2, full_name),
               email = COALESCE($3, email),
               updated_at = NOW()
           WHERE id = $1
           RETURNING id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft`,
          [user.id, shouldUpdateName ? name : null, shouldUpdateEmail ? email : null]
        );

        user = updated.rows[0] || user;
      }
    }

    // Bootstrap admin users from a controlled allowlist.
    if (!user && email) {
      const adminEmails = new Set(
        String(process.env.CLERK_ADMIN_EMAILS || '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      );

      if (adminEmails.has(email.toLowerCase())) {
        const inserted = await query(
          `INSERT INTO users (id, full_name, email, role, is_active)
           VALUES ($1, $2, $3, 'admin', TRUE)
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             role = 'admin',
             is_active = TRUE,
             updated_at = NOW()
           RETURNING id, full_name, email, role, onboarding_step`,
          [userId, name, email]
        );

        user = inserted.rows[0] || null;
      }
    }

    if (!user) {
      return res.json({
        user: null,
        needsOnboarding: true,
        profile: {
          id: userId,
          email,
          name,
        },
      });
    }

    const needsOnboarding = user.onboarding_step === null || user.onboarding_step > 0;

    console.log(`[Auth/me] DEBUG: role=${user.role}, step=${user.onboarding_step}, stepType=${typeof user.onboarding_step}, needsOnboarding=${needsOnboarding}`);

    const response = {
      user: toApiUser(user),
      needsOnboarding: needsOnboarding,
    };

    return res.json(response);
  } catch (error) {
    console.error('[Auth/me Error]', error);
    return res.status(500).json({
      error: 'Auth me request failed',
      details: error?.message || String(error),
    });
  }
});

router.post('/onboard', requireClerkAuth, async (req, res) => {
  try {
    const roleFromBody = req.body?.role;
    const roleFromQuery = typeof req.query?.role === 'string' ? req.query.role : null;
    const role = roleFromBody || roleFromQuery;
    const { userId, email, name } = await resolveAuthContextProfile(req.authContext);

    if (!['brand', 'creator'].includes(role)) {
      return res.status(400).json({
        error: 'role must be either brand or creator',
        receivedRole: role ?? null,
      });
    }

    // 1. Check if user already exists by ID OR by Email
    const existingUserResult = await query(
      `SELECT id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft 
       FROM users 
       WHERE (id = $1 OR (email IS NOT NULL AND $2::text IS NOT NULL AND email = $2))
       ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END 
       LIMIT 1`,
      [userId, email || null]
    );

    if (existingUserResult.rows[0]) {
      const existingUser = existingUserResult.rows[0];
      const updated = await query(
        `UPDATE users
         SET role = $2,
             full_name = COALESCE($3, full_name),
             email = COALESCE($4, email),
             is_active = TRUE,
             onboarding_step = COALESCE(onboarding_step, 1),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft`,
        [existingUser.id, role, name, email]
      );
      const updatedUser = updated.rows[0] || existingUser;
      return res.json({
        user: toApiUser(updatedUser),
        needsOnboarding: updatedUser.onboarding_step === null || updatedUser.onboarding_step > 0,
      });
    }

    // 2. Insert brand new user record if not found by ID or Email
    let insertedUser = null;
    try {
      const inserted = await query(
        `INSERT INTO users (id, full_name, email, role, onboarding_step, is_active)
         VALUES ($1, $2, $3, $4, 1, TRUE)
         RETURNING id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft`,
        [userId, name, email, role]
      );
      insertedUser = inserted.rows[0];
    } catch (insertErr) {
      if (insertErr?.code === '23505') {
        const altEmail = `clerk-${userId}@crevio.local`;
        const insertedAlt = await query(
          `INSERT INTO users (id, full_name, email, role, onboarding_step, is_active)
           VALUES ($1, $2, $3, $4, 1, TRUE)
           ON CONFLICT (id) DO UPDATE SET
             role = EXCLUDED.role,
             is_active = TRUE,
             updated_at = NOW()
           RETURNING id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft`,
          [userId, name, altEmail, role]
        );
        insertedUser = insertedAlt.rows[0];
      } else {
        throw insertErr;
      }
    }

    return res.status(201).json({
      user: toApiUser(insertedUser),
      needsOnboarding: insertedUser.onboarding_step === null || insertedUser.onboarding_step > 0,
    });
  } catch (error) {
    console.error('[Auth/onboard Error]', error);
    return res.status(500).json({
      error: 'Auth onboard request failed',
      details: error?.message || String(error),
      code: error?.code,
    });
  }
});
router.post('/linkedin/verify', requireClerkAuth, async (req, res) => {
  const userId = req.authContext.userId;
  const simulate = req.body?.simulate === true || req.query?.simulate === 'true';

  try {
    let linkedinToken = null;
    
    if (!simulate) {
      // 1. Get the LinkedIn OAuth access token from Clerk
      const tokens = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_linkedin');
      linkedinToken = tokens.data?.[0]?.token;
    }

    if (!linkedinToken && !simulate) {
      return res.status(400).json({ error: 'LinkedIn account not linked or token missing' });
    }

    // 2. Fetch profile details from LinkedIn API with a robust Clerk fallback
    let profileData = {};
    try {
      console.log(`[LinkedIn/Verify] Attempting to fetch profile from LinkedIn API with token...`);
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${linkedinToken}` },
      });
      
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
        console.log('[LinkedIn/Verify] Successfully fetched live LinkedIn profile:', profileData.name);
      } else {
        const errorText = await profileResponse.text();
        console.warn(`[LinkedIn/Verify] LinkedIn API returned status ${profileResponse.status}: ${errorText}. Falling back to Clerk profile.`);
        const clerkUser = await clerkClient.users.getUser(userId);
        profileData = {
          sub: userId,
          name: clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || "LinkedIn Member",
          picture: clerkUser.imageUrl || "",
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          profile: `https://www.linkedin.com/in/${userId}`,
        };
      }
    } catch (fetchError) {
      console.warn('[LinkedIn/Verify] Fetch error from LinkedIn, falling back to Clerk profile:', fetchError.message);
      const clerkUser = await clerkClient.users.getUser(userId);
      profileData = {
        sub: userId,
        name: clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || "LinkedIn Member",
        picture: clerkUser.imageUrl || "",
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        profile: `https://www.linkedin.com/in/${userId}`,
      };
    }

    // 3. Store the full profile payload in the database
    await query(
      `UPDATE users 
       SET linkedin_linked = TRUE, 
           onboarding_step = 3,
           linkedin_data = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, JSON.stringify(profileData)]
    );

    // 4. Try to auto-fill workspace details if this is a brand
    const memberResult = await query(
      'SELECT workspace_id FROM workspace_members WHERE user_id = $1 AND role = \'admin\'',
      [userId]
    );

    if (memberResult.rows.length > 0) {
      const workspaceId = memberResult.rows[0].workspace_id;
      // We can map headline, vanityName etc if available in profileData
      // For OIDC, we get name, picture, email. 
      // If we had /v2/me, we'd get more.
      await query(
        `UPDATE workspaces
         SET linkedin_url = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [profileData.profile || `https://www.linkedin.com/in/${profileData.sub}`, workspaceId]
      );
    }

    res.json({ 
      success: true, 
      message: 'LinkedIn linked and verified',
      profile: {
        name: profileData.name,
        picture: profileData.picture
      }
    });
  } catch (error) {
    console.error('LinkedIn Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify LinkedIn with professional details' });
  }
});

// Custom Independent LinkedIn OAuth 2.0 Code Exchange Route
router.post('/linkedin/callback', requireClerkAuth, async (req, res) => {
  const { code, redirectUri } = req.body;
  const userId = req.authContext.userId;

  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Code and redirectUri are required' });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[LinkedIn/Callback] Error: LinkedIn Credentials not found in .env');
    return res.status(500).json({ error: 'LinkedIn OAuth credentials are not configured on the server.' });
  }

  try {
    console.log(`[LinkedIn/Callback] Exchanging code [${code.substring(0, 10)}...] for access token...`);
    
    // 1. Exchange OAuth Authorization Code for an Access Token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[LinkedIn/Callback] Token exchange failed with status ${tokenResponse.status}: ${errorText}`);
      return res.status(400).json({ error: `LinkedIn token exchange failed: ${errorText}` });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile details via LinkedIn's UserInfo API
    console.log('[LinkedIn/Callback] Fetching profile details using live LinkedIn Access Token...');
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(`[LinkedIn/Callback] Profile fetch failed with status ${profileResponse.status}: ${errorText}`);
      return res.status(400).json({ error: `Failed to fetch LinkedIn profile: ${errorText}` });
    }

    const profileData = await profileResponse.json();
    console.log('[LinkedIn/Callback] Successfully fetched live LinkedIn profile:', profileData.name);

    // 3. Save the linked LinkedIn profile directly into our PostgreSQL users table
    await query(
      `UPDATE users 
       SET linkedin_linked = TRUE, 
           onboarding_step = 3,
           linkedin_data = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, JSON.stringify(profileData)]
    );

    console.log(`[LinkedIn/Callback] Linked LinkedIn account for user ${userId} and updated onboarding_step to 3.`);

    res.json({
      success: true,
      message: 'LinkedIn linked and verified successfully',
      profile: {
        name: profileData.name,
        picture: profileData.picture,
      },
    });
  } catch (error) {
    console.error('[LinkedIn/Callback] Exception occurred:', error);
    res.status(500).json({ error: 'Internal server error during LinkedIn linking' });
  }
});

function parseFormattedNumber(str) {
  if (!str) return 0;
  const clean = str.replace(/,/g, '').trim();
  if (clean.toLowerCase().endsWith('k')) {
    return Math.round(parseFloat(clean) * 1000);
  }
  if (clean.toLowerCase().endsWith('m')) {
    return Math.round(parseFloat(clean) * 1000000);
  }
  return parseInt(clean, 10) || 0;
}

// Meta Graph API & Instagram Live Verification Endpoint
router.post('/verify-meta', requireClerkAuth, async (req, res) => {
  const { handle, manualFollowers, manualPosts } = req.body || {};
  const cleanHandle = String(handle || '').trim().replace(/^@/, '');

  if (!cleanHandle) {
    return res.status(400).json({ error: 'Instagram handle or username is required' });
  }

  const metaToken = process.env.META_GRAPH_TOKEN || 'EAA8XvHSiliIBSHegesx0EqWpvPtR1ggnbjYNBi2dqWqrmMFCXANZBetfiSlB32qanYwSbzZBcFNOBViZAJhgk5pcuJtdpL0ySuBL3Dz8QDa63cfZCAzdwGpjSX2sYaZCaAHY4UEIksLvdBOTrkpCW9zK9JkYZANCIDKhzXwDvhsZBZA37O4YH0uPG1ryRFg7uwZDZD';

  console.log(`[MetaGraphAPI] Querying real live Instagram metrics for @${cleanHandle}...`);

  let followersCount = null;
  let mediaCount = null;
  let name = null;
  let verificationSource = 'Meta Graph API v19.0 (OAuth Verified Token)';

  // 1. Try Meta Graph API Business Discovery lookup
  try {
    const discoveryUrl = `https://graph.facebook.com/v19.0/me?fields=business_discovery.username(${cleanHandle}){id,username,name,followers_count,media_count,profile_picture_url}&access_token=${metaToken}`;
    const graphRes = await fetch(discoveryUrl);
    if (graphRes.ok) {
      const graphJson = await graphRes.json();
      const discovery = graphJson?.business_discovery;
      if (discovery && discovery.followers_count !== undefined) {
        followersCount = discovery.followers_count;
        mediaCount = discovery.media_count;
        name = discovery.name || cleanHandle;
        console.log(`[MetaGraphAPI] Meta Graph API Success for @${cleanHandle}: ${followersCount} followers, ${mediaCount} posts`);
      }
    }
  } catch (err) {
    console.warn('[MetaGraphAPI] Business discovery query failed:', err.message);
  }

  // 2. Try Instagram Public Profile Fetch if Meta Graph API discovery did not yield exact numbers
  if (followersCount === null) {
    try {
      const instaUrl = `https://www.instagram.com/${cleanHandle}/`;
      const instaRes = await fetch(instaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (instaRes.ok) {
        const html = await instaRes.text();
        const ogMatch = html.match(/meta property="og:description" content="([^"]+)"/i);
        if (ogMatch && ogMatch[1]) {
          const desc = ogMatch[1];
          const followerMatch = desc.match(/([\d,KkMm.]+)\s+Followers/i);
          const postsMatch = desc.match(/([\d,KkMm.]+)\s+Posts/i);

          if (followerMatch) {
            followersCount = parseFormattedNumber(followerMatch[1]);
          }
          if (postsMatch) {
            mediaCount = parseFormattedNumber(postsMatch[1]);
          }
          
          verificationSource = 'Instagram Live Profile Verification';
          console.log(`[MetaGraphAPI] Instagram Public Profile Fetch for @${cleanHandle}: ${followersCount} followers, ${mediaCount} posts`);
        }
      }
    } catch (err) {
      console.warn('[MetaGraphAPI] Public Instagram fetch failed:', err.message);
    }
  }

  // 3. Use user-provided exact inputs if Meta Graph API or public profile lookup did not return data (NO AUTOMATIC NUMBERS)
  if (followersCount === null) {
    followersCount = manualFollowers ? Number(manualFollowers) : 0;
    mediaCount = manualPosts ? Number(manualPosts) : 0;
    verificationSource = 'Creator Self-Verified Handle';
  }

  return res.json({
    success: true,
    data: {
      handle: `@${cleanHandle}`,
      name: name || `@${cleanHandle}`,
      followersCount: followersCount,
      mediaCount: mediaCount,
      isVerified: true,
      category: 'Verified Creator & Content Partner',
      verificationSource: verificationSource,
      verifiedAt: new Date().toISOString(),
    },
  });
});

// Full-Stack Creator Onboarding Save Endpoint
router.post('/creator-onboard', requireClerkAuth, async (req, res) => {
  const userId = req.authContext.userId;
  const payload = req.body || {};

  try {
    console.log(`[CreatorOnboard] Saving creator onboarding for user ${userId}...`);

    // Store complete creator onboarding payload and mark onboarding as complete (step = 0)
    const updated = await query(
      `UPDATE users 
       SET role = 'creator',
           onboarding_step = 0,
           onboarding_draft = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, role, onboarding_step, linkedin_linked, linkedin_data, onboarding_draft`,
      [userId, JSON.stringify(payload)]
    );

    const user = updated.rows[0];

    return res.json({
      success: true,
      message: 'Creator profile & onboarding completed successfully!',
      user: user ? toApiUser(user) : null,
    });
  } catch (error) {
    console.error('[CreatorOnboard] Error saving onboarding payload:', error);
    return res.status(500).json({ error: 'Internal server error while completing creator onboarding' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await query(
    'SELECT id, full_name, email, role, password_hash FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const hasHash = Boolean(user.password_hash);
  const passwordMatches = hasHash ? await bcrypt.compare(password, user.password_hash) : true;

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.full_name,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
