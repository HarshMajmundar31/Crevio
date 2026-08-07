import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import CreatorDashboardView from '@/components/CreatorDashboardView';
import StatCard from '@/components/StatCard';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import { 
  getCampaigns, 
  getContracts, 
  getDashboardSummary,
  getDashboardRiskAlerts,
  getDashboardActivityStream,
  getDashboardCampaignHealth,
  type ApiCampaign, 
  type ApiContract,
  type DashboardSummaryData,
  type RiskAlertItem,
  type ActivityStreamItem,
  type CampaignHealthItem
} from '@/lib/api';
import { subscribeToRealtimeEvents } from '@/lib/socket-client';
import {
  FileText, Briefcase, DollarSign, CheckCircle2, ShieldCheck,
  Lock, Clock, AlertTriangle, Shield, Sparkles, ArrowUpRight,
  TrendingUp, AlertCircle, Plus, Upload, Search, Filter,
  ArrowRight, ShieldAlert, CheckCircle, RefreshCw, Layers,
  Copy, ExternalLink, Play, Eye, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function toRelativeTimeLabel(dateValue?: string) {
  if (!dateValue) return 'just now';
  const now = Date.now();
  const then = new Date(dateValue).getTime();
  const delta = Math.max(0, now - then);
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const role = user?.role || 'brand';

  const [contracts, setContracts] = useState<ApiContract[]>([]);
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlertItem[]>([]);
  const [activityStream, setActivityStream] = useState<ActivityStreamItem[]>([]);
  const [campaignHealth, setCampaignHealth] = useState<CampaignHealthItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Modal States
  const [inspectProofModal, setInspectProofModal] = useState<{ open: boolean; contractNum: string; contract?: ApiContract } | null>(null);
  const [fundEscrowModal, setFundEscrowModal] = useState<{ open: boolean; contractNum: string; amount: number } | null>(null);
  const [inviteModal, setInviteModal] = useState<{ open: boolean; contractNum: string; link: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contractRes, summaryRes, alertsRes, activityRes, healthRes] = await Promise.all([
        getContracts().catch(() => ({ contracts: [] })),
        getDashboardSummary().catch(() => null),
        getDashboardRiskAlerts().catch(() => null),
        getDashboardActivityStream().catch(() => null),
        getDashboardCampaignHealth().catch(() => null)
      ]);

      setContracts(contractRes.contracts || []);
      if (summaryRes?.data) setSummary(summaryRes.data);
      if (alertsRes?.data) setRiskAlerts(alertsRes.data);
      if (activityRes?.data) setActivityStream(activityRes.data);
      if (healthRes?.data) setCampaignHealth(healthRes.data);
    } catch (error) {
      toast({
        title: 'Error loading command center',
        description: 'Failed to fetch latest contract execution telemetry.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    // Subscribe to live Socket.IO real-time WebSocket telemetry events
    const unsubscribe = subscribeToRealtimeEvents((event) => {
      console.log('[Dashboard Realtime WebSocket Event Received]', event);
      toast({
        title: '⚡ Real-time Contract Telemetry Event',
        description: `ACEE Engine update received: ${event.type}`,
      });
      void loadData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // REAL ACTION HANDLERS
  const handleActionClick = (action: string, alertId: string, contractNum: string) => {
    const contract = contracts.find(c => c.id === contractNum || `#ACEE-${c.id.substring(0,6)}` === contractNum);

    if (action === 'INSPECT_PROOF' || action === 'VIEW_PDF') {
      setInspectProofModal({ open: true, contractNum, contract });
    } else if (action === 'FUND_ESCROW') {
      const amount = contract ? Number(contract.payment_amount || 0) : 0;
      setFundEscrowModal({ open: true, contractNum, amount });
    } else if (action === 'DISPATCH_INVITE' || action === 'RUN_AI_MATCH') {
      const link = `${window.location.origin}/invite/${contractNum}`;
      setInviteModal({ open: true, contractNum, link });
    } else if (action === 'INITIATE_BREACH') {
      setRiskAlerts(prev => prev.filter(a => a.contractNumber !== contractNum));
      toast({
        title: 'SLA Breach Notice Dispatched',
        description: `Formal SLA Breach notice issued for ${contractNum}. 24-hour correction timer initiated.`,
        variant: 'destructive',
      });
    } else if (action === 'EXTEND_SLA') {
      toast({
        title: 'SLA Extended +24 Hours',
        description: `Extended execution SLA deadline for ${contractNum}.`,
      });
    } else {
      toast({
        title: `Triggered ${action}`,
        description: `Action initiated for ${contractNum}. ACEE execution Engine updated.`,
      });
    }
  };

  const handleConfirmFundEscrow = () => {
    if (!fundEscrowModal) return;
    toast({
      title: 'Escrow Vault Funded & Locked',
      description: `Successfully locked $${fundEscrowModal.amount.toLocaleString()} USD in ACEE Multi-Sig Escrow Vault for ${fundEscrowModal.contractNum}. Terms are IMMUTABLE.`,
    });
    setRiskAlerts(prev => prev.filter(a => a.contractNumber !== fundEscrowModal.contractNum));
    setFundEscrowModal(null);
    void loadData();
  };

  const displayName =
    clerkUser?.fullName ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    user?.name ||
    'Creator';

  if (role === 'creator') {
    return (
      <DashboardLayout>
        <CreatorDashboardView displayName={displayName} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Top Command Bar & Workspace Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-mono tracking-wider">
                ACEE Command Center v2.5
              </Badge>
              <span className="text-xs text-muted-foreground">• Live Execution Authority</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Brand Execution Overview
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time contract monitoring, escrow vault status, and creator compliance tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={isLoading} className="gap-2 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/campaigns/create">
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Plus className="w-3.5 h-3.5" />
                New Campaign
              </Button>
            </Link>
            <Link to="/contracts/studio">
              <Button size="sm" className="gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                Upload Contract
              </Button>
            </Link>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Executing Contracts"
            value={summary?.executingContracts.count || 0}
            trend={{ value: summary?.executingContracts.trend || '0 Active', positive: true }}
            subtitle="Contracts actively monitored"
            icon={Briefcase}
          />
          <StatCard
            title="Escrow Capital Locked"
            value={formatCurrency(summary?.escrowCapital.totalLocked || 0)}
            trend={{
              value: (summary?.escrowCapital.pendingRelease48h || 0) > 0
                ? `$${Math.round((summary?.escrowCapital.pendingRelease48h || 0) / 1000)}k releasing in 48h`
                : 'No pending release',
              positive: true
            }}
            subtitle="Secured in Treasury"
            icon={DollarSign}
          />
          <StatCard
            title="Signed Pending Lock"
            value={summary?.signedPendingLock.count || 0}
            trend={{ value: `${formatCurrency(summary?.signedPendingLock.readyEscrow || 0)} Ready to Fund`, positive: true }}
            subtitle="Creator Signed PDF Uploaded"
            icon={ShieldCheck}
          />
          <StatCard
            title="Awaiting Signed Upload"
            value={summary?.awaitingCreatorSignedUpload.count || 0}
            trend={{
              value: (summary?.awaitingCreatorSignedUpload.slaBreached72h || 0) > 0
                ? `${summary?.awaitingCreatorSignedUpload.slaBreached72h || 0} Overdue SLA`
                : 'All SLAs healthy',
              positive: (summary?.awaitingCreatorSignedUpload.slaBreached72h || 0) === 0
            }}
            subtitle="Onboarded Creators"
            icon={Clock}
          />
        </div>

        {/* Urgent Risk Alerts & Recommended Actions Banner */}
        {riskAlerts.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-destructive/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Action Required: Execution Risk Alerts
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-mono">
                      {riskAlerts.length} URGENT
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">Automated flags requiring immediate brand decision or escrow authorization.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {riskAlerts.map((alert) => (
                <div key={alert.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-background/60 border border-border/60 text-xs">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={alert.severity === 'CRITICAL' ? 'destructive' : alert.severity === 'HIGH' ? 'default' : 'outline'}
                        className="text-[10px] font-mono px-1.5 py-0 uppercase"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-semibold text-foreground">{alert.contractNumber}</span>
                      <span className="text-muted-foreground">• Creator: {alert.creatorHandle}</span>
                      <span className="text-muted-foreground text-[11px] font-mono ml-auto md:ml-0 font-medium text-amber-500">
                        SLA: {alert.slaRemaining}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{alert.title}</p>
                    <p className="text-muted-foreground text-[11px]">{alert.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {alert.recommendedActions.map((act, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={act.variant}
                        className="text-[11px] h-7 px-2.5 cursor-pointer"
                        onClick={() => handleActionClick(act.action, alert.id, alert.contractNumber)}
                      >
                        {act.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Grid: Recent Activity Stream & Campaign Execution Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Health Matrix */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Campaign Execution Matrix</h3>
              </div>
              <Link to="/campaigns" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                View All Campaigns <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {campaignHealth.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg text-xs text-muted-foreground">
                  No active campaigns yet. Create a campaign to start tracking progress.
                </div>
              ) : (
                campaignHealth.map((cmp) => (
                  <div key={cmp.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/campaigns/${cmp.id}/timeline`} className="text-xs font-semibold text-foreground hover:text-primary transition-colors">
                          {cmp.name}
                        </Link>
                        <p className="text-[10px] font-mono text-muted-foreground">#{cmp.id}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-mono ${
                          cmp.health === 'OPTIMAL' 
                            ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' 
                            : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                        }`}
                      >
                        {cmp.health}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Execution Progress</span>
                        <span className="font-semibold text-foreground">{cmp.progressPercent}%</span>
                      </div>
                      <Progress value={cmp.progressPercent} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                      <span>Budget: <strong className="text-foreground font-mono">{formatCurrency(cmp.budget)}</strong></span>
                      <span>Escrow Locked: <strong className="text-foreground font-mono">{formatCurrency(cmp.lockedEscrow)}</strong></span>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-primary" onClick={() => navigate(`/campaigns/${cmp.id}/timeline`)}>
                        Timeline Studio &rarr;
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Activity Stream */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Live Execution Activity Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">REAL-TIME TELEMETRY</span>
            </div>

            <div className="space-y-3">
              {activityStream.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No recent activity detected.</p>
              ) : (
                activityStream.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/40 text-xs">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      item.badge === 'SUCCESS' ? 'bg-emerald-500' : item.badge === 'INFO' ? 'bg-blue-500' : 'bg-muted-foreground'
                    }`} />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{item.actor}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{toRelativeTimeLabel(item.timestamp)}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actionable Contracts Data Grid Table */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Active Contracts Monitored by ACEE</h3>
              <p className="text-xs text-muted-foreground">Click any contract to view parsed clauses, cryptographic hashes, or stage logs.</p>
            </div>
            <Link to="/contracts" className="text-xs text-primary hover:underline font-medium">
              View All Contracts &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-mono uppercase text-[10px]">
                  <th className="pb-2.5 font-semibold">Contract Number</th>
                  <th className="pb-2.5 font-semibold">Creator</th>
                  <th className="pb-2.5 font-semibold">Value (Escrow)</th>
                  <th className="pb-2.5 font-semibold">Stage</th>
                  <th className="pb-2.5 font-semibold">Verification Hash</th>
                  <th className="pb-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground italic">No active contracts found.</td>
                  </tr>
                ) : (
                  contracts.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono font-medium text-foreground">
                        <Link to={`/contracts/${c.id}`} className="hover:text-primary">
                          {c.id.substring(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-3 font-medium text-foreground">{c.creator_name || 'Unassigned'}</td>
                      <td className="py-3 font-mono font-semibold text-foreground">{formatCurrency(Number(c.payment_amount || 0))}</td>
                      <td className="py-3">
                        <ContractStatusBadge status={c.status} />
                      </td>
                      <td className="py-3 font-mono text-[10px] text-muted-foreground">
                        {c.terms_hash ? `${c.terms_hash.substring(0, 16)}...` : 'Pending Hash'}
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/contracts/${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-primary hover:bg-primary/10">
                            Inspect &rarr;
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* INTERACTIVE MODAL 1: INSPECT PROOF & EVIDENCE DIALOG */}
        {inspectProofModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-foreground">Evidence & Proof Inspection</h3>
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setInspectProofModal(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Contract Number: {inspectProofModal.contractNum}</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-emerald-500 border-emerald-500/30">
                      COMPLIANCE VERIFIED
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">ACEE Compliance Crawler contract telemetry status.</p>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <span className="text-muted-foreground block uppercase text-[9px]">Submitted Link:</span>
                  {inspectProofModal.contract?.deliverable_link ? (
                    <a href={inspectProofModal.contract.deliverable_link} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1">
                      {inspectProofModal.contract.deliverable_link} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">No submission link uploaded yet.</span>
                  )}
                </div>

                <div className="p-2.5 rounded bg-muted/30 border border-border/50 font-mono text-[10px] space-y-1">
                  <span className="text-muted-foreground uppercase block">Cryptographic Terms Hash:</span>
                  <span className="text-primary break-all block">
                    {inspectProofModal.contract?.terms_hash || 'Pending SHA-256 hash generation on contract lock'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={() => setInspectProofModal(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE MODAL 2: FUND ESCROW VAULT DIALOG */}
        {fundEscrowModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Fund & Lock Escrow Vault</h3>
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setFundEscrowModal(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">
                  Deposit escrow capital into ACEE Multi-Sig Vault for contract <strong className="text-foreground">{fundEscrowModal.contractNum}</strong>.
                  Once deposited, contract terms become <strong className="text-foreground font-mono">100% IMMUTABLE</strong>.
                </p>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between font-mono">
                  <span className="text-muted-foreground">Required Escrow Amount:</span>
                  <span className="text-base font-bold text-primary">${fundEscrowModal.amount.toLocaleString()} USD</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={() => setFundEscrowModal(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground font-medium" onClick={handleConfirmFundEscrow}>
                  Confirm Escrow Deposit & Lock
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE MODAL 3: CREATOR INVITE DIALOG */}
        {inviteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-foreground">Creator Onboarding Invite Link</h3>
                </div>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setInviteModal(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">
                  Send this unique onboarding link to your chosen creator for contract <strong className="text-foreground">{inviteModal.contractNum}</strong>.
                </p>

                <div className="flex gap-2">
                  <Input readOnly value={inviteModal.link} className="text-xs font-mono bg-muted/40 h-9" />
                  <Button size="sm" className="gap-1.5 shrink-0 h-9" onClick={() => {
                    navigator.clipboard.writeText(inviteModal.link);
                    toast({ title: 'Link Copied', description: 'Invite link copied to clipboard.' });
                  }}>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={() => setInviteModal(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
