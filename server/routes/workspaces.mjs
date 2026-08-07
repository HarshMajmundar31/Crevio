import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { requireClerkAuth } from '../middleware/require-auth.mjs';

const router = Router();

// Step 1: Draft Workspace Name & Slug (Does not fully create the workspace yet)
router.post('/', requireClerkAuth, async (req, res) => {
  const { name, slug, logo_url } = req.body;
  const userId = req.authContext.userId;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  try {
    // 1. Check if slug is taken in completed workspaces OR other users' active onboarding drafts
    const slugCheck = await query(
      `SELECT id::text FROM workspaces WHERE slug = $1
       UNION
       SELECT id::text FROM users WHERE onboarding_draft->'workspace'->>'slug' = $1 AND id <> $2`,
      [slug, userId]
    );

    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Workspace URL is already taken' });
    }

    // 2. Read existing draft and merge workspace data
    const userResult = await query('SELECT onboarding_draft FROM users WHERE id = $1', [userId]);
    const draft = userResult.rows[0]?.onboarding_draft || {};
    
    draft.workspace = { name, slug, logo_url: logo_url || null };

    // 3. Save workspace draft & move step to 2
    await query(
      `UPDATE users 
       SET onboarding_draft = $1, 
           onboarding_step = 2,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(draft), userId]
    );

    console.log(`[Workspace/Draft] Saved Step 1 Draft for user ${userId}:`, draft.workspace);

    // Return the workspace details to keep the frontend completely satisfied
    res.status(201).json(draft.workspace);
  } catch (error) {
    console.error('[Workspace/Step1] Error:', error);
    res.status(500).json({ error: 'Failed to save workspace draft' });
  }
});

// Step 3: Draft Profile Details
router.patch('/profile', requireClerkAuth, async (req, res) => {
  const { industry, company_size, website, bio, hq_location } = req.body;
  const userId = req.authContext.userId;

  try {
    // 1. Read existing draft
    const userResult = await query('SELECT onboarding_draft FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const draft = userResult.rows[0].onboarding_draft || {};
    
    // 2. Merge profile details
    draft.profile = {
      industry: industry || null,
      company_size: company_size || null,
      website: website || null,
      bio: bio || null,
      hq_location: hq_location || null,
    };

    // 3. Save draft & move step to 5
    await query(
      `UPDATE users 
       SET onboarding_draft = $1, 
           onboarding_step = 5,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(draft), userId]
    );

    console.log(`[Workspace/Draft] Saved Step 3 Draft for user ${userId}:`, draft.profile);

    res.json(draft.profile);
  } catch (error) {
    console.error('[Workspace/Step3] Error:', error);
    res.status(500).json({ error: 'Failed to save profile draft' });
  }
});

// Step 5: Draft Team Members & Invites
router.post('/invite', requireClerkAuth, async (req, res) => {
  const { invitees } = req.body; // Array of { email, role }
  const userId = req.authContext.userId;

  try {
    // 1. Read existing draft
    const userResult = await query('SELECT onboarding_draft FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const draft = userResult.rows[0].onboarding_draft || {};

    // 2. Merge team details
    draft.team = invitees || [];

    // 3. Save draft & move step to 6
    await query(
      `UPDATE users 
       SET onboarding_draft = $1, 
           onboarding_step = 6,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(draft), userId]
    );

    console.log(`[Workspace/Draft] Saved Step 5 Draft for user ${userId}:`, draft.team);

    res.json({ success: true, message: 'Invitations drafted successfully' });
  } catch (error) {
    console.error('[Workspace/Step5] Error:', error);
    res.status(500).json({ error: 'Failed to save invitations draft' });
  }
});

// Step 6: Complete Onboarding & COMMITTED Workspace Creation!
router.post('/complete', requireClerkAuth, async (req, res) => {
  const userId = req.authContext.userId;

  try {
    // 1. Fetch user's entire onboarding draft & their connected LinkedIn details
    const userResult = await query(
      'SELECT onboarding_draft, linkedin_data, linkedin_linked FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or session expired.' });
    }

    const { onboarding_draft: draft, linkedin_data: linkedinData } = userResult.rows[0];

    const workspaceDraft = draft?.workspace;
    const profileDraft = draft?.profile || {};
    const teamDraft = draft?.team || [];

    if (!workspaceDraft || !workspaceDraft.name || !workspaceDraft.slug) {
      return res.status(400).json({ 
        error: 'Missing draft workspace details. Please start from Step 1.' 
      });
    }

    // Double-check if slug got taken while we were in onboarding
    const slugCheck = await query('SELECT id FROM workspaces WHERE slug = $1', [workspaceDraft.slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: `Workspace URL '${workspaceDraft.slug}' was taken by another user during your session. Please return to Step 1.` 
      });
    }

    // 2. Create the workspace row
    const linkedinUrl = linkedinData?.profile || (linkedinData?.sub ? `https://www.linkedin.com/in/${linkedinData.sub}` : null);

    console.log(`[Workspace/Complete] Committing final workspace '${workspaceDraft.slug}' to DB...`);
    const workspaceResult = await query(
      `INSERT INTO workspaces (
         name, slug, logo_url, industry, company_size, website, bio, hq_location, linkedin_url, onboarding_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COMPLETED')
       RETURNING *`,
      [
        workspaceDraft.name,
        workspaceDraft.slug,
        workspaceDraft.logo_url,
        profileDraft.industry,
        profileDraft.company_size,
        profileDraft.website,
        profileDraft.bio,
        profileDraft.hq_location,
        linkedinUrl
      ]
    );

    const workspace = workspaceResult.rows[0];

    // 3. Add creator as admin member
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [workspace.id, userId]
    );

    // 4. Send out team invitations (or write to invites table if applicable)
    if (teamDraft.length > 0) {
      console.log(`[Workspace/Complete] Sending invites to ${teamDraft.length} colleagues for workspace:`, workspace.id);
      // Simulating invite emails to teamDraft
    }

    // 5. Clear onboarding draft and set onboarding_step = 0 (Onboarding Completed!)
    await query(
      `UPDATE users 
       SET onboarding_step = 0, 
           onboarding_draft = '{}'::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    console.log(`[Workspace/Complete] Onboarding successfully finalized! Workspace ${workspace.id} is active.`);

    res.json({ success: true, message: 'Onboarding completed and workspace fully created!' });
  } catch (error) {
    console.error('[Workspace/Step6] Error:', error);
    res.status(500).json({ error: 'Failed to finalize onboarding setup.' });
  }
});

// GET /api/workspaces/current - Retrieve active workspace and team roster
router.get('/current', requireClerkAuth, async (req, res) => {
  const userId = req.authContext.userId;

  try {
    // 1. Fetch workspace user belongs to
    const memberResult = await query(
      `SELECT w.*, wm.role as user_role 
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1`,
      [userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active workspace found for this user.' });
    }

    const workspace = memberResult.rows[0];

    // 2. Fetch all members of this workspace
    const membersResult = await query(
      `SELECT u.id, u.full_name as name, u.email, u.avatar_url, wm.role
       FROM users u
       JOIN workspace_members wm ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.created_at ASC`,
      [workspace.id]
    );

    res.json({
      workspace,
      members: membersResult.rows
    });
  } catch (error) {
    console.error('[Workspaces/Current] Error:', error);
    res.status(500).json({ error: 'Failed to retrieve active workspace details.' });
  }
});

export default router;
