import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';
import { broadcastEvent } from '../lib/socket.mjs';
import OpenAI from 'openai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Idempotent column check for insights photo and engagement metrics
async function ensureProofSubmissionsColumns() {
  try {
    await query(`
      ALTER TABLE campaign_proof_submissions 
      ADD COLUMN IF NOT EXISTS insights_image_path TEXT,
      ADD COLUMN IF NOT EXISTS insights_image_name TEXT,
      ADD COLUMN IF NOT EXISTS engagement_rate TEXT,
      ADD COLUMN IF NOT EXISTS impressions_count TEXT,
      ADD COLUMN IF NOT EXISTS reach_count TEXT,
      ADD COLUMN IF NOT EXISTS likes_count TEXT,
      ADD COLUMN IF NOT EXISTS comments_count TEXT,
      ADD COLUMN IF NOT EXISTS shares_count TEXT,
      ADD COLUMN IF NOT EXISTS saves_count TEXT,
      ADD COLUMN IF NOT EXISTS overview_notes TEXT;
    `);
  } catch (err) {
    // Column check fallback ignored
  }
}
ensureProofSubmissionsColumns();

let openaiClient = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLinks(value, minItems = 0, maxItems = 10) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .filter((link) => /^https?:\/\//i.test(link))
    .slice(0, Math.max(minItems, maxItems));
}

function parseEngagementRatePercent(snapshot) {
  const match = String(snapshot || '').match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function calculateAudienceFitScore({ campaignTarget, campaignPlatform, audienceNiche, audienceLocation }) {
  const target = `${campaignTarget || ''} ${campaignPlatform || ''}`.toLowerCase();
  const audience = `${audienceNiche || ''} ${audienceLocation || ''}`.toLowerCase();
  const targetTokens = target.split(/[^a-z0-9]+/i).filter((token) => token.length > 2);
  const overlapCount = targetTokens.filter((token) => audience.includes(token)).length;

  return clamp(45 + overlapCount * 12);
}

function calculateEngagementQualityScore(snapshot) {
  const rate = parseEngagementRatePercent(snapshot);
  if (rate === null) {
    return 55;
  }

  if (rate >= 10) return 96;
  if (rate >= 8) return 90;
  if (rate >= 6) return 82;
  if (rate >= 4) return 70;
  if (rate >= 2) return 58;
  return 45;
}

function calculateContentQualityScore({ pitchMessage, pastWorkLinks }) {
  const pitchLength = String(pitchMessage || '').trim().length;
  const linksScore = Math.min(35, (pastWorkLinks.length || 0) * 8);
  const pitchScore = Math.min(45, Math.floor(pitchLength / 8));
  return clamp(25 + linksScore + pitchScore);
}

function calculateBudgetFitScore({ proposedFee, budgetMin, budgetMax, budget }) {
  const resolvedMin = Number(budgetMin || 0);
  const resolvedMax = Number(budgetMax || budget || 0);

  if (resolvedMax <= 0) {
    return 60;
  }

  if (proposedFee >= resolvedMin && proposedFee <= resolvedMax) {
    return 100;
  }

  const nearest = proposedFee < resolvedMin ? resolvedMin : resolvedMax;
  const variance = Math.abs(proposedFee - nearest) / Math.max(nearest, 1);

  if (variance <= 0.1) return 85;
  if (variance <= 0.2) return 72;
  if (variance <= 0.35) return 58;
  return 40;
}

async function calculateReliabilityScore(creatorId) {
  const statsResult = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
       COUNT(*) FILTER (WHERE status IN ('disputed', 'cancelled'))::int AS negative
     FROM contracts
     WHERE creator_id = $1`,
    [creatorId]
  );

  const stats = statsResult.rows[0] || { total: 0, completed: 0, negative: 0 };
  const total = Number(stats.total || 0);
  const completed = Number(stats.completed || 0);
  const negative = Number(stats.negative || 0);

  if (total === 0) {
    return 60;
  }

  const completionRatio = completed / total;
  const penalty = negative * 8;
  return clamp(Math.round(completionRatio * 100) - penalty, 25, 100);
}

// POST /api/campaigns/ai-assistant
router.post('/ai-assistant', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Valid messages array is required' });
  }

  const openai = getOpenAI();
  if (!openai) {
    return res.status(503).json({
      error: 'AI assistant is not available',
      details: 'OPENAI_API_KEY is not configured. Please set it in your environment variables.',
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert influencer marketing AI assistant helping a brand create a new campaign. 
Your goal is to consult with the user, suggest campaign details based on their chat, and provide strategic advice.
When a user suggests a campaign, act as a strategic consultant using your knowledge of market trends. In your 'reply', you MUST proactively suggest additional creative ideas, recommend specific deliverable structures, advise on target audience niches, or propose engaging hooks to make their campaign more successful.
You must respond with a JSON object exactly matching this schema:
{
  "reply": "your conversational reply, including strategic advice, suggestions, and clarifying questions",
  "suggestedFields": {
    "title": "string",
    "goal": "string",
    "targetAudience": "string",
    "description": "string",
    "deliverablesSummary": "string",
    "timelineSummary": "string",
    "platform": "Instagram | YouTube | TikTok",
    "budgetMin": "string (numeric)",
    "budgetMax": "string (numeric)",
    "contentRights": "string",
    "requirements": ["string"]
  }
}
Only include fields in suggestedFields that you can reasonably infer or generate from the conversation. 
If you are missing information, ask the user in the 'reply' field. Always aim to add value and creative ideas beyond just filling the form.`
        },
        ...messages
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...aiResponse });
  } catch (error) {
    console.error('[AI Assistant Error]', error?.message || error);
    const statusCode = error?.status || 500;
    res.status(statusCode).json({
      error: 'Failed to process AI request',
      details: error?.message || 'An unexpected error occurred with the AI service.',
    });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isBrand = req.user.role === 'brand';
  const isCreator = req.user.role === 'creator';
  const search = typeof req.query?.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : '';
  const platform = typeof req.query?.platform === 'string' ? req.query.platform.trim() : '';
  const allowedStatuses = new Set(['draft', 'active', 'completed', 'cancelled']);

  const conditions = [];
  const params = [];
  let creatorIdParamIndex = null;

  if (isCreator) {
    params.push(req.user.userId);
    creatorIdParamIndex = params.length;
    // Auto-remove accepted/working campaigns from browse view so they shift to working campaigns
    conditions.push(`NOT EXISTS (
      SELECT 1
      FROM campaign_applications ca
      WHERE ca.campaign_id = c.id
        AND ca.creator_id = $${creatorIdParamIndex}
        AND ca.status IN ('approved', 'accepted', 'active')
    )`);
  }

  if (isBrand) {
    params.push(req.user.userId);
    conditions.push(`c.brand_id = $${params.length}`);
  } else if (!isAdmin) {
    conditions.push("c.status = 'active'");
  }

  if (status) {
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    params.push(status);
    conditions.push(`c.status = $${params.length}`);
  } else {
    conditions.push("c.status != 'cancelled'");
  }

  if (platform) {
    params.push(platform);
    conditions.push(`c.platform ILIKE $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(
      c.id ILIKE $${params.length}
      OR c.title ILIKE $${params.length}
      OR c.description ILIKE $${params.length}
      OR u.full_name ILIKE $${params.length}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const hasAppliedSelect = isCreator
    ? `EXISTS (
         SELECT 1
         FROM campaign_applications ca
         WHERE ca.campaign_id = c.id
           AND ca.creator_id = $${creatorIdParamIndex}
           AND ca.status <> 'withdrawn'
       ) AS has_applied`
    : 'FALSE AS has_applied';

  const result = await query(
    `SELECT c.id, c.brand_id, u.full_name AS brand_name, c.title, c.description, c.platform,
            c.goal, c.target_audience, c.deliverables_summary, c.timeline_summary,
            c.budget, c.budget_min, c.budget_max, c.content_rights,
            c.deadline, c.status, c.created_at, c.updated_at, c.cover_image_url, c.highlight_color,
            COALESCE(reqs.requirements, '[]'::json) AS requirements,
            ${hasAppliedSelect}
     FROM campaigns c
     JOIN users u ON u.id = c.brand_id
     LEFT JOIN (
       SELECT campaign_id,
              json_agg(requirement_text ORDER BY sort_order, created_at) AS requirements
       FROM campaign_requirements
       GROUP BY campaign_id
     ) reqs ON reqs.campaign_id = c.id
     ${whereClause}
     ORDER BY c.created_at DESC`
    ,
    params
  );

  const sanitizedCampaigns = result.rows.map(c => ({
    ...c,
    brand_name: (!c.brand_name || c.brand_name.includes('ACEMS')) ? 'Brand Partner' : c.brand_name
  }));

  return res.json({ campaigns: sanitizedCampaigns });
});

// GET /api/campaigns/working - Working & accepted campaigns for creators, brands, and admins
router.get('/working', requireAuth, async (req, res) => {
  const isCreator = req.user.role === 'creator';
  const isBrand = req.user.role === 'brand';

  try {
    if (isCreator) {
      const result = await query(
        `SELECT c.id, c.brand_id, u.full_name AS brand_name, u.email AS brand_email,
                c.title, c.description, c.platform, c.goal, c.target_audience,
                c.deliverables_summary, c.timeline_summary, c.budget, c.budget_min, c.budget_max,
                c.content_rights, c.deadline, c.status AS campaign_status,
                c.contract_file_name, c.contract_extracted_terms, c.cover_image_url, c.highlight_color,
                ca.id AS application_id, ca.status AS application_status, ca.proposed_fee,
                ca.signed_contract_name, ca.signed_at, ca.created_at AS joined_at,
                ct.id AS contract_id, ct.status AS contract_status,
                COALESCE(deliv_stats.total_deliverables, 0)::int AS total_deliverables,
                COALESCE(deliv_stats.completed_deliverables, 0)::int AS completed_deliverables,
                COALESCE(esc.status, 'held') AS escrow_status,
                COALESCE(esc.amount, ca.proposed_fee, c.budget) AS escrow_amount
         FROM campaign_applications ca
         JOIN campaigns c ON c.id = ca.campaign_id
         JOIN users u ON u.id = c.brand_id
         LEFT JOIN contracts ct ON (ct.campaign_id = c.id AND ct.creator_id = ca.creator_id)
         LEFT JOIN escrow_holdings esc ON (esc.campaign_id = c.id OR esc.contract_id = ct.id)
         LEFT JOIN (
           SELECT cd.contract_id,
                  COUNT(*) AS total_deliverables,
                  COUNT(*) FILTER (WHERE cd.status IN ('approved', 'completed')) AS completed_deliverables
           FROM contract_deliverables cd
           GROUP BY cd.contract_id
         ) deliv_stats ON deliv_stats.contract_id = ct.id
         WHERE ca.creator_id = $1
           AND ca.status IN ('approved', 'accepted', 'shortlisted', 'active')
         ORDER BY ca.created_at DESC`,
        [req.user.userId]
      );

      const workingCampaigns = result.rows.map(c => ({
        ...c,
        brand_name: (!c.brand_name || c.brand_name.includes('ACEMS')) ? 'Brand Partner' : c.brand_name
      }));

      return res.json({ campaigns: workingCampaigns });
    } else if (isBrand) {
      const result = await query(
        `SELECT c.id, c.brand_id, c.title, c.description, c.platform, c.goal,
                c.target_audience, c.deliverables_summary, c.timeline_summary,
                c.budget, c.budget_min, c.budget_max, c.content_rights, c.deadline,
                c.status AS campaign_status, c.contract_file_name, c.contract_extracted_terms,
                c.cover_image_url, c.highlight_color, c.created_at,
                COALESCE(esc.status, 'held') AS escrow_status,
                COALESCE(esc.amount, c.budget) AS escrow_amount,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'application_id', ca.id,
                      'creator_id', ca.creator_id,
                      'creator_name', cr.full_name,
                      'creator_email', cr.email,
                      'status', ca.status,
                      'proposed_fee', ca.proposed_fee,
                      'signed_contract_name', ca.signed_contract_name,
                      'signed_at', ca.signed_at,
                      'contract_id', ct.id,
                      'contract_status', ct.status
                    )
                  ) FILTER (WHERE ca.id IS NOT NULL), '[]'::json
                ) AS participants,
                COUNT(ca.id)::int AS accepted_creators_count
         FROM campaigns c
         JOIN campaign_applications ca ON ca.campaign_id = c.id AND ca.status IN ('approved', 'accepted', 'shortlisted', 'active')
         JOIN users cr ON cr.id = ca.creator_id
         LEFT JOIN contracts ct ON (ct.campaign_id = c.id AND ct.creator_id = ca.creator_id)
         LEFT JOIN escrow_holdings esc ON (esc.campaign_id = c.id)
         WHERE c.brand_id = $1
         GROUP BY c.id, esc.status, esc.amount
         ORDER BY c.created_at DESC`,
        [req.user.userId]
      );

      return res.json({ campaigns: result.rows });
    } else {
      // Admin
      const result = await query(
        `SELECT c.id, c.brand_id, u.full_name AS brand_name, c.title, c.description, c.platform, c.goal,
                c.budget, c.deadline, c.status AS campaign_status, c.created_at,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'application_id', ca.id,
                      'creator_id', ca.creator_id,
                      'creator_name', cr.full_name,
                      'status', ca.status,
                      'proposed_fee', ca.proposed_fee
                    )
                  ) FILTER (WHERE ca.id IS NOT NULL), '[]'::json
                ) AS participants,
                COUNT(ca.id)::int AS accepted_creators_count
         FROM campaigns c
         JOIN users u ON u.id = c.brand_id
         JOIN campaign_applications ca ON ca.campaign_id = c.id AND ca.status IN ('approved', 'accepted', 'shortlisted', 'active')
         JOIN users cr ON cr.id = ca.creator_id
         GROUP BY c.id, u.full_name
         ORDER BY c.created_at DESC`
      );

      return res.json({ campaigns: result.rows });
    }
  } catch (error) {
    console.error('Error loading working campaigns:', error);
    return res.status(500).json({ error: 'Failed to load working campaigns' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const campaignId = req.params.id;

  const result = await query(
    `SELECT c.id, c.brand_id, u.full_name AS brand_name, c.title, c.description, c.platform,
            c.goal, c.target_audience, c.deliverables_summary, c.timeline_summary,
            c.budget, c.budget_min, c.budget_max, c.content_rights,
            c.deadline, c.status, c.created_at, c.updated_at, c.cover_image_url, c.highlight_color,
            c.contract_file_name, c.contract_extracted_terms, c.contract_raw_text,
            COALESCE(reqs.requirements, '[]'::json) AS requirements,
            COALESCE(esc.status, CASE WHEN c.status = 'active' THEN 'held' ELSE 'unfunded' END) AS escrow_status,
            COALESCE(esc.amount, c.budget) AS escrow_amount,
            esc.created_at AS escrow_funded_at,
            esc.razorpay_payment_id AS escrow_payment_ref
     FROM campaigns c
     JOIN users u ON u.id = c.brand_id
     LEFT JOIN (
       SELECT campaign_id,
              json_agg(requirement_text ORDER BY sort_order, created_at) AS requirements
       FROM campaign_requirements
       GROUP BY campaign_id
     ) reqs ON reqs.campaign_id = c.id
     LEFT JOIN escrow_holdings esc ON esc.campaign_id = c.id
     WHERE c.id = $1`,
    [campaignId]
  );

  const campaign = result.rows[0];
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (!campaign.brand_name || campaign.brand_name.includes('ACEMS')) {
    campaign.brand_name = 'Brand Partner';
  }

  const canAccess = req.user.role === 'admin' || campaign.brand_id === req.user.userId || campaign.status === 'active';
  if (!canAccess) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.json({ campaign });
});

// GET /api/campaigns/:id/contract/download - Download campaign contract file
router.get('/:id/contract/download', requireAuth, async (req, res) => {
  const campaignId = req.params.id;

  const result = await query(
    `SELECT id, brand_id, title, status, contract_file_name, contract_file_path, contract_file_mime, contract_file_data, contract_raw_text
     FROM campaigns
     WHERE id = $1`,
    [campaignId]
  );

  const campaign = result.rows[0];
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const fileName = campaign.contract_file_name || `${(campaign.title || 'Campaign').replace(/[^a-zA-Z0-9_-]/g, '_')}_Contract.pdf`;
  const mimeType = campaign.contract_file_mime || 'application/pdf';

  // 1. Try file path on disk
  if (campaign.contract_file_path && fs.existsSync(campaign.contract_file_path)) {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(path.resolve(campaign.contract_file_path));
  }

  // 2. Try base64 stored file data
  if (campaign.contract_file_data) {
    const buffer = Buffer.from(campaign.contract_file_data, 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  }

  // 3. Fallback to sample open campaign contract template if exists
  const templatePdf = path.join(process.cwd(), 'Contract', 'Content_Creator_Contract_Open_Campaign.pdf');
  if (fs.existsSync(templatePdf)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`}"`);
    return res.sendFile(templatePdf);
  }

  // 4. Fallback to raw text file
  if (campaign.contract_raw_text) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/\.pdf$/i, '')}.txt"`);
    return res.send(campaign.contract_raw_text);
  }

  return res.status(404).json({ error: 'No contract document attached to this campaign' });
});

// POST /api/campaigns/:id/upload-signed-contract - Creator uploads signed contract
router.post('/:id/upload-signed-contract', requireAuth, requireRole('creator'), upload.single('file'), async (req, res) => {
  const campaignId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: 'Signed contract file is required (multipart field: file)' });
  }

  const appResult = await query(
    'SELECT id, brand_id, status FROM campaign_applications WHERE campaign_id = $1 AND creator_id = $2',
    [campaignId, req.user.userId]
  );
  let application = appResult.rows[0];

  const uploadsDir = path.join(process.cwd(), 'uploads', 'signed_contracts');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const sanitizedName = (req.file.originalname || 'signed_contract.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  const diskFileName = `${campaignId}_${req.user.userId}_${Date.now()}_${sanitizedName}`;
  const filePath = path.join(uploadsDir, diskFileName);
  fs.writeFileSync(filePath, req.file.buffer);

  let brandId = null;

  if (application) {
    brandId = application.brand_id;
    await query(
      `UPDATE campaign_applications
       SET signed_contract_path = $2,
           signed_contract_name = $3,
           signed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [application.id, filePath, req.file.originalname]
    );
  } else {
    // If application row didn't exist yet, create it
    const campResult = await query('SELECT brand_id, budget, budget_min FROM campaigns WHERE id = $1', [campaignId]);
    const camp = campResult.rows[0];
    brandId = camp ? camp.brand_id : null;
    const appId = createId('app');
    const fee = Number(camp?.budget_min || camp?.budget || 0);
    await query(
      `INSERT INTO campaign_applications (
         id, campaign_id, creator_id, brand_id, pitch_message, platform_links,
         audience_location, audience_age_band, audience_niche, engagement_snapshot,
         past_work_links, proposed_deliverables, proposed_fee, proposed_payment_model,
         earliest_start_date, availability_notes, compliance_agreed, status,
         audience_fit_score, engagement_quality_score, content_quality_score,
         reliability_score, budget_fit_score, fit_score,
         signed_contract_path, signed_contract_name, signed_at
       )
       VALUES (
         $1, $2, $3, $4, 'Signed contract uploaded directly.', '[]'::jsonb,
         'Global', '18-34', 'Content Creator', 'Direct Verified',
         '[]'::jsonb, 'Master Contract Deliverables', $5, 'Flat Fee Escrow',
         CURRENT_DATE, 'Available Immediately', true, 'approved',
         85, 85, 85, 85, 85, 85,
         $6, $7, NOW()
       )`,
      [
        appId,
        campaignId,
        req.user.userId,
        brandId,
        fee,
        filePath,
        req.file.originalname
      ]
    );
  }

  if (brandId) {
    // Send notification to brand without unsupported columns
    const notifId = createId('notif');
    const title = 'Creator Signed & Uploaded Contract 📄';
    const message = `A creator has uploaded their signed contract for campaign ${campaignId}. Review and lock the contract to begin execution.`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [notifId, brandId, title, message]
    );

    broadcastEvent('notification', {
      title,
      message,
      userId: brandId,
      timestamp: new Date().toISOString()
    });
  }

  broadcastEvent('campaign:contract_uploaded', {
    campaignId,
    creatorId: req.user.userId,
    fileName: req.file.originalname,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    fileName: req.file.originalname,
    filePath,
    signedAt: new Date().toISOString()
  });
});

// GET /api/campaigns/:id/signed-contract/download - Download creator's signed contract
router.get('/:id/signed-contract/download', requireAuth, async (req, res) => {
  const campaignId = req.params.id;

  let querySql = 'SELECT signed_contract_path, signed_contract_name FROM campaign_applications WHERE campaign_id = $1';
  const queryParams = [campaignId];

  if (req.user.role === 'creator') {
    querySql += ' AND creator_id = $2';
    queryParams.push(req.user.userId);
  } else if (req.query.creatorId) {
    querySql += ' AND (creator_id = $2 OR id = $2)';
    queryParams.push(req.query.creatorId);
  } else {
    querySql += ' AND signed_contract_path IS NOT NULL ORDER BY signed_at DESC LIMIT 1';
  }

  const result = await query(querySql, queryParams);
  const app = result.rows[0];

  if (!app || !app.signed_contract_path || !fs.existsSync(app.signed_contract_path)) {
    return res.status(404).json({ error: 'Signed contract file not found or not yet uploaded' });
  }

  const fileName = app.signed_contract_name || 'signed_contract.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.sendFile(path.resolve(app.signed_contract_path));
});

// POST /api/campaigns/:id/lock-contract - Brand or Admin locks the contract
router.post('/:id/lock-contract', requireAuth, async (req, res) => {
  if (req.user.role !== 'brand' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only brand or admin can lock the contract' });
  }

  const campaignId = req.params.id;
  const { applicationId, creatorId } = req.body || {};

  let targetAppQuery = 'SELECT id, creator_id, brand_id FROM campaign_applications WHERE campaign_id = $1';
  const targetParams = [campaignId];

  if (applicationId) {
    targetAppQuery += ' AND id = $2';
    targetParams.push(applicationId);
  } else if (creatorId) {
    targetAppQuery += ' AND creator_id = $2';
    targetParams.push(creatorId);
  }

  const apps = await query(targetAppQuery, targetParams);
  if (!apps.rows.length) {
    return res.status(404).json({ error: 'No matching application found to lock' });
  }

  for (const app of apps.rows) {
    await query(
      `UPDATE campaign_applications
       SET is_contract_locked = TRUE,
           contract_locked_at = NOW(),
           status = CASE WHEN status IN ('submitted', 'shortlisted', 'interviewing') THEN 'approved' ELSE status END,
           updated_at = NOW()
       WHERE id = $1`,
      [app.id]
    );

    // Also update contract if linked
    await query(
      `UPDATE contracts SET status = 'active', updated_at = NOW() WHERE campaign_id = $1`,
      [campaignId]
    ).catch(() => {});

    // Notify creator
    const notifId = createId('notif');
    const title = 'Contract Approved & Locked! 🔒';
    const message = `Your signed contract for campaign ${campaignId} has been approved and locked. You can now start working on deliverables and submit proof!`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [notifId, app.creator_id, title, message]
    );

    broadcastEvent('notification', {
      title,
      message,
      userId: app.creator_id,
      timestamp: new Date().toISOString()
    });
  }

  broadcastEvent('campaign:contract_locked', {
    campaignId,
    lockedBy: req.user.userId,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    is_contract_locked: true,
    contract_locked_at: new Date().toISOString()
  });
});

// GET /api/campaigns/:id/messages - Get campaign chat messages
router.get('/:id/messages', requireAuth, async (req, res) => {
  const campaignId = req.params.id;

  const result = await query(
    `SELECT m.id, m.campaign_id, m.sender_id, m.recipient_id, m.sender_role,
            m.message, m.attachment_url, m.attachment_name, m.created_at,
            COALESCE(u.full_name, 'Participant') AS sender_name,
            u.avatar_url AS sender_avatar
     FROM campaign_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.campaign_id = $1
     ORDER BY m.created_at ASC`,
    [campaignId]
  );

  return res.json({ messages: result.rows });
});

// POST /api/campaigns/:id/messages - Send campaign chat message
router.post('/:id/messages', requireAuth, async (req, res) => {
  const campaignId = req.params.id;
  const { message, recipientId, attachmentUrl, attachmentName } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const campResult = await query('SELECT id, brand_id, title FROM campaigns WHERE id = $1', [campaignId]);
  const campaign = campResult.rows[0];
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const targetRecipientId = recipientId || (req.user.role === 'creator' ? campaign.brand_id : null);

  const msgId = createId('msg');
  const insertResult = await query(
    `INSERT INTO campaign_messages (
       id, campaign_id, sender_id, recipient_id, sender_role,
       message, attachment_url, attachment_name
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      msgId,
      campaignId,
      req.user.userId,
      targetRecipientId,
      req.user.role,
      message.trim(),
      attachmentUrl || null,
      attachmentName || null
    ]
  );

  const created = insertResult.rows[0];
  const userResult = await query('SELECT full_name, avatar_url FROM users WHERE id = $1', [req.user.userId]);
  const user = userResult.rows[0] || {};
  created.sender_name = user.full_name || 'Participant';
  created.sender_avatar = user.avatar_url || null;

  if (targetRecipientId) {
    const notifId = createId('notif');
    await query(
      `INSERT INTO notifications (id, user_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [
        notifId,
        targetRecipientId,
        `New message from ${created.sender_name}`,
        message.length > 80 ? message.substring(0, 80) + '...' : message
      ]
    );
  }

  broadcastEvent('campaign:message', {
    campaignId,
    message: created,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({ message: created });
});

// GET /api/campaigns/:id/proof-submissions - Get campaign deliverable proof submissions
router.get('/:id/proof-submissions', requireAuth, async (req, res) => {
  const campaignId = req.params.id;

  let querySql = `
    SELECT p.id, p.campaign_id, p.creator_id, p.application_id,
           p.deliverable_title, p.live_url, p.description,
           p.attachment_path, p.attachment_name,
           p.insights_image_path, p.insights_image_name,
           p.engagement_rate, p.impressions_count, p.reach_count,
           p.likes_count, p.comments_count, p.shares_count, p.saves_count,
           p.overview_notes, p.status,
           p.brand_feedback, p.submitted_at, p.reviewed_at, p.created_at,
           u.full_name AS creator_name, u.avatar_url AS creator_avatar,
           u.email AS creator_email
    FROM campaign_proof_submissions p
    JOIN users u ON u.id = p.creator_id
    WHERE p.campaign_id = $1
  `;
  const params = [campaignId];

  if (req.user.role === 'creator') {
    querySql += ' AND p.creator_id = $2';
    params.push(req.user.userId);
  }

  querySql += ' ORDER BY p.submitted_at DESC';

  const result = await query(querySql, params);
  return res.json({ submissions: result.rows });
});

// POST /api/campaigns/:id/proof-submissions - Creator submits proof of work with insights & photo
router.post('/:id/proof-submissions', requireAuth, requireRole('creator'), upload.any(), async (req, res) => {
  const campaignId = req.params.id;
  const { 
    deliverableTitle, 
    liveUrl, 
    description,
    engagementRate,
    impressionsCount,
    reachCount,
    likesCount,
    commentsCount,
    sharesCount,
    savesCount,
    overviewNotes
  } = req.body || {};

  if (!deliverableTitle || !liveUrl) {
    return res.status(400).json({ error: 'Deliverable title and live content URL are required' });
  }

  let attachmentPath = null;
  let attachmentName = null;
  let insightsImagePath = null;
  let insightsImageName = null;

  const files = req.files || (req.file ? [req.file] : []);
  if (files.length > 0) {
    const proofsDir = path.join(process.cwd(), 'uploads', 'proof_attachments');
    fs.mkdirSync(proofsDir, { recursive: true });

    for (const file of files) {
      const sanitized = (file.originalname || 'proof_image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskName = `${campaignId}_${req.user.userId}_${Date.now()}_${sanitized}`;
      const savedPath = path.join(proofsDir, diskName);
      fs.writeFileSync(savedPath, file.buffer);
      const relativeWebPath = `/uploads/proof_attachments/${diskName}`;

      if (file.fieldname === 'insights_photo' || file.fieldname === 'photo' || file.fieldname === 'insightsImage') {
        insightsImagePath = relativeWebPath;
        insightsImageName = file.originalname;
      } else if (file.fieldname === 'attachment') {
        attachmentPath = relativeWebPath;
        attachmentName = file.originalname;
      } else {
        // Fallback: if image, prioritize as insights photo
        if (!insightsImagePath && file.mimetype && file.mimetype.startsWith('image/')) {
          insightsImagePath = relativeWebPath;
          insightsImageName = file.originalname;
        }
        if (!attachmentPath) {
          attachmentPath = relativeWebPath;
          attachmentName = file.originalname;
        }
      }
    }
  }

  // Ensure both paths are populated gracefully if only one file is uploaded
  if (insightsImagePath && !attachmentPath) {
    attachmentPath = insightsImagePath;
    attachmentName = insightsImageName;
  }
  if (attachmentPath && !insightsImagePath && attachmentName && attachmentName.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
    insightsImagePath = attachmentPath;
    insightsImageName = attachmentName;
  }

  const appResult = await query(
    'SELECT id, brand_id FROM campaign_applications WHERE campaign_id = $1 AND creator_id = $2',
    [campaignId, req.user.userId]
  );
  const app = appResult.rows[0];

  const proofId = createId('proof');
  const insertResult = await query(
    `INSERT INTO campaign_proof_submissions (
       id, campaign_id, creator_id, application_id, deliverable_title,
       live_url, description, attachment_path, attachment_name,
       insights_image_path, insights_image_name, engagement_rate,
       impressions_count, reach_count, likes_count, comments_count,
       shares_count, saves_count, overview_notes, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pending')
     RETURNING *`,
    [
      proofId,
      campaignId,
      req.user.userId,
      app ? app.id : null,
      deliverableTitle,
      liveUrl,
      description || '',
      attachmentPath,
      attachmentName,
      insightsImagePath,
      insightsImageName,
      engagementRate || null,
      impressionsCount || null,
      reachCount || null,
      likesCount || null,
      commentsCount || null,
      sharesCount || null,
      savesCount || null,
      overviewNotes || null
    ]
  );

  const submission = insertResult.rows[0];

  // Notify brand
  const campResult = await query('SELECT brand_id, title FROM campaigns WHERE id = $1', [campaignId]);
  const campaign = campResult.rows[0];
  if (campaign) {
    const notifId = createId('notif');
    const title = 'New Deliverable Proof Submitted 📋';
    const message = `A creator has submitted proof with insights screenshots for "${deliverableTitle}" on campaign ${campaign.title}. Please review engagement metrics and approve.`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [notifId, campaign.brand_id, title, message]
    );

    broadcastEvent('notification', {
      title,
      message,
      userId: campaign.brand_id,
      timestamp: new Date().toISOString()
    });
  }

  broadcastEvent('campaign:proof_submitted', {
    campaignId,
    submission,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({ submission });
});

// GET /api/campaigns/:id/proof-submissions/:proofId/file/:fileType - View/stream uploaded proof attachment or insights photo
router.get('/:id/proof-submissions/:proofId/file/:fileType', async (req, res) => {
  const { id: campaignId, proofId, fileType } = req.params;
  const result = await query(
    'SELECT attachment_path, insights_image_path, attachment_name, insights_image_name FROM campaign_proof_submissions WHERE id = $1 AND campaign_id = $2',
    [proofId, campaignId]
  );
  const proof = result.rows[0];
  if (!proof) {
    return res.status(404).json({ error: 'Proof submission not found' });
  }

  let filePath = (fileType === 'insights' || fileType === 'photo') ? proof.insights_image_path : proof.attachment_path;
  if (!filePath) {
    filePath = proof.attachment_path || proof.insights_image_path;
  }
  if (!filePath) {
    return res.status(404).json({ error: 'No file attached to this proof' });
  }

  const localPath = filePath.startsWith('/uploads') 
    ? path.join(process.cwd(), filePath)
    : path.resolve(filePath);

  if (!fs.existsSync(localPath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  return res.sendFile(localPath);
});

// PATCH /api/campaigns/:id/proof-submissions/:proofId/status - Brand reviews proof (approve / request revision)
router.patch('/:id/proof-submissions/:proofId/status', requireAuth, async (req, res) => {
  if (req.user.role !== 'brand' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only brand or admin can review proof submissions' });
  }

  const { id: campaignId, proofId } = req.params;
  const { status, brandFeedback } = req.body || {};

  if (!['approved', 'revision_requested', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, revision_requested, or rejected' });
  }

  const proofResult = await query(
    `UPDATE campaign_proof_submissions
     SET status = $1,
         brand_feedback = $2,
         reviewed_at = NOW(),
         updated_at = NOW()
     WHERE id = $3 AND campaign_id = $4
     RETURNING *`,
    [status, brandFeedback || '', proofId, campaignId]
  );

  const proof = proofResult.rows[0];
  if (!proof) {
    return res.status(404).json({ error: 'Proof submission not found' });
  }

  // Notify creator
  const notifId = createId('notif');
  const title = status === 'approved' 
    ? 'Deliverable Proof Approved! 🎉' 
    : 'Changes Requested on Deliverable Proof ⚠️';
  const message = status === 'approved'
    ? `Your proof for "${proof.deliverable_title}" has been approved by the brand!`
    : `Brand requested changes on "${proof.deliverable_title}": "${brandFeedback || 'Please review feedback and update'}". You can chat directly with the brand in the Campaign Chat.`;

  await query(
    `INSERT INTO notifications (id, user_id, title, message)
     VALUES ($1, $2, $3, $4)`,
    [notifId, proof.creator_id, title, message]
  );

  broadcastEvent('notification', {
    title,
    message,
    userId: proof.creator_id,
    timestamp: new Date().toISOString()
  });

  broadcastEvent('campaign:proof_reviewed', {
    campaignId,
    proof,
    timestamp: new Date().toISOString()
  });

  return res.json({ submission: proof });
});

// POST /api/campaigns/:id/direct-join - Direct auto-join for custom invited creators
router.post('/:id/direct-join', requireAuth, requireRole('creator'), async (req, res) => {
  const campaignId = req.params.id;

  const campaignResult = await query(
    `SELECT id, brand_id, title, platform, status, target_audience, budget, budget_min, budget_max, deliverables_summary
     FROM campaigns
     WHERE id = $1`,
    [campaignId]
  );
  const campaign = campaignResult.rows[0];

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.brand_id === req.user.userId) {
    return res.status(400).json({ error: 'Campaign owner cannot join as creator' });
  }

  // Check if creator has already applied or joined
  const existingApplication = await query(
    'SELECT id, status FROM campaign_applications WHERE campaign_id = $1 AND creator_id = $2',
    [campaignId, req.user.userId]
  );

  if (existingApplication.rows[0]) {
    return res.json({
      success: true,
      alreadyJoined: true,
      applicationId: existingApplication.rows[0].id,
      status: existingApplication.rows[0].status,
    });
  }

  const applicationId = createId('app');
  const fee = Number(campaign.budget_min || campaign.budget || 0);

  await query(
    `INSERT INTO campaign_applications (
      id, campaign_id, creator_id, brand_id, pitch_message, platform_links,
      audience_location, audience_age_band, audience_niche, engagement_snapshot,
      past_work_links, proposed_deliverables, proposed_fee, proposed_payment_model,
      earliest_start_date, availability_notes, compliance_agreed, status,
      audience_fit_score, engagement_quality_score, content_quality_score,
      reliability_score, budget_fit_score, fit_score
    )
    VALUES (
      $1, $2, $3, $4, $5, '[]'::jsonb,
      $6, '18-34', $7, 'Direct Invite Auto-Verified',
      '[]'::jsonb, $8, $9, 'Flat Fee Escrow',
      CURRENT_DATE, 'Immediate availability via invite', true, 'approved',
      100, 100, 100, 100, 100, 100
    )`,
    [
      applicationId,
      campaignId,
      req.user.userId,
      campaign.brand_id,
      'Joined directly via brand custom invite link.',
      campaign.target_audience || 'Global',
      campaign.platform || 'General',
      campaign.deliverables_summary || 'As specified in contract',
      fee,
    ]
  );

  await query(
    `INSERT INTO creator_matches (id, campaign_id, creator_id, match_score, rationale)
     VALUES ($1, $2, $3, 100, $4::jsonb)
     ON CONFLICT (campaign_id, creator_id)
     DO UPDATE SET match_score = 100, generated_at = NOW()`,
    [
      createId('match'),
      campaignId,
      req.user.userId,
      JSON.stringify({ source: 'direct_brand_invite_link', joinedAt: new Date().toISOString() }),
    ]
  );

  await query(
    `INSERT INTO notifications (id, user_id, title, message)
     VALUES ($1, $2, $3, $4)`,
    [
      createId('notif'),
      campaign.brand_id,
      'Creator Joined via Invite Link! 🎉',
      `${req.user.name || 'Creator'} accepted custom invite and joined ${campaign.title}!`,
    ]
  );

  return res.status(201).json({
    success: true,
    autoJoined: true,
    campaignId,
    applicationId,
    status: 'approved',
  });
});

router.post('/:id/apply', requireAuth, requireRole('creator'), async (req, res) => {
  const campaignId = req.params.id;
  const {
    pitchMessage,
    platformLinks,
    audienceLocation,
    audienceAgeBand,
    audienceNiche,
    engagementSnapshot,
    pastWorkLinks,
    proposedDeliverables,
    proposedFee,
    proposedPaymentModel,
    earliestStartDate,
    availabilityNotes,
    complianceAgreed,
  } = req.body || {};

  const normalizedPlatformLinks = normalizeLinks(platformLinks, 1, 6);
  const normalizedPastWorkLinks = normalizeLinks(pastWorkLinks, 2, 5);

  if (
    !String(pitchMessage || '').trim() ||
    !String(audienceLocation || '').trim() ||
    !String(audienceAgeBand || '').trim() ||
    !String(audienceNiche || '').trim() ||
    !String(engagementSnapshot || '').trim() ||
    !String(proposedDeliverables || '').trim() ||
    !String(proposedPaymentModel || '').trim() ||
    !String(availabilityNotes || '').trim()
  ) {
    return res.status(400).json({ error: 'All application fields are required' });
  }

  if (normalizedPlatformLinks.length === 0) {
    return res.status(400).json({ error: 'At least one platform link is required' });
  }

  if (normalizedPastWorkLinks.length < 2) {
    return res.status(400).json({ error: 'Please provide at least 2 past work links' });
  }

  const fee = Number(proposedFee || 0);
  if (!Number.isFinite(fee) || fee < 0) {
    return res.status(400).json({ error: 'Proposed fee must be a valid positive amount' });
  }

  if (!earliestStartDate) {
    return res.status(400).json({ error: 'Earliest start date is required' });
  }

  if (complianceAgreed !== true) {
    return res.status(400).json({ error: 'You must accept sponsored content disclosure compliance' });
  }

  const campaignResult = await query(
    `SELECT id, brand_id, title, platform, status, target_audience, budget, budget_min, budget_max
     FROM campaigns
     WHERE id = $1`,
    [campaignId]
  );
  const campaign = campaignResult.rows[0];

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'active') {
    return res.status(409).json({ error: 'Only active campaigns can receive applications' });
  }

  if (campaign.brand_id === req.user.userId) {
    return res.status(400).json({ error: 'Campaign owner cannot apply as creator' });
  }

  const existingApplication = await query(
    'SELECT id, status FROM campaign_applications WHERE campaign_id = $1 AND creator_id = $2',
    [campaignId, req.user.userId]
  );

  if (existingApplication.rows[0]) {
    return res.status(409).json({
      error: `Application already exists with status '${existingApplication.rows[0].status}'`,
      alreadyApplied: true,
      status: existingApplication.rows[0].status,
    });
  }

  const audienceFitScore = calculateAudienceFitScore({
    campaignTarget: campaign.target_audience,
    campaignPlatform: campaign.platform,
    audienceNiche,
    audienceLocation,
  });
  const engagementQualityScore = calculateEngagementQualityScore(engagementSnapshot);
  const contentQualityScore = calculateContentQualityScore({
    pitchMessage,
    pastWorkLinks: normalizedPastWorkLinks,
  });
  const reliabilityScore = await calculateReliabilityScore(req.user.userId);
  const budgetFitScore = calculateBudgetFitScore({
    proposedFee: fee,
    budgetMin: campaign.budget_min,
    budgetMax: campaign.budget_max,
    budget: campaign.budget,
  });

  const fitScore = clamp(
    audienceFitScore * 0.35 +
      engagementQualityScore * 0.25 +
      contentQualityScore * 0.2 +
      reliabilityScore * 0.1 +
      budgetFitScore * 0.1
  );

  let applicationId = null;

  try {
    applicationId = createId('app');
    await query(
      `INSERT INTO campaign_applications (
        id, campaign_id, creator_id, brand_id, pitch_message, platform_links,
        audience_location, audience_age_band, audience_niche, engagement_snapshot,
        past_work_links, proposed_deliverables, proposed_fee, proposed_payment_model,
        earliest_start_date, availability_notes, compliance_agreed, status,
        audience_fit_score, engagement_quality_score, content_quality_score,
        reliability_score, budget_fit_score, fit_score
      )
      VALUES (
        $1, $2, $3, $4, $5, $6::jsonb,
        $7, $8, $9, $10,
        $11::jsonb, $12, $13, $14,
        $15, $16, $17, 'submitted',
        $18, $19, $20,
        $21, $22, $23
      )`,
      [
        applicationId,
        campaignId,
        req.user.userId,
        campaign.brand_id,
        String(pitchMessage).trim(),
        JSON.stringify(normalizedPlatformLinks),
        String(audienceLocation).trim(),
        String(audienceAgeBand).trim(),
        String(audienceNiche).trim(),
        String(engagementSnapshot).trim(),
        JSON.stringify(normalizedPastWorkLinks),
        String(proposedDeliverables).trim(),
        fee,
        String(proposedPaymentModel).trim(),
        earliestStartDate,
        String(availabilityNotes).trim(),
        true,
        audienceFitScore,
        engagementQualityScore,
        contentQualityScore,
        reliabilityScore,
        budgetFitScore,
        fitScore,
      ]
    );

    await query(
      `INSERT INTO creator_matches (id, campaign_id, creator_id, match_score, rationale)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (campaign_id, creator_id)
       DO UPDATE SET
         match_score = EXCLUDED.match_score,
         rationale = EXCLUDED.rationale,
         generated_at = NOW()`,
      [
        createId('match'),
        campaignId,
        req.user.userId,
        fitScore,
        JSON.stringify({
          source: 'creator_application_scoring',
          appliedAt: new Date().toISOString(),
          audienceFitScore,
          engagementQualityScore,
          contentQualityScore,
          reliabilityScore,
          budgetFitScore,
          fitScore,
        }),
      ]
    );
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Application already submitted for this campaign', alreadyApplied: true });
    }

    throw error;
  }

  await query(
    `INSERT INTO notifications (id, user_id, title, message)
     VALUES ($1, $2, $3, $4)`,
    [
      createId('notif'),
      campaign.brand_id,
      'New campaign application',
      `${req.user.name} applied to ${campaign.title} with fit score ${fitScore.toFixed(1)}`,
    ]
  );

  if (applicationId) {
    await query(
      `INSERT INTO campaign_application_events (id, application_id, actor_user_id, event_type, payload)
       VALUES ($1, $2, $3, 'application_submitted', $4::jsonb)`,
      [
        createId('appevt'),
        applicationId,
        req.user.userId,
        JSON.stringify({
          fitScore,
          audienceFitScore,
          engagementQualityScore,
          contentQualityScore,
          reliabilityScore,
          budgetFitScore,
        }),
      ]
    );
  }

  return res.status(201).json({ campaignId, applied: true, alreadyApplied: false, fitScore, applicationId });
});

router.delete('/:id', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const campaignId = req.params.id;

  const campaignResult = await query(
    'SELECT id, brand_id, status FROM campaigns WHERE id = $1',
    [campaignId]
  );
  const campaign = campaignResult.rows[0];

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (req.user.role !== 'admin' && campaign.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only campaign owner or admin can delete this campaign' });
  }

  if (campaign.status === 'cancelled') {
    return res.json({ campaignId, status: 'cancelled' });
  }

  const lockedContractsResult = await query(
    `SELECT COUNT(*)::int AS count
     FROM contracts
     WHERE campaign_id = $1 AND status IN ('locked', 'executed', 'completed')`,
    [campaignId]
  );

  const lockedContractsCount = Number(lockedContractsResult.rows[0]?.count || 0);
  if (lockedContractsCount > 0 && req.user.role !== 'admin') {
    return res.status(409).json({
      error: 'Campaign cannot be deleted because it has locked/executed/completed contracts',
    });
  }

  await query(
    `UPDATE campaigns
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1`,
    [campaignId]
  );

  return res.json({ campaignId, status: 'cancelled' });
});

router.post('/', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const {
    title,
    goal,
    targetAudience,
    description,
    deliverablesSummary,
    timelineSummary,
    platform,
    budgetMin,
    budgetMax,
    contentRights,
    deadline,
    requirements = [],
    coverImageUrl,
    highlightColor,
  } = req.body || {};

  if (
    !title ||
    !goal ||
    !targetAudience ||
    !description ||
    !deliverablesSummary ||
    !timelineSummary ||
    !platform ||
    !contentRights ||
    !deadline
  ) {
    return res.status(400).json({
      error: 'title, goal, targetAudience, description, deliverablesSummary, timelineSummary, platform, contentRights, and deadline are required',
    });
  }

  const minBudget = Number(budgetMin || 0);
  const maxBudget = Number(budgetMax || 0);
  if (!Number.isFinite(minBudget) || !Number.isFinite(maxBudget) || minBudget < 0 || maxBudget < minBudget) {
    return res.status(400).json({ error: 'Invalid budget range. Ensure budgetMin >= 0 and budgetMax >= budgetMin' });
  }

  const campaignId = createId('camp');
  await query(
    `INSERT INTO campaigns (
      id, brand_id, title, goal, target_audience, description, deliverables_summary,
      timeline_summary, platform, budget, budget_min, budget_max, content_rights, deadline, status, cover_image_url, highlight_color
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'draft', $15, $16)`,
    [
      campaignId,
      req.user.userId,
      String(title).trim(),
      String(goal).trim(),
      String(targetAudience).trim(),
      String(description).trim(),
      String(deliverablesSummary).trim(),
      String(timelineSummary).trim(),
      String(platform).trim(),
      maxBudget,
      minBudget,
      maxBudget,
      String(contentRights).trim(),
      deadline,
      coverImageUrl ? String(coverImageUrl).trim() : null,
      highlightColor ? String(highlightColor).trim() : null,
    ]
  );

  for (let i = 0; i < requirements.length; i += 1) {
    await query(
      `INSERT INTO campaign_requirements (id, campaign_id, requirement_text, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [createId('creq'), campaignId, String(requirements[i]), i + 1]
    );
  }

  return res.status(201).json({ campaignId });
});

router.patch('/:id', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const campaignId = req.params.id;
  
  const campaignResult = await query(
    'SELECT id, brand_id FROM campaigns WHERE id = $1',
    [campaignId]
  );
  
  const campaign = campaignResult.rows[0];
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (req.user.role !== 'admin' && campaign.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only campaign owner or admin can update this campaign' });
  }

  const updates = [];
  const params = [];
  let paramCount = 1;

  const allowedFields = [
    'title', 'goal', 'target_audience', 'description', 'deliverables_summary',
    'timeline_summary', 'platform', 'budget', 'budget_min', 'budget_max',
    'content_rights', 'deadline', 'cover_image_url', 'highlight_color', 'status'
  ];

  for (const [key, value] of Object.entries(req.body || {})) {
    // Basic camelCase to snake_case mapping for allowed fields
    let dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (allowedFields.includes(dbKey) && value !== undefined) {
      updates.push(`${dbKey} = $${paramCount}`);
      params.push(value);
      paramCount++;
    }
  }

  if (updates.length > 0) {
    updates.push(`updated_at = NOW()`);
    params.push(campaignId);
    
    await query(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );
  }

  return res.json({ success: true, campaignId });
});

// NOTE: Duplicate DELETE /:id route was removed. The canonical handler is registered above (line ~533)
// with proper locked-contract protection checks.

// GET /api/campaigns/:id/execution-matrix - Contract Execution Lifecycle Matrix
router.get('/:id/execution-matrix', async (req, res, next) => {
  try {
    const campaignId = req.params.id;

    // Fetch contracts associated with this campaign
    const contractsRes = await query(
      `SELECT c.*, u.full_name as creator_name, u.email as creator_email
       FROM contracts c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.campaign_id = $1`,
      [campaignId]
    );

    const contracts = contractsRes.rows || [];

    // Stage categorization
    const stages = [
      {
        stageId: 'STAGE_1_DRAFT',
        stageNumber: 1,
        title: 'Contract Ingestion & AI Parse',
        description: 'Original PDF uploaded and parameters parsed into Crevio rule schema',
        contracts: contracts.filter(c => c.status === 'draft')
      },
      {
        stageId: 'STAGE_2_ONBOARDING',
        stageNumber: 2,
        title: 'Creator Onboarding & Invite',
        description: 'Direct Email invite, shareable link, or AI Creator Matcher recommendation',
        contracts: contracts.filter(c => c.status === 'pending')
      },
      {
        stageId: 'STAGE_3_SIGNED_UPLOAD',
        stageNumber: 3,
        title: 'Signed Contract Acceptance Upload',
        description: 'Creator downloaded and re-uploaded signed acceptance PDF with SHA-256 hash',
        contracts: contracts.filter(c => c.status === 'accepted')
      },
      {
        stageId: 'STAGE_4_LOCKED_ESCROW',
        stageNumber: 4,
        title: 'Escrow Vault Funded & Locked',
        description: 'Brand verified signed contract PDF and deposited escrow. Terms are IMMUTABLE',
        contracts: contracts.filter(c => c.status === 'locked')
      },
      {
        stageId: 'STAGE_5_EXECUTING_EVIDENCE',
        stageNumber: 5,
        title: 'Executing & Evidence Review',
        description: 'Creator submitted live deliverable URL/asset; Crevio automated compliance pass',
        contracts: contracts.filter(c => c.status === 'executed')
      },
      {
        stageId: 'STAGE_6_COMPLETED',
        stageNumber: 6,
        title: 'Completed & Escrow Settlement',
        description: 'Milestone verified, escrow auto-released, and audit package generated',
        contracts: contracts.filter(c => c.status === 'completed')
      }
    ];

    res.json({
      success: true,
      campaignId,
      totalContractsCount: contracts.length,
      stages
    });
  } catch (error) {
    next(error);
  }
});

export default router;
