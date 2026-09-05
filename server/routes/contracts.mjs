import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { broadcastEvent } from '../lib/socket.mjs';
import multer from 'multer';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';
import {
  createContentHash,
  createImmutableTermsHash,
  extractContractTermsFromText,
  parseContractWithAI,
  readUploadedDocument,
} from '../lib/contract-ingestion.mjs';
import { 
  sendContractSignedEmail, 
  sendEscrowReleasedEmail 
} from '../services/emailService.mjs';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const allowedTransitions = {
  pending: ['accepted'],
  accepted: ['locked'],
  locked: ['executed'],
  executed: ['completed', 'disputed'],
};

function canTransition(currentStatus, nextStatus) {
  return (allowedTransitions[currentStatus] || []).includes(nextStatus);
}

async function logApplicationEvent(applicationId, actorUserId, eventType, payload = {}) {
  if (!applicationId) {
    return;
  }

  await query(
    `INSERT INTO campaign_application_events (id, application_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [createId('appevt'), applicationId, actorUserId || null, eventType, JSON.stringify(payload || {})]
  );
}

async function updateContractStatus(contractId, expectedCurrentStatus, nextStatus, timestamps = {}) {
  if (!canTransition(expectedCurrentStatus, nextStatus)) {
    throw new Error(`Invalid lifecycle transition ${expectedCurrentStatus} -> ${nextStatus}`);
  }

  const sets = ['status = $3', 'updated_at = NOW()'];
  const values = [contractId, expectedCurrentStatus, nextStatus];
  let index = values.length;

  if (timestamps.acceptedAt) {
    index += 1;
    sets.push(`accepted_at = $${index}`);
    values.push(timestamps.acceptedAt);
  }

  if (timestamps.lockedAt) {
    index += 1;
    sets.push(`locked_at = $${index}`);
    values.push(timestamps.lockedAt);
  }

  if (timestamps.executedAt) {
    index += 1;
    sets.push(`executed_at = $${index}`);
    values.push(timestamps.executedAt);
  }

  if (timestamps.completedAt) {
    index += 1;
    sets.push(`completed_at = $${index}`);
    values.push(timestamps.completedAt);
  }

  const result = await query(
    `UPDATE contracts
     SET ${sets.join(', ')}
     WHERE id = $1 AND status = $2
     RETURNING id, status`,
    values
  );

  if (!result.rows[0]) {
    throw new Error(`Contract must be in ${expectedCurrentStatus} state before moving to ${nextStatus}`);
  }

  return result.rows[0];
}

async function evaluateContract(contractId) {
  const [rulesResult, deliverablesResult, documentResult] = await Promise.all([
    query(
      'SELECT id, rule_type, description, passed FROM contract_rules WHERE contract_id = $1 ORDER BY created_at ASC',
      [contractId]
    ),
    query(
      'SELECT id, status, deadline, submitted_at, evidence_url, reviewer_notes FROM contract_deliverables WHERE contract_id = $1 ORDER BY created_at ASC',
      [contractId]
    ),
    query(
      'SELECT extracted_terms FROM contract_documents WHERE contract_id = $1',
      [contractId]
    ),
  ]);

  const deliverables = deliverablesResult.rows;
  const allVerified = deliverables.length > 0 && deliverables.every((d) => d.status === 'verified');
  const anyRejected = deliverables.some((d) => d.status === 'rejected');
  const anyPending = deliverables.some((d) => d.status === 'pending');
  const anyLate = deliverables.some((d) => {
    if (!d.submitted_at) {
      return true;
    }

    return new Date(d.submitted_at).getTime() > new Date(d.deadline).getTime();
  });

  const extractedTerms = documentResult.rows[0]?.extracted_terms || {};
  const summaryText = String(extractedTerms.summary || '').toLowerCase();
  const evidenceText = deliverables
    .map((d) => `${d.evidence_url || ''} ${d.reviewer_notes || ''}`.toLowerCase())
    .join(' ');

  const disclosureExpected = /\b(ftc|disclosure|sponsored|#ad)\b/i.test(summaryText);
  const disclosureFound = /\b(ftc|disclosure|sponsored|#ad)\b/i.test(evidenceText);
  const prohibitedExpected = /\b(prohibited|restricted|no\s+gambling|no\s+adult|no\s+offensive)\b/i.test(summaryText);
  const prohibitedDetected = /\b(prohibited|adult|gambling|offensive|hate)\b/i.test(evidenceText);

  const reasons = [];
  let allPassed = true;

  for (const rule of rulesResult.rows) {
    let passed = rule.passed;

    if (passed === null) {
      if (rule.rule_type === 'deliverable') {
        passed = allVerified && !anyRejected;
      } else if (rule.rule_type === 'deadline') {
        passed = !anyLate && !anyPending;
      } else {
        const description = String(rule.description || '').toLowerCase();
        if (description.includes('disclosure') || description.includes('ftc')) {
          passed = disclosureExpected ? disclosureFound : true;
        } else if (description.includes('prohibited') || description.includes('restricted')) {
          passed = prohibitedExpected ? !prohibitedDetected : true;
        } else {
          passed = allVerified && !anyRejected;
        }
      }

      await query('UPDATE contract_rules SET passed = $2, evaluated_at = NOW() WHERE id = $1', [rule.id, passed]);
    }

    if (passed !== true) {
      allPassed = false;
      reasons.push(`${rule.rule_type}: ${rule.description}`);
    }
  }

  if (allPassed) {
    reasons.push('All rules passed');
  }

  return {
    decision: allPassed ? 'success' : 'failure',
    confidenceScore: allPassed ? 1 : 0.72,
    reasons,
  };
}

router.get('/:id/dossier', requireAuth, requireRole('admin'), async (req, res) => {
  const contractId = req.params.id;

  const [contractResult, deliverablesResult, rulesResult, documentResult, decisionsResult, eventsResult] = await Promise.all([
    query(
      `SELECT c.*, b.full_name AS brand_name, cr.full_name AS creator_name
       FROM contracts c
       JOIN users b ON b.id = c.brand_id
       JOIN users cr ON cr.id = c.creator_id
       WHERE c.id = $1`,
      [contractId]
    ),
    query('SELECT * FROM contract_deliverables WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
    query('SELECT * FROM contract_rules WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
    query('SELECT * FROM contract_documents WHERE contract_id = $1', [contractId]),
    query(
      `SELECT d.*, COALESCE(
         json_agg(json_build_object('id', dr.id, 'reason_text', dr.reason_text, 'is_blocker', dr.is_blocker, 'sort_order', dr.sort_order)
         ORDER BY dr.sort_order) FILTER (WHERE dr.id IS NOT NULL), '[]'::json
       ) AS reasons
       FROM decision_evaluations d
       LEFT JOIN decision_reasons dr ON dr.decision_id = d.id
       WHERE d.contract_id = $1
       GROUP BY d.id
       ORDER BY d.evaluated_at DESC`,
      [contractId]
    ),
    query('SELECT * FROM contract_events WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
  ]);

  if (!contractResult.rows[0]) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  return res.json({
    contract: contractResult.rows[0],
    document: documentResult.rows[0] || null,
    deliverables: deliverablesResult.rows,
    rules: rulesResult.rows,
    decisions: decisionsResult.rows,
    events: eventsResult.rows,
  });
});

router.get('/', requireAuth, async (req, res) => {
  const isCreator = req.user.role === 'creator';
  const isBrand = req.user.role === 'brand';
  const isAdmin = req.user.role === 'admin';
  const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : '';

  try {
    // 1. Direct contracts from `contracts` table
    const directParams = [];
    const directWhere = [];

    if (!isAdmin) {
      directParams.push(req.user.userId);
      directWhere.push(`(c.brand_id = $${directParams.length} OR c.creator_id = $${directParams.length})`);
    }

    const directWhereClause = directWhere.length > 0 ? `WHERE ${directWhere.join(' AND ')}` : '';
    const directResult = await query(
      `SELECT c.id, c.campaign_id, cmp.title AS campaign_title, c.brand_id, b.full_name AS brand_name,
              c.creator_id, cr.full_name AS creator_name, c.status, c.payment_amount,
              c.contract_deadline, c.notes, c.terms_hash, c.created_at, c.accepted_at, c.locked_at,
              c.executed_at, c.completed_at,
              COALESCE(stats.total_deliverables, 0)::int AS total_deliverables,
              COALESCE(stats.verified_deliverables, 0)::int AS verified_deliverables,
              cmp.contract_file_name,
              ca.signed_contract_name,
              ca.is_contract_locked,
              'direct' AS contract_type
       FROM contracts c
       JOIN users b ON b.id = c.brand_id
       JOIN users cr ON cr.id = c.creator_id
       LEFT JOIN campaigns cmp ON cmp.id = c.campaign_id
       LEFT JOIN campaign_applications ca ON (ca.campaign_id = c.campaign_id AND ca.creator_id = c.creator_id)
       LEFT JOIN (
         SELECT contract_id,
                COUNT(*) AS total_deliverables,
                COUNT(*) FILTER (WHERE status = 'verified' OR status = 'approved') AS verified_deliverables
         FROM contract_deliverables
         GROUP BY contract_id
       ) stats ON stats.contract_id = c.id
       ${directWhereClause}
       ORDER BY c.created_at DESC`,
      directParams
    );

    const existingDirectKeys = new Set(
      directResult.rows.map(r => `${r.campaign_id}_${r.creator_id}`)
    );

    // 2. Campaign contracts
    const campaignContracts = [];

    if (isBrand || isAdmin) {
      // Query campaigns uploaded/created by brand (or all campaigns for admin)
      const brandParams = [];
      let brandWhere = '';
      if (isBrand) {
        brandParams.push(req.user.userId);
        brandWhere = `WHERE c.brand_id = $1`;
      }

      const brandCampaignsRes = await query(
        `SELECT c.id AS campaign_id, c.title AS campaign_title, c.brand_id, b.full_name AS brand_name,
                c.budget, c.budget_min, c.budget_max, c.deadline AS contract_deadline, c.status AS campaign_status,
                c.contract_file_name, c.contract_extracted_terms, c.created_at,
                ca.id AS application_id, ca.creator_id, cr.full_name AS creator_name,
                ca.status AS application_status, ca.proposed_fee, ca.signed_contract_name,
                ca.is_contract_locked, ca.created_at AS application_created_at
         FROM campaigns c
         JOIN users b ON b.id = c.brand_id
         LEFT JOIN campaign_applications ca ON (ca.campaign_id = c.id AND ca.status IN ('approved', 'accepted', 'shortlisted', 'submitted', 'active'))
         LEFT JOIN users cr ON cr.id = ca.creator_id
         ${brandWhere}
         ORDER BY c.created_at DESC`,
        brandParams
      );

      const campaignsProcessed = new Set();

      for (const row of brandCampaignsRes.rows) {
        if (row.application_id) {
          const key = `${row.campaign_id}_${row.creator_id}`;
          if (!existingDirectKeys.has(key)) {
            let extractedDeliverablesCount = 0;
            if (row.contract_extracted_terms?.deliverables && Array.isArray(row.contract_extracted_terms.deliverables)) {
              extractedDeliverablesCount = row.contract_extracted_terms.deliverables.length;
            }

            const contractStatus = row.is_contract_locked
              ? 'locked'
              : (row.signed_contract_name ? 'accepted' : (row.application_status === 'approved' ? 'pending' : 'draft'));

            campaignContracts.push({
              id: row.application_id,
              campaign_id: row.campaign_id,
              campaign_title: row.campaign_title,
              brand_id: row.brand_id,
              brand_name: (!row.brand_name || row.brand_name.includes('ACEMS')) ? 'Brand Partner' : row.brand_name,
              creator_id: row.creator_id,
              creator_name: row.creator_name || 'Creator',
              status: contractStatus,
              payment_amount: Number(row.proposed_fee || row.budget_max || row.budget || 0),
              contract_deadline: row.contract_deadline,
              notes: `Campaign Contract for ${row.campaign_title}`,
              terms_hash: null,
              created_at: row.application_created_at || row.created_at,
              accepted_at: row.signed_contract_name ? row.application_created_at : null,
              locked_at: row.is_contract_locked ? row.application_created_at : null,
              total_deliverables: extractedDeliverablesCount || 1,
              verified_deliverables: 0,
              contract_file_name: row.contract_file_name || 'Campaign_Contract.pdf',
              signed_contract_name: row.signed_contract_name,
              is_contract_locked: Boolean(row.is_contract_locked),
              contract_type: 'campaign_application'
            });
          }
        } else if (!campaignsProcessed.has(row.campaign_id)) {
          campaignsProcessed.add(row.campaign_id);
          let extractedDeliverablesCount = 0;
          if (row.contract_extracted_terms?.deliverables && Array.isArray(row.contract_extracted_terms.deliverables)) {
            extractedDeliverablesCount = row.contract_extracted_terms.deliverables.length;
          }

          campaignContracts.push({
            id: `ct_camp_${row.campaign_id}`,
            campaign_id: row.campaign_id,
            campaign_title: row.campaign_title,
            brand_id: row.brand_id,
            brand_name: (!row.brand_name || row.brand_name.includes('ACEMS')) ? 'Brand Partner' : row.brand_name,
            creator_id: null,
            creator_name: 'Open / Enrolling Creators',
            status: row.campaign_status === 'active' ? 'pending' : 'draft',
            payment_amount: Number(row.budget_max || row.budget || 0),
            contract_deadline: row.contract_deadline,
            notes: `Master Legal Contract for ${row.campaign_title}`,
            terms_hash: null,
            created_at: row.created_at,
            accepted_at: null,
            locked_at: null,
            total_deliverables: extractedDeliverablesCount,
            verified_deliverables: 0,
            contract_file_name: row.contract_file_name || 'Campaign_Contract.pdf',
            signed_contract_name: null,
            is_contract_locked: false,
            contract_type: 'campaign_master'
          });
        }
      }
    } else if (isCreator) {
      // Creator ONLY sees contracts for campaigns they participated in / applied to
      const creatorCampaignsRes = await query(
        `SELECT c.id AS campaign_id, c.title AS campaign_title, c.brand_id, b.full_name AS brand_name,
                c.budget, c.budget_min, c.budget_max, c.deadline AS contract_deadline, c.status AS campaign_status,
                c.contract_file_name, c.contract_extracted_terms, c.created_at,
                ca.id AS application_id, ca.creator_id, cr.full_name AS creator_name,
                ca.status AS application_status, ca.proposed_fee, ca.signed_contract_name,
                ca.is_contract_locked, ca.created_at AS application_created_at
         FROM campaign_applications ca
         JOIN campaigns c ON c.id = ca.campaign_id
         JOIN users b ON b.id = c.brand_id
         JOIN users cr ON cr.id = ca.creator_id
         WHERE ca.creator_id = $1
           AND ca.status IN ('approved', 'accepted', 'shortlisted', 'submitted', 'active')
         ORDER BY ca.created_at DESC`,
        [req.user.userId]
      );

      for (const row of creatorCampaignsRes.rows) {
        const key = `${row.campaign_id}_${row.creator_id}`;
        if (!existingDirectKeys.has(key)) {
          let extractedDeliverablesCount = 0;
          if (row.contract_extracted_terms?.deliverables && Array.isArray(row.contract_extracted_terms.deliverables)) {
            extractedDeliverablesCount = row.contract_extracted_terms.deliverables.length;
          }

          const contractStatus = row.is_contract_locked
            ? 'locked'
            : (row.signed_contract_name ? 'accepted' : (row.application_status === 'approved' ? 'pending' : 'draft'));

          campaignContracts.push({
            id: row.application_id,
            campaign_id: row.campaign_id,
            campaign_title: row.campaign_title,
            brand_id: row.brand_id,
            brand_name: (!row.brand_name || row.brand_name.includes('ACEMS')) ? 'Brand Partner' : row.brand_name,
            creator_id: row.creator_id,
            creator_name: row.creator_name || 'Me',
            status: contractStatus,
            payment_amount: Number(row.proposed_fee || row.budget_min || row.budget || 0),
            contract_deadline: row.contract_deadline,
            notes: `Campaign Contract for ${row.campaign_title}`,
            terms_hash: null,
            created_at: row.application_created_at || row.created_at,
            accepted_at: row.signed_contract_name ? row.application_created_at : null,
            locked_at: row.is_contract_locked ? row.application_created_at : null,
            total_deliverables: extractedDeliverablesCount || 1,
            verified_deliverables: 0,
            contract_file_name: row.contract_file_name || 'Campaign_Contract.pdf',
            signed_contract_name: row.signed_contract_name,
            is_contract_locked: Boolean(row.is_contract_locked),
            contract_type: 'campaign_application'
          });
        }
      }
    }

    // Combine direct contracts and campaign contracts
    let combined = [...directResult.rows, ...campaignContracts];

    // Sanitize brand names
    combined = combined.map(c => ({
      ...c,
      brand_name: (!c.brand_name || c.brand_name.includes('ACEMS')) ? 'Brand Partner' : c.brand_name
    }));

    // Filter by status if specified
    if (status && status !== 'all') {
      combined = combined.filter(c => String(c.status).toLowerCase() === status);
    }

    // Filter by search query if specified
    if (search) {
      combined = combined.filter(c => {
        const id = String(c.id || '').toLowerCase();
        const campId = String(c.campaign_id || '').toLowerCase();
        const campTitle = String(c.campaign_title || '').toLowerCase();
        const brandName = String(c.brand_name || '').toLowerCase();
        const creatorName = String(c.creator_name || '').toLowerCase();
        const fileName = String(c.contract_file_name || '').toLowerCase();
        return id.includes(search) ||
               campId.includes(search) ||
               campTitle.includes(search) ||
               brandName.includes(search) ||
               creatorName.includes(search) ||
               fileName.includes(search);
      });
    }

    // Sort by created_at DESC
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({ contracts: combined });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return res.status(500).json({ error: 'Failed to fetch contracts', details: error?.message });
  }
});

router.delete('/:id', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const contractId = req.params.id;
  const { reason } = req.body || {};

  const contractResult = await query(
    'SELECT id, brand_id, status FROM contracts WHERE id = $1',
    [contractId]
  );
  const contract = contractResult.rows[0];

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (req.user.role !== 'admin' && contract.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only contract owner brand or admin can delete this contract' });
  }

  if (contract.status === 'cancelled') {
    return res.json({ contractId, status: 'cancelled' });
  }

  const protectedStatuses = new Set(['locked', 'executed', 'completed', 'disputed']);
  if (protectedStatuses.has(contract.status) && req.user.role !== 'admin') {
    return res.status(409).json({
      error: `Contracts in '${contract.status}' state can only be deleted by admin`,
    });
  }

  await query(
    `UPDATE contracts
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1`,
    [contractId]
  );

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'contract_cancelled', $4::jsonb)`,
    [
      createId('evt'),
      contractId,
      req.user.userId,
      JSON.stringify({ reason: reason || 'Cancelled from contracts listing' }),
    ]
  );

  return res.json({ contractId, status: 'cancelled' });
});

router.get('/:id', requireAuth, async (req, res) => {
  const contractId = req.params.id;

  // 1. Try fetching from contracts table
  const contractResult = await query(
    `SELECT c.id, c.campaign_id, cmp.title AS campaign_title, c.brand_id, b.full_name AS brand_name,
            c.creator_id, cr.full_name AS creator_name, c.status, c.payment_amount,
            c.contract_deadline, c.notes, c.terms_hash, c.created_at, c.accepted_at, c.locked_at,
            c.executed_at, c.completed_at
     FROM contracts c
     JOIN users b ON b.id = c.brand_id
     JOIN users cr ON cr.id = c.creator_id
     LEFT JOIN campaigns cmp ON cmp.id = c.campaign_id
     WHERE c.id = $1`,
    [contractId]
  );

  const contract = contractResult.rows[0];
  if (contract) {
    const isAllowed = req.user.role === 'admin' || contract.brand_id === req.user.userId || contract.creator_id === req.user.userId;
    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!contract.brand_name || contract.brand_name.includes('ACEMS')) {
      contract.brand_name = 'Brand Partner';
    }

    const [deliverablesResult, rulesResult, decisionsResult] = await Promise.all([
      query('SELECT * FROM contract_deliverables WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
      query('SELECT * FROM contract_rules WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
      query(
        `SELECT d.*, COALESCE(
           json_agg(json_build_object('id', dr.id, 'reason_text', dr.reason_text, 'is_blocker', dr.is_blocker, 'sort_order', dr.sort_order)
           ORDER BY dr.sort_order) FILTER (WHERE dr.id IS NOT NULL), '[]'::json
         ) AS reasons
         FROM decision_evaluations d
         LEFT JOIN decision_reasons dr ON dr.decision_id = d.id
         WHERE d.contract_id = $1
         GROUP BY d.id
         ORDER BY d.evaluated_at DESC`,
        [contractId]
      ),
    ]);

    return res.json({
      contract,
      deliverables: deliverablesResult.rows,
      rules: rulesResult.rows,
      decisions: decisionsResult.rows,
    });
  }

  // 2. If not found in contracts, check if it is a campaign or application
  let targetCampaignId = contractId.replace(/^ct_camp_/, '');
  let application = null;

  // Check if it's an application ID
  const appCheck = await query(
    `SELECT ca.*, c.brand_id, c.title AS campaign_title, c.deadline, c.budget, c.contract_extracted_terms, c.contract_file_name,
            b.full_name AS brand_name, cr.full_name AS creator_name
     FROM campaign_applications ca
     JOIN campaigns c ON c.id = ca.campaign_id
     JOIN users b ON b.id = c.brand_id
     JOIN users cr ON cr.id = ca.creator_id
     WHERE ca.id = $1`,
    [contractId]
  );

  if (appCheck.rows[0]) {
    application = appCheck.rows[0];
    targetCampaignId = application.campaign_id;
  }

  const campResult = await query(
    `SELECT c.*, b.full_name AS brand_name
     FROM campaigns c
     JOIN users b ON b.id = c.brand_id
     WHERE c.id = $1`,
    [targetCampaignId]
  );

  const campaign = campResult.rows[0];
  if (!campaign) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const isAllowed = req.user.role === 'admin' ||
                    campaign.brand_id === req.user.userId ||
                    (application && application.creator_id === req.user.userId);
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const brandName = (!campaign.brand_name || campaign.brand_name.includes('ACEMS')) ? 'Brand Partner' : campaign.brand_name;
  const terms = campaign.contract_extracted_terms || {};
  const deliverables = (terms.deliverables || []).map((d, i) => ({
    id: `deliv_${i + 1}`,
    contract_id: contractId,
    deliverable_type: d.format || d.platform || 'Campaign Deliverable',
    platform: d.platform || campaign.platform || 'General',
    description: d.description || d.format || 'Deliverable item',
    status: 'pending',
    deadline: d.dueDate || d.deadline || campaign.deadline,
    amount: d.amount || 0,
    created_at: campaign.created_at
  }));

  const syntheticContract = {
    id: contractId,
    campaign_id: campaign.id,
    campaign_title: campaign.title,
    brand_id: campaign.brand_id,
    brand_name: brandName,
    creator_id: application ? application.creator_id : null,
    creator_name: application ? application.creator_name : 'Open / Enrolling Creators',
    status: application ? (application.is_contract_locked ? 'locked' : (application.signed_contract_name ? 'accepted' : 'pending')) : (campaign.status === 'active' ? 'pending' : 'draft'),
    payment_amount: application ? Number(application.proposed_fee || campaign.budget || 0) : Number(campaign.budget || 0),
    contract_deadline: campaign.deadline,
    notes: campaign.deliverables_summary || campaign.description,
    terms_hash: null,
    created_at: application ? application.created_at : campaign.created_at,
    accepted_at: application?.signed_at || null,
    locked_at: application?.contract_locked_at || null,
    executed_at: null,
    completed_at: null,
    contract_file_name: campaign.contract_file_name,
    signed_contract_name: application?.signed_contract_name || null,
    is_contract_locked: Boolean(application?.is_contract_locked)
  };

  return res.json({
    contract: syntheticContract,
    deliverables,
    rules: [],
    decisions: [],
    document: {
      id: `doc_${campaign.id}`,
      contract_id: contractId,
      source_file_name: campaign.contract_file_name || 'Campaign_Contract.pdf',
      extracted_terms: terms
    }
  });
});

// Upload contract document directly for a campaign during campaign setup
router.post('/upload-for-campaign/:campaignId', requireAuth, requireRole('brand', 'admin'), upload.single('file'), async (req, res) => {
  const { campaignId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Contract file is required (multipart field: file)' });
  }

  const campaignResult = await query('SELECT id, brand_id FROM campaigns WHERE id = $1', [campaignId]);
  const campaign = campaignResult.rows[0];

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (req.user.role !== 'admin' && campaign.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const rawText = await readUploadedDocument(req.file);
    if (!rawText.trim()) {
      return res.status(400).json({ error: 'Unable to extract text from uploaded contract file' });
    }

    const parsedTerms = await parseContractWithAI(rawText);

    // Save contract file to disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const sanitizedName = (req.file.originalname || 'contract.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskFileName = `${campaignId}_${Date.now()}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, diskFileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'application/pdf';

    await query(
      `UPDATE campaigns
       SET contract_file_name = $2,
           contract_file_path = $3,
           contract_file_mime = $4,
           contract_file_data = $5,
           contract_raw_text = $6,
           contract_extracted_terms = $7::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [campaignId, req.file.originalname, filePath, mimeType, base64Data, rawText, JSON.stringify(parsedTerms)]
    );

    return res.json({
      success: true,
      campaignId,
      fileName: req.file.originalname,
      filePath,
      rawText,
      parsedTerms,
    });
  } catch (err) {
    console.error('[Upload Contract Error]', err);
    return res.status(500).json({ error: 'Failed to process contract document', details: err?.message });
  }
});

// Parse contract text using OpenAI / AI engine
router.post('/parse', requireAuth, async (req, res) => {
  const { rawText } = req.body || {};
  if (!rawText || !String(rawText).trim()) {
    return res.status(400).json({ error: 'rawText is required' });
  }

  try {
    const parsedData = await parseContractWithAI(rawText);
    return res.json({ success: true, parsedData });
  } catch (err) {
    console.error('[Parse Contract Error]', err);
    return res.status(500).json({ error: 'Failed to parse contract text', details: err?.message });
  }
});

router.post('/ingest', requireAuth, requireRole('brand', 'admin'), upload.single('file'), async (req, res) => {
  const { campaignId, creatorId, paymentAmount, contractDeadline, notes, applicationId } = req.body || {};

  if (!req.file) {
    return res.status(400).json({ error: 'Contract file is required (multipart field: file)' });
  }

  if (!campaignId || !creatorId) {
    return res.status(400).json({ error: 'campaignId and creatorId are required' });
  }

  const campaignResult = await query(
    'SELECT id, brand_id, status FROM campaigns WHERE id = $1',
    [campaignId]
  );
  const campaign = campaignResult.rows[0];

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status === 'cancelled') {
    return res.status(409).json({ error: 'Cannot create contract for cancelled campaign' });
  }

  if (req.user.role !== 'admin' && campaign.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only campaign owner brand or admin can create contracts for this campaign' });
  }

  const approvedAppResult = applicationId
    ? await query(
        `SELECT id, status, contract_id
         FROM campaign_applications
         WHERE id = $1
           AND campaign_id = $2
           AND creator_id = $3
           AND brand_id = $4`,
        [applicationId, campaignId, creatorId, campaign.brand_id]
      )
    : await query(
        `SELECT id, status, contract_id
         FROM campaign_applications
         WHERE campaign_id = $1
           AND creator_id = $2
           AND brand_id = $3
           AND status = 'approved'
         ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
         LIMIT 1`,
        [campaignId, creatorId, campaign.brand_id]
      );

  const approvedApplication = approvedAppResult.rows[0];
  if (!approvedApplication) {
    return res.status(409).json({ error: 'Only approved applications can be converted to contracts' });
  }

  if (approvedApplication.status !== 'approved') {
    return res.status(409).json({ error: `Application must be approved before contract creation (current: ${approvedApplication.status})` });
  }

  if (approvedApplication.contract_id) {
    return res.status(409).json({ error: 'This approved application is already linked to a contract' });
  }

  const text = await readUploadedDocument(req.file);
  if (!text.trim()) {
    return res.status(400).json({ error: 'Unable to extract text from uploaded file' });
  }

  const extractedTerms = extractContractTermsFromText(text);
  const resolvedPayment = Number(paymentAmount || extractedTerms.paymentAmount || 0);

  if (!resolvedPayment || Number.isNaN(resolvedPayment)) {
    return res.status(400).json({ error: 'paymentAmount is required when contract file does not include payment term' });
  }

  const resolvedDeadline = contractDeadline || extractedTerms.deadline;
  const contractId = createId('con');

  await query(
    `INSERT INTO contracts (id, campaign_id, brand_id, creator_id, status, payment_amount, contract_deadline, notes)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)`,
    [contractId, campaignId, campaign.brand_id, creatorId, resolvedPayment, resolvedDeadline || null, notes || null]
  );

  await query(
    `UPDATE campaign_applications
     SET contract_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [approvedApplication.id, contractId]
  );

  for (const deliverable of extractedTerms.deliverables) {
    await query(
      `INSERT INTO contract_deliverables (id, contract_id, description, platform, deadline, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [createId('d'), contractId, deliverable.description, deliverable.platform, deliverable.deadline]
    );
  }

  for (const rule of extractedTerms.rules) {
    await query(
      `INSERT INTO contract_rules (id, contract_id, rule_type, description, passed)
       VALUES ($1, $2, $3, $4, NULL)`,
      [createId('r'), contractId, rule.ruleType, rule.description]
    );
  }

  await query(
    `INSERT INTO contract_documents (
      id, contract_id, source_file_name, source_mime_type, source_sha256, extracted_terms,
      brand_signed_at, brand_signed_by
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), $7)`,
    [
      createId('doc'),
      contractId,
      req.file.originalname,
      req.file.mimetype,
      createContentHash(text),
      JSON.stringify(extractedTerms),
      req.user.userId,
    ]
  );

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'contract_ingested', $4::jsonb)`,
    [createId('evt'), contractId, req.user.userId, JSON.stringify({ sourceFileName: req.file.originalname, phase: 'brand_signed_upload' })]
  );

  await logApplicationEvent(approvedApplication.id, req.user.userId, 'contract_uploaded_by_brand', {
    contractId,
    sourceFileName: req.file.originalname,
  });

  return res.status(201).json({
    contractId,
    status: 'pending',
    applicationId: approvedApplication.id,
    extractedTerms,
  });
});

router.post('/:id/accept', requireAuth, requireRole('creator'), async (req, res) => {
  const contractId = req.params.id;

  const contractResult = await query('SELECT id, creator_id, status FROM contracts WHERE id = $1', [contractId]);
  const contract = contractResult.rows[0];

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (contract.creator_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only assigned creator can accept this contract' });
  }

  if (contract.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending contracts can be accepted' });
  }

  await updateContractStatus(contractId, 'pending', 'accepted', { acceptedAt: new Date().toISOString() });

  await query(
    `UPDATE contract_documents
     SET creator_signed_at = NOW(), creator_signed_by = $2
     WHERE contract_id = $1`,
    [contractId, req.user.userId]
  );

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'contract_accepted', '{}'::jsonb)`,
    [createId('evt'), contractId, req.user.userId]
  );

  const contractInfoResult = await query('SELECT brand_id FROM contracts WHERE id = $1', [contractId]);
  const contractInfo = contractInfoResult.rows[0];
  if (contractInfo?.brand_id) {
    const title = 'Creator e-sign completed';
    const message = `Creator signed contract ${contractId}. Waiting final submission for lock.`;
    await query(
      `INSERT INTO notifications (id, user_id, contract_id, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [createId('notif'), contractInfo.brand_id, contractId, title, message]
    );
    broadcastEvent('notification', { 
      title, 
      message, 
      userId: contractInfo.brand_id, 
      timestamp: new Date().toISOString() 
    });
  }

  const applicationResult = await query('SELECT id FROM campaign_applications WHERE contract_id = $1', [contractId]);
  const applicationId = applicationResult.rows[0]?.id;
  await logApplicationEvent(applicationId, req.user.userId, 'creator_esigned_contract', { contractId });

  // Autonomous email notification to brand
  try {
    if (contractInfo?.brand_id) {
      const brandUser = await query('SELECT full_name, email FROM users WHERE id = $1', [contractInfo.brand_id]);
      const bEmail = brandUser.rows[0]?.email;
      const bName = brandUser.rows[0]?.full_name;
      if (bEmail) {
        sendContractSignedEmail({
          recipientEmail: bEmail,
          recipientName: bName,
          otherPartyName: req.user.name || 'Verified Creator',
          contractId,
          role: 'brand'
        }).catch(e => console.error('[Contract Signed Email Hook Error]', e));
      }
    }
  } catch (emailErr) {
    console.error('[Contract Signed Email Trigger Failed]', emailErr);
  }

  return res.json({ contractId, status: 'accepted' });
});

router.post('/:id/lock', requireAuth, requireRole('creator', 'admin'), async (req, res) => {
  const contractId = req.params.id;
  const { finalSubmissionUrl } = req.body || {};

  const contractResult = await query(
    'SELECT id, brand_id, status, campaign_id, creator_id, payment_amount, contract_deadline FROM contracts WHERE id = $1',
    [contractId]
  );
  const contract = contractResult.rows[0];

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (req.user.role !== 'admin' && contract.creator_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only assigned creator can lock this contract after final submission' });
  }

  if (contract.status !== 'accepted') {
    return res.status(400).json({ error: 'Only creator-signed contracts can be locked' });
  }

  if (!finalSubmissionUrl || !/^https?:\/\//i.test(String(finalSubmissionUrl))) {
    return res.status(400).json({ error: 'finalSubmissionUrl is required and must be a valid URL' });
  }

  const signedDocResult = await query(
    `SELECT id, creator_signed_at
     FROM contract_documents
     WHERE contract_id = $1`,
    [contractId]
  );
  const signedDoc = signedDocResult.rows[0];
  if (!signedDoc?.creator_signed_at) {
    return res.status(409).json({ error: 'Creator e-sign is required before locking the contract' });
  }

  const [deliverablesResult, rulesResult, documentResult] = await Promise.all([
    query('SELECT description, platform, deadline FROM contract_deliverables WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
    query('SELECT rule_type, description FROM contract_rules WHERE contract_id = $1 ORDER BY created_at ASC', [contractId]),
    query('SELECT id, extracted_terms FROM contract_documents WHERE contract_id = $1', [contractId]),
  ]);

  const immutableHash = createImmutableTermsHash({
    contractId,
    campaignId: contract.campaign_id,
    creatorId: contract.creator_id,
    paymentAmount: contract.payment_amount,
    contractDeadline: contract.contract_deadline,
    deliverables: deliverablesResult.rows,
    rules: rulesResult.rows,
    extractedTerms: documentResult.rows[0]?.extracted_terms || null,
  });

  await updateContractStatus(contractId, 'accepted', 'locked', { lockedAt: new Date().toISOString() });
  await query('UPDATE contracts SET terms_hash = $2 WHERE id = $1', [contractId, immutableHash]);

  if (documentResult.rows[0]) {
    await query(
      `UPDATE contract_documents
       SET locked_terms_hash = $2,
           locked_at = NOW(),
           creator_final_submission_url = $3,
           creator_final_submitted_at = NOW()
       WHERE id = $1`,
      [documentResult.rows[0].id, immutableHash, String(finalSubmissionUrl)]
    );
  }

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'contract_locked', $4::jsonb)`,
    [createId('evt'), contractId, req.user.userId, JSON.stringify({ termsHash: immutableHash, finalSubmissionUrl })]
  );

  const title = 'Contract locked after creator final submission';
  const message = `Creator completed final submission and contract ${contractId} is now locked.`;
  await query(
    `INSERT INTO notifications (id, user_id, contract_id, title, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      createId('notif'),
      contract.brand_id,
      contractId,
      title,
      message,
    ]
  );
  broadcastEvent('notification', { 
    title, 
    message, 
    userId: contract.brand_id, 
    timestamp: new Date().toISOString() 
  });

  const applicationResult = await query('SELECT id FROM campaign_applications WHERE contract_id = $1', [contractId]);
  const applicationId = applicationResult.rows[0]?.id;
  await logApplicationEvent(applicationId, req.user.userId, 'contract_locked_after_creator_submission', {
    contractId,
    finalSubmissionUrl,
  });

  return res.json({ contractId, status: 'locked', termsHash: immutableHash });
});

router.patch('/:id/deliverables/:deliverableId/status', requireAuth, async (req, res) => {
  const { id: contractId, deliverableId } = req.params;
  const { status, evidenceUrl, reviewerNotes } = req.body || {};

  if (!['submitted', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be submitted, verified, or rejected' });
  }

  const contractResult = await query('SELECT id, brand_id, creator_id, status FROM contracts WHERE id = $1', [contractId]);
  const contract = contractResult.rows[0];

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const canSubmit = status === 'submitted' && contract.creator_id === req.user.userId;
  const canReview = ['verified', 'rejected'].includes(status) && (req.user.role === 'admin' || contract.brand_id === req.user.userId);

  if (!canSubmit && !canReview) {
    return res.status(403).json({ error: 'Forbidden for this deliverable action' });
  }

  if (status === 'submitted' && !['locked', 'executed'].includes(contract.status)) {
    return res.status(409).json({ error: 'Deliverables can be submitted only after contract is locked' });
  }

  if (['verified', 'rejected'].includes(status) && !['locked', 'executed', 'completed', 'disputed'].includes(contract.status)) {
    return res.status(409).json({ error: 'Brand verification is available only after contract is locked' });
  }

  const submittedAt = status === 'submitted' ? new Date().toISOString() : null;
  const verifiedAt = status === 'verified' ? new Date().toISOString() : null;

  const result = await query(
    `UPDATE contract_deliverables
     SET status = $3,
         submitted_at = COALESCE($4, submitted_at),
         verified_at = COALESCE($5, verified_at),
         evidence_url = COALESCE($6, evidence_url),
         reviewer_notes = COALESCE($7, reviewer_notes)
     WHERE id = $1 AND contract_id = $2
     RETURNING id, status`,
    [deliverableId, contractId, status, submittedAt, verifiedAt, evidenceUrl || null, reviewerNotes || null]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: 'Deliverable not found' });
  }

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'deliverable_status_changed', $4::jsonb)`,
    [createId('evt'), contractId, req.user.userId, JSON.stringify({ deliverableId, status })]
  );

  return res.json({ contractId, deliverableId, status });
});

router.patch('/:id/rules/:ruleId', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const { id: contractId, ruleId } = req.params;
  const { passed, details } = req.body || {};

  if (typeof passed !== 'boolean') {
    return res.status(400).json({ error: 'passed must be boolean' });
  }

  const result = await query(
    `UPDATE contract_rules
     SET passed = $3, evaluated_at = NOW(), evaluation_details = COALESCE($4::jsonb, evaluation_details)
     WHERE id = $1 AND contract_id = $2
     RETURNING id`,
    [ruleId, contractId, passed, details ? JSON.stringify(details) : null]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'rule_evaluated', $4::jsonb)`,
    [createId('evt'), contractId, req.user.userId, JSON.stringify({ ruleId, passed })]
  );

  return res.json({ contractId, ruleId, passed });
});

router.post('/:id/execute', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const contractId = req.params.id;

  const contractResult = await query('SELECT id, brand_id, creator_id, status FROM contracts WHERE id = $1', [contractId]);
  const contract = contractResult.rows[0];

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (req.user.role !== 'admin' && contract.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only contract brand can execute this contract' });
  }

  if (contract.status !== 'locked') {
    return res.status(400).json({ error: 'Only locked contracts can be executed' });
  }

  await updateContractStatus(contractId, 'locked', 'executed', { executedAt: new Date().toISOString() });

  const evaluation = await evaluateContract(contractId);
  const decisionId = createId('dec');

  await query(
    `INSERT INTO decision_evaluations (id, contract_id, decision, confidence_score, processing_time_ms, trace)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [decisionId, contractId, evaluation.decision, evaluation.confidenceScore, 800, JSON.stringify({ mode: 'rule_engine_v2' })]
  );

  for (let i = 0; i < evaluation.reasons.length; i += 1) {
    await query(
      `INSERT INTO decision_reasons (id, decision_id, reason_text, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [createId('dr'), decisionId, evaluation.reasons[i], i + 1]
    );
  }

  const finalStatus = evaluation.decision === 'success' ? 'completed' : 'disputed';
  await updateContractStatus(contractId, 'executed', finalStatus, {
    completedAt: finalStatus === 'completed' ? new Date().toISOString() : null,
  });

  // Automated Escrow Release / Dispute Hook
  try {
    if (finalStatus === 'completed') {
      const escRes = await query("SELECT * FROM escrow_holdings WHERE contract_id = $1 AND status = 'held'", [contractId]);
      const escrow = escRes.rows[0];
      if (escrow) {
        // 1. Mark escrow as released
        await query("UPDATE escrow_holdings SET status = 'released', released_at = NOW(), updated_at = NOW() WHERE id = $1", [escrow.id]);
        
        // 2. Subtract from Brand's locked pending escrow balance
        const brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.brand_id]);
        if (brandWalletRes.rows[0]) {
          await query('UPDATE user_wallets SET pending_escrow_balance = pending_escrow_balance - $2, updated_at = NOW() WHERE id = $1', [brandWalletRes.rows[0].id, escrow.amount]);
        }
        
        // 3. Credit Creator's available balance
        let creatorWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.creator_id]);
        if (!creatorWalletRes.rows[0]) {
          const walletId = createId('wal');
          await query("INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) VALUES ($1, $2, 0.00, 0.00, 'INR')", [walletId, escrow.creator_id]);
          creatorWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.creator_id]);
        }
        const creatorWallet = creatorWalletRes.rows[0];
        await query('UPDATE user_wallets SET available_balance = available_balance + $2, updated_at = NOW() WHERE id = $1', [creatorWallet.id, escrow.amount]);
        
        // 4. Log credit transaction for creator
        await query(
          `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description, reference_escrow_id)
           VALUES ($1, $2, $3, 'escrow_credit', 'completed', $4, $5)`,
          [createId('txn'), creatorWallet.id, escrow.amount, `Escrow Released: Contract ${contractId} Deliverables Verified Successfully`, escrow.id]
        );

        // Autonomous email notification to creator on payout release
        try {
          const creatorUser = await query('SELECT full_name, email FROM users WHERE id = $1', [contract.creator_id]);
          const cEmail = creatorUser.rows[0]?.email;
          const cName = creatorUser.rows[0]?.full_name;
          if (cEmail) {
            sendEscrowReleasedEmail({
              creatorEmail: cEmail,
              creatorName: cName,
              amount: escrow.amount,
              contractId
            }).catch(e => console.error('[Escrow Released Email Hook Error]', e));
          }
        } catch (emailErr) {
          console.error('[Escrow Released Email Trigger Failed]', emailErr);
        }
      }
    } else if (finalStatus === 'disputed') {
      // If AI fails, move the escrow holding to disputed status
      await query("UPDATE escrow_holdings SET status = 'disputed', updated_at = NOW() WHERE contract_id = $1 AND status = 'held'", [contractId]);
    }
  } catch (escHookError) {
    console.error('Failed to process automated escrow release hook:', escHookError);
  }

  const executeTitle = 'Contract Decision Ready';
  const executeMessage = `Contract ${contractId} was evaluated as ${evaluation.decision}`;
  await query(
    `INSERT INTO notifications (id, user_id, contract_id, decision_id, title, message)
     VALUES
       ($1, $2, $3, $4, $5, $6),
       ($7, $8, $3, $4, $5, $6)`,
    [
      createId('noti'),
      contract.brand_id,
      contractId,
      decisionId,
      executeTitle,
      executeMessage,
      createId('noti'),
      contract.creator_id,
    ]
  );
  broadcastEvent('notification', { title: executeTitle, message: executeMessage, userId: contract.brand_id, timestamp: new Date().toISOString() });
  broadcastEvent('notification', { title: executeTitle, message: executeMessage, userId: contract.creator_id, timestamp: new Date().toISOString() });

  await query(
    `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, 'contract_executed', $4::jsonb)`,
    [createId('evt'), contractId, req.user.userId, JSON.stringify({ decisionId, decision: evaluation.decision, finalStatus })]
  );

  return res.json({
    contractId,
    decisionId,
    decision: evaluation.decision,
    status: finalStatus,
    finalStatus,
    reasons: evaluation.reasons,
  });
});

export default router;
