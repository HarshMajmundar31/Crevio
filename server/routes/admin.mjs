import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';
import crypto from 'crypto';

const router = Router();

// 1. Audit Logs
router.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    const isBrand = req.user.role === 'brand';
    const isCreator = req.user.role === 'creator';
    const userId = req.user.userId;

    let filterClause = '';
    const params = [];

    if (isBrand) {
      params.push(userId);
      filterClause = `WHERE (actor_user_id = $1 OR brand_id = $1)`;
    } else if (isCreator) {
      params.push(userId);
      filterClause = `WHERE (actor_user_id = $1 OR creator_id = $1)`;
    }

    // Combine contract_events, campaign_application_events, and campaign creation events
    const queryText = `
      WITH unified_events AS (
        -- Contract Events
        SELECT 
          ce.id,
          ce.created_at AS timestamp,
          COALESCE(c.id, ce.contract_id, 'SYS') AS contract_number,
          ce.event_type,
          ce.actor_user_id,
          c.brand_id,
          c.creator_id,
          ce.payload
        FROM contract_events ce
        LEFT JOIN contracts c ON c.id = ce.contract_id

        UNION ALL

        -- Campaign Application & Signing Events
        SELECT
          cae.id,
          cae.created_at AS timestamp,
          COALESCE(ca.campaign_id, 'SYS') AS contract_number,
          cae.event_type,
          cae.actor_user_id,
          c.brand_id,
          ca.creator_id,
          cae.payload
        FROM campaign_application_events cae
        JOIN campaign_applications ca ON ca.id = cae.application_id
        JOIN campaigns c ON c.id = ca.campaign_id

        UNION ALL

        -- Campaign Contract Ingestion Events
        SELECT
          CONCAT('camp_', c.id) AS id,
          c.created_at AS timestamp,
          c.id AS contract_number,
          'campaign_contract_ingested' AS event_type,
          c.brand_id AS actor_user_id,
          c.brand_id,
          NULL AS creator_id,
          jsonb_build_object(
            'title', c.title,
            'contract_file_name', c.contract_file_name,
            'budget', c.budget,
            'status', c.status
          ) AS payload
        FROM campaigns c
      )
      SELECT 
        ue.id,
        ue.timestamp,
        ue.contract_number,
        ue.event_type,
        ue.payload,
        COALESCE(u.full_name, 'System') AS actor,
        COALESCE(u.role, 'system') AS actor_role
      FROM unified_events ue
      LEFT JOIN users u ON u.id = ue.actor_user_id
      ${filterClause}
      ORDER BY ue.timestamp ASC
    `;

    const eventsRes = await query(queryText, params);

    let parentHash = '0000000000000000000000000000000000000000000000000000000000000000';
    
    const logs = eventsRes.rows.map((row) => {
      const payloadString = JSON.stringify(row.payload || {});
      const hashContent = `${row.id}${row.timestamp}${row.event_type}${payloadString}${parentHash}`;
      const sha256Hash = crypto.createHash('sha256').update(hashContent).digest('hex');
      
      const log = {
        id: `AUD-${String(row.id).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`,
        timestamp: row.timestamp,
        contractNumber: row.contract_number ? `#CR-${String(row.contract_number).substring(0, 8)}` : 'SYS',
        eventType: row.event_type,
        actor: row.actor || 'System',
        actorRole: (row.actor_role ? String(row.actor_role).toUpperCase() : 'CREVIO_ENGINE'),
        sha256Hash: sha256Hash,
        parentHash: parentHash,
        payloadSummary: `Event ${row.event_type} registered. Data: ${payloadString.substring(0, 100)}`,
        verificationStatus: 'VERIFIED'
      };
      
      parentHash = sha256Hash;
      return log;
    });

    // Reverse to show newest first
    return res.json({ logs: logs.reverse() });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// 2. System Ledger Stats
router.get('/system-metrics', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const poolRes = await query(`SELECT SUM(available_balance) as total FROM user_wallets`);
    const escrowRes = await query(`SELECT SUM(amount) as total FROM escrow_holdings WHERE status = 'held'`);
    
    const poolTotal = parseFloat(poolRes.rows[0]?.total || '0');
    const escrowTotal = parseFloat(escrowRes.rows[0]?.total || '0');

    return res.json({
      metrics: {
        globalAvailablePool: poolTotal,
        escrowLedgerCheck: escrowTotal,
        isBalanced: true
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve system metrics' });
  }
});

// ==========================================
// 3. Platform Overview & System-Wide Analytics
// ==========================================
router.get('/overview', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const usersCountRes = await query(`
      SELECT 
        COUNT(*)::int AS total_users,
        COUNT(CASE WHEN role = 'brand' THEN 1 END)::int AS total_brands,
        COUNT(CASE WHEN role = 'creator' THEN 1 END)::int AS total_creators,
        COUNT(CASE WHEN role = 'admin' THEN 1 END)::int AS total_admins
      FROM users
    `);

    const campaignsCountRes = await query(`
      SELECT 
        COUNT(*)::int AS total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_campaigns,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_campaigns,
        COUNT(CASE WHEN status = 'draft' THEN 1 END)::int AS draft_campaigns,
        COALESCE(SUM(budget), 0)::numeric AS total_budget_volume
      FROM campaigns
    `);

    const contractsCountRes = await query(`
      SELECT 
        COUNT(*)::int AS total_contracts,
        COUNT(CASE WHEN status = 'locked' OR status = 'executed' OR status = 'accepted' THEN 1 END)::int AS active_contracts,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_contracts,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END)::int AS disputed_contracts,
        COALESCE(SUM(payment_amount), 0)::numeric AS total_contract_volume
      FROM contracts
    `);

    const escrowCountRes = await query(`
      SELECT 
        COUNT(*)::int AS total_escrows,
        COALESCE(SUM(CASE WHEN status = 'held' THEN amount ELSE 0 END), 0)::numeric AS total_held_escrow,
        COALESCE(SUM(CASE WHEN status = 'released' THEN amount ELSE 0 END), 0)::numeric AS total_released_escrow,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END)::int AS disputed_escrows
      FROM escrow_holdings
    `);

    const appsCountRes = await query(`SELECT COUNT(*)::int AS total FROM campaign_applications`);
    const msgsCountRes = await query(`SELECT COUNT(*)::int AS total FROM campaign_messages`);
    const proofsCountRes = await query(`SELECT COUNT(*)::int AS total FROM campaign_proof_submissions`);

    const activityStreamRes = await query(`
      SELECT 
        'campaign_created' AS event_type,
        c.id,
        c.title AS description,
        u.full_name AS actor_name,
        u.role AS actor_role,
        c.created_at AS timestamp
      FROM campaigns c
      JOIN users u ON u.id = c.brand_id

      UNION ALL

      SELECT 
        'application_submitted' AS event_type,
        ca.id,
        CONCAT(u.full_name, ' applied to ', c.title) AS description,
        u.full_name AS actor_name,
        'creator' AS actor_role,
        ca.created_at AS timestamp
      FROM campaign_applications ca
      JOIN users u ON u.id = ca.creator_id
      JOIN campaigns c ON c.id = ca.campaign_id

      UNION ALL

      SELECT 
        'contract_created' AS event_type,
        ct.id,
        CONCAT('Contract #', SUBSTRING(ct.id FROM 1 FOR 8), ' for ₹', ct.payment_amount) AS description,
        COALESCE(b.full_name, 'Brand') AS actor_name,
        'brand' AS actor_role,
        ct.created_at AS timestamp
      FROM contracts ct
      LEFT JOIN users b ON b.id = ct.brand_id

      ORDER BY timestamp DESC
      LIMIT 25
    `);

    return res.json({
      stats: {
        users: usersCountRes.rows[0] || {},
        campaigns: campaignsCountRes.rows[0] || {},
        contracts: contractsCountRes.rows[0] || {},
        escrow: escrowCountRes.rows[0] || {},
        totalApplications: appsCountRes.rows[0]?.total || 0,
        totalMessages: msgsCountRes.rows[0]?.total || 0,
        totalProofs: proofsCountRes.rows[0]?.total || 0
      },
      activityStream: activityStreamRes.rows
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin overview data' });
  }
});

// ==========================================
// 4. CAMPAIGN MANAGEMENT (CRUD + STATUS)
// ==========================================
router.get('/campaigns', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { q, status } = req.query;
    let whereClauses = [];
    let params = [];

    if (q) {
      params.push(`%${q}%`);
      whereClauses.push(`(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    if (status && status !== 'all') {
      params.push(status);
      whereClauses.push(`c.status = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryText = `
      SELECT 
        c.*,
        u.full_name AS brand_name,
        u.email AS brand_email,
        u.avatar_url AS brand_avatar,
        (SELECT COUNT(*)::int FROM campaign_applications ca WHERE ca.campaign_id = c.id) AS applicants_count,
        (SELECT COUNT(*)::int FROM campaign_applications ca WHERE ca.campaign_id = c.id AND ca.status = 'approved') AS accepted_count
      FROM campaigns c
      JOIN users u ON u.id = c.brand_id
      ${whereStr}
      ORDER BY c.created_at DESC
    `;

    const result = await query(queryText, params);
    return res.json({ campaigns: result.rows });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to retrieve campaigns' });
  }
});

router.post('/campaigns', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const {
      brand_id,
      title,
      description,
      goal,
      target_audience,
      deliverables_summary,
      timeline_summary,
      platform,
      budget,
      deadline,
      status,
      content_rights
    } = req.body;

    if (!title || !description || !platform || !budget || !deadline) {
      return res.status(400).json({ error: 'Missing required campaign fields (title, description, platform, budget, deadline)' });
    }

    const effectiveBrandId = brand_id || req.user.userId;
    const campaignId = `camp_${crypto.randomBytes(6).toString('hex')}`;
    const insertText = `
      INSERT INTO campaigns (
        id, brand_id, title, description, goal, target_audience,
        deliverables_summary, timeline_summary, platform, budget,
        deadline, status, content_rights, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await query(insertText, [
      campaignId,
      effectiveBrandId,
      title,
      description,
      goal || null,
      target_audience || null,
      deliverables_summary || null,
      timeline_summary || null,
      platform,
      budget,
      deadline,
      status || 'active',
      content_rights || 'Standard Commercial Rights'
    ]);

    return res.status(201).json({ success: true, campaign: result.rows[0] });
  } catch (error) {
    console.error('Admin create campaign error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create campaign' });
  }
});

router.patch('/campaigns/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      goal,
      target_audience,
      deliverables_summary,
      timeline_summary,
      platform,
      budget,
      deadline,
      status,
      content_rights
    } = req.body;

    const existingRes = await query(`SELECT * FROM campaigns WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const current = existingRes.rows[0];

    const updateText = `
      UPDATE campaigns SET
        title = $1,
        description = $2,
        goal = $3,
        target_audience = $4,
        deliverables_summary = $5,
        timeline_summary = $6,
        platform = $7,
        budget = $8,
        deadline = $9,
        status = $10,
        content_rights = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const result = await query(updateText, [
      title !== undefined ? title : current.title,
      description !== undefined ? description : current.description,
      goal !== undefined ? goal : current.goal,
      target_audience !== undefined ? target_audience : current.target_audience,
      deliverables_summary !== undefined ? deliverables_summary : current.deliverables_summary,
      timeline_summary !== undefined ? timeline_summary : current.timeline_summary,
      platform !== undefined ? platform : current.platform,
      budget !== undefined ? budget : current.budget,
      deadline !== undefined ? deadline : current.deadline,
      status !== undefined ? status : current.status,
      content_rights !== undefined ? content_rights : current.content_rights,
      id
    ]);

    return res.json({ success: true, campaign: result.rows[0] });
  } catch (error) {
    console.error('Admin update campaign error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update campaign' });
  }
});

router.delete('/campaigns/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    await query(`DELETE FROM campaign_proof_submissions WHERE campaign_id = $1`, [id]);
    await query(`DELETE FROM campaign_messages WHERE campaign_id = $1`, [id]);
    await query(`DELETE FROM creator_matches WHERE campaign_id = $1`, [id]);
    await query(`DELETE FROM campaign_requirements WHERE campaign_id = $1`, [id]);
    
    const apps = await query(`SELECT id FROM campaign_applications WHERE campaign_id = $1`, [id]);
    for (const app of apps.rows) {
      await query(`DELETE FROM campaign_application_events WHERE application_id = $1`, [app.id]);
    }
    await query(`DELETE FROM campaign_applications WHERE campaign_id = $1`, [id]);

    const contracts = await query(`SELECT id FROM contracts WHERE campaign_id = $1`, [id]);
    for (const ct of contracts.rows) {
      await query(`DELETE FROM contract_events WHERE contract_id = $1`, [ct.id]);
      await query(`DELETE FROM contract_deliverables WHERE contract_id = $1`, [ct.id]);
      await query(`DELETE FROM contract_rules WHERE contract_id = $1`, [ct.id]);
      await query(`DELETE FROM escrow_holdings WHERE contract_id = $1`, [ct.id]);
      await query(`DELETE FROM contracts WHERE id = $1`, [ct.id]);
    }

    const deleteRes = await query(`DELETE FROM campaigns WHERE id = $1 RETURNING id`, [id]);
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ success: true, message: `Campaign ${id} and all related records deleted successfully.` });
  } catch (error) {
    console.error('Admin delete campaign error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete campaign' });
  }
});

// ==========================================
// 5. CONTRACT MANAGEMENT (CRUD + STATUS)
// ==========================================
router.get('/contracts', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { q, status } = req.query;
    let whereClauses = [];
    let params = [];

    if (q) {
      params.push(`%${q}%`);
      whereClauses.push(`(
        c.id ILIKE $${params.length} OR 
        b.full_name ILIKE $${params.length} OR 
        cr.full_name ILIKE $${params.length} OR 
        camp.title ILIKE $${params.length}
      )`);
    }

    if (status && status !== 'all') {
      params.push(status);
      whereClauses.push(`c.status = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryText = `
      SELECT 
        c.*,
        camp.title AS campaign_title,
        camp.contract_file_name,
        camp.contract_extracted_terms,
        b.full_name AS brand_name,
        b.email AS brand_email,
        cr.full_name AS creator_name,
        cr.email AS creator_email,
        ca.signed_contract_name,
        ca.signed_at,
        (SELECT COUNT(*)::int FROM contract_deliverables cd WHERE cd.contract_id = c.id) AS deliverables_count
      FROM contracts c
      LEFT JOIN campaigns camp ON camp.id = c.campaign_id
      LEFT JOIN users b ON b.id = c.brand_id
      LEFT JOIN users cr ON cr.id = c.creator_id
      LEFT JOIN campaign_applications ca ON (ca.campaign_id = c.campaign_id AND ca.creator_id = c.creator_id)
      ${whereStr}
      ORDER BY c.created_at DESC
    `;

    const result = await query(queryText, params);
    return res.json({ contracts: result.rows });
  } catch (error) {
    console.error('Admin get contracts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve contracts' });
  }
});

router.post('/contracts', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const {
      campaign_id,
      brand_id,
      creator_id,
      payment_amount,
      contract_deadline,
      notes,
      status
    } = req.body;

    if (!brand_id || !creator_id || !payment_amount) {
      return res.status(400).json({ error: 'Missing required contract fields (brand_id, creator_id, payment_amount)' });
    }

    const contractId = `ct_${crypto.randomBytes(6).toString('hex')}`;
    const insertText = `
      INSERT INTO contracts (
        id, campaign_id, brand_id, creator_id, payment_amount,
        contract_deadline, notes, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await query(insertText, [
      contractId,
      campaign_id || null,
      brand_id,
      creator_id,
      payment_amount,
      contract_deadline || null,
      notes || null,
      status || 'pending'
    ]);

    return res.status(201).json({ success: true, contract: result.rows[0] });
  } catch (error) {
    console.error('Admin create contract error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create contract' });
  }
});

router.patch('/contracts/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_amount,
      contract_deadline,
      notes,
      status
    } = req.body;

    const existing = await query(`SELECT * FROM contracts WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const current = existing.rows[0];
    const updateText = `
      UPDATE contracts SET
        payment_amount = $1,
        contract_deadline = $2,
        notes = $3,
        status = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await query(updateText, [
      payment_amount !== undefined ? payment_amount : current.payment_amount,
      contract_deadline !== undefined ? contract_deadline : current.contract_deadline,
      notes !== undefined ? notes : current.notes,
      status !== undefined ? status : current.status,
      id
    ]);

    return res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    console.error('Admin update contract error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update contract' });
  }
});

router.delete('/contracts/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM contract_events WHERE contract_id = $1`, [id]);
    await query(`DELETE FROM contract_deliverables WHERE contract_id = $1`, [id]);
    await query(`DELETE FROM contract_rules WHERE contract_id = $1`, [id]);
    await query(`DELETE FROM escrow_holdings WHERE contract_id = $1`, [id]);

    const result = await query(`DELETE FROM contracts WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    return res.json({ success: true, message: `Contract ${id} deleted successfully.` });
  } catch (error) {
    console.error('Admin delete contract error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete contract' });
  }
});

// ==========================================
// 6. APPLICATIONS MANAGEMENT
// ==========================================
router.get('/applications', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { q, status } = req.query;
    let whereClauses = [];
    let params = [];

    if (q) {
      params.push(`%${q}%`);
      whereClauses.push(`(
        cr.full_name ILIKE $${params.length} OR 
        cr.email ILIKE $${params.length} OR 
        b.full_name ILIKE $${params.length} OR 
        c.title ILIKE $${params.length}
      )`);
    }

    if (status && status !== 'all') {
      params.push(status);
      whereClauses.push(`ca.status = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryText = `
      SELECT 
        ca.*,
        c.title AS campaign_title,
        c.platform AS campaign_platform,
        c.budget AS campaign_budget,
        cr.full_name AS creator_name,
        cr.email AS creator_email,
        cr.avatar_url AS creator_avatar,
        b.full_name AS brand_name,
        b.email AS brand_email
      FROM campaign_applications ca
      JOIN campaigns c ON c.id = ca.campaign_id
      JOIN users cr ON cr.id = ca.creator_id
      JOIN users b ON b.id = ca.brand_id
      ${whereStr}
      ORDER BY ca.created_at DESC
    `;

    const result = await query(queryText, params);
    return res.json({ applications: result.rows });
  } catch (error) {
    console.error('Admin get applications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve applications' });
  }
});

router.patch('/applications/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, brand_notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await query(`
      UPDATE campaign_applications SET
        status = $1,
        brand_notes = COALESCE($2, brand_notes),
        reviewed_by = $3,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, brand_notes || null, req.user.userId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Admin update application status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update application' });
  }
});

router.delete('/applications/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM campaign_application_events WHERE application_id = $1`, [id]);
    const result = await query(`DELETE FROM campaign_applications WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json({ success: true, message: `Application ${id} deleted successfully.` });
  } catch (error) {
    console.error('Admin delete application error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete application' });
  }
});

// ==========================================
// 7. GLOBAL CHAT HISTORY & MESSAGES MONITOR
// ==========================================
router.get('/messages', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { campaign_id, q } = req.query;
    let whereClauses = [];
    let params = [];

    if (campaign_id) {
      params.push(campaign_id);
      whereClauses.push(`cm.campaign_id = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      whereClauses.push(`(cm.message ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR c.title ILIKE $${params.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryText = `
      SELECT 
        cm.*,
        u.full_name AS sender_name,
        u.email AS sender_email,
        u.avatar_url AS sender_avatar,
        c.title AS campaign_title,
        rec.full_name AS recipient_name
      FROM campaign_messages cm
      JOIN users u ON u.id = cm.sender_id
      JOIN campaigns c ON c.id = cm.campaign_id
      LEFT JOIN users rec ON rec.id = cm.recipient_id
      ${whereStr}
      ORDER BY cm.created_at DESC
      LIMIT 100
    `;

    const result = await query(queryText, params);
    return res.json({ messages: result.rows });
  } catch (error) {
    console.error('Admin get messages error:', error);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

router.post('/messages', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { campaign_id, message, recipient_id } = req.body;
    if (!campaign_id || !message) {
      return res.status(400).json({ error: 'campaign_id and message are required' });
    }

    const msgId = `msg_${crypto.randomBytes(6).toString('hex')}`;
    const result = await query(`
      INSERT INTO campaign_messages (
        id, campaign_id, sender_id, recipient_id, sender_role, message, created_at
      ) VALUES ($1, $2, $3, $4, 'admin', $5, NOW())
      RETURNING *
    `, [msgId, campaign_id, req.user.userId, recipient_id || null, message]);

    return res.status(201).json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Admin post message error:', error);
    return res.status(500).json({ error: error.message || 'Failed to post message' });
  }
});

router.delete('/messages/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM campaign_messages WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    return res.json({ success: true, message: `Message ${id} deleted.` });
  } catch (error) {
    console.error('Admin delete message error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ==========================================
// 8. USERS MANAGEMENT (CRUD + ROLE + WALLET)
// ==========================================
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { q, role } = req.query;
    let whereClauses = [];
    let params = [];

    if (q) {
      params.push(`%${q}%`);
      whereClauses.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.id ILIKE $${params.length})`);
    }

    if (role && role !== 'all') {
      params.push(role);
      whereClauses.push(`u.role = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryText = `
      SELECT 
        u.*,
        COALESCE(w.available_balance, 0)::numeric AS available_balance,
        COALESCE(w.pending_escrow_balance, 0)::numeric AS pending_escrow_balance,
        (SELECT COUNT(*)::int FROM campaigns c WHERE c.brand_id = u.id) AS campaigns_count,
        (SELECT COUNT(*)::int FROM contracts ct WHERE ct.brand_id = u.id OR ct.creator_id = u.id) AS contracts_count,
        (SELECT COUNT(*)::int FROM campaign_applications ca WHERE ca.creator_id = u.id) AS applications_count
      FROM users u
      LEFT JOIN user_wallets w ON w.user_id = u.id
      ${whereStr}
      ORDER BY u.created_at DESC
    `;

    const result = await query(queryText, params);
    return res.json({ users: result.rows });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

router.post('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { full_name, email, role, initial_balance } = req.body;
    if (!full_name || !email || !role) {
      return res.status(400).json({ error: 'full_name, email, and role are required' });
    }

    const userId = `user_${crypto.randomBytes(8).toString('hex')}`;
    const insertUserRes = await query(`
      INSERT INTO users (id, full_name, email, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING *
    `, [userId, full_name, email, role]);

    const walletId = `w_${crypto.randomBytes(6).toString('hex')}`;
    const balance = initial_balance ? parseFloat(initial_balance) : 10000;
    await query(`
      INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency, updated_at)
      VALUES ($1, $2, $3, 0, 'INR', NOW())
    `, [walletId, userId, balance]);

    return res.status(201).json({ success: true, user: insertUserRes.rows[0] });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

router.patch('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, is_active } = req.body;

    const existing = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = existing.rows[0];
    const updateRes = await query(`
      UPDATE users SET
        full_name = $1,
        email = $2,
        role = $3,
        is_active = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [
      full_name !== undefined ? full_name : current.full_name,
      email !== undefined ? email : current.email,
      role !== undefined ? role : current.role,
      is_active !== undefined ? is_active : current.is_active,
      id
    ]);

    return res.json({ success: true, user: updateRes.rows[0] });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

router.post('/users/:id/adjust-balance', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    const adjustNum = parseFloat(amount);
    if (isNaN(adjustNum)) {
      return res.status(400).json({ error: 'Valid numeric amount is required' });
    }

    let walletRes = await query(`SELECT * FROM user_wallets WHERE user_id = $1`, [id]);
    let walletId;
    if (walletRes.rows.length === 0) {
      walletId = `w_${crypto.randomBytes(6).toString('hex')}`;
      await query(`
        INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency, updated_at)
        VALUES ($1, $2, $3, 0, 'INR', NOW())
      `, [walletId, id, Math.max(0, adjustNum)]);
    } else {
      walletId = walletRes.rows[0].id;
      await query(`
        UPDATE user_wallets SET
          available_balance = GREATEST(0, available_balance + $1),
          updated_at = NOW()
        WHERE id = $2
      `, [adjustNum, walletId]);
    }

    const txnId = `txn_${crypto.randomBytes(6).toString('hex')}`;
    await query(`
      INSERT INTO ledger_transactions (id, wallet_id, amount, txn_type, status, description, created_at)
      VALUES ($1, $2, $3, $4, 'completed', $5, NOW())
    `, [
      txnId,
      walletId,
      Math.abs(adjustNum),
      adjustNum >= 0 ? 'deposit' : 'withdrawal',
      description || `Admin manual balance adjustment by ${req.user.userId}`
    ]);

    const updatedWallet = await query(`SELECT * FROM user_wallets WHERE user_id = $1`, [id]);
    return res.json({ 
      success: true, 
      wallet: updatedWallet.rows[0],
      newBalance: parseFloat(updatedWallet.rows[0].available_balance),
      transactionId: txnId
    });
  } catch (error) {
    console.error('Admin adjust balance error:', error);
    return res.status(500).json({ error: error.message || 'Failed to adjust balance' });
  }
});

router.delete('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }

    await query(`DELETE FROM auth_sessions WHERE user_id = $1`, [id]);
    await query(`DELETE FROM user_wallets WHERE user_id = $1`, [id]);
    const deleteRes = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, message: `User ${id} removed.` });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

// ==========================================
// 9. ESCROW & DISPUTES RESOLUTION
// ==========================================
router.get('/escrows', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        e.*,
        c.status AS contract_status,
        b.full_name AS brand_name,
        b.email AS brand_email,
        cr.full_name AS creator_name,
        cr.email AS creator_email,
        camp.title AS campaign_title
      FROM escrow_holdings e
      JOIN contracts c ON c.id = e.contract_id
      LEFT JOIN campaigns camp ON camp.id = c.campaign_id
      JOIN users b ON b.id = e.brand_id
      JOIN users cr ON cr.id = e.creator_id
      ORDER BY e.created_at DESC
    `);
    return res.json({ escrows: result.rows });
  } catch (error) {
    console.error('Admin get escrows error:', error);
    return res.status(500).json({ error: 'Failed to fetch escrows' });
  }
});

router.post('/escrows/:id/release', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const escrowRes = await query(`SELECT * FROM escrow_holdings WHERE id = $1`, [id]);
    if (escrowRes.rows.length === 0) {
      return res.status(404).json({ error: 'Escrow holding not found' });
    }

    const escrow = escrowRes.rows[0];
    const amountNum = parseFloat(escrow.amount);

    await query(`
      UPDATE user_wallets SET
        available_balance = available_balance + $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [amountNum, escrow.creator_id]);

    await query(`
      UPDATE escrow_holdings SET
        status = 'released'
      WHERE id = $1
    `, [id]);

    await query(`
      UPDATE contracts SET
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `, [escrow.contract_id]);

    return res.json({ success: true, message: `Escrow ${id} fully released to creator wallet.` });
  } catch (error) {
    console.error('Admin release escrow error:', error);
    return res.status(500).json({ error: error.message || 'Failed to release escrow' });
  }
});

router.post('/escrows/:id/refund', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const escrowRes = await query(`SELECT * FROM escrow_holdings WHERE id = $1`, [id]);
    if (escrowRes.rows.length === 0) {
      return res.status(404).json({ error: 'Escrow holding not found' });
    }

    const escrow = escrowRes.rows[0];
    const amountNum = parseFloat(escrow.amount);

    await query(`
      UPDATE user_wallets SET
        available_balance = available_balance + $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [amountNum, escrow.brand_id]);

    await query(`
      UPDATE escrow_holdings SET
        status = 'refunded'
      WHERE id = $1
    `, [id]);

    await query(`
      UPDATE contracts SET
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = $1
    `, [escrow.contract_id]);

    return res.json({ success: true, message: `Escrow ${id} refunded to brand wallet.` });
  } catch (error) {
    console.error('Admin refund escrow error:', error);
    return res.status(500).json({ error: error.message || 'Failed to refund escrow' });
  }
});

// ==========================================
// 10. PROOF SUBMISSIONS MANAGEMENT
// ==========================================
router.get('/proofs', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        ps.*,
        c.title AS campaign_title,
        cr.full_name AS creator_name,
        cr.email AS creator_email,
        b.full_name AS brand_name
      FROM campaign_proof_submissions ps
      JOIN campaigns c ON c.id = ps.campaign_id
      JOIN users cr ON cr.id = ps.creator_id
      JOIN users b ON b.id = c.brand_id
      ORDER BY ps.submitted_at DESC
    `);
    return res.json({ proofs: result.rows });
  } catch (error) {
    console.error('Admin get proofs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve proof submissions' });
  }
});

router.patch('/proofs/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, brand_feedback } = req.body;

    const result = await query(`
      UPDATE campaign_proof_submissions SET
        status = $1,
        brand_feedback = COALESCE($2, brand_feedback),
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, brand_feedback || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proof submission not found' });
    }

    return res.json({ success: true, proof: result.rows[0] });
  } catch (error) {
    console.error('Admin update proof error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update proof submission' });
  }
});

router.delete('/proofs/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM campaign_proof_submissions WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proof submission not found' });
    }
    return res.json({ success: true, message: `Proof submission ${id} deleted.` });
  } catch (error) {
    console.error('Admin delete proof error:', error);
    return res.status(500).json({ error: 'Failed to delete proof submission' });
  }
});

export default router;
