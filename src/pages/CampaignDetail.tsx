import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  getCampaign, 
  getApplications, 
  updateApplicationStatus, 
  type ApiCampaign, 
  type ApiCampaignApplication 
} from '@/lib/api';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import { 
  Calendar, DollarSign, Tag, Users, ArrowUpRight, ArrowLeft,
  FileText, ShieldCheck, Target, Award, Clock, Sparkles, CheckCircle2,
  Clock3, XCircle, FileSignature, ExternalLink, TrendingUp, BarChart3,
  Filter, ArrowUpDown, UserCheck, Zap
} from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const role = user?.role || 'brand';

  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApiCampaignApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'timeline' | 'rules' | 'participants'>('overview');

  // Filter & Sorting state for Participants
  const [participantStatusFilter, setParticipantStatusFilter] = useState<string>('all');
  const [participantSortBy, setParticipantSortBy] = useState<'fit_score' | 'fee_asc' | 'fee_desc' | 'newest'>('fit_score');

  const fetchApplications = async () => {
    if (!id) return;
    try {
      setLoadingApps(true);
      const res = await getApplications({ campaignId: id });
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to fetch campaign applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await getCampaign(id);
        setCampaign(res.campaign);
        await fetchApplications();
      } catch (error) {
        toast({
          title: "Error fetching campaign",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignData();
  }, [id, toast]);

  const handleStatusUpdate = async (
    applicationId: string, 
    nextStatus: 'shortlisted' | 'interviewing' | 'approved' | 'rejected' | 'withdrawn'
  ) => {
    try {
      setUpdatingAppId(applicationId);
      await updateApplicationStatus(applicationId, { status: nextStatus });
      toast({ title: `Participant application updated to '${nextStatus}'` });
      await fetchApplications();
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Unable to update status",
        variant: "destructive"
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleAutoShortlistHighMatches = async () => {
    const highMatches = applications.filter(
      (app) => Number(app.fit_score || 0) >= 75 && app.status === 'submitted'
    );

    if (highMatches.length === 0) {
      toast({
        title: "No submitted high matches",
        description: "All creators with Match Score ≥ 75 are already shortlisted or reviewed.",
      });
      return;
    }

    try {
      setBatchActionLoading(true);
      for (const app of highMatches) {
        await updateApplicationStatus(app.id, { status: 'shortlisted' });
      }
      toast({
        title: "Auto-Shortlist Complete",
        description: `Shortlisted ${highMatches.length} creator(s) with AI Match Score ≥ 75%.`,
      });
      await fetchApplications();
    } catch (error) {
      toast({
        title: "Batch Shortlist Failed",
        description: error instanceof Error ? error.message : "Error during batch update",
        variant: "destructive",
      });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const creatorApplication = role === 'creator' ? applications[0] : null;

  // Analytics Metrics Calculation
  const analytics = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter((a) => a.status === 'submitted').length;
    const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
    const interviewing = applications.filter((a) => a.status === 'interviewing').length;
    const approved = applications.filter((a) => a.status === 'approved').length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;

    const avgFitScore = total > 0
      ? (applications.reduce((sum, a) => sum + Number(a.fit_score || 0), 0) / total).toFixed(1)
      : '0.0';

    const highMatchCount = applications.filter((a) => Number(a.fit_score || 0) >= 75).length;
    const committedBudget = applications
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + Number(a.proposed_fee || 0), 0);

    const avgProposedFee = total > 0
      ? (applications.reduce((sum, a) => sum + Number(a.proposed_fee || 0), 0) / total).toFixed(0)
      : '0';

    const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      submitted,
      shortlisted,
      interviewing,
      approved,
      rejected,
      avgFitScore,
      highMatchCount,
      committedBudget,
      avgProposedFee,
      conversionRate,
    };
  }, [applications]);

  // Filtered and Sorted Applications
  const processedApplications = useMemo(() => {
    let result = [...applications];

    if (participantStatusFilter !== 'all') {
      result = result.filter((a) => a.status === participantStatusFilter);
    }

    result.sort((a, b) => {
      if (participantSortBy === 'fit_score') {
        return Number(b.fit_score || 0) - Number(a.fit_score || 0);
      }
      if (participantSortBy === 'fee_asc') {
        return Number(a.proposed_fee || 0) - Number(b.proposed_fee || 0);
      }
      if (participantSortBy === 'fee_desc') {
        return Number(b.proposed_fee || 0) - Number(a.proposed_fee || 0);
      }
      if (participantSortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return result;
  }, [applications, participantStatusFilter, participantSortBy]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-[320px] w-full rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
          <Button variant="outline" onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        <Link to="/campaigns">
          <Button variant="ghost" size="sm" className="mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>

        {/* Hero Banner Section */}
        <div 
          className="relative rounded-2xl overflow-hidden min-h-[320px] flex flex-col justify-end p-8 border border-border/50 shadow-2xl"
          style={{
            background: campaign.cover_image_url 
              ? `url(${campaign.cover_image_url}) center/cover no-repeat` 
              : campaign.highlight_color 
                ? `linear-gradient(135deg, ${campaign.highlight_color} 0%, #000000 100%)`
                : 'linear-gradient(135deg, var(--primary) 0%, #000000 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-md">
                  {campaign.brand_name}
                </Badge>
                <ContractStatusBadge status={campaign.status} />
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {campaign.title}
              </h1>
              <p className="text-lg text-white/80 line-clamp-2 max-w-2xl font-medium">
                {campaign.goal}
              </p>
            </div>
            
            <div className="flex gap-3 shrink-0">
              {role === 'creator' ? (
                creatorApplication ? (
                  <Button 
                    size="lg" 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 gap-2"
                    onClick={() => navigate(`/applications/${creatorApplication.id}`)}
                  >
                    <CheckCircle2 className="w-5 h-5" /> View My Proposal
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-white/90 font-bold px-8"
                    onClick={() => navigate(`/campaigns/${campaign.id}/apply`)}
                    disabled={campaign.status !== 'active'}
                  >
                    Apply Now
                  </Button>
                )
              ) : (
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-white/90 font-bold"
                  onClick={() => navigate('/contracts/studio')}
                >
                  <FileText className="w-5 h-5 mr-2" /> Upload Contract
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Creator Application Status Panel (if creator has applied) */}
        {role === 'creator' && creatorApplication && (
          <Card className="p-6 border-emerald-500/30 bg-emerald-950/10 backdrop-blur-xl shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                    Application Status: {creatorApplication.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Applied on {new Date(creatorApplication.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">You are a registered participant for this campaign</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Proposed Fee: <strong className="text-foreground">${Number(creatorApplication.proposed_fee).toLocaleString()}</strong> • Earliest Start: <strong className="text-foreground">{creatorApplication.earliest_start_date}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right pr-3 border-r border-border/50">
                  <div className="text-xs text-muted-foreground">AI Fit Score</div>
                  <div className="text-2xl font-black text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {Number(creatorApplication.fit_score).toFixed(1)}
                  </div>
                </div>

                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/applications/${creatorApplication.id}`)}
                >
                  Application Details
                </Button>
                {['submitted', 'shortlisted', 'interviewing'].includes(creatorApplication.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={updatingAppId === creatorApplication.id}
                    onClick={() => void handleStatusUpdate(creatorApplication.id, 'withdrawn')}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Sticky Navigation Tabs */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border flex overflow-x-auto hide-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'deliverables', label: 'Prizes & Deliverables', icon: Award },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'rules', label: 'Contract Rules', icon: ShieldCheck },
                ...(role === 'brand' || role === 'admin'
                  ? [{ id: 'participants', label: `Participants (${applications.length})`, icon: Users }]
                  : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] pt-4">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section>
                    <h3 className="text-xl font-bold mb-4">About the Campaign</h3>
                    <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                      <p>{campaign.description}</p>
                    </div>
                  </section>
                  
                  <section className="grid sm:grid-cols-2 gap-4">
                    <Card className="p-5 border-border/50 bg-muted/20">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Audience</h4>
                      <p className="font-medium">{campaign.target_audience}</p>
                    </Card>
                    <Card className="p-5 border-border/50 bg-muted/20">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Platform</h4>
                      <div className="flex items-center gap-2 font-medium">
                        <Tag className="w-4 h-4 text-primary" /> {campaign.platform}
                      </div>
                    </Card>
                  </section>
                </div>
              )}

              {/* DELIVERABLES TAB */}
              {activeTab === 'deliverables' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-1">Total Prize Pool (Escrow)</h3>
                      <p className="text-sm text-muted-foreground">Guaranteed payout for completing deliverables.</p>
                    </div>
                    <div className="text-3xl font-black text-primary font-mono tracking-tight">
                      ${Number(campaign.budget).toLocaleString()}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-4">Required Deliverables</h3>
                  <Card className="p-6 border-border/50">
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {campaign.deliverables_summary || "See official contract for exact deliverable breakdown."}
                    </p>
                  </Card>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h3 className="text-xl font-bold mb-4">Campaign Timeline</h3>
                   <div className="relative border-l-2 border-primary/30 ml-3 md:ml-6 space-y-10 py-4">
                      {/* Deadline Node */}
                      <div className="relative">
                        <div className="absolute -left-[33px] bg-background border-2 border-primary w-4 h-4 rounded-full" />
                        <div className="pl-6">
                          <Badge variant="outline" className="mb-2 text-primary border-primary/30">Application Deadline</Badge>
                          <h4 className="font-bold text-lg">{campaign.deadline}</h4>
                          <p className="text-muted-foreground text-sm mt-1">Last day for creators to submit proposals or accept invites.</p>
                        </div>
                      </div>
                      
                      {/* Dynamic Content Node */}
                      <div className="relative">
                        <div className="absolute -left-[33px] bg-muted border-2 border-muted-foreground w-4 h-4 rounded-full" />
                        <div className="pl-6">
                          <h4 className="font-bold text-lg">Execution Schedule</h4>
                          <p className="text-muted-foreground text-sm mt-2 whitespace-pre-line bg-muted/20 p-4 rounded-lg border border-border/50">
                            {campaign.timeline_summary || "Specific milestones will be synced once contract is uploaded."}
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* RULES TAB */}
              {activeTab === 'rules' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h3 className="text-xl font-bold mb-4">Rights & Restrictions</h3>
                   <Card className="p-6 border-border/50">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" /> Usage Rights
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {campaign.content_rights || "Standard platform rights apply."}
                    </p>
                  </Card>

                  {campaign.requirements && campaign.requirements.length > 0 && (
                    <Card className="p-6 border-border/50">
                      <h4 className="font-semibold mb-4">Specific Requirements</h4>
                      <ul className="space-y-3">
                        {campaign.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-3 text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              )}

              {/* CREATOR PARTICIPANTS TAB (Brand/Admin) */}
              {activeTab === 'participants' && (role === 'brand' || role === 'admin') && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Brand Analytics & Campaign Metrics Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Campaign Analytics & Funnel Metrics
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5 border-primary/30 hover:border-primary"
                        disabled={batchActionLoading}
                        onClick={() => void handleAutoShortlistHighMatches()}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        {batchActionLoading ? 'Processing...' : 'Auto-Shortlist High Match (≥75%)'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card className="p-4 bg-muted/20 border-border/50">
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Applicants</div>
                        <div className="text-2xl font-black mt-1 text-foreground flex items-center justify-between">
                          {analytics.total}
                          <Users className="w-4 h-4 text-primary opacity-60" />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {analytics.submitted} Pending Review
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/20 border-border/50">
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg AI Match Fit</div>
                        <div className="text-2xl font-black mt-1 text-primary flex items-center justify-between">
                          {analytics.avgFitScore}
                          <Sparkles className="w-4 h-4 text-primary opacity-60" />
                        </div>
                        <div className="text-[11px] text-emerald-500 mt-1 font-semibold">
                          {analytics.highMatchCount} Creators ≥ 75 Score
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/20 border-border/50">
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Committed Payout</div>
                        <div className="text-2xl font-black mt-1 text-emerald-400 flex items-center justify-between">
                          ${analytics.committedBudget.toLocaleString()}
                          <DollarSign className="w-4 h-4 text-emerald-500 opacity-60" />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Avg proposal: ${Number(analytics.avgProposedFee).toLocaleString()}
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/20 border-border/50">
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Approval Rate</div>
                        <div className="text-2xl font-black mt-1 text-indigo-400 flex items-center justify-between">
                          {analytics.conversionRate}%
                          <TrendingUp className="w-4 h-4 text-indigo-400 opacity-60" />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {analytics.approved} Approved Creators
                        </div>
                      </Card>
                    </div>

                    {/* Pipeline Funnel Distribution */}
                    <Card className="p-4 border-border/50 bg-muted/10 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Participant Pipeline Breakdown</div>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <div className="font-bold text-blue-400">{analytics.submitted}</div>
                          <div className="text-[10px] text-muted-foreground">Submitted</div>
                        </div>
                        <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
                          <div className="font-bold text-indigo-400">{analytics.shortlisted}</div>
                          <div className="text-[10px] text-muted-foreground">Shortlisted</div>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <div className="font-bold text-amber-400">{analytics.interviewing}</div>
                          <div className="text-[10px] text-muted-foreground">Interviewing</div>
                        </div>
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                          <div className="font-bold text-emerald-400">{analytics.approved}</div>
                          <div className="text-[10px] text-muted-foreground">Approved</div>
                        </div>
                        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20">
                          <div className="font-bold text-rose-400">{analytics.rejected}</div>
                          <div className="text-[10px] text-muted-foreground">Rejected</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Filtering & Sorting Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Filter:</span>
                      <select
                        className="h-8 rounded-md border bg-background px-2.5 text-xs"
                        value={participantStatusFilter}
                        onChange={(e) => setParticipantStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses ({applications.length})</option>
                        <option value="submitted">Submitted ({analytics.submitted})</option>
                        <option value="shortlisted">Shortlisted ({analytics.shortlisted})</option>
                        <option value="interviewing">Interviewing ({analytics.interviewing})</option>
                        <option value="approved">Approved ({analytics.approved})</option>
                        <option value="rejected">Rejected ({analytics.rejected})</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Sort By:</span>
                      <select
                        className="h-8 rounded-md border bg-background px-2.5 text-xs"
                        value={participantSortBy}
                        onChange={(e) => setParticipantSortBy(e.target.value as any)}
                      >
                        <option value="fit_score">Highest Match Score</option>
                        <option value="fee_asc">Lowest Proposed Fee</option>
                        <option value="fee_desc">Highest Proposed Fee</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Applicants List */}
                  {loadingApps ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-5 space-y-3">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </Card>
                      ))}
                    </div>
                  ) : processedApplications.length === 0 ? (
                    <Card className="p-10 text-center text-muted-foreground space-y-2">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground/50" />
                      <p className="text-base font-semibold">No participant creators found</p>
                      <p className="text-xs">Try selecting a different status filter.</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {processedApplications.map((app) => (
                        <Card key={app.id} className="p-5 border-border/50 hover:border-primary/30 transition-all space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-foreground">{app.creator_name}</h4>
                                <Badge variant="secondary" className="text-xs uppercase font-mono">
                                  {app.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Proposed Fee: <strong className="text-foreground">${Number(app.proposed_fee).toLocaleString()}</strong> • Earliest Start: <strong className="text-foreground">{app.earliest_start_date}</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <div className="text-xs font-semibold">
                                Match Score: <span className="text-primary text-sm font-bold">{Number(app.fit_score).toFixed(1)}/100</span>
                              </div>
                            </div>
                          </div>

                          {/* Scores breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            <div>Audience: <strong>{Number(app.audience_fit_score).toFixed(1)}</strong></div>
                            <div>Engagement: <strong>{Number(app.engagement_quality_score).toFixed(1)}</strong></div>
                            <div>Content: <strong>{Number(app.content_quality_score).toFixed(1)}</strong></div>
                            <div>Reliability: <strong>{Number(app.reliability_score).toFixed(1)}</strong></div>
                            <div>Budget: <strong>{Number(app.budget_fit_score).toFixed(1)}</strong></div>
                          </div>

                          {/* Pitch */}
                          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
                            <strong className="text-foreground block mb-1">Pitch:</strong>
                            <p className="line-clamp-3">{app.pitch_message}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs"
                              onClick={() => navigate(`/applications/${app.id}`)}
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Full Proposal
                            </Button>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                disabled={updatingAppId === app.id}
                                onClick={() => void handleStatusUpdate(app.id, 'shortlisted')}
                              >
                                Shortlist
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                disabled={updatingAppId === app.id}
                                onClick={() => void handleStatusUpdate(app.id, 'interviewing')}
                              >
                                Interview
                              </Button>
                              <Button 
                                size="sm" 
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={updatingAppId === app.id}
                                onClick={() => void handleStatusUpdate(app.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="text-xs"
                                disabled={updatingAppId === app.id}
                                onClick={() => void handleStatusUpdate(app.id, 'rejected')}
                              >
                                Reject
                              </Button>

                              {app.status === 'approved' && !app.contract_id && (
                                <Button
                                  size="sm"
                                  className="text-xs gradient-primary text-primary-foreground font-semibold"
                                  onClick={() => navigate(`/contracts/create?applicationId=${encodeURIComponent(app.id)}`)}
                                >
                                  <FileSignature className="w-3.5 h-3.5 mr-1" /> Start Contract
                                </Button>
                              )}

                              {app.contract_id && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-xs"
                                  onClick={() => navigate(`/contracts/${app.contract_id}`)}
                                >
                                  View Contract
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right Sidebar (Action Panel) (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-[100px] space-y-6">
              
              <Card className="p-6 border-border/50 shadow-xl shadow-black/5 bg-gradient-to-b from-card to-background">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prize Pool</p>
                    <p className="text-3xl font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="w-6 h-6 text-emerald-500" />
                      {Number(campaign.budget).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="w-full h-px bg-border/50" />
                  
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deadline</p>
                    <p className="text-lg font-medium flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      {campaign.deadline}
                    </p>
                  </div>

                  <div className="w-full h-px bg-border/50" />

                  <div className="space-y-3">
                    {role === 'creator' ? (
                      creatorApplication ? (
                        <Button 
                          className="w-full font-bold h-12 text-md bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => navigate(`/applications/${creatorApplication.id}`)}
                        >
                          View Your Proposal
                        </Button>
                      ) : (
                        <Button 
                          className="w-full font-bold h-12 text-md shadow-lg gradient-primary text-primary-foreground"
                          disabled={campaign.status !== 'active'}
                          onClick={() => navigate(`/campaigns/${campaign.id}/apply`)}
                        >
                          Apply with Proposal
                        </Button>
                      )
                    ) : (
                      <>
                        <Button 
                          className="w-full font-bold h-12 text-md"
                          onClick={() => navigate('/contracts/studio')}
                        >
                          <FileText className="w-4 h-4 mr-2" /> Upload Contract
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full font-semibold"
                          onClick={() => navigate(`/campaigns/${campaign.id}/timeline`)}
                        >
                          View Execution Matrix
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}


