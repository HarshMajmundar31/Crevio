import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  apiGetWallet, 
  apiCreateDepositOrder, 
  apiVerifyDepositPayment, 
  apiWithdrawFunds,
  ApiWallet, 
  ApiTransaction 
} from '@/lib/api';
import { 
  Wallet, 
  Lock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Sparkles,
  CreditCard,
  PlusCircle,
  ArrowDownCircle,
  HelpCircle,
  Loader2,
  CheckCircle2,
  X,
  Smartphone,
  Building
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { toast } from 'sonner';

export default function WalletHub() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<ApiWallet | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals visibility
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Operation states
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [isWithdrawing, setIsWithdrawLoading] = useState(false);
  const [withdrawalStep, setWithdrawalStep] = useState<number>(0); // 0=idle, 1=ledger, 2=clearing, 3=verifying, 4=done

  const fetchWalletDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiGetWallet();
      setWallet(res.wallet);
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const formatAmount = (num: string | number) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Build dynamic chart data
  const getChartData = () => {
    if (transactions.length === 0) {
      return [
        { date: 'Baseline', balance: 100000 }
      ];
    }

    const sortedTxns = [...transactions].reverse();
    let currentTotal = 0;
    
    // We compute the running cumulative sum of balances
    const chartPoints = sortedTxns.map((t) => {
      const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      currentTotal += amt;
      const d = new Date(t.created_at);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return {
        date: label,
        balance: Math.round(currentTotal)
      };
    });

    // Seed a baseline if cumulative points are short
    if (chartPoints.length === 1) {
      return [{ date: 'Start', balance: 0 }, ...chartPoints];
    }
    return chartPoints;
  };

  // Helper to load Razorpay popup script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Perform Razorpay Deposit operation
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(depositAmount);
    if (!numAmt || isNaN(numAmt) || numAmt <= 0) {
      toast.error('Please specify a valid deposit amount');
      return;
    }

    setIsDepositLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not contact payment gateways. Check your internet connection.');
        setIsDepositLoading(false);
        return;
      }

      // 1. Fetch Order details from express backend
      const res = await apiCreateDepositOrder(numAmt);

      // 2. Open standard popup modal
      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        name: 'Crevio Wallet',
        description: 'Instant Account Sandbox Top-up',
        order_id: res.orderId,
        handler: async (response: any) => {
          try {
            // 3. Post parameters back to verify cryptographically
            const verifyRes = await apiVerifyDepositPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: numAmt
            });

            if (verifyRes.success) {
              toast.success(`🎉 Deposit Confirmed! Added ${formatAmount(numAmt)} to your account available balance.`);
              setDepositAmount('');
              setShowDepositModal(false);
              await fetchWalletDetails();
            }
          } catch (err: any) {
            toast.error(err?.message || 'Secure signature verification rejected.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: {
          color: '#6366f1'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create deposit order. Retry.');
    } finally {
      setIsDepositLoading(false);
    }
  };

  // Perform Simulated banking cashout
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(withdrawAmount);
    if (!numAmt || isNaN(numAmt) || numAmt <= 0) {
      toast.error('Please specify a valid withdrawal amount');
      return;
    }

    if (wallet && parseFloat(wallet.available_balance as string) < numAmt) {
      toast.error('Insufficient wallet balance to request this cashout');
      return;
    }

    const details = withdrawMethod === 'upi' ? upiId : `${bankAccount} (IFSC: ${bankIfsc})`;
    if (withdrawMethod === 'upi' && !upiId.includes('@')) {
      toast.error('Please provide a valid UPI handle (e.g. user@okhdfc)');
      return;
    }
    if (withdrawMethod === 'bank' && (!bankAccount || !bankIfsc)) {
      toast.error('Please input complete bank account and IFSC details');
      return;
    }

    setIsWithdrawLoading(true);
    setWithdrawalStep(1); // Ledger lookup

    try {
      // Step 1: Ledger Lookup simulation (1s delay)
      await new Promise(r => setTimeout(resolve => r(true), 1000));
      setWithdrawalStep(2); // RBI clearing connection

      // Step 2: Connection simulation (1.2s delay)
      await new Promise(r => setTimeout(resolve => r(true), 1200));
      setWithdrawalStep(3); // Authorization checks

      // Step 3: Auth simulation (1s delay)
      await new Promise(r => setTimeout(resolve => r(true), 1000));

      // Post actual database debit
      const res = await apiWithdrawFunds({
        amount: numAmt,
        paymentMethod: withdrawMethod,
        paymentDetails: details
      });

      if (res.success) {
        setWithdrawalStep(4); // Success!
        await new Promise(r => setTimeout(resolve => r(true), 1000));
        
        toast.success(`💸 Withdrawal completed! Transferred ${formatAmount(numAmt)} to your coordinates.`);
        setWithdrawAmount('');
        setUpiId('');
        setBankAccount('');
        setBankIfsc('');
        setShowWithdrawModal(false);
        await fetchWalletDetails();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to authorize cash-out request.');
    } finally {
      setIsWithdrawLoading(false);
      setWithdrawalStep(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Wallet Hub 
            <Sparkles className="w-5 h-5 text-accent animate-pulse-soft" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Directly top-up funds, secure campaign escrows, or request bank transfers</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent/80 rounded-xl shadow-glow-accent transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" /> Add Sandbox Funds
          </button>
          
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-muted hover:bg-muted/80 rounded-xl border transition-all duration-200"
          >
            <ArrowDownCircle className="w-4 h-4" /> Withdraw Earnings
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
          <div className="w-12 h-12 rounded-full border-4 border-muted border-t-accent animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Syncing ledger journals...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Account Metrics displays */}
          <div className="grid md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Available Balance</p>
                <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                  {wallet ? formatAmount(wallet.available_balance) : '₹0'}
                </h3>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Instant top-ups operational
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
                <Wallet className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Campaign Holds Locked</p>
                <h3 className="text-3xl font-extrabold text-accent tracking-tight">
                  {wallet ? formatAmount(wallet.pending_escrow_balance) : '₹0'}
                </h3>
                <p className="text-xs text-muted-foreground">Immutable contract locks active</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                <Lock className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Portfolio Net</p>
                <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                  {wallet ? formatAmount(parseFloat(wallet.available_balance as string) + parseFloat(wallet.pending_escrow_balance as string)) : '₹0'}
                </h3>
                <p className="text-xs text-muted-foreground">Audit Signature Key: SHA256::HMAC</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-muted-foreground/10">
                <CreditCard className="w-5 h-5" />
              </div>
            </motion.div>
          </div>

          {/* Earnings charts area */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card-elevated p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-accent" /> Asset Trend Ledger
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Live visualization of play credit transactions</p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--accent))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="rgb(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff'
                    }} 
                    formatter={(val) => [formatAmount(val as number), 'Balance']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="rgb(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Double-Entry Transaction list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-5 border-b pb-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="w-4 h-4 text-accent" /> Transaction Audit Log
              </h3>
              <p className="text-xs text-muted-foreground">Total records: {transactions.length}</p>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-muted/25 rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">No financial events recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-muted-foreground border-b border-muted/50 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {transactions.map((txn) => {
                      const amt = parseFloat(txn.amount as string);
                      const isCredit = amt >= 0;
                      return (
                        <tr key={txn.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                            {txn.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              txn.txn_type === 'seed' 
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : txn.txn_type === 'deposit' || txn.txn_type === 'escrow_credit' || txn.txn_type === 'escrow_refund'
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-warning/10 text-warning border border-warning/20'
                            }`}>
                              {txn.txn_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium max-w-[280px] truncate">
                            {txn.description}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {new Date(txn.created_at).toLocaleString('en-IN')}
                          </td>
                          <td className={`py-3.5 px-4 font-bold text-right ${isCredit ? 'text-success' : 'text-warning'}`}>
                            <span className="inline-flex items-center gap-1 justify-end">
                              {isCredit ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 text-warning" />
                              )}
                              {formatAmount(Math.abs(amt))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* --- ADD SANDBOX FUNDS MODAL --- */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDepositing && setShowDepositModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card-elevated w-full max-w-md p-6 relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-1.5">
                    <PlusCircle className="w-5 h-5 text-accent" />
                    Load Play Funds via Razorpay
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Top-up your wallet using Test Mode/Sandbox</p>
                </div>
                <button
                  disabled={isDepositing}
                  onClick={() => setShowDepositModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg bg-muted/40 hover:bg-muted/80 disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top-up Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100000"
                      value={depositAmount}
                      disabled={isDepositing}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-muted/40 border border-muted-foreground/10 hover:border-muted-foreground/20 focus:border-accent rounded-xl py-3 pl-8 pr-4 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Loads instant, simulated checkout portal supported with test cards.</p>
                </div>

                <button
                  type="submit"
                  disabled={isDepositing || !depositAmount}
                  className="w-full py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-accent flex items-center justify-center gap-2"
                >
                  {isDepositing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Launching Checkout Gate...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Proceed to payment
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- WITHDRAW EARNINGS BANK TRANSFER MODAL --- */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isWithdrawing && setShowWithdrawModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card-elevated w-full max-w-md p-6 relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-1.5">
                    <ArrowDownCircle className="w-5 h-5 text-accent" />
                    Request Bank Payout Transfer
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Disburse earnings to external coordinates</p>
                </div>
                <button
                  disabled={isWithdrawing}
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg bg-muted/40 hover:bg-muted/80 disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {withdrawalStep > 0 && withdrawalStep < 4 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-accent animate-spin" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-foreground">
                      {withdrawalStep === 1 && '🔍 Verifying available balances...'}
                      {withdrawalStep === 2 && '🏦 Establishing secure RBI IMPS Channel...'}
                      {withdrawalStep === 3 && '🛰️ Authenticating ledger transaction nodes...'}
                    </p>
                    <p className="text-xs text-muted-foreground">Holding secure link. Please keep tab open.</p>
                  </div>
                </div>
              ) : withdrawalStep === 4 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success animate-bounce-soft">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-success">Transfer Successful!</p>
                    <p className="text-xs text-muted-foreground">Ledger records successfully balances and logs transaction.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  {/* Select Payment Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('upi')}
                      className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                        withdrawMethod === 'upi'
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-muted/40 hover:bg-muted/60 border-transparent'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> UPI Handle
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank')}
                      className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                        withdrawMethod === 'bank'
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-muted/40 hover:bg-muted/60 border-transparent'
                      }`}
                    >
                      <Building className="w-4 h-4" /> IMPS Bank account
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Cashout Amount (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                          type="number"
                          required
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="e.g. 10000"
                          className="w-full bg-muted/40 border border-muted-foreground/10 hover:border-muted-foreground/20 focus:border-accent rounded-xl py-2.5 pl-7 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>

                    {withdrawMethod === 'upi' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">UPI Virtual Address (VPA)</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. name@okhdfc"
                          className="w-full bg-muted/40 border border-muted-foreground/10 focus:border-accent rounded-xl py-2.5 px-4 text-xs outline-none"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Account Number</label>
                          <input
                            type="text"
                            required
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            placeholder="e.g. 5010023411442"
                            className="w-full bg-muted/40 border border-muted-foreground/10 focus:border-accent rounded-xl py-2.5 px-4 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">IFSC Code</label>
                          <input
                            type="text"
                            required
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value)}
                            placeholder="e.g. HDFC0000124"
                            className="w-full bg-muted/40 border border-muted-foreground/10 focus:border-accent rounded-xl py-2.5 px-4 text-xs outline-none uppercase"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isWithdrawing || !withdrawAmount}
                    className="w-full py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-accent flex items-center justify-center gap-1.5"
                  >
                    Initiate Wire Transfer
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
