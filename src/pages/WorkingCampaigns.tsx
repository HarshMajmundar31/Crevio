import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  apiGetWorkingCampaigns, 
  apiDownloadCampaignContract, 
  apiUploadCreatorSignedContract, 
  apiDownloadSignedContract,
  type ApiWorkingCampaign 
} from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, 
  Activity, 
  Search, 
  Sparkles, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  UploadCloud, 
  Download, 
  ExternalLink, 
  Users, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Loader2,
  Share2,
  Check,
  Lock,
  MessageSquare,
  CheckSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const isDirectInviteCampaign = (camp?: { pitch_message?: string } | null) => {
  if (!camp) return false;
  const msg = (camp.pitch_message || '').toLowerCase().trim();
  return (
    msg.includes('invite') ||
    msg.includes('joined directly') ||
    msg === '' ||
    msg === 'n/a'
  );
};

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function WorkingCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = user?.role || 'creator';

  const [campaigns, setCampaigns] = useState<ApiWorkingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadWorkingCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiGetWorkingCampaigns();
      setCampaigns(res.campaigns || []);
    } catch (err: any) {
      toast({
        title: 'Failed to load working campaigns',
        description: err?.message || 'Could not fetch active collaborations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkingCampaigns();
  }, []);

  const handleDownloadContract = async (campaignId: string, title?: string) => {
    setDownloadingId(campaignId);
    try {
      const fileName = `${(title || 'Campaign').replace(/[^a-zA-Z0-9_-]/g, '_')}_Contract.pdf`;
      await apiDownloadCampaignContract(campaignId, fileName);
      toast({
        title: 'Contract Downloaded',
        description: `Successfully downloaded contract for ${title || 'Campaign'}`,
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err?.message || 'Failed to download contract file.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSigned = async (campaignId: string) => {
    setDownloadingId(campaignId);
    try {
      await apiDownloadSignedContract(campaignId);
      toast({
        title: 'Signed Contract Downloaded',
        description: 'Successfully downloaded the signed contract file.',
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err?.message || 'Failed to download signed contract.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUploadSignedContract = async (campaignId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(campaignId);
    try {
      await apiUploadCreatorSignedContract(campaignId, file);
      toast({
        title: '🎉 Signed Contract Uploaded!',
        description: `"${file.name}" has been uploaded and linked to this working campaign.`,
      });
      await loadWorkingCampaigns();
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to upload signed contract file.',
        variant: 'destructive',
      });
    } finally {
      setUploadingId(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleShare = (campaignId: string) => {
    const inviteUrl = `${window.location.origin}/campaigns/${campaignId}?invite=true`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(campaignId);
    toast({
      title: 'Invite Link Copied!',
      description: 'Send this link to creators to auto-join this working campaign.',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter campaigns based on search & platform
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.brand_name && c.brand_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    const matchesPlatform = platformFilter === 'all' || (c.platform && c.platform.toLowerCase() === platformFilter.toLowerCase());

    return matchesSearch && matchesPlatform;
  });

  // Calculate Metrics
  const totalCollaborations = campaigns.length;
  const totalEscrowAmount = campaigns.reduce((acc, curr) => {
    const amt = Number(curr.escrow_amount || curr.proposed_fee || curr.budget || 0);
    return acc + (isNaN(amt) ? 0 : amt);
  }, 0);
  const totalDeliverablesCount = campaigns.reduce((acc, curr) => acc + (curr.total_deliverables || 0), 0);
  const completedDeliverablesCount = campaigns.reduce((acc, curr) => acc + (curr.completed_deliverables || 0), 0);

  const availablePlatforms = Array.from(new Set(campaigns.map((c) => c.platform).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                {role === 'creator' ? 'My Working Campaigns' : role === 'brand' ? 'Active Collaborations' : 'All Working Campaigns'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {role === 'creator' 
                ? 'Manage campaigns where you are accepted, track deliverables, upload signed contracts, and monitor payouts.' 
                : 'Monitor accepted creators, review deliverables progress, and manage live campaign execution.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {role === 'creator' ? (
              <Button 
                variant="outline"
                className="font-semibold gap-2"
                onClick={() => navigate('/campaigns')}
              >
                <Search className="w-4 h-4" /> Browse More Campaigns
              </Button>
            ) : (
              <Button 
                className="gradient-primary text-primary-foreground font-semibold gap-2 shadow-lg"
                onClick={() => navigate('/campaigns/create')}
              >
                + New Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Metric Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Campaigns
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : totalCollaborations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In active production</p>
          </Card>

          <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {role === 'creator' ? 'Escrowed Payouts' : 'Escrow Budget'}
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {loading ? <Skeleton className="h-8 w-24" /> : `₹${totalEscrowAmount.toLocaleString()}`}
            </div>
            <p className="text-xs text-emerald-500/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Escrow Protected
            </p>
          </Card>

          <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deliverables Tracker
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              {loading ? <Skeleton className="h-8 w-20" /> : `${completedDeliverablesCount} / ${totalDeliverablesCount || totalCollaborations}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completed & Verified</p>
          </Card>

          <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contract Compliance
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-400 mt-2">
              {loading ? <Skeleton className="h-8 w-16" /> : `${campaigns.filter(c => c.signed_contract_name || c.contract_id).length} Active`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Legally binding agreements</p>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/40 backdrop-blur-md">
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3.5 py-2 text-sm text-muted-foreground w-full sm:w-80 border border-border/30">
            <Search className="w-4 h-4 shrink-0 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by campaign title or brand..."
              className="h-6 border-0 bg-transparent p-0 text-xs focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {availablePlatforms.length > 0 && (
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-9 text-xs w-[140px] bg-muted/40 border-border/40">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {availablePlatforms.map((plat) => (
                    <SelectItem key={plat} value={plat.toLowerCase()}>{plat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Campaign List / Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 border-border/40 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="flex justify-between">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center border-border/40 bg-card/30 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No Working Campaigns Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 mb-6">
              {role === 'creator'
                ? 'You do not have any accepted or active collaborations right now. Explore the open campaign feed to discover new brand opportunities!'
                : 'No creators have joined or been accepted into your campaigns yet. Share your campaign invite links or review incoming applications!'}
            </p>
            {role === 'creator' ? (
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground font-semibold px-8 shadow-xl"
                onClick={() => navigate('/campaigns')}
              >
                <Search className="w-4 h-4 mr-2" /> Browse Open Campaigns
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground font-semibold px-8 shadow-xl"
                onClick={() => navigate('/campaigns')}
              >
                <Briefcase className="w-4 h-4 mr-2" /> View Your Campaigns
              </Button>
            )}
          </Card>
        ) : (
          <motion.div 
            variants={stagger.container} 
            initial="initial" 
            animate="animate" 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredCampaigns.map((camp) => {
              const contractExtracted = camp.contract_extracted_terms || {};
              const deliverablesList = contractExtracted.deliverables || [];
              const payout = camp.proposed_fee || camp.escrow_amount || camp.budget || 0;

              return (
                <motion.div key={camp.id} variants={stagger.item}>
                  <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 shadow-xl flex flex-col h-full group">
                    {/* Card Top Banner with Cover & Highlights */}
                    <div className="relative h-36 w-full bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 overflow-hidden border-b border-border/40">
                      {camp.cover_image_url && (
                        <img 
                          src={camp.cover_image_url} 
                          alt={camp.title} 
                          className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500" 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-600 text-white font-bold shadow-lg gap-1">
                            <Activity className="w-3.5 h-3.5" /> Working Collaboration
                          </Badge>
                          {camp.platform && (
                            <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white border-white/20 text-xs">
                              {camp.platform}
                            </Badge>
                          )}
                        </div>

                        {(role === 'brand' || role === 'admin') && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md"
                              title="Share Direct Invite Link"
                              onClick={() => handleShare(camp.id)}
                            >
                              {copiedId === camp.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-300" />}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Title & Brand Over Banner */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">
                          {camp.brand_name || 'Brand Partner'}
                        </div>
                        <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-emerald-300 transition-colors">
                          {camp.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      {/* Key Details Grid */}
                      <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border/30">
                        <div>
                          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {role === 'creator' ? 'Your Payout' : 'Campaign Budget'}
                          </div>
                          <div className="text-lg font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                            ₹{Number(payout).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Money Submitted
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Escrow Protection
                          </div>
                          <div className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="capitalize">{camp.escrow_status === 'held' ? '100% Escrow Secured' : camp.escrow_status || '100% Escrow Secured'}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Guaranteed creator payout
                          </div>
                        </div>
                      </div>

                      {/* Contract & Signed Agreement Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="font-medium text-foreground">
                            {camp.contract_file_name ? camp.contract_file_name : 'Master Service Agreement'}
                          </span>
                        </div>

                        {camp.is_contract_locked ? (
                          <Badge className="text-[11px] bg-emerald-600 text-white font-semibold gap-1 shadow-sm">
                            <Lock className="w-3 h-3" /> Contract Locked & Active
                          </Badge>
                        ) : camp.signed_contract_name ? (
                          <Badge variant="outline" className="text-[11px] text-emerald-300 border-emerald-500/40 bg-emerald-950/40 font-semibold gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Signed & Attached
                          </Badge>
                        ) : role === 'creator' ? (
                          <Badge variant="outline" className="text-[11px] text-amber-300 border-amber-500/40 bg-amber-950/40 font-semibold gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> Signed Copy Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-indigo-300 border-indigo-500/30">
                            Contract Linked
                          </Badge>
                        )}
                      </div>

                      {/* Deliverables Scope Preview */}
                      {deliverablesList.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span>Contract Deliverables ({deliverablesList.length})</span>
                            <span className="text-[11px] text-emerald-400 font-bold">Milestones Active</span>
                          </div>
                          <div className="space-y-1">
                            {deliverablesList.slice(0, 2).map((del: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20 border border-border/20">
                                <span className="font-medium text-foreground truncate max-w-[280px]">
                                  {del.description || del.title}
                                </span>
                                {del.deadline && (
                                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                                    {del.deadline}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {camp.deliverables_summary || camp.description || 'Deliverables and milestones configured in campaign workspace.'}
                        </p>
                      )}

                      {/* Brand Participants List (For Brand view) */}
                      {role === 'brand' && camp.participants && camp.participants.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Accepted Creators ({camp.participants.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {camp.participants.map((p, idx) => (
                              <Badge key={idx} variant="outline" className="bg-muted/40 border-border/40 text-xs py-1 px-2.5">
                                <span className="font-semibold text-foreground">{p.creator_name}</span>
                                {p.is_contract_locked ? (
                                  <Lock className="w-3 h-3 text-emerald-400 ml-1.5 inline" />
                                ) : p.signed_contract_name ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-1.5 inline" />
                                ) : null}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold gap-1.5"
                            onClick={() => handleDownloadContract(camp.id, camp.title)}
                            disabled={downloadingId === camp.id}
                          >
                            {downloadingId === camp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-emerald-400" />}
                            Master Contract
                          </Button>

                          {camp.signed_contract_name && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-400"
                              onClick={() => handleDownloadSigned(camp.id)}
                              disabled={downloadingId === camp.id}
                            >
                              {downloadingId === camp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-emerald-400" />}
                              Signed Copy
                            </Button>
                          )}

                          {role === 'creator' && !camp.is_contract_locked && (
                            <label className="cursor-pointer">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleUploadSignedContract(camp.id, e)}
                                disabled={uploadingId === camp.id}
                              />
                              <Button
                                size="sm"
                                className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm pointer-events-none transition-all px-3.5"
                                disabled={uploadingId === camp.id}
                              >
                                {uploadingId === camp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <UploadCloud className="w-3.5 h-3.5 text-white" />}
                                {camp.signed_contract_name ? 'Re-upload Signed' : 'Upload Signed'}
                              </Button>
                            </label>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          {camp.application_id && !isDirectInviteCampaign(camp) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-semibold"
                              onClick={() => navigate(`/applications/${camp.application_id}`)}
                            >
                              Proposal
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-900/30"
                            onClick={() => navigate(`/campaigns/${camp.id}?from=working`)}
                          >
                            Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
