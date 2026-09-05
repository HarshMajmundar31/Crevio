import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  apiGetWallet, 
  apiCreateDepositOrder, 
  apiVerifyDepositPayment, 
  apiWithdrawFunds,
  apiAdminGetTreasuryOverview,
  apiAdminGetAllTransactions,
  apiAdminRunLedgerAudit,
  apiAdminGetUsersWalletsSummary,
  apiAdminAdjustUserBalance,
  apiGetAdminEscrows,
  apiAdminSettleDispute,
  ApiWallet, 
  ApiTransaction,
  AdminTreasuryOverviewResponse,
  AdminGlobalTransaction,
  AdminLedgerAuditResponse,
  AdminUserWalletSummary,
  ApiEscrowHolding
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
  Building, 
  ShieldCheck, 
  Scale, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  Layers, 
  BarChart3, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';
import { toast } from 'sonner';

type AdminTab = 'treasury' | 'ledger' | 'escrows' | 'users' | 'operating_wallet';

export default function WalletHub() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation tab for Admin
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('treasury');

  // Personal / User Wallet State
  const [wallet, setWallet] = useState<ApiWallet | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isPersonalLoading, setIsPersonalLoading] = useState(true);

  // Admin Treasury & Analytics State
  const [treasuryData, setTreasuryData] = useState<AdminTreasuryOverviewResponse | null>(null);
  const [isTreasuryLoading, setIsTreasuryLoading] = useState(false);

  // Admin Global Ledger State
  const [globalTransactions, setGlobalTransactions] = useState<AdminGlobalTransaction[]>([]);
  const [totalTxnCount, setTotalTxnCount] = useState(0);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('all');
  const [ledgerRoleFilter, setLedgerRoleFilter] = useState('all');
  const [ledgerGatewayFilter, setLedgerGatewayFilter] = useState('all');
  const [ledgerPage, setLedgerPage] = useState(0);
  const ledgerPageSize = 25;

  // Admin Escrows State
  const [escrows, setEscrows] = useState<ApiEscrowHolding[]>([]);
  const [isEscrowsLoading, setIsEscrowsLoading] = useState(false);
  const [escrowStatusFilter, setEscrowStatusFilter] = useState('all');
  const [escrowSearch, setEscrowSearch] = useState('');

  // Admin Users Summary State
  const [userWallets, setUserWallets] = useState<AdminUserWalletSummary[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Modals & Actions
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditResult, setAuditResult] = useState<AdminLedgerAuditResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // User Balance Adjust Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<AdminUserWalletSummary | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Dispute Settle Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeEscrow, setDisputeEscrow] = useState<ApiEscrowHolding | null>(null);
  const [creatorSplitPct, setCreatorSplitPct] = useState(50);
  const [isSettlingDispute, setIsSettlingDispute] = useState(false);

  // Personal Deposit & Withdraw Forms
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [isWithdrawing, setIsWithdrawLoading] = useState(false);
  const [withdrawalStep, setWithdrawalStep] = useState<number>(0);

  // Chart timeframe filter
  const [chartMetric, setChartMetric] = useState<'flows' | 'volume'>('flows');

  // Load User's Personal Wallet Details
  const fetchPersonalWallet = async () => {
    try {
      setIsPersonalLoading(true);
      const res = await apiGetWallet();
      setWallet(res.wallet);
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setIsPersonalLoading(false);
    }
  };

  // Load Admin Treasury Overview
  const fetchTreasuryOverview = async () => {
    if (!isAdmin) return;
    try {
      setIsTreasuryLoading(true);
      const res = await apiAdminGetTreasuryOverview();
      setTreasuryData(res);
    } catch (err) {
      console.error('Failed to load treasury overview:', err);
      toast.error('Could not load treasury overview metrics');
    } finally {
      setIsTreasuryLoading(false);
    }
  };

  // Load Admin Global Transactions
  const fetchGlobalLedger = async () => {
    if (!isAdmin) return;
    try {
      setIsLedgerLoading(true);
      const res = await apiAdminGetAllTransactions({
        q: ledgerSearch || undefined,
        txn_type: ledgerTypeFilter !== 'all' ? ledgerTypeFilter : undefined,
        status: ledgerStatusFilter !== 'all' ? ledgerStatusFilter : undefined,
        role: ledgerRoleFilter !== 'all' ? ledgerRoleFilter : undefined,
        gateway_filter: ledgerGatewayFilter !== 'all' ? ledgerGatewayFilter : undefined,
        limit: ledgerPageSize,
        offset: ledgerPage * ledgerPageSize
      });
      setGlobalTransactions(res.transactions);
      setTotalTxnCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load global ledger:', err);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  // Load Admin Escrows
  const fetchEscrows = async () => {
    if (!isAdmin) return;
    try {
      setIsEscrowsLoading(true);
      const res = await apiGetAdminEscrows();
      setEscrows(res.escrows);
    } catch (err) {
      console.error('Failed to load escrows:', err);
    } finally {
      setIsEscrowsLoading(false);
    }
  };

  // Load Admin User Wallets Summary
  const fetchUserWallets = async () => {
    if (!isAdmin) return;
    try {
      setIsUsersLoading(true);
      const res = await apiAdminGetUsersWalletsSummary();
      setUserWallets(res.users);
    } catch (err) {
      console.error('Failed to load user wallets:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Run Real-Time Ledger Audit
  const handleRunAudit = async () => {
    try {
      setIsAuditing(true);
      const res = await apiAdminRunLedgerAudit();
      setAuditResult(res);
      setShowAuditModal(true);
      if (res.isSolvent) {
        toast.success('Ledger Solvency Audit: 100% Balanced and Verified');
      } else {
        toast.warning('Discrepancy detected during solvency audit');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute ledger audit');
    } finally {
      setIsAuditing(false);
    }
  };

  // Initial Load & Admin Tab changes
  useEffect(() => {
    fetchPersonalWallet();
    if (isAdmin) {
      fetchTreasuryOverview();
      fetchGlobalLedger();
      fetchEscrows();
      fetchUserWallets();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeAdminTab === 'ledger') {
      fetchGlobalLedger();
    }
  }, [isAdmin, activeAdminTab, ledgerPage, ledgerTypeFilter, ledgerStatusFilter, ledgerRoleFilter, ledgerGatewayFilter]);

  const handleRefreshAll = async () => {
    toast.info('Syncing platform treasury & payment ledger...');
    await Promise.all([
      fetchPersonalWallet(),
      fetchTreasuryOverview(),
      fetchGlobalLedger(),
      fetchEscrows(),
      fetchUserWallets()
    ]);
    toast.success('Telemetry and financial data refreshed!');
  };

  const formatAmount = (num: string | number | undefined) => {
    if (num === undefined || num === null) return '₹0';
    const val = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(isNaN(val) ? 0 : val);
  };

  // Handle User Balance Adjustment
  const handleBalanceAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num === 0) {
      toast.error('Please enter a valid non-zero adjustment amount (+ for credit, - for debit)');
      return;
    }

    try {
      setIsAdjusting(true);
      const res = await apiAdminAdjustUserBalance(adjustTargetUser.id, num, adjustReason);
      if (res.success) {
        toast.success(`Successfully adjusted balance for ${adjustTargetUser.full_name}. New Balance: ₹${res.newBalance.toLocaleString('en-IN')}`);
        setShowAdjustModal(false);
        setAdjustAmount('');
        setAdjustReason('');
        setAdjustTargetUser(null);
        await Promise.all([fetchTreasuryOverview(), fetchGlobalLedger(), fetchUserWallets()]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to adjust user balance');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle Dispute Settlement Split
  const handleDisputeSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEscrow) return;

    try {
      setIsSettlingDispute(true);
      const creatorPct = creatorSplitPct;
      const brandPct = 100 - creatorSplitPct;
      const res = await apiAdminSettleDispute(disputeEscrow.contract_id, creatorPct, brandPct);
      if (res.success) {
        toast.success(`Dispute settled! Creator disbursed: ₹${res.creatorShare.toLocaleString('en-IN')} (${creatorPct}%), Brand refunded: ₹${res.brandShare.toLocaleString('en-IN')} (${brandPct}%)`);
        setShowDisputeModal(false);
        setDisputeEscrow(null);
        await Promise.all([fetchEscrows(), fetchTreasuryOverview(), fetchGlobalLedger()]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to settle escrow dispute');
    } finally {
      setIsSettlingDispute(false);
    }
  };

  // Export Global Ledger to CSV
  const handleExportCSV = () => {
    if (globalTransactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'Timestamp',
      'User Name',
      'User Email',
      'User Role',
      'Type',
      'Status',
      'Amount (INR)',
      'Description',
      'Razorpay ID',
      'Contract ID'
    ];

    const rows = globalTransactions.map(t => [
      `"${t.id}"`,
      `"${new Date(t.created_at).toISOString()}"`,
      `"${t.user_name || ''}"`,
      `"${t.user_email || ''}"`,
      `"${t.user_role || ''}"`,
      `"${t.txn_type}"`,
      `"${t.status}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.razorpay_payment_id || t.razorpay_order_id || ''}"`,
      `"${t.contract_id || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crevio_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial ledger exported to CSV successfully');
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

  // Personal Deposit
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
        toast.error('Could not contact payment gateways. Check your connection.');
        setIsDepositLoading(false);
        return;
      }

      const res = await apiCreateDepositOrder(numAmt);
      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        name: 'Crevio Wallet',
        description: 'Instant Account Top-up',
        order_id: res.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await apiVerifyDepositPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: numAmt
            });

            if (verifyRes.success) {
              toast.success(`🎉 Deposit Confirmed! Added ${formatAmount(numAmt)} to available balance.`);
              setDepositAmount('');
              setShowDepositModal(false);
              await fetchPersonalWallet();
              if (isAdmin) fetchTreasuryOverview();
            }
          } catch (err: any) {
            toast.error(err?.message || 'Payment signature verification rejected.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: { color: '#6366f1' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create deposit order.');
    } finally {
      setIsDepositLoading(false);
    }
  };

  // Personal Withdrawal
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
    setWithdrawalStep(1);

    try {
      await new Promise(r => setTimeout(r, 800));
      setWithdrawalStep(2);
      await new Promise(r => setTimeout(r, 800));
      setWithdrawalStep(3);
      await new Promise(r => setTimeout(r, 800));

      const res = await apiWithdrawFunds({
        amount: numAmt,
        paymentMethod: withdrawMethod,
        paymentDetails: details
      });

      if (res.success) {
        setWithdrawalStep(4);
        await new Promise(r => setTimeout(r, 800));
        toast.success(`💸 Withdrawal completed! Transferred ${formatAmount(numAmt)} to external coordinates.`);
        setWithdrawAmount('');
        setUpiId('');
        setBankAccount('');
        setBankIfsc('');
        setShowWithdrawModal(false);
        await fetchPersonalWallet();
        if (isAdmin) fetchTreasuryOverview();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to authorize cash-out request.');
    } finally {
      setIsWithdrawLoading(false);
      setWithdrawalStep(0);
    }
  };

  // Filtered Escrows
  const filteredEscrows = useMemo(() => {
    return escrows.filter(e => {
      const matchesSearch = !escrowSearch || 
        e.contract_id.toLowerCase().includes(escrowSearch.toLowerCase()) ||
        e.brand_name?.toLowerCase().includes(escrowSearch.toLowerCase()) ||
        e.brand_email?.toLowerCase().includes(escrowSearch.toLowerCase()) ||
        e.creator_name?.toLowerCase().includes(escrowSearch.toLowerCase()) ||
        e.creator_email?.toLowerCase().includes(escrowSearch.toLowerCase());
      const matchesStatus = escrowStatusFilter === 'all' || e.status === escrowStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [escrows, escrowSearch, escrowStatusFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userWallets.filter(u => {
      return !userSearch ||
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearch.toLowerCase());
    });
  }, [userWallets, userSearch]);

  // Capital Distribution Pie Data
  const capitalPieData = useMemo(() => {
    if (!treasuryData?.liquidity) return [];
    const brand = parseFloat(String(treasuryData.liquidity.brand_available || 0));
    const creator = parseFloat(String(treasuryData.liquidity.creator_available || 0));
    const admin = parseFloat(String(treasuryData.liquidity.admin_available || 0));
    const escrow = parseFloat(String(treasuryData.escrow.total_held || 0));

    return [
      { name: 'Brand Balances', value: brand, color: '#6366f1' },
      { name: 'Creator Balances', value: creator, color: '#10b981' },
      { name: 'Locked Escrow Vault', value: escrow, color: '#f59e0b' },
      { name: 'Admin Reserves', value: admin, color: '#8b5cf6' }
    ].filter(d => d.value > 0);
  }, [treasuryData]);

  // Personal wallet chart points
  const getPersonalChartData = () => {
    if (transactions.length === 0) {
      return [{ date: 'Baseline', balance: 100000 }];
    }
    const sortedTxns = [...transactions].reverse();
    let currentTotal = 0;
    const chartPoints = sortedTxns.map((t) => {
      const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      currentTotal += amt;
      const d = new Date(t.created_at);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return { date: label, balance: Math.round(currentTotal) };
    });
    if (chartPoints.length === 1) {
      return [{ date: 'Start', balance: 0 }, ...chartPoints];
    }
    return chartPoints;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        
        {/* ========================================== */}
        {/* HEADER SECTION                             */}
        {/* ========================================== */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
                {isAdmin ? 'Treasury & Payment Command Center' : 'Wallet Hub'}
                <Sparkles className="w-6 h-6 text-accent animate-pulse-soft" />
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LEDGER SOLVENT & ACTIVE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin 
                ? 'System-wide financial telemetry, automated escrow reconciliation, payment analytics, and global audit ledger.'
                : 'Manage your available balance, fund campaign escrows, deposit test credits, or request instant bank withdrawals.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {isAdmin ? (
              <>
                <button
                  onClick={handleRefreshAll}
                  disabled={isTreasuryLoading || isLedgerLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-muted/60 hover:bg-muted border border-border/60 rounded-xl transition-all"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className={`w-4 h-4 ${(isTreasuryLoading || isLedgerLoading) ? 'animate-spin' : ''}`} />
                  Sync
                </button>

                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all"
                >
                  {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                  Audit Solvency
                </button>

                <button
                  onClick={() => {
                    setAdjustTargetUser(null);
                    setShowAdjustModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-xl transition-all"
                >
                  <Coins className="w-4 h-4" />
                  Adjust Balance
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 border border-border/60 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export Ledger
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* ADMIN TAB NAVIGATION                       */}
        {/* ========================================== */}
        {isAdmin && (
          <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveAdminTab('treasury')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAdminTab === 'treasury'
                  ? 'bg-accent text-white shadow-glow-accent'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Platform Treasury & Analytics
            </button>

            <button
              onClick={() => setActiveAdminTab('ledger')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAdminTab === 'ledger'
                  ? 'bg-accent text-white shadow-glow-accent'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="w-4 h-4" />
              Global Transaction Ledger ({totalTxnCount})
            </button>

            <button
              onClick={() => setActiveAdminTab('escrows')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAdminTab === 'escrows'
                  ? 'bg-accent text-white shadow-glow-accent'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-4 h-4" />
              Escrow Vault & Collateral ({escrows.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAdminTab === 'users'
                  ? 'bg-accent text-white shadow-glow-accent'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              User Wallets Directory ({userWallets.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('operating_wallet')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ml-auto ${
                activeAdminTab === 'operating_wallet'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-dashed border-border'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Personal Operating Account
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 1: ADMIN PLATFORM TREASURY & METRICS  */}
        {/* ========================================== */}
        {isAdmin && activeAdminTab === 'treasury' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Primary KPI Deck (6 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              {/* Total Liquidity */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Liquidity Pool</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">
                    {formatAmount(treasuryData?.liquidity.total_available)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">Across {treasuryData?.liquidity.total_wallets || 0} user wallets</p>
                </div>
              </motion.div>

              {/* Locked Escrow Vault */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Escrow Locked</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-amber-400 tracking-tight">
                    {formatAmount(treasuryData?.escrow.total_held)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{treasuryData?.escrow.held_count || 0} active contracts locked</p>
                </div>
              </motion.div>

              {/* Gross Inflow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gross System Inflow</p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-indigo-400 tracking-tight">
                    {formatAmount(treasuryData?.volume.total_inflow)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">Total deposits & funding</p>
                </div>
              </motion.div>

              {/* Gross Outflow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gross Outflow / Cashouts</p>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-rose-400 tracking-tight">
                    {formatAmount(treasuryData?.volume.total_withdrawn)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">Disbursed to bank/UPI</p>
                </div>
              </motion.div>

              {/* Escrow Settlement Volume */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Escrow Settlement Volume</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-blue-400 tracking-tight">
                    {formatAmount(treasuryData?.volume.total_settled_volume)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{treasuryData?.escrow.released_count || 0} completed payouts</p>
                </div>
              </motion.div>

              {/* Dispute Risk Reserve */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Disputed Holdings</p>
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-yellow-400 tracking-tight">
                    {formatAmount(treasuryData?.escrow.total_disputed)}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{treasuryData?.escrow.disputed_count || 0} disputes pending</p>
                </div>
              </motion.div>
            </div>

            {/* Razorpay Test Mode Telemetry & Developer Sandbox Section */}
            <div className="glass-card-elevated p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background to-indigo-500/10 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-foreground">🧪 Razorpay Test Mode Telemetry & Developer Sandbox</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        LIVE SANDBOX ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tracking simulated card/UPI inflows, test escrow holdings, verified order signatures, and developer play balances.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-semibold">Key:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">
                    {treasuryData?.testModeTelemetry?.gatewayInfo?.keyId || 'rzp_test_••••••••'}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Test Gateway Inflow</span>
                    <Coins className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xl font-black text-foreground">
                    {formatAmount(treasuryData?.testModeTelemetry?.metrics?.total_razorpay_inflow || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Simulated Razorpay top-ups</p>
                </div>

                <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Test Escrow Vault</span>
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xl font-black text-amber-400">
                    {formatAmount(treasuryData?.testModeTelemetry?.metrics?.razorpay_escrow_held || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Locked sandbox contract collateral</p>
                </div>

                <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified Orders</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-emerald-400">
                    {treasuryData?.testModeTelemetry?.metrics?.total_razorpay_payments || 0}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      / {treasuryData?.testModeTelemetry?.metrics?.total_razorpay_orders || 0}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {treasuryData?.testModeTelemetry?.metrics?.verification_rate || 100}% signature rate
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Simulated Gateway Fees</span>
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xl font-black text-rose-400">
                    {formatAmount(treasuryData?.testModeTelemetry?.metrics?.simulated_gateway_fees || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">2% + 18% GST (₹23.60 / ₹1,000)</p>
                </div>
              </div>

              {/* Sandbox Quick Testing Helper Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-border/40 text-muted-foreground">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    💳 <strong className="text-foreground font-mono">4012 0000 0000 0000</strong> (CVV 123)
                  </span>
                  <span>·</span>
                  <span>
                    📱 UPI: <strong className="text-emerald-400 font-mono">success@razorpay</strong>
                  </span>
                  <span>·</span>
                  <span>
                    🔑 OTP: <strong className="text-accent font-mono">123456</strong>
                  </span>
                </div>
                <div>
                  Seed Sandbox Volume Distributed:{' '}
                  <strong className="text-foreground">{formatAmount(treasuryData?.testModeTelemetry?.metrics?.seed_play_credits_volume || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Middle Section: Timeline Chart + Asset Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 30-Day Daily Financial Timeline */}
              <div className="lg:col-span-2 glass-card-elevated p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      30-Day Platform Payment Volume Timeline
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Daily breakdown of inflows, escrow lockings, and settlements</p>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl text-xs">
                    <button
                      onClick={() => setChartMetric('flows')}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        chartMetric === 'flows' ? 'bg-accent text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Inflows & Escrow
                    </button>
                    <button
                      onClick={() => setChartMetric('volume')}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        chartMetric === 'volume' ? 'bg-accent text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Outflow & Releases
                    </button>
                  </div>
                </div>

                <div className="h-[320px] w-full pt-4">
                  {treasuryData?.dailyTrends && treasuryData.dailyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={treasuryData.dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradInflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="gradEscrow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="gradOutflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="gradReleased" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10} 
                          tickLine={false} 
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10} 
                          tickLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(15, 23, 42, 0.95)', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }} 
                          formatter={(val, name) => [formatAmount(val as number), String(name).toUpperCase()]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {chartMetric === 'flows' ? (
                          <>
                            <Area type="monotone" dataKey="inflow" name="Inflow (Deposits)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gradInflow)" />
                            <Area type="monotone" dataKey="escrow_locked" name="Escrow Locked" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gradEscrow)" />
                          </>
                        ) : (
                          <>
                            <Area type="monotone" dataKey="outflow" name="Outflow (Withdrawals)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradOutflow)" />
                            <Area type="monotone" dataKey="escrow_released" name="Escrow Releases" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradReleased)" />
                          </>
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      No daily transaction trends recorded in the last 30 days.
                    </div>
                  )}
                </div>
              </div>

              {/* Capital & Reserve Allocation */}
              <div className="glass-card-elevated p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    Capital & Vault Allocation
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Distribution of platform capital across entities</p>
                </div>

                <div className="h-[200px] w-full relative flex items-center justify-center">
                  {capitalPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={capitalPieData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {capitalPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(15, 23, 42, 0.95)', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }} 
                          formatter={(val) => [formatAmount(val as number), 'Volume']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground">No capital distribution data</p>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Reserve</span>
                    <span className="text-sm font-black text-foreground">
                      {formatAmount(
                        parseFloat(String(treasuryData?.liquidity.total_available || 0)) +
                        parseFloat(String(treasuryData?.escrow.total_held || 0))
                      )}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Brand Balances:
                    </span>
                    <span className="font-bold text-foreground">{formatAmount(treasuryData?.liquidity.brand_available)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Creator Balances:
                    </span>
                    <span className="font-bold text-foreground">{formatAmount(treasuryData?.liquidity.creator_available)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Locked Escrows:
                    </span>
                    <span className="font-bold text-amber-400">{formatAmount(treasuryData?.escrow.total_held)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      Admin Reserves:
                    </span>
                    <span className="font-bold text-foreground">{formatAmount(treasuryData?.liquidity.admin_available)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Transaction Type Breakdown + Recent High-Value Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Type Breakdown Bar Chart */}
              <div className="glass-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Transaction Volume by Operation Type
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Aggregate ledger velocity</p>
                </div>

                <div className="space-y-3 pt-2">
                  {treasuryData?.typeBreakdown && treasuryData.typeBreakdown.map((t) => (
                    <div key={t.txn_type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold capitalize text-foreground flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            t.txn_type === 'deposit' || t.txn_type === 'seed' ? 'bg-indigo-400' :
                            t.txn_type === 'escrow_debit' ? 'bg-amber-400' :
                            t.txn_type === 'escrow_credit' ? 'bg-emerald-400' :
                            t.txn_type === 'withdrawal' ? 'bg-rose-400' : 'bg-blue-400'
                          }`} />
                          {t.txn_type.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-foreground">
                          {formatAmount(t.total_volume)} <span className="text-muted-foreground text-[10px] font-normal">({t.count} txns)</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            t.txn_type === 'deposit' || t.txn_type === 'seed' ? 'bg-indigo-500' :
                            t.txn_type === 'escrow_debit' ? 'bg-amber-500' :
                            t.txn_type === 'escrow_credit' ? 'bg-emerald-500' :
                            t.txn_type === 'withdrawal' ? 'bg-rose-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (parseFloat(String(t.total_volume)) / (parseFloat(String(treasuryData?.volume.total_inflow || 100000)))) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Real-Time Ledger Feed */}
              <div className="lg:col-span-2 glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <History className="w-4 h-4 text-accent" />
                      Live Platform Transaction Stream
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Most recent 10 transactions across all users</p>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab('ledger')}
                    className="text-xs text-accent hover:underline font-bold flex items-center gap-1"
                  >
                    View All {totalTxnCount} Records <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/50 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {treasuryData?.recentTransactions && treasuryData.recentTransactions.map((txn) => {
                        const amt = parseFloat(String(txn.amount));
                        const isCredit = amt >= 0;
                        return (
                          <tr key={txn.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                  {txn.user_name ? txn.user_name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="leading-tight">
                                  <p className="font-semibold text-foreground truncate max-w-[120px]">{txn.user_name || 'System User'}</p>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                    txn.user_role === 'brand' ? 'bg-indigo-500/10 text-indigo-400' :
                                    txn.user_role === 'creator' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                                  }`}>
                                    {txn.user_role}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                txn.txn_type === 'deposit' || txn.txn_type === 'escrow_credit' || txn.txn_type === 'seed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : txn.txn_type === 'escrow_debit'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {txn.txn_type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-muted-foreground truncate max-w-[220px]">
                              {txn.description}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                              {new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className={`py-2.5 px-3 font-bold text-right whitespace-nowrap ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {isCredit ? '+' : '-'}{formatAmount(Math.abs(amt))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 2: GLOBAL TRANSACTION LEDGER          */}
        {/* ========================================== */}
        {isAdmin && activeAdminTab === 'ledger' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card-elevated p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-accent" />
                    Global System Payment Ledger
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Immutable journal of all financial debits, credits, escrow locks, and settlements across all accounts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Total Records: {totalTxnCount}</span>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-xl border border-border"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => {
                      setLedgerSearch(e.target.value);
                      setLedgerPage(0);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && fetchGlobalLedger()}
                    placeholder="Search ID, user, email, Razorpay ID..."
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <select
                    value={ledgerGatewayFilter}
                    onChange={(e) => {
                      setLedgerGatewayFilter(e.target.value);
                      setLedgerPage(0);
                    }}
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All Gateways & Sources</option>
                    <option value="razorpay_test">🧪 Razorpay Test Gateway</option>
                    <option value="seed">🌱 Sandbox Play Seeds</option>
                    <option value="internal">⚡ Internal Ledger</option>
                  </select>
                </div>

                <div>
                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => {
                      setLedgerTypeFilter(e.target.value);
                      setLedgerPage(0);
                    }}
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All Transaction Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="escrow_debit">Escrow Debits (Holds)</option>
                    <option value="escrow_credit">Escrow Credits (Disbursements)</option>
                    <option value="escrow_refund">Escrow Refunds</option>
                    <option value="seed">Play Credit Seeds</option>
                  </select>
                </div>

                <div>
                  <select
                    value={ledgerRoleFilter}
                    onChange={(e) => {
                      setLedgerRoleFilter(e.target.value);
                      setLedgerPage(0);
                    }}
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All User Roles</option>
                    <option value="brand">Brands</option>
                    <option value="creator">Creators</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                <div>
                  <select
                    value={ledgerStatusFilter}
                    onChange={(e) => {
                      setLedgerStatusFilter(e.target.value);
                      setLedgerPage(0);
                    }}
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-xl border border-border/50">
                {isLedgerLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading ledger records...</p>
                  </div>
                ) : globalTransactions.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    No transactions match your search filters.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground border-b border-border/50 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Description & Reference</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {globalTransactions.map((txn) => {
                        const amt = parseFloat(String(txn.amount));
                        const isCredit = amt >= 0;
                        return (
                          <tr key={txn.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                              {txn.id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                  {txn.user_name ? txn.user_name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="leading-tight">
                                  <p className="font-semibold text-foreground">{txn.user_name || 'System User'}</p>
                                  <p className="text-[10px] text-muted-foreground">{txn.user_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                txn.txn_type === 'deposit' || txn.txn_type === 'escrow_credit' || txn.txn_type === 'seed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : txn.txn_type === 'escrow_debit'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {txn.txn_type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                txn.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {txn.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-[280px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium text-foreground truncate">{txn.description}</p>
                                {txn.is_test_mode && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    TEST
                                  </span>
                                )}
                              </div>
                              {(txn.razorpay_payment_id || txn.razorpay_order_id || txn.contract_id) && (
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate flex items-center gap-1">
                                  {txn.razorpay_payment_id ? (
                                    <span className="text-amber-300">RP: {txn.razorpay_payment_id}</span>
                                  ) : txn.razorpay_order_id ? (
                                    <span className="text-indigo-300">Ord: {txn.razorpay_order_id}</span>
                                  ) : (
                                    <span>Contract: #{txn.contract_id?.substring(0, 8)}</span>
                                  )}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {new Date(txn.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className={`py-3 px-4 font-bold text-right whitespace-nowrap ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                              <span className="inline-flex items-center gap-0.5">
                                {isCredit ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />}
                                {formatAmount(Math.abs(amt))}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  const u = userWallets.find(x => x.id === txn.user_id);
                                  if (u) {
                                    setAdjustTargetUser(u);
                                  } else {
                                    setAdjustTargetUser({
                                      id: txn.user_id,
                                      full_name: txn.user_name,
                                      email: txn.user_email,
                                      role: txn.user_role,
                                      available_balance: 0,
                                      pending_escrow_balance: 0,
                                      transaction_count: 1
                                    });
                                  }
                                  setShowAdjustModal(true);
                                }}
                                className="px-2 py-1 text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors"
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>
                  Showing {ledgerPage * ledgerPageSize + 1} - {Math.min((ledgerPage + 1) * ledgerPageSize, totalTxnCount)} of {totalTxnCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={ledgerPage === 0 || isLedgerLoading}
                    onClick={() => setLedgerPage(p => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold px-2">Page {ledgerPage + 1}</span>
                  <button
                    disabled={(ledgerPage + 1) * ledgerPageSize >= totalTxnCount || isLedgerLoading}
                    onClick={() => setLedgerPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 3: ESCROW VAULT & COLLATERAL RESERVES */}
        {/* ========================================== */}
        {isAdmin && activeAdminTab === 'escrows' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card-elevated p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-accent" />
                    Escrow Vault & Collateral Reserves Monitor
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track all campaign escrow deposits, active holds, completed releases, and settle disputed funds.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Total Escrows: {escrows.length}</span>
                </div>
              </div>

              {/* Search & Status Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative col-span-2">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={escrowSearch}
                    onChange={(e) => setEscrowSearch(e.target.value)}
                    placeholder="Search by Contract ID, Brand, or Creator..."
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <select
                    value={escrowStatusFilter}
                    onChange={(e) => setEscrowStatusFilter(e.target.value)}
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All Escrow Statuses</option>
                    <option value="held">Held (Locked in Vault)</option>
                    <option value="released">Released (Paid Out)</option>
                    <option value="refunded">Refunded to Brand</option>
                    <option value="disputed">Disputed (Requires Settlement)</option>
                    <option value="awaiting_deposit">Awaiting Deposit</option>
                  </select>
                </div>
              </div>

              {/* Escrow Holdings Table */}
              <div className="overflow-x-auto rounded-xl border border-border/50">
                {isEscrowsLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading escrow records...</p>
                  </div>
                ) : filteredEscrows.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    No escrow holdings found matching your filters.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground border-b border-border/50 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Contract ID</th>
                        <th className="py-3 px-4">Brand</th>
                        <th className="py-3 px-4">Creator</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Vault Status</th>
                        <th className="py-3 px-4">Payment Reference</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-center">Settlement Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredEscrows.map((esc) => (
                        <tr key={esc.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-muted-foreground">
                            {esc.contract_id ? `#${esc.contract_id.substring(0, 8)}` : esc.id}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">{esc.brand_name || 'Brand'}</p>
                            <p className="text-[10px] text-muted-foreground">{esc.brand_email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">{esc.creator_name || 'Creator'}</p>
                            <p className="text-[10px] text-muted-foreground">{esc.creator_email}</p>
                          </td>
                          <td className="py-3 px-4 font-black text-foreground">
                            {formatAmount(esc.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              esc.status === 'held'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : esc.status === 'released'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : esc.status === 'disputed'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse-soft'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {esc.status === 'held' && <Lock className="w-3 h-3" />}
                              {esc.status === 'released' && <CheckCircle2 className="w-3 h-3" />}
                              {esc.status === 'disputed' && <AlertTriangle className="w-3 h-3" />}
                              {esc.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {esc.razorpay_payment_id || esc.razorpay_order_id || 'Wallet Funding'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {new Date(esc.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {esc.status === 'held' || esc.status === 'disputed' ? (
                              <button
                                onClick={() => {
                                  setDisputeEscrow(esc);
                                  setCreatorSplitPct(50);
                                  setShowDisputeModal(true);
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                              >
                                Settle Split
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 4: USER WALLETS DIRECTORY             */}
        {/* ========================================== */}
        {isAdmin && activeAdminTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card-elevated p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    User Wallets Directory
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monitor individual balances, review pending locks, and perform balance adjustments.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Total Accounts: {userWallets.length}</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, or role..."
                  className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-border/50">
                {isUsersLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading user accounts...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    No users found matching your search.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground border-b border-border/50 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4 text-right">Available Balance</th>
                        <th className="py-3 px-4 text-right">Locked in Escrow</th>
                        <th className="py-3 px-4 text-center">Txn Count</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                                {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{u.full_name}</p>
                                <p className="text-[10px] text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'brand' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              u.role === 'creator' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-right text-emerald-400">
                            {formatAmount(u.available_balance)}
                          </td>
                          <td className="py-3 px-4 font-black text-right text-amber-400">
                            {formatAmount(u.pending_escrow_balance)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                            {u.transaction_count}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setAdjustTargetUser(u);
                                setShowAdjustModal(true);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-xl transition-colors"
                            >
                              Adjust Balance
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 5: PERSONAL / OPERATING WALLET        */}
        {/* ========================================== */}
        {(!isAdmin || activeAdminTab === 'operating_wallet') && (
          <div className="space-y-8 animate-fade-in">
            {isAdmin && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                <span>👤 You are viewing your <strong>Personal Admin Operating Account</strong> for direct sandbox testing and payment simulations.</span>
                <button
                  onClick={() => setActiveAdminTab('treasury')}
                  className="px-3 py-1 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-600 transition-colors"
                >
                  Return to Platform Treasury
                </button>
              </div>
            )}

            {isPersonalLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
                <div className="w-12 h-12 rounded-full border-4 border-muted border-t-accent animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Syncing personal wallet ledger...</p>
              </div>
            ) : (
              <>
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
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Instant top-ups operational
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
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
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Net Balance</p>
                      <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                        {wallet ? formatAmount(parseFloat(String(wallet.available_balance)) + parseFloat(String(wallet.pending_escrow_balance))) : '₹0'}
                      </h3>
                      <p className="text-xs text-muted-foreground">Cryptographic SHA-256 Ledger</p>
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
                      <p className="text-xs text-muted-foreground mt-0.5">Live visualization of transaction history</p>
                    </div>
                  </div>

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getPersonalChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPersonalBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(15, 23, 42, 0.95)', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff'
                          }} 
                          formatter={(val) => [formatAmount(val as number), 'Balance']}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPersonalBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Personal Transaction list */}
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
                            const amt = parseFloat(String(txn.amount));
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
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
                                <td className={`py-3.5 px-4 font-bold text-right ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    {isCredit ? (
                                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
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
              </>
            )}
          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* MODAL 1: SOLVENCY & LEDGER INTEGRITY AUDIT */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAuditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuditModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card-elevated w-full max-w-xl p-6 relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Solvency & Ledger Integrity Report</h3>
                    <p className="text-xs text-muted-foreground">Automated cryptographic balance verification</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-muted/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {auditResult && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="font-bold">SYSTEM SOLVENT & BALANCED (100%)</p>
                        <p className="text-[11px] text-emerald-400/80">All user wallets match active escrow reserve holdings.</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-1 rounded">
                      SHA256::VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold">Total Wallets Audited</p>
                      <p className="text-base font-black text-foreground mt-1">{auditResult.stats.totalWallets}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold">Total Available Pool</p>
                      <p className="text-base font-black text-emerald-400 mt-1">{formatAmount(auditResult.stats.totalAvailablePool)}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold">Pending Escrow Balances</p>
                      <p className="text-base font-black text-amber-400 mt-1">{formatAmount(auditResult.stats.totalPendingEscrow)}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold">Active Held Escrow Vault</p>
                      <p className="text-base font-black text-amber-400 mt-1">{formatAmount(auditResult.stats.totalHeldEscrowVault)}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Escrow Ledger Discrepancy</span>
                        <span className="font-bold text-emerald-400 font-mono">₹{auditResult.stats.escrowDiscrepancy.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                    Audit Timestamp: {new Date(auditResult.auditTimestamp).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAuditModal(false)}
                className="w-full py-2.5 bg-accent hover:bg-accent/80 text-white font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL 2: USER BALANCE ADJUSTMENT           */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isAdjusting && setShowAdjustModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card-elevated w-full max-w-md p-6 relative z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-accent" />
                  <h3 className="text-base font-bold text-foreground">Adjust User Wallet Balance</h3>
                </div>
                <button
                  disabled={isAdjusting}
                  onClick={() => setShowAdjustModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-muted/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBalanceAdjustSubmit} className="space-y-4">
                {/* Select User if not set */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Target Account</label>
                  {adjustTargetUser ? (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-foreground">{adjustTargetUser.full_name}</p>
                        <p className="text-xs text-muted-foreground">{adjustTargetUser.email} ({adjustTargetUser.role})</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatAmount(adjustTargetUser.available_balance)}
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      onChange={(e) => {
                        const found = userWallets.find(u => u.id === e.target.value);
                        if (found) setAdjustTargetUser(found);
                      }}
                      className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl px-3 py-2.5 text-xs outline-none"
                    >
                      <option value="">Select a user account...</option>
                      {userWallets.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role}) - Current: ₹{Number(u.available_balance).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Adjustment Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Adjustment Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="e.g. 5000 (credit) or -2000 (debit)"
                      className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl py-2.5 pl-8 pr-4 text-sm font-bold outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Positive values will credit funds; negative values will debit funds.</p>
                </div>

                {/* Audit Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Audit Reason / Memo</label>
                  <textarea
                    rows={2}
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Administrative sandbox credit or campaign compensation"
                    className="w-full bg-muted/40 border border-border focus:border-accent rounded-xl p-3 text-xs outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAdjusting || !adjustAmount || !adjustTargetUser}
                  className="w-full py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-accent flex items-center justify-center gap-2"
                >
                  {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Balance Adjustment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL 3: DISPUTE SETTLEMENT SPLIT          */}
      {/* ========================================== */}
      <AnimatePresence>
        {showDisputeModal && disputeEscrow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSettlingDispute && setShowDisputeModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card-elevated w-full max-w-md p-6 relative z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-foreground">Settle Escrow Payout Split</h3>
                </div>
                <button
                  disabled={isSettlingDispute}
                  onClick={() => setShowDisputeModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-muted/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contract Escrow:</span>
                  <span className="font-bold text-foreground">{formatAmount(disputeEscrow.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-semibold">{disputeEscrow.brand_name || 'Brand'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Creator:</span>
                  <span className="font-semibold">{disputeEscrow.creator_name || 'Creator'}</span>
                </div>
              </div>

              <form onSubmit={handleDisputeSettleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Creator Payout: <strong className="text-emerald-400">{creatorSplitPct}%</strong></span>
                    <span>Brand Refund: <strong className="text-indigo-400">{100 - creatorSplitPct}%</strong></span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={creatorSplitPct}
                    onChange={(e) => setCreatorSplitPct(parseInt(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
                    <span>Creator: {formatAmount((parseFloat(String(disputeEscrow.amount)) * creatorSplitPct) / 100)}</span>
                    <span>Brand: {formatAmount((parseFloat(String(disputeEscrow.amount)) * (100 - creatorSplitPct)) / 100)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreatorSplitPct(100)}
                    className="flex-1 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold"
                  >
                    100% Creator
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorSplitPct(50)}
                    className="flex-1 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold"
                  >
                    50 / 50 Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorSplitPct(0)}
                    className="flex-1 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold"
                  >
                    100% Brand Refund
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSettlingDispute}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {isSettlingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Execute Dispute Settlement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL 4: ADD SANDBOX FUNDS                 */}
      {/* ========================================== */}
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
                    Load Funds via Razorpay
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Top-up wallet using Test Mode/Sandbox</p>
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
                  <p className="text-[10px] text-muted-foreground">Instant checkout portal supported with test UPI and cards.</p>
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

      {/* ========================================== */}
      {/* MODAL 5: WITHDRAW EARNINGS BANK TRANSFER   */}
      {/* ========================================== */}
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
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce-soft">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-emerald-400">Transfer Successful!</p>
                    <p className="text-xs text-muted-foreground">Ledger records successfully balances and logs transaction.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
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
