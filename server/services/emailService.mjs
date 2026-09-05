import { Resend } from 'resend';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { broadcastEvent } from '../lib/socket.mjs';

let resendClient = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend Warning] RESEND_API_KEY is not configured in environment variables.');
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function getSenderEmail() {
  return process.env.RESEND_FROM_EMAIL || 'Crevio <onboarding@resend.dev>';
}

export function getAdminEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.CLERK_ADMIN_EMAILS || 'crevio.admin@gmail.com';
}

// Ensure database table for logging emails
export async function ensureEmailLogsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(64) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        subject VARCHAR(500) NOT NULL,
        template_name VARCHAR(100) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'sent',
        resend_id VARCHAR(128),
        error_message TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_name);
      CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
    `);
  } catch (err) {
    console.warn('[EmailService] Table initialization check notice:', err?.message || err);
  }
}

// Auto-run schema check
ensureEmailLogsTable();

// -------------------------------------------------------------
// HTML Email Templates (Branded, Responsive, Dark-Violet Modern)
// -------------------------------------------------------------

function renderBaseLayout({ title, preheader, contentHtml, ctaUrl, ctaText, badgeText }) {
  const appUrl = process.env.FRONTEND_URL || 'https://crevio.co.in';
  const actionButton = ctaUrl && ctaText ? `
    <div style="margin: 32px 0 24px; text-align: center;">
      <a href="${ctaUrl.startsWith('http') ? ctaUrl : appUrl + ctaUrl}" 
         style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; padding: 14px 28px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35); letter-spacing: 0.3px;">
        ${ctaText} &rarr;
      </a>
    </div>
  ` : '';

  const badgeHtml = badgeText ? `
    <span style="display: inline-block; padding: 4px 12px; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 9999px; margin-bottom: 12px;">
      ${badgeText}
    </span>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Crevio Notification'}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background-color: #13151f; border: 1px solid #232738; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header-bar { height: 4px; background: linear-gradient(90deg, #8b5cf6, #ec4899, #6366f1); width: 100%; }
    .body-content { padding: 36px 28px; }
    .meta-box { background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .footer { text-align: center; padding: 28px 16px; color: #64748b; font-size: 12px; line-height: 1.5; }
    .footer a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">${preheader}</div>` : ''}
  
  <div class="container" style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
    <!-- Logo & Brand Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
          CREV<span style="color: #a855f7;">IO</span>
        </span>
      </div>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Autonomous Contract & Creator Execution</p>
    </div>

    <!-- Main Container Card -->
    <div class="card" style="background-color: #13151f; border: 1px solid #232738; border-radius: 16px; overflow: hidden;">
      <div class="header-bar" style="height: 4px; background: linear-gradient(90deg, #8b5cf6, #ec4899, #6366f1); width: 100%;"></div>
      
      <div class="body-content" style="padding: 32px 28px; color: #e2e8f0;">
        ${badgeHtml}
        
        <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
          ${title}
        </h1>
        
        <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          ${contentHtml}
        </div>

        ${actionButton}
      </div>
    </div>

    <!-- Security & Footer -->
    <div class="footer" style="text-align: center; padding: 28px 16px; color: #64748b; font-size: 12px; line-height: 1.6;">
      <p style="margin: 0 0 8px;">
        This is an autonomous transactional security notification from <strong>Crevio Platform</strong>.
      </p>
      <p style="margin: 0;">
        <a href="${appUrl}" style="color: #a855f7; text-decoration: none;">Platform Portal</a> &bull; 
        <a href="${appUrl}/dashboard" style="color: #a855f7; text-decoration: none;">Command Center</a> &bull; 
        <a href="${appUrl}/contracts" style="color: #a855f7; text-decoration: none;">Escrow Contracts</a>
      </p>
      <p style="margin: 12px 0 0; font-size: 11px; color: #475569;">
        &copy; ${new Date().getFullYear()} Crevio Inc. Autonomous Contract Execution & Monitoring System.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 1. Welcome Onboarding Email Template
export function tplWelcomeUser({ name, role, email }) {
  const isBrand = role === 'brand';
  const roleTitle = isBrand ? 'Brand Partner' : 'Creator / Influencer';
  
  const contentHtml = `
    <p>Hi <strong>${name || 'Creator'}</strong>,</p>
    <p>Welcome to <strong>Crevio</strong>! Your profile is verified as a <strong>${roleTitle}</strong>.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px; color: #f8fafc; font-size: 14px;">⚡ What you can do next:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.8;">
        ${isBrand ? `
          <li>Launch your first autonomous influencer campaign.</li>
          <li>Set precision AI match filters and target deliverables.</li>
          <li>Lock campaign budgets securely into Razorpay smart escrow.</li>
        ` : `
          <li>Connect your verified Instagram Graph API metrics.</li>
          <li>Explore curated brand campaigns matching your audience niche.</li>
          <li>Submit proposals and get paid autonomously with smart escrow.</li>
        `}
      </ul>
    </div>
    <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;">
      Need assistance? Reply directly to this notification or reach out to our team at any time.
    </p>
  `;

  return {
    subject: `Welcome to Crevio, ${name || 'Creator'}! 🚀`,
    html: renderBaseLayout({
      title: `Welcome to Crevio! 🎉`,
      preheader: `Your account is ready as a ${roleTitle}. Start exploring campaigns and smart escrow.`,
      badgeText: 'Account Activated',
      contentHtml,
      ctaUrl: isBrand ? '/campaigns/create' : '/campaigns',
      ctaText: isBrand ? 'Create Your First Campaign' : 'Browse Available Campaigns',
    }),
  };
}

// 2. Campaign Created Confirmation Template
export function tplCampaignCreated({ campaignTitle, budget, brandName, campaignId, platform }) {
  const contentHtml = `
    <p>Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p>Your new campaign <strong>"${campaignTitle}"</strong> has been created and published on the Crevio platform.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">Campaign ID:</td>
          <td style="color: #f8fafc; font-family: monospace; font-weight: 600; text-align: right;">${campaignId}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">Allocated Budget:</td>
          <td style="color: #34d399; font-weight: 700; text-align: right;">₹${Number(budget || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">Target Platform:</td>
          <td style="color: #a78bfa; font-weight: 600; text-align: right;">${platform || 'Instagram'}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">Match Engine:</td>
          <td style="color: #38bdf8; font-weight: 600; text-align: right;">Active & Scoring Creators</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      Crevio's autonomous matching engine is notifying relevant high-fit creators. You will receive email alerts as applications arrive.
    </p>
  `;

  return {
    subject: `Campaign Created: "${campaignTitle}" 📣`,
    html: renderBaseLayout({
      title: 'Campaign Published Successfully 🚀',
      preheader: `Your campaign "${campaignTitle}" is now live with budget ₹${Number(budget || 0).toLocaleString('en-IN')}`,
      badgeText: 'Campaign Live',
      contentHtml,
      ctaUrl: `/campaigns/${campaignId}`,
      ctaText: 'View Campaign Dashboard',
    }),
  };
}

// 3. Application Submitted Template (To Brand)
export function tplApplicationSubmitted({ brandName, creatorName, campaignTitle, fitScore, proposedFee, campaignId, applicationId }) {
  const contentHtml = `
    <p>Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p>A creator has submitted an application for your campaign <strong>"${campaignTitle}"</strong>.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">Creator:</td>
          <td style="color: #f8fafc; font-weight: 700; text-align: right;">${creatorName || 'Verified Creator'}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">AI Fit Score:</td>
          <td style="color: #38bdf8; font-weight: 800; font-size: 15px; text-align: right;">${Number(fitScore || 0).toFixed(1)} / 100</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 6px 0;">Proposed Fee:</td>
          <td style="color: #34d399; font-weight: 700; text-align: right;">₹${Number(proposedFee || 0).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      Review their pitch, audience analytics, and proposed deliverables to initiate a smart escrow contract.
    </p>
  `;

  return {
    subject: `New Application from ${creatorName || 'Creator'} for "${campaignTitle}" 📥`,
    html: renderBaseLayout({
      title: 'New Creator Application Received 📬',
      preheader: `${creatorName} applied to ${campaignTitle} with AI Fit Score ${Number(fitScore || 0).toFixed(1)}/100`,
      badgeText: 'Application Received',
      contentHtml,
      ctaUrl: `/applications/${applicationId || ''}`,
      ctaText: 'Review Creator Application',
    }),
  };
}

// 4. Contract Signed Template
export function tplContractSigned({ recipientName, otherPartyName, contractId, campaignTitle, role }) {
  const isBrand = role === 'brand';
  const contentHtml = `
    <p>Hi <strong>${recipientName || 'Partner'}</strong>,</p>
    <p>The contract for <strong>"${campaignTitle || 'Deliverables Execution'}"</strong> has been digitally e-signed by <strong>${otherPartyName}</strong>.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-family: monospace; font-size: 12px; color: #a78bfa; margin-bottom: 8px;">
        CONTRACT ID: #${contractId}
      </div>
      <p style="margin: 0; color: #e2e8f0; font-size: 13px;">
        ${isBrand 
          ? 'The creator has signed the terms. You can now lock the escrow collateral to begin execution.'
          : 'Your digital signature was recorded on-chain. The brand will secure the escrow collateral.'}
      </p>
    </div>
  `;

  return {
    subject: `Contract E-Signed: #${contractId} ✍️`,
    html: renderBaseLayout({
      title: 'Contract Digitally E-Signed 📄',
      preheader: `Contract #${contractId} has been signed. Check status in Crevio.`,
      badgeText: 'Contract Signed',
      contentHtml,
      ctaUrl: `/contracts/${contractId}`,
      ctaText: 'View Contract Details',
    }),
  };
}

// 5. Escrow Funded & Locked Template
export function tplEscrowFunded({ brandName, creatorName, amount, contractId, paymentId, isCreatorRecipient }) {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const contentHtml = isCreatorRecipient ? `
    <p>Hi <strong>${creatorName || 'Creator'}</strong>,</p>
    <p>Great news! The brand <strong>${brandName || 'Partner'}</strong> has fully funded and locked <strong>${formattedAmount}</strong> into secure Crevio smart escrow for Contract <strong>#${contractId}</strong>.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #94a3b8; font-size: 12px;">Escrow Collateral:</span>
        <strong style="color: #34d399; font-size: 16px;">${formattedAmount} (LOCKED)</strong>
      </div>
      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 12px;">
        Your funds are safely held in escrow and will be automatically disbursed upon proof verification.
      </p>
    </div>
  ` : `
    <p>Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p>Your payment of <strong>${formattedAmount}</strong> has been verified via Razorpay and locked into Escrow for Contract <strong>#${contractId}</strong>.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #94a3b8; padding: 4px 0;">Payment Reference:</td>
          <td style="color: #f8fafc; font-family: monospace; text-align: right;">${paymentId || 'RZP-ESCROW'}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 4px 0;">Creator Beneficiary:</td>
          <td style="color: #a78bfa; font-weight: 600; text-align: right;">${creatorName || 'Assigned Creator'}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; padding: 4px 0;">Escrow State:</td>
          <td style="color: #34d399; font-weight: 700; text-align: right;">HELD & PROTECTED</td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: `Escrow Secured: ${formattedAmount} Locked for Contract #${contractId} 🔒`,
    html: renderBaseLayout({
      title: 'Escrow Payment Secured 🛡️',
      preheader: `${formattedAmount} has been locked into escrow for Contract #${contractId}`,
      badgeText: 'Escrow Locked',
      contentHtml,
      ctaUrl: `/contracts/${contractId}`,
      ctaText: 'View Escrow Vault',
    }),
  };
}

// 6. Deliverables & Proof Submitted Template
export function tplProofSubmitted({ brandName, creatorName, campaignTitle, liveLinks, impressions, reach, contractId, campaignId }) {
  const contentHtml = `
    <p>Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p>Creator <strong>${creatorName || 'Partner'}</strong> has uploaded their live deliverable proofs and performance insights for <strong>"${campaignTitle}"</strong>.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px; color: #f8fafc; font-size: 13px;">📊 Submitted Insights & Telemetry:</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${reach ? `<tr><td style="color: #94a3b8; padding: 4px 0;">Reach:</td><td style="color: #38bdf8; font-weight: 600; text-align: right;">${reach}</td></tr>` : ''}
        ${impressions ? `<tr><td style="color: #94a3b8; padding: 4px 0;">Impressions:</td><td style="color: #818cf8; font-weight: 600; text-align: right;">${impressions}</td></tr>` : ''}
        <tr>
          <td style="color: #94a3b8; padding: 4px 0;">Live URLs:</td>
          <td style="color: #34d399; font-weight: 600; text-align: right;">${Array.isArray(liveLinks) ? liveLinks.length : 1} links submitted</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      Review the submitted proofs on your dashboard. Once approved, escrow funds will disburse automatically.
    </p>
  `;

  return {
    subject: `Deliverable Proofs Uploaded by ${creatorName || 'Creator'} for "${campaignTitle}" 📸`,
    html: renderBaseLayout({
      title: 'Deliverable Proofs Ready for Review 📸',
      preheader: `${creatorName} submitted live post links & dashboard analytics for review.`,
      badgeText: 'Proofs Submitted',
      contentHtml,
      ctaUrl: contractId ? `/contracts/${contractId}` : `/campaigns/${campaignId}`,
      ctaText: 'Review Deliverable Proofs',
    }),
  };
}

// 7. Escrow Released Payout Template (To Creator)
export function tplEscrowReleased({ creatorName, amount, contractId, campaignTitle }) {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const contentHtml = `
    <p>Hi <strong>${creatorName || 'Creator'}</strong>,</p>
    <p>Congratulations! Your campaign deliverables for <strong>"${campaignTitle || 'Contract Milestone'}"</strong> have been successfully verified and approved.</p>
    
    <div class="meta-box" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
      <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Disbursed Amount</div>
      <div style="font-size: 28px; font-weight: 900; color: #34d399; margin: 6px 0;">${formattedAmount}</div>
      <div style="font-size: 12px; color: #a78bfa; font-family: monospace;">CREDITED TO CREVIO WALLET</div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      The escrow funds have been released to your wallet. You can view your balance or request a withdrawal in the Wallet Hub.
    </p>
  `;

  return {
    subject: `Payment Released: ${formattedAmount} Credited to Your Wallet! 💰`,
    html: renderBaseLayout({
      title: 'Milestone Approved & Payout Released 🎉',
      preheader: `${formattedAmount} has been released from escrow to your Crevio wallet.`,
      badgeText: 'Payment Released',
      contentHtml,
      ctaUrl: '/wallet',
      ctaText: 'Open Wallet Hub',
    }),
  };
}

// 8. Custom Admin Broadcast & Test Template
export function tplCustomBroadcast({ title, message, actionUrl, actionText, badgeText }) {
  return {
    subject: title || 'Crevio Platform Notification',
    html: renderBaseLayout({
      title: title || 'Platform Announcement',
      preheader: message ? message.substring(0, 100) : 'Important update from Crevio Platform',
      badgeText: badgeText || 'Announcement',
      contentHtml: `<p>${message || 'No additional details provided.'}</p>`,
      ctaUrl: actionUrl || '/dashboard',
      ctaText: actionText || 'Open Crevio Platform',
    }),
  };
}

// -------------------------------------------------------------
// Core Sending Engine
// -------------------------------------------------------------

export async function sendAutonomousEmail({
  to,
  toName,
  subject,
  templateName,
  templateData = {},
  html,
  metadata = {}
}) {
  const logId = createId('emlog');
  const recipientEmail = String(to || '').trim();
  const recipientName = String(toName || '').trim();

  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn(`[EmailService] Invalid recipient email: "${recipientEmail}"`);
    return { success: false, error: 'Invalid recipient email address' };
  }

  // Resolve HTML content from template generator if not explicitly passed
  let finalHtml = html;
  let finalSubject = subject;

  if (!finalHtml) {
    let tplResult = null;
    switch (templateName) {
      case 'welcome_user':
        tplResult = tplWelcomeUser(templateData);
        break;
      case 'campaign_created':
        tplResult = tplCampaignCreated(templateData);
        break;
      case 'application_submitted':
        tplResult = tplApplicationSubmitted(templateData);
        break;
      case 'contract_signed':
        tplResult = tplContractSigned(templateData);
        break;
      case 'escrow_funded':
        tplResult = tplEscrowFunded(templateData);
        break;
      case 'proof_submitted':
        tplResult = tplProofSubmitted(templateData);
        break;
      case 'escrow_released':
        tplResult = tplEscrowReleased(templateData);
        break;
      case 'custom_broadcast':
      case 'test_email':
      default:
        tplResult = tplCustomBroadcast(templateData);
        break;
    }

    if (tplResult) {
      finalHtml = tplResult.html;
      if (!finalSubject) finalSubject = tplResult.subject;
    }
  }

  const resend = getResendClient();
  const fromEmail = getSenderEmail();

  let resendId = null;
  let status = 'sent';
  let errorMessage = null;

  try {
    if (!resend) {
      status = 'simulated';
      console.log(`[EmailService SIMULATED] Would send "${finalSubject}" to ${recipientEmail}`);
    } else {
      console.log(`[EmailService] Dispatching email via Resend to ${recipientEmail} (${templateName || 'custom'})...`);
      
      const response = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject: finalSubject,
        html: finalHtml,
      });

      if (response.error) {
        throw new Error(response.error.message || JSON.stringify(response.error));
      }

      resendId = response.data?.id || null;
      console.log(`[EmailService] ✅ Successfully dispatched email via Resend! ID: ${resendId}`);
    }
  } catch (error) {
    status = 'failed';
    errorMessage = error?.message || String(error);
    console.error(`[EmailService ❌ ERROR] Failed to send email to ${recipientEmail}:`, errorMessage);
  }

  // Persist log to database
  try {
    await query(`
      INSERT INTO email_logs (id, recipient_email, recipient_name, subject, template_name, status, resend_id, error_message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    `, [
      logId,
      recipientEmail,
      recipientName || null,
      finalSubject || 'Crevio Notification',
      templateName || 'custom',
      status,
      resendId,
      errorMessage,
      JSON.stringify({ ...metadata, ...templateData })
    ]);
  } catch (dbErr) {
    console.error('[EmailService] Failed to insert email log into database:', dbErr?.message || dbErr);
  }

  // Broadcast real-time event to Admin Console
  try {
    broadcastEvent('admin:email_dispatched', {
      id: logId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject: finalSubject,
      template_name: templateName,
      status,
      resend_id: resendId,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (sockErr) {
    // ignore socket broadcast err
  }

  return {
    success: status === 'sent' || status === 'simulated',
    id: logId,
    resendId,
    status,
    error: errorMessage,
  };
}

// -------------------------------------------------------------
// Helper Wrappers for Application Lifecycle Triggers
// -------------------------------------------------------------

export async function sendWelcomeEmail({ userEmail, userName, role }) {
  return sendAutonomousEmail({
    to: userEmail,
    toName: userName,
    templateName: 'welcome_user',
    templateData: { name: userName, role, email: userEmail },
  });
}

export async function sendCampaignCreatedEmail({ brandEmail, brandName, campaignTitle, budget, campaignId, platform }) {
  return sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'campaign_created',
    templateData: { brandName, campaignTitle, budget, campaignId, platform },
  });
}

export async function sendApplicationSubmittedEmail({ brandEmail, brandName, creatorName, campaignTitle, fitScore, proposedFee, campaignId, applicationId }) {
  return sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'application_submitted',
    templateData: { brandName, creatorName, campaignTitle, fitScore, proposedFee, campaignId, applicationId },
  });
}

export async function sendContractSignedEmail({ recipientEmail, recipientName, otherPartyName, contractId, campaignTitle, role }) {
  return sendAutonomousEmail({
    to: recipientEmail,
    toName: recipientName,
    templateName: 'contract_signed',
    templateData: { recipientName, otherPartyName, contractId, campaignTitle, role },
  });
}

export async function sendEscrowFundedEmail({ brandEmail, brandName, creatorEmail, creatorName, amount, contractId, paymentId }) {
  const promises = [];
  if (brandEmail) {
    promises.push(sendAutonomousEmail({
      to: brandEmail,
      toName: brandName,
      templateName: 'escrow_funded',
      templateData: { brandName, creatorName, amount, contractId, paymentId, isCreatorRecipient: false },
    }));
  }
  if (creatorEmail) {
    promises.push(sendAutonomousEmail({
      to: creatorEmail,
      toName: creatorName,
      templateName: 'escrow_funded',
      templateData: { brandName, creatorName, amount, contractId, paymentId, isCreatorRecipient: true },
    }));
  }
  return Promise.all(promises);
}

export async function sendProofSubmittedEmail({ brandEmail, brandName, creatorName, campaignTitle, liveLinks, impressions, reach, contractId, campaignId }) {
  return sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'proof_submitted',
    templateData: { brandName, creatorName, campaignTitle, liveLinks, impressions, reach, contractId, campaignId },
  });
}

export async function sendEscrowReleasedEmail({ creatorEmail, creatorName, amount, contractId, campaignTitle }) {
  return sendAutonomousEmail({
    to: creatorEmail,
    toName: creatorName,
    templateName: 'escrow_released',
    templateData: { creatorName, amount, contractId, campaignTitle },
  });
}
