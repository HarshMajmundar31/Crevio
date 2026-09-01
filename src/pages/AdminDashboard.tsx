import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  apiGetAdminEscrows, 
  apiAdminSettleDispute, 
  ApiEscrowHolding 
} from '@/lib/api';
import { 
  ShieldAlert, 
  Activity, 
  UserCheck, 
  Lock, 
  Unlock, 
  TrendingUp,
  Scale,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [escrows, setEscrows] = useState<ApiEscrowHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monitor' | 'disputes' | 'audits'>('monitor');
  
  // Settle dispute states
  const [selectedDispute, setSelectedDispute] = useState<ApiEscrowHolding | null>(null);
  const [creatorPercent, setCreatorPercent] = useState<number>(50);
  const [isSettling, setIsSettling] = useState(false);

  // System metrics state
  const [sysMetrics, setSysMetrics] = useState({ globalAvailablePool: 0, escrowLedgerCheck: 0, isBalanced: true });

  const fetchGlobalEscrows = async () => {
    try {
      setIsLoading(true);
      const res = await apiGetAdminEscrows();
      setEscrows(res.escrows);
      
      const { apiGetSystemMetrics } = await import('@/lib/api');
      const metricsRes = await apiGetSystemMetrics();
      if (metricsRes.metrics) {
        setSysMetrics(metricsRes.metrics);
      }
      
      // Auto-select first disputed contract if any
      const disputed = res.escrows.filter(e => e.status === 'disputed');
      if (disputed.length > 0 && !selectedDispute) {
        setSelectedDispute(disputed[0]);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalEscrows();
  }, []);

  const handleSettleDispute = async () => {
    if (!selectedDispute) return;
    try {
      setIsSettling(true);
      const bPercent = 100 - creatorPercent;
      const res = await apiAdminSettleDispute(selectedDispute.contract_id, creatorPercent, bPercent);
      if (res.success) {
        toast.success(`Dispute settled successfully! Creator credited ₹${res.creatorShare.toLocaleString('en-IN')}, Brand refunded ₹${res.brandShare.toLocaleString('en-IN')}.`);
        setSelectedDispute(null);
        await fetchGlobalEscrows();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to settle dispute');
    } finally {
      setIsSettling(false);
    }
  };

  const formatAmount = (num: string | number) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const disputes = escrows.filter(e => e.status === 'disputed');
  const heldFunds = escrows
    .filter(e => e.status === 'held')
    .reduce((sum, e) => sum + parseFloat(e.amount as string), 0);
  const releasedFunds = escrows
    .filter(e => e.status === 'released')
    .reduce((sum, e) => sum + parseFloat(e.amount as string), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Admin Command Center
            <UserCheck className="w-5 h-5 text-accent" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Platform-wide escrow monitoring, auditing, and dispute settlements</p>
        </div>
        <button 
          onClick={fetchGlobalEscrows}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg font-medium border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Admin Performance Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Locked Escrow</p>
          <p className="text-2xl font-bold text-accent mt-1">{formatAmount(heldFunds)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Settle Volume</p>
          <p className="text-2xl font-bold text-success mt-1">{formatAmount(releasedFunds)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Pending Disputes</p>
          <p className="text-2xl font-bold text-warning mt-1">{disputes.length} Campaigns</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">System Audit Health</p>
          <p className="text-2xl font-bold text-foreground mt-1 flex items-center gap-1">
            {sysMetrics.isBalanced ? (
              <><CheckCircle2 className="w-5 h-5 text-success inline" /> Optimal</>
            ) : (
              <><AlertTriangle className="w-5 h-5 text-warning inline" /> Alert</>
            )}
          </p>
        </div>
      </div>

      {/* Admin Panel Tabs */}
      <div className="flex border-b border-muted/50 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'monitor' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Global Escrow Monitor
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'disputes' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Dispute Resolution Suite
          {disputes.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'audits' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          System Ledger Audits
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
          <div className="w-12 h-12 rounded-full border-4 border-muted border-t-accent animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Retrieving platform escrow ledgers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'monitor' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-muted-foreground border-b border-muted/50 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Escrow ID</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4">Creator</th>
                      <th className="py-3 px-4">Secured Amount</th>
                      <th className="py-3 px-4">Escrow Status</th>
                      <th className="py-3 px-4">Linked Contract</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {escrows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">No escrow holdings exist on the platform.</td>
                      </tr>
                    ) : (
                      escrows.map((esc) => (
                        <tr key={esc.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                            {esc.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold">{esc.brand_name}</div>
                            <div className="text-[10px] text-muted-foreground">{esc.brand_email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold">{esc.creator_name}</div>
                            <div className="text-[10px] text-muted-foreground">{esc.creator_email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {formatAmount(esc.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              esc.status === 'held'
                                ? 'bg-accent/10 text-accent border border-accent/20'
                                : esc.status === 'released'
                                ? 'bg-success/10 text-success border border-success/20'
                                : esc.status === 'disputed'
                                ? 'bg-warning/10 text-warning border border-warning/20 animate-pulse'
                                : 'bg-muted text-muted-foreground border border-muted-foreground/10'
                            }`}>
                              {esc.status === 'held' && <Lock className="w-3 h-3 mr-0.5" />}
                              {esc.status === 'released' && <Unlock className="w-3 h-3 mr-0.5" />}
                              {esc.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <a 
                              href={`/contracts/${esc.contract_id}`}
                              className="text-xs font-mono text-accent hover:underline"
                            >
                              {esc.contract_id.substring(0, 12)}...
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'disputes' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {/* Disputes Selector list */}
              <div className="space-y-4 md:col-span-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Disputed Contracts</h3>
                {disputes.length === 0 ? (
                  <div className="p-6 bg-success/5 rounded-xl border border-success/20 text-center text-sm text-success">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-2" />
                    All clear! No pending disputed escrows.
                  </div>
                ) : (
                  disputes.map((disc) => (
                    <div
                      key={disc.id}
                      onClick={() => setSelectedDispute(disc)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedDispute?.id === disc.id
                          ? 'bg-warning/10 border-warning shadow-glow-warning'
                          : 'bg-muted/30 hover:bg-muted/50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-muted-foreground">{disc.contract_id.substring(0, 10)}...</span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-warning/20 text-warning text-[10px] font-bold uppercase rounded">
                          <AlertTriangle className="w-3 h-3" /> AI Failed
                        </span>
                      </div>
                      <p className="font-semibold text-sm">{disc.brand_name} ↔ {disc.creator_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Value: {formatAmount(disc.amount)}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Settle Dashboard panel */}
              <div className="md:col-span-2">
                {selectedDispute ? (
                  <motion.div 
                    key={selectedDispute.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card-elevated p-6 space-y-6"
                  >
                    <div className="border-b pb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Scale className="w-5 h-5 text-warning" />
                        Dispute Settlement Board
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Intervene and slide to split locked contract budget between both users.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Brand Account</p>
                        <p className="font-bold text-sm mt-0.5">{selectedDispute.brand_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedDispute.brand_email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Creator Account</p>
                        <p className="font-bold text-sm mt-0.5">{selectedDispute.creator_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedDispute.creator_email}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-warning">Brand: {100 - creatorPercent}%</span>
                        <span className="text-success">Creator: {creatorPercent}%</span>
                      </div>

                      {/* Split Percentage slider */}
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={creatorPercent} 
                        onChange={(e) => setCreatorPercent(parseInt(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent" 
                      />

                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                        <span>Brand Refund: {formatAmount((parseFloat(selectedDispute.amount as string) * (100 - creatorPercent)) / 100)}</span>
                        <span>Creator Payout: {formatAmount((parseFloat(selectedDispute.amount as string) * creatorPercent) / 100)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-5 flex justify-end gap-3">
                      <button
                        onClick={() => setSelectedDispute(null)}
                        className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 rounded-xl font-medium border"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSettleDispute}
                        disabled={isSettling}
                        className="px-4 py-2 text-xs font-bold text-white bg-warning hover:bg-warning/80 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-glow-warning"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {isSettling ? 'Settle in Database...' : 'Confirm Disbursement Settlement'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[250px] bg-muted/15 rounded-2xl border border-dashed border-muted text-center p-6">
                    <Scale className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="font-bold text-sm text-muted-foreground">Select a dispute case from the left panel to execute an escrow settlement split override.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'audits' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-start gap-4 mb-6 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-indigo-400">
                <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">System Double-Entry Bookkeeping Audits</h4>
                  <p className="text-xs mt-0.5">Every financial debit/credit on Crevio is recorded in an immutable ledger transaction log. This dashboard asserts that all user wallet pending escrows correctly balance with physical ledger totals.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/40 p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground">Global Available Pool</p>
                  <p className="text-lg font-bold mt-1">{formatAmount(sysMetrics.globalAvailablePool)}</p>
                </div>
                <div className="bg-muted/40 p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground">Escrow Ledger Check</p>
                  <p className={`text-lg font-bold mt-1 ${sysMetrics.isBalanced ? 'text-success' : 'text-warning'}`}>
                    {sysMetrics.isBalanced ? 'Balanced' : 'Unbalanced'} ({formatAmount(sysMetrics.escrowLedgerCheck)} locked)
                  </p>
                </div>
                <div className="bg-muted/40 p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground">Audit Signature Key</p>
                  <p className="text-sm font-mono mt-1 text-muted-foreground">SHA256::HMAC_STABLE</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
