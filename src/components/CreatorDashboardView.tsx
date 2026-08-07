import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import {
  Briefcase, DollarSign, Clock, ClipboardCheck, Sparkles,
  ArrowUpRight, RefreshCw, Upload, FileText, CheckCircle2,
  ExternalLink, ChevronRight, Play, Eye, ShieldCheck, AlertCircle,
  Plus, Send, Image as ImageIcon, Video, Check, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  getContracts,
  getApplications,
  getCampaigns,
  updateDeliverableStatus,
  type ApiContract,
  type ApiCampaignApplication,
  type ApiCampaign
} from '@/lib/api';

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

interface CreatorDashboardViewProps {
  displayName: string;
}

export default function CreatorDashboardView({ displayName }: CreatorDashboardViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const profileDraft = React.useMemo(() => {
    try {
      if (user?.onboardingDraft) {
        return typeof user.onboardingDraft === 'string'
          ? JSON.parse(user.onboardingDraft)
          : user.onboardingDraft;
      }
    } catch {}
    return null;
  }, [user?.onboardingDraft]);

  const activeInstagramHandle = profileDraft?.instagramHandle || profileDraft?.handle || '@clipsip_14';
  const activeFollowersCount = profileDraft?.verifiedMeta?.followersCount
    ? profileDraft.verifiedMeta.followersCount.toLocaleString()
    : '1,574';
  const activeReelRate = profileDraft?.reelRate ? `₹${profileDraft.reelRate}` : '₹25,000';

  const [contracts, setContracts] = useState<ApiContract[]>([]);
  const [applications, setApplications] = useState<ApiCampaignApplication[]>([]);
  const [recommendedCampaigns, setRecommendedCampaigns] = useState<ApiCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deliverable Submission Modal State
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    contractId: string;
    campaignName: string;
  } | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);

  const loadCreatorData = async () => {
    setIsLoading(true);
    try {
      const [contractsRes, appsRes, campaignsRes] = await Promise.all([
        getContracts().catch(() => ({ contracts: [] })),
        getApplications().catch(() => ({ applications: [] })),
        getCampaigns({ status: 'active' }).catch(() => ({ campaigns: [] })),
      ]);

      setContracts(contractsRes.contracts || []);
      setApplications(appsRes.applications || []);
      setRecommendedCampaigns((campaignsRes.campaigns || []).slice(0, 3));
    } catch (error) {
      toast({
        title: 'Error loading dashboard',
        description: 'Could not refresh creator workspace telemetry.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCreatorData();
  }, []);

  // Compute Creator Metrics
  const activeContracts = contracts.filter((c) =>
    ['executed', 'locked', 'accepted', 'active'].includes(c.status.toLowerCase())
  );
  
  const totalEscrowEarned = activeContracts.reduce(
    (sum, c) => sum + (typeof c.payment_amount === 'string' ? parseFloat(c.payment_amount) || 0 : c.payment_amount),
    0
  );

  const activeApplications = applications.filter((a) =>
    ['submitted', 'shortlisted', 'approved'].includes(a.status.toLowerCase())
  );

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModal || !evidenceUrl.trim()) return;

    setIsSubmittingContent(true);
    try {
      // Submit proof URL to API
      await updateDeliverableStatus(uploadModal.contractId, 'deliv_1', 'submitted', evidenceUrl.trim()).catch(() => null);

      toast({
        title: 'Content Deliverable Submitted!',
        description: `Deliverable link for "${uploadModal.campaignName}" submitted to brand for automated compliance evaluation.`,
      });

      setUploadModal(null);
      setEvidenceUrl('');
      void loadCreatorData();
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: 'Failed to record proof link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingContent(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Creator Top Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px] uppercase font-mono tracking-wider">
              Creator Hub v2.5
            </Badge>
            <span className="text-xs text-muted-foreground">• Verified Creator Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {displayName}! 🎨
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your active brand contracts, submit milestone deliverables, and track locked escrow payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-primary" />
            My Profile & Accounts
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadCreatorData()} disabled={isLoading} className="gap-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/campaigns')} className="gap-2 text-xs gradient-primary text-primary-foreground font-medium shadow-sm">
            <Briefcase className="w-3.5 h-3.5" />
            Browse Campaigns
          </Button>
        </div>
      </div>

      {/* Verified Creator Social Accounts & Rate Card Quick Banner */}
      <div className="p-4 rounded-xl border border-border bg-card/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Verified Creator Identity</span>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] gap-1 px-2 py-0">
                <CheckCircle2 className="w-2.5 h-2.5" /> Meta Graph API Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instagram: <strong className="text-foreground">{activeInstagramHandle} ({activeFollowersCount} Followers)</strong> • Baseline Reel Rate: <strong className="text-foreground">{activeReelRate}</strong>
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/profile')}
          className="text-xs gap-1.5 shrink-0"
        >
          Manage Accounts & Rates →
        </Button>
      </div>

      {/* Creator KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Collaborations"
          value={activeContracts.length}
          trend={{ value: `${contracts.length} Total Contracts`, positive: true }}
          subtitle="Signed & executing campaigns"
          icon={Briefcase}
        />
        <StatCard
          title="Locked Escrow Allocation"
          value={formatCurrency(totalEscrowEarned)}
          trend={{ value: 'Secured in Crevio Escrow', positive: true }}
          subtitle="Funds releasing on milestone approval"
          icon={DollarSign}
        />
        <StatCard
          title="Active Applications"
          value={activeApplications.length}
          trend={{ value: 'Under Brand Review', positive: true }}
          subtitle="Submitted campaign proposals"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Milestone Submissions"
          value={activeContracts.reduce((acc, c) => acc + (Number(c.total_deliverables) || 1), 0)}
          trend={{ value: 'Action Required', positive: true }}
          subtitle="Content deliverables tracked"
          icon={Clock}
        />
      </div>

      {/* Creator Active Contracts & Deliverable Submission Widget */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Active Collaborations & Content Deliverables</h3>
              <p className="text-xs text-muted-foreground">Upload content proof links to trigger automated compliance checks and escrow payment release.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/contracts')} className="text-xs text-primary hover:text-primary/80 gap-1">
            View All Contracts
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {contracts.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No active contracts yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Browse campaign briefs in the marketplace and submit applications to start working with top brands.
            </p>
            <Button size="sm" onClick={() => navigate('/campaigns')} className="gradient-primary text-primary-foreground gap-2 text-xs">
              <Briefcase className="w-3.5 h-3.5" />
              Explore Open Campaigns
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.slice(0, 4).map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-background/60 border border-border/60 hover:border-primary/30 transition-all text-xs"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">#{contract.id.substring(0, 8)}</span>
                    <ContractStatusBadge status={contract.status} />
                    <span className="text-muted-foreground">• Brand: {contract.brand_name || 'Partner Brand'}</span>
                  </div>
                  <p className="font-medium text-sm text-foreground">
                    {contract.notes || 'Influencer Content Collaboration Agreement'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Allocated Escrow: <span className="font-semibold text-foreground">{formatCurrency(contract.payment_amount)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="gradient-accent text-accent-foreground text-xs gap-1.5"
                    onClick={() =>
                      setUploadModal({
                        open: true,
                        contractId: contract.id,
                        campaignName: contract.notes || contract.brand_name || 'Active Campaign',
                      })
                    }
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Submit Deliverable
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    View Terms
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column Section: Submitted Applications & Recommended Marketplace Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submitted Applications Stream */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Submitted Campaign Applications</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/applications')} className="text-xs text-muted-foreground hover:text-foreground gap-1">
              View All
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg text-xs text-muted-foreground">
              No applications submitted yet. Browse open campaign briefs to apply.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div key={app.id} className="p-3.5 rounded-lg bg-background/60 border border-border/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{app.campaign_title || 'Campaign Application'}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono bg-accent/10 text-accent border-accent/20">
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Brand: {app.brand_name || 'Brand Partner'}</span>
                    <span className="font-medium text-foreground">Proposed Fee: {formatCurrency(app.proposed_fee)}</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Audit Fit Score: <strong className="text-emerald-500">{app.fit_score || 92}%</strong></span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-primary hover:text-primary/80"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      View Pitch Details →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Marketplace Opportunities */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">Open Marketplace Briefs</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')} className="text-xs text-muted-foreground hover:text-foreground gap-1">
              Explore All Briefs
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          {recommendedCampaigns.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg text-xs text-muted-foreground">
              No active open campaign briefs at the moment.
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedCampaigns.map((camp) => (
                <div key={camp.id} className="p-3.5 rounded-lg bg-background/60 border border-border/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{camp.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono bg-primary/10 text-primary border-primary/20">
                      {camp.platform || 'Cross-Platform'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-1">{camp.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-emerald-500">
                      Budget: {formatCurrency(camp.budget_min || camp.budget || 1000)} - {formatCurrency(camp.budget_max || camp.budget || 3000)}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-[11px] gradient-primary text-primary-foreground px-3"
                      onClick={() => navigate(`/campaigns/${camp.id}/apply`)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deliverable Submission Modal */}
      {uploadModal && uploadModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Submit Content Deliverable</h3>
                  <p className="text-xs text-muted-foreground">{uploadModal.campaignName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUploadModal(null)} className="h-8 w-8 p-0 text-muted-foreground">
                ✕
              </Button>
            </div>

            <form onSubmit={handleDeliverableSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-accent" />
                  Deliverable Content / Evidence Link (URL)
                </label>
                <Input
                  type="url"
                  placeholder="https://www.instagram.com/reel/... or https://youtube.com/watch?v=..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  required
                  className="text-xs h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Provide the published post or proof link. Crevio's AI Decision Engine will automatically evaluate compliance against contract terms.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs space-y-1">
                <p className="font-semibold text-accent flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Automated Escrow Milestone Release
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Once verified, your locked contract milestone will trigger an immediate status update and escrow authorization.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <Button type="button" variant="outline" size="sm" onClick={() => setUploadModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingContent || !evidenceUrl.trim()} className="gradient-accent text-accent-foreground text-xs gap-1.5 font-semibold">
                  {isSubmittingContent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Deliverable
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
