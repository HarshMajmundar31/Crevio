import { Router } from 'express';
import multer from 'multer';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';
import {
  createContentHash,
  createImmutableTermsHash,
  extractContractTermsFromText,
  readUploadedDocument,
} from '../lib/contract-ingestion.mjs';

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
  const search = typeof req.query?.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : '';
  const allowedStatuses = new Set(['draft', 'pending', 'accepted', 'locked', 'executed', 'completed', 'disputed', 'cancelled']);

  const whereParts = [];
  const params = [];

  if (req.user.role !== 'admin') {
    params.push(req.user.userId);
    whereParts.push(`(c.brand_id = $${params.length} OR c.creator_id = $${params.length})`);
  }

  if (status) {
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    params.push(status);
    whereParts.push(`c.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereParts.push(`(
      c.id ILIKE $${params.length}
      OR c.campaign_id ILIKE $${params.length}
      OR b.full_name ILIKE $${params.length}
      OR cr.full_name ILIKE $${params.length}
    )`);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  const result = await query(
    `SELECT c.id, c.campaign_id, c.brand_id, b.full_name AS brand_name,
            c.creator_id, cr.full_name AS creator_name, c.status, c.payment_amount,
            c.contract_deadline, c.notes, c.terms_hash, c.created_at, c.accepted_at, c.locked_at,
            c.executed_at, c.completed_at,
            COALESCE(stats.total_deliverables, 0) AS total_deliverables,
            COALESCE(stats.verified_deliverables, 0) AS verified_deliverables
     FROM contracts c
     JOIN users b ON b.id = c.brand_id
     JOIN users cr ON cr.id = c.creator_id
     LEFT JOIN (
       SELECT contract_id,
              COUNT(*) AS total_deliverables,
              COUNT(*) FILTER (WHERE status = 'verified') AS verified_deliverables
       FROM contract_deliverables
       GROUP BY contract_id
     ) stats ON stats.contract_id = c.id
     ${whereClause}
     ORDER BY c.created_at DESC`,
    params
  );

  return res.json({ contracts: result.rows });
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

  const contractResult = await query(
    `SELECT c.id, c.campaign_id, c.brand_id, b.full_name AS brand_name,
            c.creator_id, cr.full_name AS creator_name, c.status, c.payment_amount,
            c.contract_deadline, c.notes, c.terms_hash, c.created_at, c.accepted_at, c.locked_at,
            c.executed_at, c.completed_at
     FROM contracts c
     JOIN users b ON b.id = c.brand_id
     JOIN users cr ON cr.id = c.creator_id
     WHERE c.id = $1`,
    [contractId]
  );

  const contract = contractResult.rows[0];
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const isAllowed = req.user.role === 'admin' || contract.brand_id === req.user.userId || contract.creator_id === req.user.userId;
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden' });
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
    await query(
      `INSERT INTO notifications (id, user_id, contract_id, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [createId('notif'), contractInfo.brand_id, contractId, 'Creator e-sign completed', `Creator signed contract ${contractId}. Waiting final submission for lock.`]
    );
  }

  const applicationResult = await query('SELECT id FROM campaign_applications WHERE contract_id = $1', [contractId]);
  const applicationId = applicationResult.rows[0]?.id;
  await logApplicationEvent(applicationId, req.user.userId, 'creator_esigned_contract', { contractId });

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

  await query(
    `INSERT INTO notifications (id, user_id, contract_id, title, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      createId('notif'),
      contract.brand_id,
      contractId,
      'Contract locked after creator final submission',
      `Creator completed final submission and contract ${contractId} is now locked.`,
    ]
  );

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
      }
    } else if (finalStatus === 'disputed') {
      // If AI fails, move the escrow holding to disputed status
      await query("UPDATE escrow_holdings SET status = 'disputed', updated_at = NOW() WHERE contract_id = $1 AND status = 'held'", [contractId]);
    }
  } catch (escHookError) {
    console.error('Failed to process automated escrow release hook:', escHookError);
  }

  await query(
    `INSERT INTO notifications (id, user_id, contract_id, decision_id, title, message)
     VALUES
       ($1, $2, $3, $4, 'Contract Decision Ready', $5),
       ($6, $7, $3, $4, 'Contract Decision Ready', $5)`,
    [
      createId('noti'),
      contract.brand_id,
      contractId,
      decisionId,
      `Contract ${contractId} was evaluated as ${evaluation.decision}`,
      createId('noti'),
      contract.creator_id,
    ]
  );

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

router.post('/upload-for-campaign/:campaignId', requireAuth, requireRole('brand', 'admin'), upload.single('file'), async (req, res) => {
  const { campaignId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Contract file is required (multipart field: file)' });
  }

  const campaignResult = await query('SELECT id, brand_id, status FROM campaigns WHERE id = $1', [campaignId]);
  const campaign = campaignResult.rows[0];

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (req.user.role !== 'admin' && campaign.brand_id !== req.user.userId) {
    return res.status(403).json({ error: 'Only campaign owner brand or admin can upload contracts for this campaign' });
  }

  // Simulate storing to Cloudinary and generating a URL
  const fileUrl = `https://res.cloudinary.com/acems/contracts/${campaignId}_${Date.now()}.pdf`;
  
  const text = await readUploadedDocument(req.file);
  const checksum = createContentHash(text);
  
  return res.json({ 
    success: true, 
    documentId: createId('doc'), 
    fileUrl, 
    checksum,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    rawText: text
  });
});

router.post('/parse', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const { rawText } = req.body || {};
  if (!rawText) {
    return res.status(400).json({ error: 'rawText is required to parse' });
  }
  
  const extractedTerms = extractContractTermsFromText(rawText);
  
  return res.json({
    success: true,
    parsedData: {
      brandName: 'Brand Co.', // Placeholder or parse from text
      campaignName: 'Campaign Name',
      totalValue: extractedTerms.paymentAmount || 10000,
      currency: 'USD',
      confidenceScore: 92.5,
      deliverables: extractedTerms.deliverables.map((d, i) => ({
        id: String(i + 1),
        platform: d.platform,
        format: d.description,
        dueDate: d.deadline || new Date().toISOString().split('T')[0],
        amount: Math.floor((extractedTerms.paymentAmount || 10000) / extractedTerms.deliverables.length),
        confidence: 95
      })),
      clauses: {
        usageRights: 'Standard digital usage rights',
        exclusivity: 'No competitors for 30 days',
        evidenceReq: 'Submit post URL'
      },
      rawRules: extractedTerms.rules
    }
  });
});

export default router;
