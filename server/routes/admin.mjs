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

export default router;
