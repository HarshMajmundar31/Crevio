import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';
import { 
  getResendClient, 
  getSenderEmail, 
  getAdminEmail, 
  sendAutonomousEmail,
  tplWelcomeUser,
  tplCampaignCreated,
  tplApplicationSubmitted,
  tplContractSigned,
  tplEscrowFunded,
  tplProofSubmitted,
  tplEscrowReleased,
  tplCustomBroadcast,
  tplDisputeAlert,
  tplSecurityAlert
} from '../services/emailService.mjs';

const router = Router();

// 1. Overview Telemetry & Resend Gateway Status
router.get('/overview', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const resend = getResendClient();
    const apiKey = process.env.RESEND_API_KEY || '';
    const maskedKey = apiKey ? `${apiKey.substring(0, 7)}••••••••${apiKey.substring(apiKey.length - 4)}` : 'Not Configured';

    // Metrics aggregates from DB
    const metricsRes = await query(`
      SELECT 
        COUNT(*) as total_all,
        COUNT(*) FILTER (WHERE status = 'sent') as total_sent,
        COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
        COUNT(*) FILTER (WHERE status = 'simulated') as total_simulated,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as sent_last_24h
      FROM email_logs
    `);
    const metrics = metricsRes.rows[0] || { total_all: 0, total_sent: 0, total_failed: 0, total_simulated: 0, sent_last_24h: 0 };

    const totalAll = parseInt(metrics.total_all, 10) || 0;
    const totalSent = parseInt(metrics.total_sent, 10) || 0;
    const successRate = totalAll > 0 ? ((totalSent / totalAll) * 100).toFixed(1) : '100.0';

    // Templates breakdown
    const tplRes = await query(`
      SELECT template_name, COUNT(*) as count
      FROM email_logs
      GROUP BY template_name
      ORDER BY count DESC
    `);

    // Recent 10 logs
    const logsRes = await query(`
      SELECT *
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return res.json({
      gateway: {
        isConfigured: Boolean(apiKey),
        status: apiKey ? 'connected' : 'disconnected',
        provider: 'Resend Email API (Official Node SDK)',
        maskedKey,
        senderEmail: getSenderEmail(),
        adminEmail: getAdminEmail(),
        environment: apiKey.startsWith('re_') ? 'Live Production / Developer Sandbox' : 'Simulated Fallback',
      },
      metrics: {
        totalAll,
        totalSent,
        totalFailed: parseInt(metrics.total_failed, 10) || 0,
        totalSimulated: parseInt(metrics.total_simulated, 10) || 0,
        sentLast24h: parseInt(metrics.sent_last_24h, 10) || 0,
        successRate: `${successRate}%`,
      },
      templatesDistribution: tplRes.rows,
      recentLogs: logsRes.rows,
    });
  } catch (error) {
    console.error('Email overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch email overview telemetry' });
  }
});

// 2. Paginated Dispatch History & Search
router.get('/logs', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = page * limit;
    const statusFilter = req.query.status || 'all';
    const templateFilter = req.query.template || 'all';
    const search = req.query.search ? String(req.query.search).trim() : '';

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (statusFilter !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(statusFilter);
    }

    if (templateFilter !== 'all') {
      conditions.push(`template_name = $${paramIndex++}`);
      params.push(templateFilter);
    }

    if (search) {
      conditions.push(`(
        recipient_email ILIKE $${paramIndex} 
        OR recipient_name ILIKE $${paramIndex} 
        OR subject ILIKE $${paramIndex}
        OR resend_id ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM email_logs ${whereClause}`, params);
    const totalCount = parseInt(countRes.rows[0]?.total || 0, 10);

    const logsRes = await query(`
      SELECT *
      FROM email_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    return res.json({
      logs: logsRes.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Email logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// 3. Send Instant Live Test Email
router.post('/send-test', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { to, templateName = 'welcome_user', templateData = {}, customSubject, customMessage } = req.body || {};
    const recipient = to ? String(to).trim() : getAdminEmail();

    let result;
    if (customMessage) {
      result = await sendAutonomousEmail({
        to: recipient,
        toName: 'Crevio Admin Test Recipient',
        subject: customSubject || '🧪 Crevio Live Test Email',
        templateName: 'custom_broadcast',
        templateData: {
          title: customSubject || 'Crevio Resend Engine Test',
          message: customMessage,
          badgeText: 'Live Resend Test',
        },
      });
    } else {
      result = await sendAutonomousEmail({
        to: recipient,
        toName: 'Crevio Tester',
        templateName: templateName,
        templateData: {
          name: 'Sarah Creator',
          role: 'creator',
          email: recipient,
          campaignTitle: 'Summer Fit & Flow 2026',
          budget: 75000,
          brandName: 'Apex Sportswear',
          campaignId: 'camp_demo_test',
          platform: 'Instagram Reels',
          creatorName: 'Sarah Jenkins',
          fitScore: 94.2,
          proposedFee: 65000,
          applicationId: 'app_demo_test',
          recipientName: 'Sarah Jenkins',
          otherPartyName: 'Apex Sportswear',
          contractId: 'cnt_demo_882',
          amount: 65000,
          paymentId: 'pay_test_9921',
          liveLinks: ['https://instagram.com/p/demo1', 'https://instagram.com/reel/demo2'],
          impressions: '124,500',
          reach: '98,200',
          ...templateData,
        },
      });
    }

    return res.json({
      success: result.success,
      status: result.status,
      logId: result.id,
      resendId: result.resendId,
      recipient,
      error: result.error,
    });
  } catch (error) {
    console.error('Send test email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
});

// 4. Send Targeted Broadcast Email
router.post('/broadcast', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { targetAudience = 'all', subject, message, actionUrl, actionText } = req.body || {};

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required for broadcast' });
    }

    let usersQuery = 'SELECT id, full_name, email, role FROM users WHERE is_active = TRUE AND email IS NOT NULL';
    const params = [];

    if (targetAudience === 'creators') {
      usersQuery += ' AND role = $1';
      params.push('creator');
    } else if (targetAudience === 'brands') {
      usersQuery += ' AND role = $1';
      params.push('brand');
    } else if (targetAudience === 'admin') {
      usersQuery += ' AND role = $1';
      params.push('admin');
    }

    const usersRes = await query(usersQuery, params);
    const users = usersRes.rows;

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        const res = await sendAutonomousEmail({
          to: user.email,
          toName: user.full_name,
          subject,
          templateName: 'custom_broadcast',
          templateData: {
            title: subject,
            message,
            actionUrl,
            actionText,
            badgeText: 'Platform Broadcast',
          },
          metadata: { broadcastTarget: targetAudience, senderId: req.user.userId },
        });

        if (res.success) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    return res.json({
      success: true,
      totalRecipients: users.length,
      successCount,
      failCount,
      targetAudience,
    });
  } catch (error) {
    console.error('Broadcast email error:', error);
    return res.status(500).json({ error: 'Failed to send broadcast emails' });
  }
});

// 5. Template Catalog & Previews
router.get('/templates', requireAuth, requireRole('admin'), async (req, res) => {
  const sampleData = {
    name: 'Sarah Jenkins',
    role: 'creator',
    email: 'sarah@example.com',
    campaignTitle: 'Summer Fit & Flow 2026',
    budget: 75000,
    brandName: 'Apex Sportswear',
    campaignId: 'camp_9921',
    platform: 'Instagram Reels',
    creatorName: 'Sarah Jenkins',
    fitScore: 94.2,
    proposedFee: 65000,
    applicationId: 'app_3312',
    recipientName: 'Sarah Jenkins',
    otherPartyName: 'Apex Sportswear',
    contractId: 'cnt_8821',
    amount: 65000,
    paymentId: 'pay_test_7718',
    liveLinks: ['https://instagram.com/p/demo1', 'https://instagram.com/reel/demo2'],
    impressions: '142,000',
    reach: '110,400',
  };

  const templates = [
    {
      id: 'welcome_user',
      name: 'Welcome & Account Activation',
      trigger: 'When a new Creator or Brand completes onboarding profile',
      description: 'Congratulates user on verification, summarizes role capabilities, and gives getting started actions.',
      previewHtml: tplWelcomeUser(sampleData).html,
    },
    {
      id: 'campaign_created',
      name: 'Campaign Created Confirmation',
      trigger: 'When a brand publishes a new campaign',
      description: 'Confirms live campaign publication, budget allocation, target platform, and AI matching activation.',
      previewHtml: tplCampaignCreated(sampleData).html,
    },
    {
      id: 'application_submitted',
      name: 'Creator Application Received',
      trigger: 'When a creator submits an application to a campaign',
      description: 'Notifies brand of incoming proposal with AI Fit Score (0-100), proposed deliverables, and review link.',
      previewHtml: tplApplicationSubmitted(sampleData).html,
    },
    {
      id: 'contract_signed',
      name: 'Contract Digitally E-Signed',
      trigger: 'When creator or brand digitally executes an agreement',
      description: 'Alerts counter-party that terms are signed and prompts next escrow funding step.',
      previewHtml: tplContractSigned(sampleData).html,
    },
    {
      id: 'escrow_funded',
      name: 'Escrow Payment Locked',
      trigger: 'When brand deposits funds via Razorpay Checkout',
      description: 'Provides payment receipt to brand and assures creator that collateral is secured in smart escrow.',
      previewHtml: tplEscrowFunded(sampleData).html,
    },
    {
      id: 'proof_submitted',
      name: 'Deliverables Proof Uploaded',
      trigger: 'When creator uploads live post URLs and insights screenshot',
      description: 'Sends brand a digest of live links, impressions, reach, and review button.',
      previewHtml: tplProofSubmitted(sampleData).html,
    },
    {
      id: 'escrow_released',
      name: 'Milestone Disbursed & Payout',
      trigger: 'When deliverables are verified and escrow executes payout',
      description: 'Celebrates completed milestone and notifies creator that funds are deposited into their wallet.',
      previewHtml: tplEscrowReleased(sampleData).html,
    },
    {
      id: 'custom_broadcast',
      name: 'Platform Broadcast & Announcement',
      trigger: 'On-demand Admin broadcast',
      description: 'Custom rich announcement dispatched to all or selected users.',
      previewHtml: tplCustomBroadcast({ title: 'Platform System Update', message: 'Crevio introduces autonomous Resend mail and live telemetry.' }).html,
    },
    {
      id: 'dispute_alert',
      name: 'Dispute & Arbitration Notice',
      trigger: 'When a brand or creator opens a dispute on an escrow milestone',
      description: 'Alerts counterparty that funds are held in secure arbitration with case details and resolution actions.',
      previewHtml: tplDisputeAlert({ disputeId: 'disp_9021', contractId: 'cnt_8821', raisedBy: 'Apex Sportswear', reason: 'Deliverable revisions requested.', amount: 65000 }).html,
    },
    {
      id: 'security_alert',
      name: 'Security & New Device Login',
      trigger: 'When an account login is detected from a new IP or device',
      description: 'Provides timestamp, device details, IP address, and immediate security action links.',
      previewHtml: tplSecurityAlert({ userName: 'Sarah Jenkins', ipAddress: '103.21.144.12', location: 'Bengaluru, India', device: 'Chrome on macOS (Sonoma)', timestamp: new Date().toLocaleString('en-IN') }).html,
    },
  ];

  return res.json({ templates });
});

export default router;
