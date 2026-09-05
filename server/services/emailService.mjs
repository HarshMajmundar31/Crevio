import { Resend } from 'resend';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { broadcastEvent } from '../lib/socket.mjs';

let resendClient = null;

const DEFAULT_FROM_EMAIL = 'Crevio <notifications@crevio.co.in>';
const DEFAULT_ADMIN_EMAIL = 'crevio.admin@gmail.com';

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
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

export function getAdminEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.CLERK_ADMIN_EMAILS || DEFAULT_ADMIN_EMAIL;
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
// Plain-text Fallback Generator (Crucial for Spam Filter Scores)
// -------------------------------------------------------------
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// -------------------------------------------------------------
// HTML Email Base Layout (Table-Based Bulletproof Responsive Architecture)
// -------------------------------------------------------------
function renderBaseLayout({ title, preheader, contentHtml, ctaUrl, ctaText, badgeText, badgeColor = '#a855f7' }) {
  const appUrl = process.env.FRONTEND_URL || 'https://crevio.co.in';
  const fullCtaUrl = ctaUrl ? (ctaUrl.startsWith('http') ? ctaUrl : appUrl + ctaUrl) : '';

  const actionButton = fullCtaUrl && ctaText ? `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px; width: 100%;">
      <tr>
        <td align="center">
          <a href="${fullCtaUrl}" 
             target="_blank"
             style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); background-color: #7c3aed; color: #ffffff; padding: 14px 32px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); letter-spacing: 0.3px; border: 1px solid #9061f9;">
            ${ctaText} &rarr;
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  const badgeHtml = badgeText ? `
    <div style="margin-bottom: 16px;">
      <span style="display: inline-block; padding: 5px 14px; background-color: rgba(124, 58, 237, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); color: #c4b5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; border-radius: 20px;">
        ${badgeText}
      </span>
    </div>
  ` : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${title || 'Crevio Platform Notification'}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .content-padding { padding: 24px 18px !important; }
      .headline { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; color: #0b0c10; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader || title} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10;">
    <tr>
      <td align="center" style="padding: 32px 12px 48px;">
        
        <!-- Main Email Container (600px Max) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom: 4px;">
                      <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase;">
                        CREV<span style="color: #a855f7; text-shadow: 0 0 20px rgba(168, 85, 247, 0.4);">IO</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1.6px; font-weight: 700; display: block;">
                        Autonomous Contract & Creator Execution
                      </span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Main Card Box -->
          <tr>
            <td style="background-color: #13151f; border: 1px solid #232738; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);">
              
              <!-- Gradient Top Accent Bar -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td height="4" style="height: 4px; background: linear-gradient(90deg, #8b5cf6, #ec4899, #6366f1); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Main Body Content -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="content-padding" style="padding: 36px 32px 32px; color: #e2e8f0;">
                    
                    ${badgeHtml}

                    <h1 class="headline" style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
                      ${title}
                    </h1>

                    <div style="font-size: 14px; line-height: 1.65; color: #cbd5e1;">
                      ${contentHtml}
                    </div>

                    ${actionButton}

                    <!-- Security & Protection Seal -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #1f2438;">
                      <tr>
                        <td align="left" style="font-size: 11px; color: #64748b; line-height: 1.5;">
                          <span style="color: #10b981; font-weight: 700;">&#10003; Verified Security</span> &bull; 
                          Cryptographic Escrow Protection &bull; 
                          Automated Milestone Ledger
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Anti-Spam Compliant Footer & Physical Imprint -->
          <tr>
            <td style="padding: 28px 16px 0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 10px; color: #94a3b8; font-size: 11px;">
                You received this transactional email for your registered activity on 
                <a href="${appUrl}" style="color: #a855f7; text-decoration: none; font-weight: 600;">crevio.co.in</a>.
              </p>
              
              <p style="margin: 0 0 10px; font-size: 11px;">
                <a href="${appUrl}/dashboard" style="color: #94a3b8; text-decoration: underline;">Dashboard</a> &bull; 
                <a href="${appUrl}/campaigns" style="color: #94a3b8; text-decoration: underline;">Campaigns</a> &bull; 
                <a href="${appUrl}/contracts" style="color: #94a3b8; text-decoration: underline;">Smart Escrow</a> &bull; 
                <a href="${appUrl}/settings" style="color: #94a3b8; text-decoration: underline;">Notification Settings</a>
              </p>

              <p style="margin: 12px 0 0; font-size: 10px; color: #475569; line-height: 1.4;">
                Crevio Platform Inc. &bull; Bengaluru, Karnataka 560103, India<br />
                Autonomous Contract Execution & Monitoring System &bull; All Rights Reserved &copy; ${new Date().getFullYear()}
              </p>

              <p style="margin: 8px 0 0; font-size: 10px; color: #475569;">
                To manage email preferences or stop non-essential notifications, 
                <a href="${appUrl}/settings" style="color: #64748b; text-decoration: underline;">click here</a>.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// -------------------------------------------------------------
// 1. Welcome & Onboarding Email Template
// -------------------------------------------------------------
export function tplWelcomeUser({ name, role, email }) {
  const isBrand = role === 'brand';
  const roleTitle = isBrand ? 'Brand Partner' : 'Creator / Influencer';
  
  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${name || 'Creator'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      Welcome to <strong>Crevio</strong>! Your profile has been verified and registered as a 
      <span style="color: #c4b5fd; font-weight: 700;">${roleTitle}</span>.
    </p>

    <!-- Highlight Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <h3 style="margin: 0 0 12px; color: #f8fafc; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px;">
            ⚡ Quick Launch Guide:
          </h3>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            ${isBrand ? `
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1;">
                  <strong style="color: #a855f7;">1.</strong> Publish your first influencer campaign with custom deliverables.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1;">
                  <strong style="color: #a855f7;">2.</strong> AI Match Engine scores and matches top creator talent automatically.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1;">
                  <strong style="color: #a855f7;">3.</strong> Lock budget in Razorpay smart escrow — funds disburse only on approval.
                </td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1;">
                  <strong style="color: #a855f7;">1.</strong> Connect your Instagram Graph API to showcase verified reach & impressions.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1;">
                  <strong style="color: #a855f7;">2.</strong> Browse curated brand campaigns matching your audience niche.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1;">
                  <strong style="color: #a855f7;">3.</strong> Submit proposals and receive guaranteed instant payouts via smart escrow.
                </td>
              </tr>
            `}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      Questions or need onboarding assistance? You can reply directly to this email at any time.
    </p>
  `;

  return {
    subject: `Welcome to Crevio, ${name || 'Creator'}! 🚀`,
    html: renderBaseLayout({
      title: `Welcome to Crevio! 🎉`,
      preheader: `Your ${roleTitle} account is active. Start exploring campaigns and smart escrow.`,
      badgeText: 'Account Activated',
      contentHtml,
      ctaUrl: isBrand ? '/campaigns/create' : '/campaigns',
      ctaText: isBrand ? 'Create Your First Campaign' : 'Browse Live Campaigns',
    }),
  };
}

// -------------------------------------------------------------
// 2. Campaign Created Confirmation Template
// -------------------------------------------------------------
export function tplCampaignCreated({ campaignTitle, budget, brandName, campaignId, platform }) {
  const formattedBudget = `₹${Number(budget || 0).toLocaleString('en-IN')}`;

  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      Your campaign <strong style="color: #ffffff;">"${campaignTitle}"</strong> is now published and active on Crevio.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0; width: 45%;">Campaign ID:</td>
              <td style="color: #f8fafc; font-family: monospace; font-weight: 600; text-align: right;">${campaignId || 'CAMP-NEW'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Allocated Budget:</td>
              <td style="color: #34d399; font-weight: 700; font-size: 14px; text-align: right;">${formattedBudget}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Platform:</td>
              <td style="color: #a78bfa; font-weight: 600; text-align: right;">${platform || 'Instagram'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">AI Match Status:</td>
              <td style="color: #38bdf8; font-weight: 600; text-align: right;">Active & Scoring Talent</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      Crevio is now automatically notifying matching high-fit creators. You will receive email alerts as new proposals arrive.
    </p>
  `;

  return {
    subject: `Campaign Published: "${campaignTitle}" 📣`,
    html: renderBaseLayout({
      title: 'Campaign Live on Crevio 🚀',
      preheader: `Your campaign "${campaignTitle}" is published with budget ${formattedBudget}. Matchmaker is active.`,
      badgeText: 'Campaign Live',
      contentHtml,
      ctaUrl: `/campaigns/${campaignId || ''}`,
      ctaText: 'Open Campaign Dashboard',
    }),
  };
}

// -------------------------------------------------------------
// 3. Creator Application Submitted (Sent to Brand)
// -------------------------------------------------------------
export function tplApplicationSubmitted({ brandName, creatorName, campaignTitle, fitScore, proposedFee, campaignId, applicationId }) {
  const formattedFee = `₹${Number(proposedFee || 0).toLocaleString('en-IN')}`;
  const scoreNum = Number(fitScore || 0);

  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      A creator has applied for your campaign <strong style="color: #ffffff;">"${campaignTitle}"</strong>.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0; width: 45%;">Applicant:</td>
              <td style="color: #ffffff; font-weight: 700; text-align: right;">${creatorName || 'Verified Creator'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">AI Fit Score:</td>
              <td style="color: #38bdf8; font-weight: 800; font-size: 15px; text-align: right;">
                <span style="background: rgba(56, 189, 248, 0.15); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);">
                  ${scoreNum > 0 ? scoreNum.toFixed(1) : '94.5'} / 100
                </span>
              </td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Proposed Fee:</td>
              <td style="color: #34d399; font-weight: 700; text-align: right;">${formattedFee}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      Inspect their live audience demographics, pitch details, and generate an escrow contract with one click.
    </p>
  `;

  return {
    subject: `New Application: ${creatorName || 'Creator'} applied for "${campaignTitle}" 📥`,
    html: renderBaseLayout({
      title: 'Creator Proposal Received 📬',
      preheader: `${creatorName} applied to ${campaignTitle} with AI Fit Score ${scoreNum > 0 ? scoreNum.toFixed(1) : '94.5'}/100`,
      badgeText: 'Application Received',
      contentHtml,
      ctaUrl: applicationId ? `/applications/${applicationId}` : `/campaigns/${campaignId || ''}`,
      ctaText: 'Review Creator Proposal',
    }),
  };
}

// -------------------------------------------------------------
// 4. Contract Digitally E-Signed
// -------------------------------------------------------------
export function tplContractSigned({ recipientName, otherPartyName, contractId, campaignTitle, role }) {
  const isBrand = role === 'brand';

  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${recipientName || 'Partner'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      The agreement for <strong style="color: #ffffff;">"${campaignTitle || 'Milestone Execution'}"</strong> has been digitally e-signed by <strong style="color: #a855f7;">${otherPartyName || 'Party'}</strong>.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <div style="font-family: monospace; font-size: 12px; color: #a78bfa; margin-bottom: 8px;">
            CONTRACT REFERENCE: #${contractId || 'CRV-ESCROW'}
          </div>
          <p style="margin: 0; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
            ${isBrand 
              ? 'The creator has accepted all legal stipulations and deliverables. You can now fund the escrow vault to initiate content creation.'
              : 'Your cryptographic signature has been stamped and verified. The brand is now locking the escrow payout.'}
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Contract E-Signed: #${contractId} ✍️`,
    html: renderBaseLayout({
      title: 'Contract Digitally E-Signed 📄',
      preheader: `Contract #${contractId} has been signed. Next step: Escrow vault lock.`,
      badgeText: 'Contract Signed',
      contentHtml,
      ctaUrl: `/contracts/${contractId || ''}`,
      ctaText: 'View Contract Terms',
    }),
  };
}

// -------------------------------------------------------------
// 5. Escrow Vault Funded & Locked
// -------------------------------------------------------------
export function tplEscrowFunded({ brandName, creatorName, amount, contractId, paymentId, isCreatorRecipient }) {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const contentHtml = isCreatorRecipient ? `
    <p style="margin: 0 0 14px;">Hi <strong>${creatorName || 'Creator'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      Great news! Brand <strong style="color: #ffffff;">${brandName || 'Partner'}</strong> has funded and locked 
      <strong style="color: #34d399;">${formattedAmount}</strong> into secure smart escrow for Contract <strong style="color: #a855f7;">#${contractId}</strong>.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0; text-align: center;">
      <tr>
        <td style="padding: 22px 20px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 4px;">Protected Escrow Vault</div>
          <div style="font-size: 28px; font-weight: 900; color: #34d399; font-family: -apple-system, sans-serif;">${formattedAmount}</div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 700; margin-top: 6px;">STATUS: 100% LOCKED & SECURED</div>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      You can now proceed with creating and publishing your scheduled deliverables. Funds will disburse automatically upon proof verification.
    </p>
  ` : `
    <p style="margin: 0 0 14px;">Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      Your payment of <strong style="color: #34d399;">${formattedAmount}</strong> has been confirmed via Razorpay and secured in smart escrow for Contract <strong style="color: #a855f7;">#${contractId}</strong>.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #94a3b8; padding: 6px 0; width: 45%;">Payment ID:</td>
              <td style="color: #f8fafc; font-family: monospace; font-weight: 600; text-align: right;">${paymentId || 'RZP-ESCROW'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Creator Beneficiary:</td>
              <td style="color: #a78bfa; font-weight: 600; text-align: right;">${creatorName || 'Assigned Creator'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 6px 0;">Escrow State:</td>
              <td style="color: #34d399; font-weight: 700; text-align: right;">HELD & PROTECTED</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Escrow Secured: ${formattedAmount} Locked for Contract #${contractId} 🔒`,
    html: renderBaseLayout({
      title: 'Escrow Payment Secured 🛡️',
      preheader: `${formattedAmount} has been deposited and locked into escrow for Contract #${contractId}`,
      badgeText: 'Escrow Locked',
      contentHtml,
      ctaUrl: `/contracts/${contractId || ''}`,
      ctaText: 'View Escrow Vault',
    }),
  };
}

// -------------------------------------------------------------
// 6. Deliverables & Performance Proofs Submitted
// -------------------------------------------------------------
export function tplProofSubmitted({ brandName, creatorName, campaignTitle, liveLinks, impressions, reach, contractId, campaignId }) {
  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${brandName || 'Brand Partner'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      Creator <strong style="color: #ffffff;">${creatorName || 'Partner'}</strong> has uploaded their live deliverables and engagement analytics for <strong style="color: #ffffff;">"${campaignTitle}"</strong>.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <h4 style="margin: 0 0 10px; color: #f8fafc; font-size: 13px; text-transform: uppercase;">📊 Analytics Summary:</h4>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            ${reach ? `<tr><td style="color: #94a3b8; padding: 4px 0;">Verified Reach:</td><td style="color: #38bdf8; font-weight: 700; text-align: right;">${reach}</td></tr>` : ''}
            ${impressions ? `<tr><td style="color: #94a3b8; padding: 4px 0;">Impressions:</td><td style="color: #818cf8; font-weight: 700; text-align: right;">${impressions}</td></tr>` : ''}
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Proof URLs:</td>
              <td style="color: #34d399; font-weight: 600; text-align: right;">${Array.isArray(liveLinks) ? liveLinks.length : 1} live links submitted</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      Please inspect the deliverables on your dashboard. Once approved, the escrow funds will automatically release to the creator.
    </p>
  `;

  return {
    subject: `Deliverable Proofs Uploaded by ${creatorName || 'Creator'} for "${campaignTitle}" 📸`,
    html: renderBaseLayout({
      title: 'Deliverables Ready for Review 📸',
      preheader: `${creatorName} submitted live post links & dashboard analytics for review.`,
      badgeText: 'Proofs Submitted',
      contentHtml,
      ctaUrl: contractId ? `/contracts/${contractId}` : `/campaigns/${campaignId || ''}`,
      ctaText: 'Review Deliverable Proofs',
    }),
  };
}

// -------------------------------------------------------------
// 7. Escrow Released Payout Disbursed
// -------------------------------------------------------------
export function tplEscrowReleased({ creatorName, amount, contractId, campaignTitle }) {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${creatorName || 'Creator'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      Congratulations! Your deliverables for <strong style="color: #ffffff;">"${campaignTitle || 'Milestone Execution'}"</strong> have been verified and approved.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0; text-align: center;">
      <tr>
        <td style="padding: 24px 20px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 4px;">Milestone Payout Disbursed</div>
          <div style="font-size: 32px; font-weight: 900; color: #34d399; font-family: -apple-system, sans-serif;">${formattedAmount}</div>
          <div style="font-size: 11px; color: #a78bfa; font-weight: 700; margin-top: 6px;">CREDITED TO CREVIO WALLET</div>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      The escrow funds are now in your Crevio wallet. You can use your balance or initiate an instant bank transfer at any time.
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

// -------------------------------------------------------------
// 8. Custom Admin Broadcast & Announcement
// -------------------------------------------------------------
export function tplCustomBroadcast({ title, message, actionUrl, actionText, badgeText }) {
  return {
    subject: title || 'Crevio Platform Announcement',
    html: renderBaseLayout({
      title: title || 'Platform Announcement',
      preheader: message ? message.substring(0, 100) : 'Important update from Crevio Platform',
      badgeText: badgeText || 'Announcement',
      contentHtml: `<p style="margin: 0; line-height: 1.7; color: #cbd5e1;">${message || 'No additional details provided.'}</p>`,
      ctaUrl: actionUrl || '/dashboard',
      ctaText: actionText || 'Open Crevio Platform',
    }),
  };
}

// -------------------------------------------------------------
// 9. Dispute Notification & Arbitration Alert
// -------------------------------------------------------------
export function tplDisputeAlert({ disputeId, contractId, raisedBy, reason, amount }) {
  const formattedAmount = `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const contentHtml = `
    <p style="margin: 0 0 14px;">Hello,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      A dispute has been initiated for Contract <strong style="color: #ffffff;">#${contractId}</strong> by <strong style="color: #f87171;">${raisedBy || 'Counterparty'}</strong>.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #7f1d1d; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #94a3b8; padding: 4px 0; width: 45%;">Dispute ID:</td>
              <td style="color: #f87171; font-family: monospace; font-weight: 700; text-align: right;">${disputeId || 'DISP-NEW'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Escrow Value:</td>
              <td style="color: #f8fafc; font-weight: 700; text-align: right;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Status:</td>
              <td style="color: #fbbf24; font-weight: 700; text-align: right;">UNDER ARBITRATION</td>
            </tr>
          </table>
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #cbd5e1;">
            <strong>Stated Reason:</strong> "${reason || 'Deliverable timeline review requested.'}"
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      The escrow funds remain locked in secure arbitration. You can upload counter-evidence or communicate via the Dispute Resolution Center.
    </p>
  `;

  return {
    subject: `Dispute Notice: Contract #${contractId} Under Arbitration ⚠️`,
    html: renderBaseLayout({
      title: 'Escrow Dispute Initiated ⚠️',
      preheader: `Dispute #${disputeId} opened for Contract #${contractId}. Funds are locked in arbitration.`,
      badgeText: 'Dispute Alert',
      badgeColor: '#ef4444',
      contentHtml,
      ctaUrl: `/contracts/${contractId || ''}`,
      ctaText: 'Open Dispute Center',
    }),
  };
}

// -------------------------------------------------------------
// 10. Security & Login Alert Template
// -------------------------------------------------------------
export function tplSecurityAlert({ userName, ipAddress, location, device, timestamp }) {
  const contentHtml = `
    <p style="margin: 0 0 14px;">Hi <strong>${userName || 'Crevio Member'}</strong>,</p>
    <p style="margin: 0 0 18px; color: #cbd5e1;">
      We detected a new sign-in to your Crevio account.
    </p>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1d2d; border: 1px solid #2d3348; border-radius: 12px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="color: #94a3b8; padding: 4px 0; width: 45%;">Time:</td>
              <td style="color: #f8fafc; font-weight: 600; text-align: right;">${timestamp || new Date().toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Device / Browser:</td>
              <td style="color: #a78bfa; font-weight: 600; text-align: right;">${device || 'Web Browser'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">Location:</td>
              <td style="color: #38bdf8; font-weight: 600; text-align: right;">${location || 'India'}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; padding: 4px 0;">IP Address:</td>
              <td style="color: #94a3b8; font-family: monospace; text-align: right;">${ipAddress || '127.0.0.1'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8;">
      If this was you, no action is needed. If you did not authorize this access, please reset your password immediately.
    </p>
  `;

  return {
    subject: `Security Alert: New Sign-in to Your Crevio Account 🛡️`,
    html: renderBaseLayout({
      title: 'Security Alert: New Sign-in 🛡️',
      preheader: `New sign-in detected from ${device || 'Web Browser'} (${location || 'India'}).`,
      badgeText: 'Security Notice',
      contentHtml,
      ctaUrl: '/settings',
      ctaText: 'Review Account Security',
    }),
  };
}

// -------------------------------------------------------------
// Core Sending Engine with Deliverability & Anti-Spam Optimization
// -------------------------------------------------------------
export async function sendAutonomousEmail({
  to,
  toName,
  subject,
  html,
  text,
  templateName,
  templateData = {},
  metadata = {},
}) {
  const logId = createId('emlog_');
  const recipientEmail = (to || '').trim();
  const recipientName = (toName || '').trim();

  if (!recipientEmail) {
    console.warn('[EmailService] Recipient email is missing. Skipping.');
    return { success: false, error: 'Recipient email is missing' };
  }

  let finalHtml = html;
  let finalSubject = subject;
  let finalPlainText = text;

  // Resolve template if requested
  if (templateName) {
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
      case 'dispute_alert':
        tplResult = tplDisputeAlert(templateData);
        break;
      case 'security_alert':
        tplResult = tplSecurityAlert(templateData);
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

  // Generate plain-text counterpart if not explicitly provided
  if (!finalPlainText && finalHtml) {
    finalPlainText = htmlToPlainText(finalHtml);
  }

  const resend = getResendClient();
  const fromEmail = getSenderEmail();
  const appUrl = process.env.FRONTEND_URL || 'https://crevio.co.in';

  let resendId = null;
  let status = 'sent';
  let errorMessage = null;

  try {
    if (!resend) {
      status = 'simulated';
      console.log(`[EmailService SIMULATED] Would send "${finalSubject}" to ${recipientEmail}`);
    } else {
      console.log(`[EmailService] Dispatching email via Resend to ${recipientEmail} (${templateName || 'custom'})...`);
      
      const payload = {
        from: fromEmail,
        to: recipientEmail,
        subject: finalSubject,
        html: finalHtml,
        text: finalPlainText,
        headers: {
          'List-Unsubscribe': `<${appUrl}/settings>, <mailto:unsubscribe@crevio.co.in?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Entity-Ref-ID': logId,
        },
      };

      const response = await resend.emails.send(payload);

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
// Autonomous Platform Trigger Helper Functions
// -------------------------------------------------------------

export async function sendWelcomeEmail({ email, name, role }) {
  return sendAutonomousEmail({
    to: email,
    toName: name,
    templateName: 'welcome_user',
    templateData: { name, role, email },
    metadata: { event: 'user_onboarded', role },
  });
}

export async function sendCampaignCreatedEmail({ brandEmail, brandName, campaignTitle, budget, campaignId, platform }) {
  return sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'campaign_created',
    templateData: { brandName, campaignTitle, budget, campaignId, platform },
    metadata: { event: 'campaign_created', campaignId },
  });
}

export async function sendApplicationSubmittedEmail({ brandEmail, brandName, creatorName, campaignTitle, fitScore, proposedFee, campaignId, applicationId }) {
  return sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'application_submitted',
    templateData: { brandName, creatorName, campaignTitle, fitScore, proposedFee, campaignId, applicationId },
    metadata: { event: 'application_submitted', campaignId, applicationId },
  });
}

export async function sendContractSignedEmail({ recipientEmail, recipientName, otherPartyName, contractId, campaignTitle, role }) {
  return sendAutonomousEmail({
    to: recipientEmail,
    toName: recipientName,
    templateName: 'contract_signed',
    templateData: { recipientName, otherPartyName, contractId, campaignTitle, role },
    metadata: { event: 'contract_signed', contractId },
  });
}

export async function sendEscrowFundedEmail({ brandEmail, brandName, creatorEmail, creatorName, amount, contractId, paymentId }) {
  const brandPromise = sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'escrow_funded',
    templateData: { brandName, creatorName, amount, contractId, paymentId, isCreatorRecipient: false },
    metadata: { event: 'escrow_funded_brand', contractId, paymentId },
  });

  const creatorPromise = creatorEmail ? sendAutonomousEmail({
    to: creatorEmail,
    toName: creatorName,
    templateName: 'escrow_funded',
    templateData: { brandName, creatorName, amount, contractId, paymentId, isCreatorRecipient: true },
    metadata: { event: 'escrow_funded_creator', contractId, paymentId },
  }) : Promise.resolve(null);

  const [brandRes, creatorRes] = await Promise.all([brandPromise, creatorPromise]);
  return { brandRes, creatorRes };
}

export async function sendProofSubmittedEmail({ brandEmail, brandName, creatorName, campaignTitle, liveLinks, impressions, reach, contractId, campaignId }) {
  return sendAutonomousEmail({
    to: brandEmail,
    toName: brandName,
    templateName: 'proof_submitted',
    templateData: { brandName, creatorName, campaignTitle, liveLinks, impressions, reach, contractId, campaignId },
    metadata: { event: 'proof_submitted', contractId, campaignId },
  });
}

export async function sendEscrowReleasedEmail({ creatorEmail, creatorName, amount, contractId, campaignTitle }) {
  return sendAutonomousEmail({
    to: creatorEmail,
    toName: creatorName,
    templateName: 'escrow_released',
    templateData: { creatorName, amount, contractId, campaignTitle },
    metadata: { event: 'escrow_released', contractId },
  });
}
