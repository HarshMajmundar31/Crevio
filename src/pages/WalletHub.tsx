import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { apiGetWallet, ApiWallet, ApiTransaction } from '@/lib/api';
import { 
  Wallet, 
  Lock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Sparkles,
  CreditCard
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

export default function WalletHub() {
  const [wallet, setWallet] = useState<ApiWallet | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Process data for the earnings trends chart from transaction ledgers
  const getChartData = () => {
    if (transactions.length === 0) {
      return [
        { date: 'Jan', amount: 0 },
        { date: 'Feb', amount: 0 },
        { date: 'Mar', amount: 0 }
      ];
    }

    // Sort oldest first for running total
    const sortedTxns = [...transactions].reverse();
    let currentTotal = 100000; // Seed baseline
    
    return sortedTxns.map((t, idx) => {
      const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      currentTotal += amt;
      const d = new Date(t.created_at);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return {
        date: label,
        balance: Math.round(currentTotal)
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Wallet Hub 
            <Sparkles className="w-5 h-5 text-accent animate-pulse-soft" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage play funds, secured escrows, and audit logs</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
          <CreditCard className="w-3.5 h-3.5 text-accent" />
          INR Sandbox Account
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
          <div className="w-12 h-12 rounded-full border-4 border-muted border-t-accent animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Retrieving secure financial records...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metrics Displays */}
          <div className="grid md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Available Play Balance</p>
                <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                  {wallet ? formatAmount(wallet.available_balance) : '₹0'}
                </h3>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Seeding credits active
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Escrow Funds Locked</p>
                <h3 className="text-3xl font-extrabold text-accent tracking-tight">
                  {wallet ? formatAmount(wallet.pending_escrow_balance) : '₹0'}
                </h3>
                <p className="text-xs text-muted-foreground">Secured until deliverables verified</p>
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Net Ledger</p>
                <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                  {wallet ? formatAmount(parseFloat(wallet.available_balance as string) + parseFloat(wallet.pending_escrow_balance as string)) : '₹0'}
                </h3>
                <p className="text-xs text-muted-foreground">Total play asset portfolio value</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-muted-foreground/10">
                <CreditCard className="w-5 h-5" />
              </div>
            </motion.div>
          </div>

          {/* Earnings Area Chart */}
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
                    formatter={(val) => [formatAmount(val as number), 'Portfolio']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="rgb(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Double-Entry Transaction Logs */}
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
                    {transactions.map((txn, idx) => {
                      const isCredit = parseFloat(txn.amount as string) >= 0;
                      return (
                        <tr key={txn.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                            {txn.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              txn.txn_type === 'seed' 
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : txn.txn_type === 'escrow_credit' || txn.txn_type === 'escrow_refund'
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
                              {formatAmount(Math.abs(parseFloat(txn.amount as string)))}
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
    </DashboardLayout>
  );
}
