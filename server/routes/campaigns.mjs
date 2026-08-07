import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';
import OpenAI from 'openai';

const router = Router();

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
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
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

router.get('/:id', requireAuth, async (req, res) => {
  const campaignId = req.params.id;

  const result = await query(
    `SELECT c.id, c.brand_id, u.full_name AS brand_name, c.title, c.description, c.platform,
            c.goal, c.target_audience, c.deliverables_summary, c.timeline_summary,
            c.budget, c.budget_min, c.budget_max, c.content_rights,
            c.deadline, c.status, c.created_at, c.updated_at, c.cover_image_url, c.highlight_color,
            COALESCE(reqs.requirements, '[]'::json) AS requirements
     FROM campaigns c
     JOIN users u ON u.id = c.brand_id
     LEFT JOIN (
       SELECT campaign_id,
              json_agg(requirement_text ORDER BY sort_order, created_at) AS requirements
       FROM campaign_requirements
       GROUP BY campaign_id
     ) reqs ON reqs.campaign_id = c.id
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

router.delete('/:id', requireAuth, requireRole('brand', 'admin'), async (req, res, next) => {
  try {
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
      return res.status(403).json({ error: 'Only campaign owner or admin can delete this campaign' });
    }

    await query(
      `UPDATE campaigns SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [campaignId]
    );

    res.json({ success: true, campaignId, status: 'cancelled' });
  } catch (error) {
    next(error);
  }
});

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
