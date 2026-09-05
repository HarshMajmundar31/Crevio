import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';

const router = Router();

let razorpayInstance = null;

function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID is not configured in environment variables.');
  }
  return keyId;
}

function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured in environment variables.');
  }
  return keySecret;
}

function getRazorpay() {
  if (!razorpayInstance) {
    const keyId = getRazorpayKeyId();
    const keySecret = getRazorpayKeySecret();
    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (err) {
      console.error('[Razorpay Error] Initialization failed:', err?.message || String(err));
      return null;
    }
  }

  return razorpayInstance;
}

// 1. Fetch/Initialize Wallet and transaction ledger
router.get('/wallet', requireAuth, async (req, res) => {
  try {
    let walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [req.user.userId]);
    
    // Dynamically initialize wallet on first check
    if (!walletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 100000.00, 0.00, 'INR')`,
        [walletId, req.user.userId]
      );
      
      // Log transactional seed credit
      await query(
        `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description) 
         VALUES ($1, $2, 100000.00, 'seed', 'completed', 'Welcome Play Credits (Developer Sandbox)')`,
        [createId('txn'), walletId]
      );
      
      walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [req.user.userId]);
    }

    const txns = await query(
      `SELECT * FROM wallet_transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC`,
      [walletRes.rows[0].id]
    );

    return res.json({ 
      wallet: walletRes.rows[0], 
      transactions: txns.rows 
    });
  } catch (error) {
    console.error('Wallet error:', error);
    return res.status(500).json({ error: 'Failed to retrieve wallet information' });
  }
});

// 2. Create Razorpay Order
router.post('/contracts/:id/create-order', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  try {
    const contractId = req.params.id;
    const contractRes = await query('SELECT * FROM contracts WHERE id = $1', [contractId]);
    const contract = contractRes.rows[0];

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Amount in Razorpay expects subunits (paise for INR)
    const amountInPaise = Math.round(Number(contract.payment_amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${contractId.substring(4, 14)}`,
    };

    const razorpay = getRazorpay();
    if (!razorpay) {
      throw new Error('Razorpay SDK is not configured');
    }

    const order = await razorpay.orders.create(options);

    // Save transition state into escrow_holdings table
    await query(
      `INSERT INTO escrow_holdings (id, contract_id, campaign_id, brand_id, creator_id, amount, status, razorpay_order_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'awaiting_deposit', $7)
       ON CONFLICT (contract_id) 
       DO UPDATE SET razorpay_order_id = $7, status = 'awaiting_deposit'`,
      [createId('esc'), contractId, contract.campaign_id, contract.brand_id, contract.creator_id, contract.payment_amount, order.id]
    );

    return res.json({ 
      orderId: order.id, 
      amount: amountInPaise, 
      currency: 'INR',
      keyId: getRazorpayKeyId()
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// 3. Cryptographically Verify Signature & Lock Contract
router.post('/contracts/:id/verify-payment', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  try {
    const contractId = req.params.id;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing signature verification parameters' });
    }

    // Mathematical HMAC signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', getRazorpayKeySecret())
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Secure payment signature verification failed' });
    }

    // Set escrow status to HELD
    const escUpdate = await query(
      `UPDATE escrow_holdings 
       SET status = 'held', razorpay_payment_id = $2, razorpay_signature = $3, updated_at = NOW() 
       WHERE razorpay_order_id = $1 
       RETURNING id, amount, brand_id`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature]
    );

    const escrow = escUpdate.rows[0];

    // Transition contract to LOCKED
    await query(
      `UPDATE contracts 
       SET status = 'locked', locked_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [contractId]
    );

    // Bookkeeping: Credit their pending escrow balance with the newly funded Razorpay external deposit
    let brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.brand_id]);
    if (!brandWalletRes.rows[0]) {
      // Dynamic fallback create if not exists
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 100000.00, 0.00, 'INR')`,
        [walletId, escrow.brand_id]
      );
      brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.brand_id]);
    }

    const brandWallet = brandWalletRes.rows[0];
    await query(
      `UPDATE user_wallets 
       SET pending_escrow_balance = pending_escrow_balance + $2, 
           updated_at = NOW() 
       WHERE id = $1`,
      [brandWallet.id, escrow.amount]
    );

    // Record Ledger Deposit & Escrow Locking Rows
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description, reference_escrow_id)
       VALUES ($1, $2, $3, 'deposit', 'completed', $4, $5)`,
      [
        createId('txn'), 
        brandWallet.id, 
        escrow.amount, 
        `Razorpay Deposit (${razorpay_payment_id}) for Contract ${contractId}`, 
        escrow.id
      ]
    );

    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description, reference_escrow_id)
       VALUES ($1, $2, $3, 'escrow_debit', 'completed', $4, $5)`,
      [
        createId('txn'), 
        brandWallet.id, 
        -escrow.amount, 
        `Escrow Locked: Contract ${contractId} Campaign Budget Secured`, 
        escrow.id
      ]
    );

    // Log a contract event
    await query(
      `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
       VALUES ($1, $2, $3, 'contract_escrow_funded', $4::jsonb)`,
      [createId('evt'), contractId, req.user.userId, JSON.stringify({ razorpay_payment_id, razorpay_order_id, amount: escrow.amount })]
    );

    return res.json({ success: true, status: 'locked' });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Failed to verify secure escrow signature' });
  }
});

// 4. Admin Manual Dispute Release split (Supports overriding settlements)
router.post('/contracts/:id/simulate-release', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const contractId = req.params.id;
    const { creatorPercent, brandPercent } = req.body;

    const escRes = await query('SELECT * FROM escrow_holdings WHERE contract_id = $1', [contractId]);
    const escrow = escRes.rows[0];

    if (!escrow || escrow.status !== 'held') {
      return res.status(400).json({ error: 'No active locked escrow funds found for this contract' });
    }

    const cPct = Number(creatorPercent || 100);
    const bPct = Number(brandPercent || 0);

    if (cPct + bPct !== 100) {
      return res.status(400).json({ error: 'Payout split percentages must equal 100%' });
    }

    const creatorShare = (escrow.amount * cPct) / 100;
    const brandShare = (escrow.amount * bPct) / 100;

    // A. Update Escrow status to released
    await query(
      `UPDATE escrow_holdings 
       SET status = 'released', released_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [escrow.id]
    );

    // B. Close out Contract to completed
    await query(
      `UPDATE contracts 
       SET status = 'completed', completed_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [contractId]
    );

    // C. Adjust Brand Balances (deduct from pending escrow holding, and refund split remainder)
    const brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.brand_id]);
    if (brandWalletRes.rows[0]) {
      const brandWallet = brandWalletRes.rows[0];
      await query(
        `UPDATE user_wallets 
         SET pending_escrow_balance = pending_escrow_balance - $2, 
             available_balance = available_balance + $3, 
             updated_at = NOW() 
         WHERE id = $1`,
        [brandWallet.id, escrow.amount, brandShare]
      );

      if (brandShare > 0) {
        // Record brand partial refund txn
        await query(
          `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description, reference_escrow_id)
           VALUES ($1, $2, $3, 'escrow_refund', 'completed', $4, $5)`,
          [
            createId('txn'), 
            brandWallet.id, 
            brandShare, 
            `Dispute Settlement Refund (${bPct}% Split): Contract ${contractId}`, 
            escrow.id
          ]
        );
      }
    }

    // D. Adjust Creator Balances (deposit creatorShare into their available balance)
    let creatorWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.creator_id]);
    if (!creatorWalletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 0.00, 0.00, 'INR')`,
        [walletId, escrow.creator_id]
      );
      creatorWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [escrow.creator_id]);
    }

    const creatorWallet = creatorWalletRes.rows[0];
    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance + $2, updated_at = NOW() 
       WHERE id = $1`,
      [creatorWallet.id, creatorShare]
    );

    // Record ledger credit row for creator
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description, reference_escrow_id)
       VALUES ($1, $2, $3, 'escrow_credit', 'completed', $4, $5)`,
      [
        createId('txn'), 
        creatorWallet.id, 
        creatorShare, 
        `Escrow Disbursements Credited (${cPct}% Split): Contract ${contractId}`, 
        escrow.id
      ]
    );

    // Log admin intervention event
    await query(
      `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
       VALUES ($1, $2, $3, 'admin_escrow_disbursement_settled', $4::jsonb)`,
      [createId('evt'), contractId, req.user.userId, JSON.stringify({ creatorPercent: cPct, brandPercent: bPct, creatorShare, brandShare })]
    );

    return res.json({ 
      success: true, 
      status: 'completed',
      creatorShare,
      brandShare
    });
  } catch (error) {
    console.error('Admin release split error:', error);
    return res.status(500).json({ error: 'Failed to settle and release disputed escrow funds' });
  }
});

// 6. Create Razorpay Deposit Order
router.post('/deposit/create-order', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Please specify a valid deposit amount' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `dep_${createId('rcpt').substring(4, 14)}`,
    };

    const razorpay = getRazorpay();
    if (!razorpay) {
      throw new Error('Razorpay SDK is not configured');
    }

    const order = await razorpay.orders.create(options);

    return res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: getRazorpayKeyId()
    });
  } catch (error) {
    console.error('Create deposit order error:', error);
    return res.status(500).json({ error: 'Failed to create deposit payment order' });
  }
});

// 7. Verify Deposit Payment and Credit Wallet
router.post('/deposit/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !amount) {
      return res.status(400).json({ error: 'Missing payment confirmation parameters' });
    }

    // Verify Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', getRazorpayKeySecret())
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Deposit signature verification failed' });
    }

    // Credit User Wallet
    let walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [req.user.userId]);
    if (!walletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 0.00, 0.00, 'INR')`,
        [walletId, req.user.userId]
      );
      walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [req.user.userId]);
    }

    const wallet = walletRes.rows[0];
    const depAmt = Number(amount);

    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance + $2, updated_at = NOW() 
       WHERE id = $1`,
      [wallet.id, depAmt]
    );

    // Log transactional credit ledger
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description) 
       VALUES ($1, $2, $3, 'deposit', 'completed', $4)`,
      [createId('txn'), wallet.id, depAmt, `Secured Deposit via Razorpay Sandbox (ID: ${razorpay_payment_id})`]
    );

    return res.json({ success: true, balance: Number(wallet.available_balance) + depAmt });
  } catch (error) {
    console.error('Verify deposit error:', error);
    return res.status(500).json({ error: 'Failed to complete credit deposit' });
  }
});

// 8. Execute Payout Withdrawal (Simulated)
router.post('/withdraw', requireAuth, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Please specify a valid withdrawal amount' });
    }

    const withAmt = Number(amount);

    let walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [req.user.userId]);
    const wallet = walletRes.rows[0];

    if (!wallet || Number(wallet.available_balance) < withAmt) {
      return res.status(400).json({ error: 'Insufficient wallet balance for this withdrawal' });
    }

    // Debit wallet balance
    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance - $2, updated_at = NOW() 
       WHERE id = $1`,
      [wallet.id, withAmt]
    );

    // Record ledger debit withdrawal
    const methodDesc = paymentMethod === 'upi' ? `UPI transfer to ${paymentDetails}` : `Bank Transfer (Account Number: ${paymentDetails})`;
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description) 
       VALUES ($1, $2, $3, 'withdrawal', 'completed', $4)`,
      [createId('txn'), wallet.id, -withAmt, `Withdrawn payout: ${methodDesc}`]
    );

    return res.json({ success: true, balance: Number(wallet.available_balance) - withAmt });
  } catch (error) {
    console.error('Withdraw payout error:', error);
    return res.status(500).json({ error: 'Failed to finalize payout cashout' });
  }
});

// 9. Create Campaign Funding Razorpay Order
router.post('/campaigns/:id/create-order', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaignRes = await query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    const campaign = campaignRes.rows[0];

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Determine budget to fund
    const budget = Number(campaign.budget || campaign.budget_max || campaign.budget_min || 10000);
    const amountInPaise = Math.round(budget * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `cmp_${campaignId.substring(4, 14)}`,
    };

    const razorpay = getRazorpay();
    if (!razorpay) {
      throw new Error('Razorpay SDK is not configured');
    }

    const order = await razorpay.orders.create(options);

    return res.json({ 
      orderId: order.id, 
      amount: amountInPaise, 
      currency: 'INR',
      keyId: getRazorpayKeyId()
    });
  } catch (error) {
    console.error('Create campaign Razorpay order error:', error);
    return res.status(500).json({ error: 'Failed to create campaign payment order' });
  }
});

// 10. Cryptographically Verify Signature & Activate Campaign
router.post('/campaigns/:id/verify-payment', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const campaignRes = await query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    const campaign = campaignRes.rows[0];

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing signature verification parameters' });
    }

    // Mathematical HMAC signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', getRazorpayKeySecret())
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Secure campaign payment verification failed' });
    }

    // Transition campaign to ACTIVE
    await query(
      `UPDATE campaigns 
       SET status = 'active', updated_at = NOW() 
       WHERE id = $1`,
      [campaignId]
    );

    const budget = Number(campaign.budget || campaign.budget_max || campaign.budget_min || 10000);

    // Bookkeeping: Credit their pending escrow balance with the newly funded Razorpay external deposit
    let brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [campaign.brand_id]);
    if (!brandWalletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 100000.00, 0.00, 'INR')`,
        [walletId, campaign.brand_id]
      );
      brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [campaign.brand_id]);
    }

    const brandWallet = brandWalletRes.rows[0];
    await query(
      `UPDATE user_wallets 
       SET pending_escrow_balance = pending_escrow_balance + $2, 
           updated_at = NOW() 
       WHERE id = $1`,
      [brandWallet.id, budget]
    );

    // Record Ledger Deposit & Escrow Locking Rows
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description)
       VALUES ($1, $2, $3, 'deposit', 'completed', $4)`,
      [
        createId('txn'), 
        brandWallet.id, 
        budget, 
        `Razorpay Deposit (${razorpay_payment_id}) for Campaign: ${campaign.title}`
      ]
    );

    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description)
       VALUES ($1, $2, $3, 'escrow_debit', 'completed', $4)`,
      [
        createId('txn'), 
        brandWallet.id, 
        -budget, 
        `Campaign Budget Secured in Escrow: ${campaign.title} Published and Active`
      ]
    );

    return res.json({ success: true, status: 'active' });
  } catch (error) {
    console.error('Verify campaign payment error:', error);
    return res.status(500).json({ error: 'Failed to verify secure campaign budget' });
  }
});

// 11. Fund Campaign Budget using Wallet Balance
router.post('/campaigns/:id/fund-with-wallet', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaignRes = await query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    const campaign = campaignRes.rows[0];

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'active') {
      return res.status(400).json({ error: 'Campaign is already active and funded' });
    }

    const budget = Number(campaign.budget || campaign.budget_max || campaign.budget_min || 10000);

    // Fetch Wallet
    let brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [campaign.brand_id]);
    if (!brandWalletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 100000.00, 0.00, 'INR')`,
        [walletId, campaign.brand_id]
      );
      brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [campaign.brand_id]);
    }

    const brandWallet = brandWalletRes.rows[0];

    if (Number(brandWallet.available_balance) < budget) {
      return res.status(400).json({ error: `Insufficient wallet balance. You have ₹${Number(brandWallet.available_balance).toLocaleString()} but need ₹${Number(budget).toLocaleString()}. Please top-up first.` });
    }

    // Deduct available, add to pending escrow
    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance - $2, 
           pending_escrow_balance = pending_escrow_balance + $2, 
           updated_at = NOW() 
       WHERE id = $1`,
      [brandWallet.id, budget]
    );

    // Transition campaign to ACTIVE
    await query(
      `UPDATE campaigns 
       SET status = 'active', updated_at = NOW() 
       WHERE id = $1`,
      [campaignId]
    );

    // Record Ledger Debit Row
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description)
       VALUES ($1, $2, $3, 'escrow_debit', 'completed', $4)`,
      [
        createId('txn'), 
        brandWallet.id, 
        -budget, 
        `Campaign Budget Secured via Wallet: ${campaign.title} Published and Active`
      ]
    );

    return res.json({ success: true, status: 'active', balance: Number(brandWallet.available_balance) - budget });
  } catch (error) {
    console.error('Wallet campaign funding error:', error);
    return res.status(500).json({ error: 'Failed to fund campaign budget from available wallet balance' });
  }
});

// 12. Fund Contract Escrow using Wallet Balance
router.post('/contracts/:id/fund-with-wallet', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  try {
    const contractId = req.params.id;
    const contractRes = await query('SELECT * FROM contracts WHERE id = $1', [contractId]);
    const contract = contractRes.rows[0];

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'accepted') {
      return res.status(400).json({ error: 'Contract must be accepted by creator before funding' });
    }

    const cost = Number(contract.payment_amount);

    // Fetch Wallet
    let brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [contract.brand_id]);
    if (!brandWalletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 100000.00, 0.00, 'INR')`,
        [walletId, contract.brand_id]
      );
      brandWalletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [contract.brand_id]);
    }

    const brandWallet = brandWalletRes.rows[0];

    if (Number(brandWallet.available_balance) < cost) {
      return res.status(400).json({ error: `Insufficient wallet balance. You have ₹${Number(brandWallet.available_balance).toLocaleString()} but need ₹${Number(cost).toLocaleString()}. Please top-up or fund via Razorpay.` });
    }

    // Save transition state into escrow_holdings table
    const escId = createId('esc');
    await query(
      `INSERT INTO escrow_holdings (id, contract_id, campaign_id, brand_id, creator_id, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'held')
       ON CONFLICT (contract_id) 
       DO UPDATE SET status = 'held', updated_at = NOW()`,
      [escId, contractId, contract.campaign_id, contract.brand_id, contract.creator_id, contract.payment_amount]
    );

    // Deduct available, add to pending escrow
    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance - $2, 
           pending_escrow_balance = pending_escrow_balance + $2, 
           updated_at = NOW() 
       WHERE id = $1`,
      [brandWallet.id, cost]
    );

    // Transition contract to LOCKED
    await query(
      `UPDATE contracts 
       SET status = 'locked', locked_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [contractId]
    );

    // Record Ledger Debit Row
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description, reference_escrow_id)
       VALUES ($1, $2, $3, 'escrow_debit', 'completed', $4, $5)`,
      [
        createId('txn'), 
        brandWallet.id, 
        -cost, 
        `Escrow Locked via Wallet Balance: Contract ${contractId} Campaign Budget Secured`,
        escId
      ]
    );

    // Log a contract event
    await query(
      `INSERT INTO contract_events (id, contract_id, actor_user_id, event_type, payload)
       VALUES ($1, $2, $3, 'contract_escrow_funded', $4::jsonb)`,
      [createId('evt'), contractId, req.user.userId, JSON.stringify({ source: 'wallet_balance', amount: cost })]
    );

    return res.json({ success: true, status: 'locked', balance: Number(brandWallet.available_balance) - cost });
  } catch (error) {
    console.error('Wallet contract funding error:', error);
    return res.status(500).json({ error: 'Failed to fund contract escrow from available wallet balance' });
  }
});

// 5. Get List of all global escrows for Admin Panel
router.get('/escrows', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT e.*, c.status AS contract_status,
              b.full_name AS brand_name, b.email AS brand_email,
              cr.full_name AS creator_name, cr.email AS creator_email
       FROM escrow_holdings e
       JOIN contracts c ON c.id = e.contract_id
       JOIN users b ON b.id = e.brand_id
       JOIN users cr ON cr.id = e.creator_id
       ORDER BY e.created_at DESC`
    );
    return res.json({ escrows: result.rows });
  } catch (error) {
    console.error('Fetch global escrows error:', error);
    return res.status(500).json({ error: 'Failed to retrieve administrative escrow audits' });
  }
});

// ==========================================
// 13. Admin Treasury & Platform Payments Analytics
// ==========================================
router.get('/admin/treasury-overview', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // 1. Overall Liquidity by Role & Total
    const liquidityRes = await query(`
      SELECT 
        COALESCE(SUM(w.available_balance), 0)::numeric AS total_available,
        COALESCE(SUM(w.pending_escrow_balance), 0)::numeric AS total_pending_escrow,
        COALESCE(SUM(CASE WHEN u.role = 'brand' THEN w.available_balance ELSE 0 END), 0)::numeric AS brand_available,
        COALESCE(SUM(CASE WHEN u.role = 'creator' THEN w.available_balance ELSE 0 END), 0)::numeric AS creator_available,
        COALESCE(SUM(CASE WHEN u.role = 'admin' THEN w.available_balance ELSE 0 END), 0)::numeric AS admin_available,
        COUNT(w.id)::int AS total_wallets
      FROM user_wallets w
      JOIN users u ON u.id = w.user_id
    `);

    // 2. Escrow Holdings Breakdown
    const escrowRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'held' THEN amount ELSE 0 END), 0)::numeric AS total_held,
        COALESCE(SUM(CASE WHEN status = 'released' THEN amount ELSE 0 END), 0)::numeric AS total_released,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0)::numeric AS total_refunded,
        COALESCE(SUM(CASE WHEN status = 'disputed' THEN amount ELSE 0 END), 0)::numeric AS total_disputed,
        COUNT(*)::int AS total_escrows_count,
        COUNT(CASE WHEN status = 'held' THEN 1 END)::int AS held_count,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END)::int AS disputed_count,
        COUNT(CASE WHEN status = 'released' THEN 1 END)::int AS released_count,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END)::int AS refunded_count
      FROM escrow_holdings
    `);

    // 3. Gross Transaction Inflows & Outflows
    const volumeRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN txn_type IN ('deposit', 'seed') AND amount > 0 THEN amount ELSE 0 END), 0)::numeric AS total_inflow,
        COALESCE(SUM(CASE WHEN txn_type = 'withdrawal' THEN ABS(amount) ELSE 0 END), 0)::numeric AS total_withdrawn,
        COALESCE(SUM(CASE WHEN txn_type = 'escrow_credit' THEN amount ELSE 0 END), 0)::numeric AS total_settled_volume,
        COALESCE(SUM(CASE WHEN txn_type = 'escrow_refund' THEN amount ELSE 0 END), 0)::numeric AS total_refund_volume,
        COUNT(*)::int AS total_transactions
      FROM wallet_transactions
    `);

    // 4. Transaction Type Distribution
    const typeBreakdownRes = await query(`
      SELECT 
        txn_type,
        COUNT(*)::int AS count,
        COALESCE(SUM(ABS(amount)), 0)::numeric AS total_volume
      FROM wallet_transactions
      GROUP BY txn_type
      ORDER BY count DESC
    `);

    // 5. 30-Day Daily Financial Timeline
    const trendsRes = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(CASE WHEN txn_type IN ('deposit', 'seed') AND amount > 0 THEN amount ELSE 0 END), 0)::numeric AS inflow,
        COALESCE(SUM(CASE WHEN txn_type = 'withdrawal' THEN ABS(amount) ELSE 0 END), 0)::numeric AS outflow,
        COALESCE(SUM(CASE WHEN txn_type = 'escrow_debit' THEN ABS(amount) ELSE 0 END), 0)::numeric AS escrow_locked,
        COALESCE(SUM(CASE WHEN txn_type = 'escrow_credit' THEN amount ELSE 0 END), 0)::numeric AS escrow_released,
        COUNT(*)::int AS txn_count
      FROM wallet_transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    // 6. Recent Platform Transactions
    const recentTxnsRes = await query(`
      SELECT 
        t.*,
        u.id AS user_id,
        u.full_name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        u.avatar_url AS user_avatar
      FROM wallet_transactions t
      JOIN user_wallets w ON w.id = t.wallet_id
      JOIN users u ON u.id = w.user_id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    // 7. Razorpay Test Mode Telemetry & Environment
    const rawKeyId = process.env.RAZORPAY_KEY_ID || '';
    const isTestMode = rawKeyId.startsWith('rzp_test_') || !rawKeyId.startsWith('rzp_live_');
    const maskedKeyId = rawKeyId ? `${rawKeyId.slice(0, 8)}••••••••${rawKeyId.slice(-4)}` : 'rzp_test_sandbox';
    const isConfigured = Boolean(rawKeyId && process.env.RAZORPAY_KEY_SECRET);

    const rzpMetricsRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN (t.description ILIKE '%Razorpay%' OR t.description ILIKE '%Sandbox%' OR e.razorpay_payment_id IS NOT NULL) AND t.amount > 0 THEN t.amount ELSE 0 END), 0)::numeric AS total_razorpay_inflow,
        COUNT(DISTINCT e.razorpay_order_id)::int AS total_razorpay_orders,
        COUNT(DISTINCT e.razorpay_payment_id)::int AS total_razorpay_payments,
        COALESCE(SUM(CASE WHEN e.status = 'held' AND (e.razorpay_order_id IS NOT NULL OR e.razorpay_payment_id IS NOT NULL) THEN e.amount ELSE 0 END), 0)::numeric AS razorpay_escrow_held,
        COALESCE(SUM(CASE WHEN e.status = 'released' AND (e.razorpay_order_id IS NOT NULL OR e.razorpay_payment_id IS NOT NULL) THEN e.amount ELSE 0 END), 0)::numeric AS razorpay_escrow_settled,
        COALESCE(SUM(CASE WHEN e.status = 'refunded' AND (e.razorpay_order_id IS NOT NULL OR e.razorpay_payment_id IS NOT NULL) THEN e.amount ELSE 0 END), 0)::numeric AS razorpay_escrow_refunded,
        COALESCE(SUM(CASE WHEN e.status = 'disputed' AND (e.razorpay_order_id IS NOT NULL OR e.razorpay_payment_id IS NOT NULL) THEN e.amount ELSE 0 END), 0)::numeric AS razorpay_disputed,
        COALESCE(SUM(CASE WHEN t.txn_type = 'seed' THEN t.amount ELSE 0 END), 0)::numeric AS seed_play_credits_volume
      FROM wallet_transactions t
      LEFT JOIN escrow_holdings e ON e.id = t.reference_escrow_id
    `);

    const rawRzp = rzpMetricsRes.rows[0] || {};
    const totalRzpInflow = parseFloat(rawRzp.total_razorpay_inflow) || 0;
    const totalOrders = parseInt(rawRzp.total_razorpay_orders, 10) || 0;
    const totalPayments = parseInt(rawRzp.total_razorpay_payments, 10) || 0;

    // Simulated 2% standard gateway fee + 18% GST (2.36%)
    const simulatedGatewayFees = Number((totalRzpInflow * 0.0236).toFixed(2));
    const verificationRate = totalOrders > 0 ? Number(((totalPayments / totalOrders) * 100).toFixed(1)) : 100;

    const testModeTelemetry = {
      gatewayInfo: {
        mode: isTestMode ? 'test' : 'live',
        keyId: maskedKeyId,
        isConfigured,
        environmentName: isTestMode ? 'Razorpay Developer Sandbox (Test Mode)' : 'Razorpay Production Gateway',
        currency: 'INR'
      },
      metrics: {
        total_razorpay_inflow: totalRzpInflow,
        total_razorpay_orders: totalOrders,
        total_razorpay_payments: totalPayments,
        razorpay_escrow_held: parseFloat(rawRzp.razorpay_escrow_held) || 0,
        razorpay_escrow_settled: parseFloat(rawRzp.razorpay_escrow_settled) || 0,
        razorpay_escrow_refunded: parseFloat(rawRzp.razorpay_escrow_refunded) || 0,
        razorpay_disputed: parseFloat(rawRzp.razorpay_disputed) || 0,
        seed_play_credits_volume: parseFloat(rawRzp.seed_play_credits_volume) || 0,
        simulated_gateway_fees: simulatedGatewayFees,
        verification_rate: verificationRate
      }
    };

    return res.json({
      success: true,
      liquidity: liquidityRes.rows[0] || {},
      escrow: escrowRes.rows[0] || {},
      volume: volumeRes.rows[0] || {},
      typeBreakdown: typeBreakdownRes.rows || [],
      dailyTrends: trendsRes.rows || [],
      recentTransactions: recentTxnsRes.rows || [],
      testModeTelemetry
    });
  } catch (error) {
    console.error('Admin treasury overview error:', error);
    return res.status(500).json({ error: 'Failed to generate platform treasury and payment analytics' });
  }
});

// ==========================================
// 14. Admin Global Transaction Ledger (All Users)
// ==========================================
router.get('/admin/all-transactions', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { q, txn_type, status, role, gateway_filter, limit = 100, offset = 0 } = req.query;
    const whereClauses = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      whereClauses.push(`(
        t.id ILIKE $${params.length} OR 
        t.description ILIKE $${params.length} OR 
        u.full_name ILIKE $${params.length} OR 
        u.email ILIKE $${params.length} OR
        e.razorpay_payment_id ILIKE $${params.length} OR
        e.razorpay_order_id ILIKE $${params.length}
      )`);
    }

    if (txn_type && txn_type !== 'all') {
      params.push(txn_type);
      whereClauses.push(`t.txn_type = $${params.length}`);
    }

    if (status && status !== 'all') {
      params.push(status);
      whereClauses.push(`t.status = $${params.length}`);
    }

    if (role && role !== 'all') {
      params.push(role);
      whereClauses.push(`u.role = $${params.length}`);
    }

    if (gateway_filter && gateway_filter !== 'all') {
      if (gateway_filter === 'razorpay_test') {
        whereClauses.push(`(t.description ILIKE '%Razorpay%' OR e.razorpay_payment_id IS NOT NULL OR e.razorpay_order_id IS NOT NULL)`);
      } else if (gateway_filter === 'seed') {
        whereClauses.push(`t.txn_type = 'seed'`);
      } else if (gateway_filter === 'internal') {
        whereClauses.push(`t.txn_type != 'seed' AND t.description NOT ILIKE '%Razorpay%' AND e.razorpay_payment_id IS NULL AND e.razorpay_order_id IS NULL`);
      }
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count for Pagination
    const countQuery = `
      SELECT COUNT(t.id)::int AS total
      FROM wallet_transactions t
      JOIN user_wallets w ON w.id = t.wallet_id
      JOIN users u ON u.id = w.user_id
      LEFT JOIN escrow_holdings e ON e.id = t.reference_escrow_id
      ${whereStr}
    `;
    const countRes = await query(countQuery, params);
    const totalCount = countRes.rows[0]?.total || 0;

    // Fetch Paginated Ledger Records
    params.push(parseInt(limit, 10));
    const limitIdx = params.length;
    params.push(parseInt(offset, 10));
    const offsetIdx = params.length;

    const dataQuery = `
      SELECT 
        t.id,
        t.wallet_id,
        t.amount,
        t.txn_type,
        t.status,
        t.description,
        t.reference_escrow_id,
        t.created_at,
        u.id AS user_id,
        u.full_name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        u.avatar_url AS user_avatar,
        w.currency,
        e.contract_id,
        e.campaign_id,
        e.razorpay_order_id,
        e.razorpay_payment_id,
        c.title AS campaign_title,
        true AS is_test_mode,
        CASE 
          WHEN t.txn_type = 'seed' THEN 'seed'
          WHEN t.description ILIKE '%Razorpay%' OR e.razorpay_payment_id IS NOT NULL OR e.razorpay_order_id IS NOT NULL THEN 'razorpay_test'
          ELSE 'internal'
        END AS gateway_type
      FROM wallet_transactions t
      JOIN user_wallets w ON w.id = t.wallet_id
      JOIN users u ON u.id = w.user_id
      LEFT JOIN escrow_holdings e ON e.id = t.reference_escrow_id
      LEFT JOIN campaigns c ON c.id = e.campaign_id
      ${whereStr}
      ORDER BY t.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query(dataQuery, params);

    return res.json({
      success: true,
      transactions: result.rows,
      totalCount,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    console.error('Admin all transactions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve global transaction ledger' });
  }
});

// ==========================================
// 15. Admin Solvency & Ledger Integrity Audit Check
// ==========================================
router.post('/admin/ledger-audit', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // 1. Wallets vs Transactions balance check
    const walletsSumRes = await query(`
      SELECT 
        COUNT(id)::int AS total_wallets,
        COALESCE(SUM(available_balance), 0)::numeric AS total_available,
        COALESCE(SUM(pending_escrow_balance), 0)::numeric AS total_pending_escrow
      FROM user_wallets
    `);

    // 2. Active Escrows
    const activeEscrowRes = await query(`
      SELECT 
        COUNT(id)::int AS active_escrow_count,
        COALESCE(SUM(amount), 0)::numeric AS total_held_escrow
      FROM escrow_holdings 
      WHERE status = 'held'
    `);

    // 3. Transactions Total
    const netTxnRes = await query(`
      SELECT 
        COUNT(id)::int AS total_transactions,
        COALESCE(SUM(amount), 0)::numeric AS net_transaction_sum
      FROM wallet_transactions
      WHERE status = 'completed'
    `);

    const totalAvailable = parseFloat(walletsSumRes.rows[0]?.total_available || '0');
    const totalPendingEscrow = parseFloat(walletsSumRes.rows[0]?.total_pending_escrow || '0');
    const totalHeldEscrow = parseFloat(activeEscrowRes.rows[0]?.total_held_escrow || '0');

    // Discrepancy checks
    const escrowDiscrepancy = Math.abs(totalPendingEscrow - totalHeldEscrow);
    const isEscrowMatched = escrowDiscrepancy < 0.01;
    const isSolvent = isEscrowMatched && totalAvailable >= 0;

    return res.json({
      success: true,
      isSolvent,
      auditTimestamp: new Date().toISOString(),
      stats: {
        totalWallets: walletsSumRes.rows[0]?.total_wallets || 0,
        totalAvailablePool: totalAvailable,
        totalPendingEscrow: totalPendingEscrow,
        totalHeldEscrowVault: totalHeldEscrow,
        activeEscrowHoldingsCount: activeEscrowRes.rows[0]?.active_escrow_count || 0,
        totalTransactionsCount: netTxnRes.rows[0]?.total_transactions || 0,
        netTransactionSum: parseFloat(netTxnRes.rows[0]?.net_transaction_sum || '0'),
        escrowDiscrepancy,
        isEscrowMatched
      }
    });
  } catch (error) {
    console.error('Admin ledger audit error:', error);
    return res.status(500).json({ error: 'Failed to perform ledger integrity audit' });
  }
});

// ==========================================
// 16. Admin Adjust User Balance (Credit/Debit with Audit Reason)
// ==========================================
router.post('/admin/users/:userId/adjust-balance', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || isNaN(amount) || Number(amount) === 0) {
      return res.status(400).json({ error: 'Please specify a non-zero adjustment amount' });
    }

    const adjAmt = Number(amount);

    let walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]);
    if (!walletRes.rows[0]) {
      const walletId = createId('wal');
      await query(
        `INSERT INTO user_wallets (id, user_id, available_balance, pending_escrow_balance, currency) 
         VALUES ($1, $2, 0.00, 0.00, 'INR')`,
        [walletId, userId]
      );
      walletRes = await query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]);
    }

    const wallet = walletRes.rows[0];
    const newBalance = Number(wallet.available_balance) + adjAmt;

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Adjustment would cause user balance to drop below ₹0' });
    }

    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance + $2, updated_at = NOW() 
       WHERE id = $1`,
      [wallet.id, adjAmt]
    );

    const desc = reason ? `Admin Treasury Adjustment: ${reason}` : `Administrative balance adjustment (${adjAmt >= 0 ? '+' : ''}₹${adjAmt})`;
    const txnType = adjAmt >= 0 ? 'deposit' : 'withdrawal';

    const txnId = createId('txn');
    await query(
      `INSERT INTO wallet_transactions (id, wallet_id, amount, txn_type, status, description) 
       VALUES ($1, $2, $3, $4, 'completed', $5)`,
      [txnId, wallet.id, adjAmt, txnType, desc]
    );

    return res.json({
      success: true,
      newBalance,
      wallet: {
        id: wallet.id,
        user_id: userId,
        available_balance: newBalance,
        pending_escrow_balance: wallet.pending_escrow_balance || 0,
        currency: 'INR'
      },
      transactionId: txnId,
      message: `Successfully adjusted balance by ₹${adjAmt}`
    });
  } catch (error) {
    console.error('Admin adjust balance error:', error);
    return res.status(500).json({ error: 'Failed to adjust user wallet balance' });
  }
});

// ==========================================
// 17. Admin Quick Users List for Wallet Hub
// ==========================================
router.get('/admin/users-wallets-summary', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.role, 
        u.avatar_url,
        COALESCE(w.available_balance, 0)::numeric AS available_balance,
        COALESCE(w.pending_escrow_balance, 0)::numeric AS pending_escrow_balance,
        (SELECT COUNT(*)::int FROM wallet_transactions wt WHERE wt.wallet_id = w.id) AS transaction_count
      FROM users u
      LEFT JOIN user_wallets w ON w.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    return res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Admin users wallets summary error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users wallet summary' });
  }
});

export default router;


