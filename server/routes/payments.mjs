import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query } from '../lib/db.mjs';
import { createId } from '../lib/ids.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';

const router = Router();

// Initialize Razorpay SDK using credentials from environment
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TMoehPXBFAhtVP',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dbHk1ziwP4w3pubpfjVzrVMl',
});

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
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TMoehPXBFAhtVP'
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
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dbHk1ziwP4w3pubpfjVzrVMl')
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

    // Bookkeeping: Subtract from Brand available play balance and credit their pending escrow balance
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
       SET available_balance = available_balance - $2, 
           pending_escrow_balance = pending_escrow_balance + $2, 
           updated_at = NOW() 
       WHERE id = $1`,
      [brandWallet.id, escrow.amount]
    );

    // Record Ledger Debit Row
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

    const order = await razorpay.orders.create(options);

    return res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TMoehPXBFAhtVP'
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
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dbHk1ziwP4w3pubpfjVzrVMl')
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

export default router;
