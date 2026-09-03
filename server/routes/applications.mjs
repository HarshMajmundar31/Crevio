import { Router } from 'express';
import { broadcastEvent } from '../lib/socket.mjs';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth } from '../middleware/require-auth.mjs';

const router = Router();

const statusSet = new Set(['submitted', 'shortlisted', 'interviewing', 'approved', 'rejected', 'withdrawn']);
const brandReviewStatuses = new Set(['shortlisted', 'interviewing', 'approved', 'rejected']);

const brandTransitions = {
  submitted: new Set(['shortlisted', 'interviewing', 'approved', 'rejected']),
  shortlisted: new Set(['interviewing', 'approved', 'rejected']),
  interviewing: new Set(['shortlisted', 'approved', 'rejected']),
  approved: new Set(['approved']),
  rejected: new Set(['rejected']),
  withdrawn: new Set([]),
};

function canBrandTransition(currentStatus, nextStatus) {
  if (!statusSet.has(currentStatus) || !statusSet.has(nextStatus)) {
    return false;
  }
  return brandTransitions[currentStatus]?.has(nextStatus) || false;
}

async function logApplicationEvent(applicationId, actorUserId, eventType, payload = {}) {
  await query(
    `INSERT INTO campaign_application_events (id, application_id, actor_user_id, event_type, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [createId('appevt'), applicationId, actorUserId || null, eventType, JSON.stringify(payload || {})]
  );
}

router.get('/', requireAuth, async (req, res) => {
  const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : '';
  const campaignId = typeof req.query?.campaignId === 'string' ? req.query.campaignId.trim() : '';

  const conditions = [];
  const params = [];

  if (req.user.role === 'creator') {
    params.push(req.user.userId);
    conditions.push(`a.creator_id = $${params.length}`);
  } else if (req.user.role === 'brand') {
    params.push(req.user.userId);
    conditions.push(`a.brand_id = $${params.length}`);
  }

  if (status) {
    if (!statusSet.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  if (campaignId) {
    params.push(campaignId);
    conditions.push(`a.campaign_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT a.id, a.campaign_id, a.creator_id, a.brand_id, a.status,
            a.pitch_message, a.platform_links, a.audience_location, a.audience_age_band,
            a.audience_niche, a.engagement_snapshot, a.past_work_links, a.proposed_deliverables,
            a.proposed_fee, a.proposed_payment_model, a.earliest_start_date, a.availability_notes,
            a.compliance_agreed, a.audience_fit_score, a.engagement_quality_score,
            a.content_quality_score, a.reliability_score, a.budget_fit_score, a.fit_score,
            a.brand_notes, a.negotiation_notes, a.usage_rights, a.exclusivity_terms,
            a.revision_terms, a.payout_terms, a.reviewed_by, a.reviewed_at, a.withdrawn_at,
            a.contract_id, a.signed_contract_path, a.signed_contract_name, a.signed_at,
            a.is_contract_locked, a.contract_locked_at, a.created_at, a.updated_at,
            c.title AS campaign_title, c.platform AS campaign_platform, c.status AS campaign_status,
            c.goal AS campaign_goal, c.target_audience AS campaign_target_audience,
            c.budget_min AS campaign_budget_min, c.budget_max AS campaign_budget_max,
            b.full_name AS brand_name, cr.full_name AS creator_name
     FROM campaign_applications a
     JOIN campaigns c ON c.id = a.campaign_id
     JOIN users b ON b.id = a.brand_id
     JOIN users cr ON cr.id = a.creator_id
     ${whereClause}
     ORDER BY a.created_at DESC`,
    params
  );

  return res.json({ applications: result.rows });
});

router.get('/:id', requireAuth, async (req, res) => {
  const applicationId = req.params.id;

  const detailResult = await query(
    `SELECT a.id, a.campaign_id, a.creator_id, a.brand_id, a.status,
            a.pitch_message, a.platform_links, a.audience_location, a.audience_age_band,
            a.audience_niche, a.engagement_snapshot, a.past_work_links, a.proposed_deliverables,
            a.proposed_fee, a.proposed_payment_model, a.earliest_start_date, a.availability_notes,
            a.compliance_agreed, a.audience_fit_score, a.engagement_quality_score,
            a.content_quality_score, a.reliability_score, a.budget_fit_score, a.fit_score,
            a.brand_notes, a.negotiation_notes, a.usage_rights, a.exclusivity_terms,
            a.revision_terms, a.payout_terms, a.reviewed_by, a.reviewed_at, a.withdrawn_at,
            a.contract_id, a.signed_contract_path, a.signed_contract_name, a.signed_at,
            a.is_contract_locked, a.contract_locked_at, a.created_at, a.updated_at,
            c.title AS campaign_title, c.platform AS campaign_platform, c.status AS campaign_status,
            c.goal AS campaign_goal, c.target_audience AS campaign_target_audience,
            c.budget_min AS campaign_budget_min, c.budget_max AS campaign_budget_max,
            b.full_name AS brand_name, cr.full_name AS creator_name
     FROM campaign_applications a
     JOIN campaigns c ON c.id = a.campaign_id
     JOIN users b ON b.id = a.brand_id
     JOIN users cr ON cr.id = a.creator_id
     WHERE a.id = $1`,
    [applicationId]
  );

  const application = detailResult.rows[0];
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const canAccess =
    req.user.role === 'admin' ||
    application.brand_id === req.user.userId ||
    application.creator_id === req.user.userId;
  if (!canAccess) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const eventsResult = await query(
    `SELECT e.id, e.application_id, e.actor_user_id, u.full_name AS actor_name, e.event_type, e.payload, e.created_at
     FROM campaign_application_events e
     LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.application_id = $1
     ORDER BY e.created_at ASC`,
    [applicationId]
  );

  return res.json({ application, events: eventsResult.rows });
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const applicationId = req.params.id;
  const {
    status,
    brandNotes,
    negotiationNotes,
    usageRights,
    exclusivityTerms,
    revisionTerms,
    payoutTerms,
  } = req.body || {};

  const nextStatus = typeof status === 'string' ? status.trim().toLowerCase() : null;

  const appResult = await query(
    `SELECT id, campaign_id, creator_id, brand_id, status, contract_id
     FROM campaign_applications
     WHERE id = $1`,
    [applicationId]
  );
  const application = appResult.rows[0];

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isBrandActor = req.user.role === 'brand' || isAdmin;
  const isCreatorActor = req.user.role === 'creator';

  if (!isAdmin) {
    if (isBrandActor && application.brand_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (isCreatorActor && application.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  if (isCreatorActor) {
    if (nextStatus !== 'withdrawn') {
      return res.status(400).json({ error: "Creators can only set status to 'withdrawn'" });
    }

    if (application.contract_id) {
      return res.status(409).json({ error: 'Cannot withdraw an application that is already linked to a contract' });
    }

    if (!['submitted', 'shortlisted', 'interviewing'].includes(application.status)) {
      return res.status(409).json({ error: `Application in '${application.status}' cannot be withdrawn` });
    }

    await query(
      `UPDATE campaign_applications
       SET status = 'withdrawn', withdrawn_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [applicationId]
    );

    await logApplicationEvent(applicationId, req.user.userId, 'application_withdrawn', {
      fromStatus: application.status,
      toStatus: 'withdrawn',
    });

    return res.json({ applicationId, status: 'withdrawn' });
  }

  if (!isBrandActor) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const hasNegotiationUpdates =
    typeof brandNotes === 'string' ||
    typeof negotiationNotes === 'string' ||
    typeof usageRights === 'string' ||
    typeof exclusivityTerms === 'string' ||
    typeof revisionTerms === 'string' ||
    typeof payoutTerms === 'string';

  if (!nextStatus && !hasNegotiationUpdates) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  if (nextStatus) {
    if (!brandReviewStatuses.has(nextStatus)) {
      return res.status(400).json({ error: 'Invalid brand review status' });
    }

    if (!canBrandTransition(application.status, nextStatus)) {
      return res.status(409).json({ error: `Invalid transition ${application.status} -> ${nextStatus}` });
    }
  }

  const sets = ['updated_at = NOW()'];
  const params = [applicationId];

  if (nextStatus) {
    params.push(nextStatus);
    sets.push(`status = $${params.length}`);
    params.push(req.user.userId);
    sets.push(`reviewed_by = $${params.length}`);
    sets.push('reviewed_at = NOW()');
  }

  if (typeof brandNotes === 'string') {
    params.push(brandNotes.trim());
    sets.push(`brand_notes = $${params.length}`);
  }

  if (typeof negotiationNotes === 'string') {
    params.push(negotiationNotes.trim());
    sets.push(`negotiation_notes = $${params.length}`);
  }

  if (typeof usageRights === 'string') {
    params.push(usageRights.trim());
    sets.push(`usage_rights = $${params.length}`);
  }

  if (typeof exclusivityTerms === 'string') {
    params.push(exclusivityTerms.trim());
    sets.push(`exclusivity_terms = $${params.length}`);
  }

  if (typeof revisionTerms === 'string') {
    params.push(revisionTerms.trim());
    sets.push(`revision_terms = $${params.length}`);
  }

  if (typeof payoutTerms === 'string') {
    params.push(payoutTerms.trim());
    sets.push(`payout_terms = $${params.length}`);
  }

  await query(
    `UPDATE campaign_applications
     SET ${sets.join(', ')}
     WHERE id = $1`,
    params
  );

  if (nextStatus) {
    await logApplicationEvent(applicationId, req.user.userId, 'application_status_changed', {
      fromStatus: application.status,
      toStatus: nextStatus,
    });
  }

  if (hasNegotiationUpdates) {
    await logApplicationEvent(applicationId, req.user.userId, 'negotiation_updated', {
      hasBrandNotes: typeof brandNotes === 'string',
      hasNegotiationNotes: typeof negotiationNotes === 'string',
      hasUsageRights: typeof usageRights === 'string',
      hasExclusivityTerms: typeof exclusivityTerms === 'string',
      hasRevisionTerms: typeof revisionTerms === 'string',
      hasPayoutTerms: typeof payoutTerms === 'string',
    });
  }

  if (nextStatus) {
    const title = `Application ${nextStatus}`;
    const message = `Your application for campaign ${application.campaign_id} is now ${nextStatus}.`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [createId('notif'), application.creator_id, title, message]
    );
    broadcastEvent('notification', { 
      title, 
      message, 
      userId: application.creator_id, 
      timestamp: new Date().toISOString() 
    });
  }

  return res.json({ applicationId, status: nextStatus || application.status });
});

export default router;
