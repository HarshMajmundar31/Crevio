import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  apiCreateCampaignOrder,
  apiVerifyCampaignPayment,
  apiGetWallet,
  apiFundCampaignWithWallet,
  apiDirectJoinCampaign,
  apiDownloadCampaignContract,
  apiUploadCreatorSignedContract,
  apiDownloadSignedContract,
  apiLockCampaignContract,
  apiGetCampaignMessages,
  apiSendCampaignMessage,
  apiGetCampaignProofs,
  apiSubmitCampaignProof,
  apiReviewCampaignProof,
  type ApiCampaign, 
  type ApiCampaignApplication,
  type ApiWallet,
  type ApiCampaignMessage,
  type ApiProofSubmission
} from '@/lib/api';
import { subscribeToEvent, joinCampaignRoom } from '@/lib/socket-client';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import { 
  Calendar, DollarSign, IndianRupee, Tag, Users, ArrowUpRight, ArrowLeft,
  FileText, ShieldCheck, Target, Award, Clock, Sparkles, CheckCircle2,
  Clock3, XCircle, FileSignature, ExternalLink, TrendingUp, BarChart3,
  Filter, ArrowUpDown, UserCheck, Zap, Loader2, Share2, Copy, Check,
  Download, UploadCloud, Lock, Unlock, MessageSquare, Send, CheckSquare,
  FileCheck2, AlertCircle, RefreshCw, MessageCircle, Link2, Paperclip,
  CheckCircle, HelpCircle, Layers, ArrowRight, Image as ImageIcon,
  Eye, Heart, Bookmark, ZoomIn, Maximize2, X, BarChart, FileImage
} from 'lucide-react';

export const isDirectInviteApplication = (app?: { pitch_message?: string } | null) => {
  if (!app) return false;
  const msg = (app.pitch_message || '').toLowerCase().trim();
  return (
    msg.includes('invite') ||
    msg.includes('joined directly') ||
    msg === '' ||
    msg === 'n/a'
  );
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const role = user?.role || 'brand';

  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApiCampaignApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'timeline' | 'rules' | 'contract' | 'submissions' | 'chat' | 'participants'>('overview');

  const [copiedLink, setCopiedLink] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);
  const isInviteParam = searchParams.get('invite') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('invite_campaign_id') === id);

  // Filter & Sorting state for Participants
  const [participantStatusFilter, setParticipantStatusFilter] = useState<string>('all');
  const [participantSortBy, setParticipantSortBy] = useState<'fit_score' | 'fee_asc' | 'fee_desc' | 'newest'>('fit_score');

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [wallet, setWallet] = useState<ApiWallet | null>(null);

  // Contract download & lock states
  const [downloadingContract, setDownloadingContract] = useState(false);
  const [downloadingSigned, setDownloadingSigned] = useState(false);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [lockingContract, setLockingContract] = useState(false);

  // Deliverables Proof Submissions & Photo Insights
  const [submissions, setSubmissions] = useState<ApiProofSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofTitle, setProofTitle] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofInsightsPhoto, setProofInsightsPhoto] = useState<File | null>(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(null);
  const [proofEngagementRate, setProofEngagementRate] = useState('');
  const [proofImpressions, setProofImpressions] = useState('');
  const [proofReach, setProofReach] = useState('');
  const [proofLikes, setProofLikes] = useState('');
  const [proofComments, setProofComments] = useState('');
  const [proofShares, setProofShares] = useState('');
  const [proofSaves, setProofSaves] = useState('');
  const [reviewingProofId, setReviewingProofId] = useState<string | null>(null);
  const [reviewFeedbackInput, setReviewFeedbackInput] = useState<{ [proofId: string]: string }>({});
  const [expandedImageModal, setExpandedImageModal] = useState<{ url: string; title: string } | null>(null);


  // Collaboration & Negotiation Chat
  const [messages, setMessages] = useState<ApiCampaignMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleShareCampaign = () => {
    if (!id) return;
    const inviteUrl = `${window.location.origin}/campaigns/${id}?invite=true`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    toast({
      title: '🎉 Invite Link Copied!',
      description: 'Creators who open this link can instantly join this campaign without an application.',
    });
  };

  const handleDirectAutoJoin = async () => {
    if (!id) return;
    try {
      setAutoJoining(true);
      const res = await apiDirectJoinCampaign(id);
      if (res.success) {
        toast({
          title: '🎉 Welcome to the Campaign!',
          description: 'You have automatically joined this campaign as an approved creator.',
        });
        localStorage.removeItem('invite_campaign_id');
        await fetchApplications();
      }
    } catch (err: any) {
      toast({
        title: 'Auto-Join Failed',
        description: err?.message || 'Failed to auto-join campaign.',
        variant: 'destructive',
      });
    } finally {
      setAutoJoining(false);
    }
  };

  const handleDownloadContract = async () => {
    if (!campaign) return;
    setDownloadingContract(true);
    try {
      const fileName = campaign.contract_file_name || `${(campaign.title || 'Campaign').replace(/[^a-zA-Z0-9_-]/g, '_')}_Contract.pdf`;
      await apiDownloadCampaignContract(campaign.id, fileName);
      toast({
        title: 'Master Contract Downloaded',
        description: `Successfully downloaded ${fileName}`,
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err?.message || 'Could not download contract file.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingContract(false);
    }
  };

  const handleDownloadSignedContract = async (creatorId?: string) => {
    if (!campaign) return;
    setDownloadingSigned(true);
    try {
      await apiDownloadSignedContract(campaign.id, creatorId);
      toast({
        title: 'Signed Contract Downloaded',
        description: 'Successfully downloaded the signed legal contract.',
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err?.message || 'Could not download signed contract file.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingSigned(false);
    }
  };

  const handleUploadSignedContract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaign) return;

    setUploadingSigned(true);
    try {
      const res = await apiUploadCreatorSignedContract(campaign.id, file);
      if (res.success) {
        toast({
          title: '🎉 Signed Contract Uploaded!',
          description: `"${file.name}" has been uploaded and attached. Brand has been notified to lock the contract.`,
        });
        await fetchApplications();
      }
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to upload signed contract file.',
        variant: 'destructive',
      });
    } finally {
      setUploadingSigned(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleLockContract = async (applicationId?: string, creatorId?: string) => {
    if (!campaign) return;
    setLockingContract(true);
    try {
      const res = await apiLockCampaignContract(campaign.id, { applicationId, creatorId });
      if (res.success) {
        toast({
          title: '🔒 Contract Approved & Locked!',
          description: 'The contract is now legally binding and locked. Creator can now proceed with deliverables and submit proof.',
        });
        await fetchApplications();
      }
    } catch (err: any) {
      toast({
        title: 'Lock Failed',
        description: err?.message || 'Could not lock contract.',
        variant: 'destructive',
      });
    } finally {
      setLockingContract(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!id) return;
    try {
      setLoadingSubmissions(true);
      const res = await apiGetCampaignProofs(id);
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error('Failed to fetch proof submissions', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handlePhotoSelect = (file: File | null) => {
    if (!file) {
      setProofInsightsPhoto(null);
      setProofPhotoPreview(null);
      return;
    }
    setProofInsightsPhoto(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProofPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !proofTitle.trim() || !proofUrl.trim()) {
      toast({
        title: 'Required fields missing',
        description: 'Please select or enter the deliverable title and provide a valid live URL.',
        variant: 'destructive'
      });
      return;
    }

    setSubmittingProof(true);
    try {
      const formData = new FormData();
      formData.append('deliverableTitle', proofTitle.trim());
      formData.append('liveUrl', proofUrl.trim());
      formData.append('description', proofDesc.trim());
      if (proofEngagementRate.trim()) formData.append('engagementRate', proofEngagementRate.trim());
      if (proofImpressions.trim()) formData.append('impressionsCount', proofImpressions.trim());
      if (proofReach.trim()) formData.append('reachCount', proofReach.trim());
      if (proofLikes.trim()) formData.append('likesCount', proofLikes.trim());
      if (proofComments.trim()) formData.append('commentsCount', proofComments.trim());
      if (proofShares.trim()) formData.append('sharesCount', proofShares.trim());
      if (proofSaves.trim()) formData.append('savesCount', proofSaves.trim());
      if (proofDesc.trim()) formData.append('overviewNotes', proofDesc.trim());

      if (proofInsightsPhoto) {
        formData.append('insights_photo', proofInsightsPhoto);
      }
      if (proofFile) {
        formData.append('attachment', proofFile);
      }

      const res = await apiSubmitCampaignProof(id, formData);
      if (res.submission) {
        toast({
          title: '🎉 Deliverable Proof & Insights Submitted!',
          description: `Proof for "${proofTitle}" with professional dashboard screenshots submitted for brand review.`,
        });
        setProofTitle('');
        setProofUrl('');
        setProofDesc('');
        setProofFile(null);
        setProofInsightsPhoto(null);
        setProofPhotoPreview(null);
        setProofEngagementRate('');
        setProofImpressions('');
        setProofReach('');
        setProofLikes('');
        setProofComments('');
        setProofShares('');
        setProofSaves('');
        await fetchSubmissions();
      }
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err?.message || 'Failed to submit proof.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingProof(false);
    }
  };


  const handleReviewProof = async (proofId: string, status: 'approved' | 'revision_requested') => {
    if (!id) return;
    setReviewingProofId(proofId);
    try {
      const feedback = reviewFeedbackInput[proofId] || '';
      const res = await apiReviewCampaignProof(id, proofId, { status, brandFeedback: feedback });
      if (res.submission) {
        toast({
          title: status === 'approved' ? '🎉 Deliverable Proof Approved!' : '⚠️ Revision Requested',
          description: status === 'approved' 
            ? 'Milestone marked as approved.' 
            : 'Creator has been notified with your feedback notes.',
        });
        await fetchSubmissions();
      }
    } catch (err: any) {
      toast({
        title: 'Review Failed',
        description: err?.message || 'Failed to update proof status.',
        variant: 'destructive'
      });
    } finally {
      setReviewingProofId(null);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      setLoadingMessages(true);
      const res = await apiGetCampaignMessages(id);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!id || !text.trim()) return;

    setSendingMessage(true);
    try {
      const res = await apiSendCampaignMessage(id, { message: text.trim() });
      if (res.message) {
        setMessages(prev => [...prev, res.message]);
        setChatInput('');
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      toast({
        title: 'Message Failed',
        description: err?.message || 'Could not send message.',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFundCampaignWithWallet = async () => {
    if (!campaign) return;
    setBusyAction('wallet');
    try {
      const res = await apiFundCampaignWithWallet(campaign.id);
      if (res.success) {
        toast({
          title: '🎉 Campaign Funded via Wallet!',
          description: `Successfully deducted ₹${Number(campaign.budget).toLocaleString()} from your available wallet balance.`,
        });
        setCampaign(prev => prev ? { ...prev, status: 'active' as any } : null);
        if (wallet) {
          setWallet(prev => prev ? { ...prev, available_balance: String(res.balance) } : null);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Wallet Funding Failed',
        description: err?.message || 'Failed to complete wallet funding deduction.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleFundCampaign = async () => {
    if (!campaign) return;
    setBusyAction('razorpay');
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast({
          title: 'Gateway Error',
          description: 'Failed to contact Razorpay servers. Check your internet connection.',
          variant: 'destructive',
        });
        setBusyAction(null);
        return;
      }

      const res = await apiCreateCampaignOrder(campaign.id);

      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        name: 'Crevio Escrow',
        description: `Fund Budget for ${campaign.title}`,
        order_id: res.orderId,
        handler: async (response: any) => {
          try {
            setBusyAction('verify');
            const verifyRes = await apiVerifyCampaignPayment(campaign.id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast({
                title: '🎉 Campaign Funded & Activated!',
                description: `Successfully escrowed ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(campaign.budget))} and set campaign to Active.`,
              });
              setCampaign(prev => prev ? { ...prev, status: 'active' as any } : null);
            }
          } catch (err: any) {
            toast({
              title: 'Verification Failed',
              description: err?.message || 'Secure payment signature verification rejected.',
              variant: 'destructive',
            });
          } finally {
            setBusyAction(null);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#6366f1',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({
        title: 'Funding Error',
        description: err?.message || 'Failed to initialize campaign escrow deposit.',
        variant: 'destructive',
      });
      setBusyAction(null);
    }
  };

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
        await fetchSubmissions();
        await fetchMessages();

        if (role === 'brand' || role === 'admin') {
          try {
            const walletRes = await apiGetWallet();
            setWallet(walletRes.wallet);
          } catch (e) {
            console.error("Failed to load wallet", e);
          }
        }
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

  // Real-time socket listeners
  useEffect(() => {
    if (!id) return;
    joinCampaignRoom(id);

    const unsubMsg = subscribeToEvent('campaign:message', (payload) => {
      if (payload?.campaignId === id && payload?.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    const unsubLocked = subscribeToEvent('campaign:contract_locked', (payload) => {
      if (payload?.campaignId === id) {
        fetchApplications();
        toast({
          title: '🔒 Contract Locked Status Updated',
          description: 'The contract status for this campaign has been updated to locked.',
        });
      }
    });

    const unsubUploaded = subscribeToEvent('campaign:contract_uploaded', (payload) => {
      if (payload?.campaignId === id) {
        fetchApplications();
      }
    });

    const unsubProof = subscribeToEvent('campaign:proof_submitted', (payload) => {
      if (payload?.campaignId === id) {
        fetchSubmissions();
      }
    });

    const unsubProofRev = subscribeToEvent('campaign:proof_reviewed', (payload) => {
      if (payload?.campaignId === id) {
        fetchSubmissions();
      }
    });

    return () => {
      unsubMsg();
      unsubLocked();
      unsubUploaded();
      unsubProof();
      unsubProofRev();
    };
  }, [id]);

  // Refetch and sync messages when Chat tab is opened
  useEffect(() => {
    if (activeTab === 'chat' && id) {
      fetchMessages();
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, id]);

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
  const isContractLocked = Boolean(
    creatorApplication?.is_contract_locked || 
    applications.some(a => a.is_contract_locked)
  );
  const hasSignedContract = Boolean(
    creatorApplication?.signed_contract_name || 
    applications.some(a => a.signed_contract_name)
  );

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

  // Extracted deliverables helper
  const extractedDeliverables = useMemo(() => {
    if (campaign?.contract_extracted_terms?.deliverables && Array.isArray(campaign.contract_extracted_terms.deliverables)) {
      return campaign.contract_extracted_terms.deliverables;
    }
    return [];
  }, [campaign]);

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

  const fromParam = searchParams.get('from');
  const isFromWorking = fromParam === 'working';

  const handleBack = () => {
    if (isFromWorking) {
      navigate('/campaigns/working');
    } else {
      navigate('/campaigns');
    }
  };

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> {isFromWorking ? 'Back to Working Campaigns' : 'Back to Campaigns'}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-24">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {isFromWorking ? 'Back to Working Campaigns' : 'Back to Campaigns'}
          </Button>
        </div>

        {/* HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-border/40 shadow-2xl bg-card">
          {campaign.cover_image_url ? (
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
              <img 
                src={campaign.cover_image_url} 
                alt={campaign.title} 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          ) : (
            <div 
              className="h-48 md:h-60 w-full relative"
              style={{
                background: campaign.highlight_color 
                  ? `linear-gradient(135deg, ${campaign.highlight_color}33 0%, rgba(15, 23, 42, 0.95) 100%)` 
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          )}

          {/* Hero Content Overlay */}
          <div className="relative -mt-20 md:-mt-24 px-6 md:px-10 pb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-semibold bg-background/80 backdrop-blur-md border border-border/50 text-foreground">
                    <Tag className="w-3.5 h-3.5 mr-1 text-primary" /> {campaign.platform}
                  </Badge>
                  <ContractStatusBadge status={campaign.status} />
                  {isContractLocked && (
                    <Badge className="bg-emerald-600 text-white font-bold gap-1 text-xs">
                      <Lock className="w-3 h-3" /> Contract Locked
                    </Badge>
                  )}
                  {campaign.status === 'active' || (campaign as any).escrow_status === 'held' ? (
                    <Badge className="bg-emerald-600 text-white font-bold gap-1 text-xs shadow-sm">
                      <ShieldCheck className="w-3 h-3" /> 100% Escrow Secured
                    </Badge>
                  ) : null}
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                  {campaign.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                  <span>Created by <strong className="text-foreground">{campaign.brand_name}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" /> Deadline: <strong className="text-foreground">{campaign.deadline}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <IndianRupee className="w-4 h-4" /> ₹{Number(campaign.budget).toLocaleString()} Prize Pool
                  </span>
                </div>
              </div>

              {/* Action Buttons in Hero */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Master Contract Download */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-md border-border/60 hover:bg-background font-semibold gap-1.5"
                  onClick={handleDownloadContract}
                  disabled={downloadingContract}
                >
                  {downloadingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                  Download Contract
                </Button>

                {/* Signed Contract Download (If exists) */}
                {hasSignedContract && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 font-semibold gap-1.5"
                    onClick={() => handleDownloadSignedContract()}
                    disabled={downloadingSigned}
                  >
                    {downloadingSigned ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                    Signed Contract
                  </Button>
                )}

                {/* Share / Invite button (Brand & Admin ONLY) */}
                {(role === 'brand' || role === 'admin') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/80 backdrop-blur-md border-indigo-500/40 hover:bg-indigo-500/10 font-semibold gap-1.5 text-indigo-400"
                    onClick={handleShareCampaign}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    {copiedLink ? 'Link Copied!' : 'Share / Invite Creator'}
                  </Button>
                )}

                {/* Direct Negotiation Chat Shortcut */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-md border-border/60 hover:bg-background font-semibold gap-1.5 text-foreground"
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Chat ({messages.length})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* DIRECT INVITE AUTO-JOIN BANNER */}
        {role === 'creator' && isInviteParam && !creatorApplication && (
          <Card className="p-6 border-indigo-500/40 bg-indigo-950/30 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-foreground">You Have Been Exclusively Invited!</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You opened a direct invite link from the brand. You do not need to fill out an application form! Click below to join immediately.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 shadow-lg shadow-indigo-500/30"
                disabled={autoJoining}
                onClick={handleDirectAutoJoin}
              >
                {autoJoining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2 text-amber-300" />}
                {autoJoining ? 'Joining...' : 'Accept Invite & Auto-Join'}
              </Button>
            </div>
          </Card>
        )}

        {/* BRAND REVIEW & LOCK BANNER (Brand Side) */}
        {(role === 'brand' || role === 'admin') && hasSignedContract && (
          <Card className="p-5 border-indigo-500/30 bg-indigo-950/20 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground">Creator Signed Contract Attached</h4>
                    {isContractLocked ? (
                      <Badge className="bg-emerald-600 text-white text-xs font-bold gap-1">
                        <Lock className="w-3 h-3" /> Contract Locked & Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-300 border-amber-500/40 bg-amber-950/40 text-xs font-semibold">
                        Awaiting Lock Approval
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isContractLocked
                      ? 'Contract is locked and legally active. The creator is submitting deliverables proof.'
                      : 'Review the creator’s uploaded signed document. Lock the contract to seal the agreement and unlock the deliverables phase.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-500/40 text-indigo-300 font-semibold gap-1.5"
                  onClick={() => handleDownloadSignedContract()}
                  disabled={downloadingSigned}
                >
                  {downloadingSigned ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Signed Copy
                </Button>

                {!isContractLocked ? (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-md shadow-emerald-600/20"
                    onClick={() => handleLockContract()}
                    disabled={lockingContract}
                  >
                    {lockingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {lockingContract ? 'Locking Contract...' : 'Lock & Approve Contract'}
                  </Button>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary font-semibold gap-1.5"
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with Creator
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* CREATOR APPLICATION & CONTRACT STATUS PANEL */}
        {role === 'creator' && creatorApplication && (
          <Card className="p-6 border-emerald-500/30 bg-emerald-950/10 backdrop-blur-xl shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 font-bold uppercase">
                    Status: {creatorApplication.status}
                  </Badge>
                  {isContractLocked ? (
                    <Badge className="bg-emerald-600 text-white font-bold gap-1">
                      <Lock className="w-3 h-3" /> Contract Locked & Binding
                    </Badge>
                  ) : creatorApplication.signed_contract_name ? (
                    <Badge variant="outline" className="text-xs text-amber-300 border-amber-500/40 bg-amber-950/40">
                      📄 Signed Copy Uploaded (Under Brand Review)
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground ml-1">
                    Joined on {new Date(creatorApplication.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">You are a registered participant for this campaign</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Proposed Fee: <strong className="text-foreground">₹{Number(creatorApplication.proposed_fee).toLocaleString()}</strong> • Earliest Start: <strong className="text-foreground">{creatorApplication.earliest_start_date || 'Immediate'}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right pr-3 border-r border-border/50">
                  <div className="text-xs text-muted-foreground">AI Fit Score</div>
                  <div className="text-2xl font-black text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {Number(creatorApplication.fit_score || 85).toFixed(1)}
                  </div>
                </div>

                {isContractLocked ? (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 px-3.5"
                      onClick={() => handleDownloadSignedContract()}
                      disabled={downloadingSigned}
                    >
                      {downloadingSigned ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Signed Copy
                    </Button>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                      onClick={() => setActiveTab('submissions')}
                    >
                      <CheckSquare className="w-4 h-4" /> Submit Proof
                    </Button>
                  </>
                ) : (
                  <>
                    {creatorApplication.signed_contract_name && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400 font-bold gap-2"
                        onClick={() => handleDownloadSignedContract()}
                        disabled={downloadingSigned}
                      >
                        {downloadingSigned ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download Signed
                      </Button>
                    )}
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleUploadSignedContract}
                        disabled={uploadingSigned}
                      />
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 px-4 shadow-md pointer-events-none transition-all"
                        disabled={uploadingSigned}
                      >
                        {uploadingSigned ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <UploadCloud className="w-4 h-4 text-white" />}
                        {creatorApplication.signed_contract_name ? 'Re-upload Signed Copy' : 'Upload Signed Contract'}
                      </Button>
                    </label>
                  </>
                )}

                {!isDirectInviteApplication(creatorApplication) && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/applications/${creatorApplication.id}`)}
                  >
                    View Proposal
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
            
            {/* Navigation Tabs */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border flex overflow-x-auto hide-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'deliverables', label: 'Prizes & Deliverables', icon: Award },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'rules', label: 'Contract Rules', icon: ShieldCheck },
                { id: 'contract', label: 'Legal Contract', icon: FileSignature, badge: isContractLocked ? '🔒' : hasSignedContract ? '📄' : undefined },
                { id: 'submissions', label: 'Submit Proof', icon: CheckSquare, badge: submissions.length > 0 ? String(submissions.length) : undefined },
                { id: 'chat', label: 'Negotiation Chat', icon: MessageSquare, badge: messages.length > 0 ? String(messages.length) : undefined },
                ...(role === 'brand' || role === 'admin'
                  ? [{ id: 'participants', label: `Participants (${applications.length})`, icon: Users }]
                  : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] pt-4">
              
              {/* ========================================================================= */}
              {/* OVERVIEW TAB                                                             */}
              {/* ========================================================================= */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* 4-Stage Campaign Execution Roadmap */}
                  <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-foreground">Campaign Execution Workflow</h4>
                        <p className="text-xs text-muted-foreground">Real-time status of legal contract, deliverables, and escrow verification</p>
                      </div>
                      <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-bold px-3 py-1">
                        {isContractLocked ? 'Phase 3: Deliverables Active' : hasSignedContract ? 'Phase 2: Contract Review' : 'Phase 1: Agreement & Signing'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                      {/* Step 1 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        hasSignedContract || isContractLocked 
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' 
                          : 'bg-muted/30 border-primary/40 text-primary'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Step 1</span>
                          {hasSignedContract || isContractLocked ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="font-bold text-foreground text-sm">Sign Contract</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Creator signs and uploads Master Agreement</p>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isContractLocked 
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' 
                          : hasSignedContract 
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-400' 
                            : 'bg-muted/20 border-border/30 text-muted-foreground opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Step 2</span>
                          {isContractLocked ? <Lock className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="font-bold text-foreground text-sm">Lock & Authorize</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Brand verifies signed contract and locks terms</p>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        submissions.length > 0 
                          ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-400' 
                          : isContractLocked 
                            ? 'bg-muted/40 border-primary/40 text-primary' 
                            : 'bg-muted/20 border-border/30 text-muted-foreground opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Step 3</span>
                          <UploadCloud className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="font-bold text-foreground text-sm">Deliverables Proof</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Creator uploads live links and task proof</p>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        submissions.some(s => s.status === 'approved') 
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' 
                          : 'bg-muted/20 border-border/30 text-muted-foreground opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Step 4</span>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="font-bold text-foreground text-sm">Review & Payout</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Brand approves proof & releases escrow payout</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Quick Action Cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Action 1: Contract Center */}
                    <Card className="p-5 border-border/50 bg-card/60 flex flex-col justify-between hover:border-primary/50 transition-all">
                      <div>
                        <div className="p-2.5 w-fit rounded-lg bg-primary/10 text-primary mb-3">
                          <FileSignature className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Legal Contract Hub</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isContractLocked ? 'Contract is locked and active' : hasSignedContract ? 'Signed contract awaiting lock' : 'Download contract or upload signed PDF'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40 flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="w-full text-xs font-semibold gap-1.5" onClick={handleDownloadContract} disabled={downloadingContract}>
                          <Download className="w-3.5 h-3.5" /> Master Agreement
                        </Button>
                        {hasSignedContract && (
                          <Button size="sm" variant="outline" className="w-full text-xs font-semibold text-emerald-400 border-emerald-500/30 gap-1.5" onClick={() => handleDownloadSignedContract()} disabled={downloadingSigned}>
                            <Download className="w-3.5 h-3.5" /> Signed Document
                          </Button>
                        )}
                      </div>
                    </Card>

                    {/* Action 2: Deliverables Proof */}
                    <Card className="p-5 border-border/50 bg-card/60 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                      <div>
                        <div className="p-2.5 w-fit rounded-lg bg-indigo-500/10 text-indigo-400 mb-3">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Submit & Review Proof</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {submissions.length > 0 ? `${submissions.length} proof submission(s) active` : 'Upload live links, screenshots and work proof'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <Button size="sm" className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5" onClick={() => setActiveTab('submissions')}>
                          <ArrowUpRight className="w-3.5 h-3.5" /> Open Proof Desk
                        </Button>
                      </div>
                    </Card>

                    {/* Action 3: Live Chat */}
                    <Card className="p-5 border-border/50 bg-card/60 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
                      <div>
                        <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground">Negotiation & Chat</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Direct real-time messaging between brand and creator for feedback & negotiations
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <Button size="sm" variant="outline" className="w-full text-xs font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5" onClick={() => setActiveTab('chat')}>
                          <MessageCircle className="w-3.5 h-3.5" /> Start Chat
                        </Button>
                      </div>
                    </Card>

                    {/* Action 4: Escrow Protection */}
                    <Card className="p-5 border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between">
                      <div>
                        <div className="p-2.5 w-fit rounded-lg bg-emerald-500/20 text-emerald-400 mb-3">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="font-bold text-sm text-foreground">Escrow Protected</h4>
                          <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">100%</Badge>
                        </div>
                        <div className="text-xl font-black text-emerald-400 flex items-center">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {Number(campaign.budget).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Funds held safely in Crevio Smart Escrow. Released upon proof approval.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-500/20">
                        <Button size="sm" variant="ghost" className="w-full text-xs text-emerald-400 hover:bg-emerald-500/10 gap-1" onClick={() => setActiveTab('deliverables')}>
                          View Milestones <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  </div>

                  {/* About the Campaign Section */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold">About the Campaign</h3>
                    <Card className="p-6 border-border/50 bg-card/50">
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {campaign.description}
                      </p>
                    </Card>
                  </section>
                  
                  {/* Campaign Parameters Grid */}
                  <section className="grid sm:grid-cols-3 gap-4">
                    <Card className="p-5 border-border/50 bg-muted/20">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Audience</h4>
                      <p className="font-medium text-foreground">{campaign.target_audience}</p>
                    </Card>
                    <Card className="p-5 border-border/50 bg-muted/20">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Platform</h4>
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <Tag className="w-4 h-4 text-primary" /> {campaign.platform}
                      </div>
                    </Card>
                    <Card className="p-5 border-border/50 bg-muted/20">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Usage Rights</h4>
                      <p className="font-medium text-foreground text-xs">{campaign.content_rights || 'Standard digital distribution rights'}</p>
                    </Card>
                  </section>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DELIVERABLES TAB                                                         */}
              {/* ========================================================================= */}
              {activeTab === 'deliverables' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground">Total Campaign Budget (Escrow)</h3>
                        {campaign.status === 'active' || (campaign as any).escrow_status === 'held' ? (
                          <Badge className="bg-emerald-600 text-white font-bold gap-1 text-xs">
                            <ShieldCheck className="w-3.5 h-3.5" /> 100% Funds Submitted & Secured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">
                            Pending Escrow Deposit
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.status === 'active' || (campaign as any).escrow_status === 'held'
                          ? 'Brand has deposited the full amount into Crevio Escrow. Guaranteed payout for completed deliverables.'
                          : 'Brand budget configured for this campaign.'}
                      </p>
                    </div>
                    <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight flex items-center">
                      <IndianRupee className="w-6 h-6 mr-0.5" />
                      {Number(campaign.budget).toLocaleString()}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-4">Required Deliverables Breakdown</h3>
                  
                  {extractedDeliverables.length > 0 ? (
                    <div className="space-y-3">
                      {extractedDeliverables.map((del: any, idx: number) => (
                        <Card key={idx} className="p-5 border-border/50 bg-card/60">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-500/30 text-xs">
                                  Milestone {idx + 1}
                                </Badge>
                                <span className="font-bold text-foreground">{del.description || del.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Platform: <strong className="text-foreground">{del.platform || campaign.platform}</strong>
                                {del.deadline && <> • Deadline: <strong className="text-foreground">{del.deadline}</strong></>}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs gap-1.5"
                              onClick={() => {
                                setProofTitle(del.description || del.title);
                                setActiveTab('submissions');
                              }}
                            >
                              <UploadCloud className="w-3.5 h-3.5" /> Submit Proof
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 border-border/50">
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {campaign.deliverables_summary || "See official contract for exact deliverable breakdown."}
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TIMELINE TAB                                                             */}
              {/* ========================================================================= */}
              {activeTab === 'timeline' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h3 className="text-xl font-bold mb-4">Campaign Timeline</h3>
                   <div className="relative border-l-2 border-primary/30 ml-3 md:ml-6 space-y-10 py-4">
                      {/* Created Node */}
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                        <h4 className="font-bold text-base">Campaign Launch & Ingestion</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Campaign launched and terms initialized on platform.
                        </p>
                      </div>

                      {/* Contract Node */}
                      <div className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${hasSignedContract ? 'bg-emerald-500' : 'bg-muted-foreground'} ring-4 ring-background`} />
                        <h4 className="font-bold text-base">Contract Signing & Locking</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isContractLocked ? 'Completed & Locked' : hasSignedContract ? 'Signed Copy Attached' : 'Pending Creator Signing'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Master Service Agreement signed by creator and locked by brand.
                        </p>
                      </div>

                      {/* Deadline Node */}
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-background" />
                        <h4 className="font-bold text-base">Final Submission Deadline</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {campaign.deadline}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          All deliverable proofs must be submitted for brand review.
                        </p>
                      </div>
                   </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONTRACT RULES TAB                                                       */}
              {/* ========================================================================= */}
              {activeTab === 'rules' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold mb-4">Contract Compliance & Rules</h3>
                  <div className="space-y-4">
                    {campaign.requirements && campaign.requirements.length > 0 ? (
                      campaign.requirements.map((req, i) => (
                        <Card key={i} className="p-4 border-border/50 bg-card/50 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{req}</p>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <Card className="p-6 border-border/50 text-center text-muted-foreground">
                        <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                        <p>No custom compliance rules attached beyond standard terms.</p>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* LEGAL CONTRACT TAB                                                       */}
              {/* ========================================================================= */}
              {activeTab === 'contract' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Master Contract Download Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-6 rounded-xl border border-border/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">Campaign Legal Agreement & Contract Terms</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Master Document: <strong className="text-foreground">{campaign.contract_file_name || 'Brand_Master_Campaign_Contract.pdf'}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {campaign.contract_extracted_terms?.confidenceScore && (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 px-3 py-1 font-semibold">
                          AI Confidence: {campaign.contract_extracted_terms.confidenceScore}%
                        </Badge>
                      )}
                      <Button
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md"
                        onClick={handleDownloadContract}
                        disabled={downloadingContract}
                      >
                        {downloadingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {downloadingContract ? 'Downloading...' : 'Download Master Contract (PDF)'}
                      </Button>
                    </div>
                  </div>

                  {/* Signed Contract & Lock Controls */}
                  <Card className={`p-6 border ${isContractLocked ? 'border-emerald-500/40 bg-emerald-950/20' : hasSignedContract ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-border/50 bg-muted/20'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isContractLocked ? (
                            <Lock className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <FileSignature className="w-5 h-5 text-indigo-400" />
                          )}
                          <h4 className="font-bold text-base text-foreground">
                            {isContractLocked 
                              ? 'Contract Officially Locked & Active 🔒' 
                              : hasSignedContract 
                                ? 'Signed Contract Uploaded (Pending Brand Approval)' 
                                : 'Signed Contract Copy Pending'}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                          {isContractLocked
                            ? 'This contract is legally active and locked. Uploading has been disabled. Proceed to the "Submit Proof" tab to complete milestones.'
                            : hasSignedContract
                              ? 'The creator has signed and submitted their contract. Brand can review and lock the agreement below.'
                              : 'Creator must download the Master Agreement, sign it, and upload the signed document.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {hasSignedContract && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold border-emerald-500/40 text-emerald-400 gap-1.5"
                            onClick={() => handleDownloadSignedContract()}
                            disabled={downloadingSigned}
                          >
                            {downloadingSigned ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download Signed Copy
                          </Button>
                        )}

                        {/* Brand Lock Button */}
                        {(role === 'brand' || role === 'admin') && !isContractLocked && hasSignedContract && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-md shadow-emerald-600/20"
                            onClick={() => handleLockContract()}
                            disabled={lockingContract}
                          >
                            {lockingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            {lockingContract ? 'Locking...' : 'Lock Contract'}
                          </Button>
                        )}

                        {/* Creator Re-upload (Only if NOT locked) */}
                        {role === 'creator' && !isContractLocked && (
                          <label className="cursor-pointer">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.doc,.docx"
                              onChange={handleUploadSignedContract}
                              disabled={uploadingSigned}
                            />
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 pointer-events-none shadow-sm"
                              disabled={uploadingSigned}
                            >
                              {uploadingSigned ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <UploadCloud className="w-4 h-4 text-white" />}
                              {hasSignedContract ? 'Re-upload Signed Copy' : 'Upload Signed Contract'}
                            </Button>
                          </label>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Extracted Contract Terms Summary */}
                  {campaign.contract_extracted_terms ? (
                    <div className="space-y-6">
                      {campaign.contract_extracted_terms.summary && (
                        <Card className="p-6 border-border/50 bg-card/40">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Contract Executive Summary</h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {campaign.contract_extracted_terms.summary}
                          </p>
                        </Card>
                      )}

                      <div className="grid sm:grid-cols-3 gap-4">
                        <Card className="p-5 border-border/50 bg-muted/20">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Contract Budget</h4>
                            {campaign.status === 'active' || (campaign as any).escrow_status === 'held' ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] font-bold py-0.5 px-2">
                                Funds Submitted
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-2xl font-black text-emerald-400 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-0.5" />
                            {Number(campaign.contract_extracted_terms.totalValue || campaign.contract_extracted_terms.paymentAmount || campaign.budget).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-emerald-500 mt-1.5 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> 100% Escrow Protected
                          </p>
                        </Card>
                        <Card className="p-5 border-border/50 bg-muted/20">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payment Milestones</h4>
                          <p className="text-sm font-medium text-foreground">
                            {campaign.contract_extracted_terms.paymentTerms || '50% advance on signing + 50% on final delivery'}
                          </p>
                        </Card>
                        <Card className="p-5 border-border/50 bg-muted/20">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Usage Rights & Exclusivity</h4>
                          <p className="text-sm font-medium text-foreground">
                            {campaign.contract_extracted_terms.rights || campaign.content_rights || 'Standard digital media & social distribution rights.'}
                          </p>
                        </Card>
                      </div>

                      {/* Deliverables Breakdown */}
                      {campaign.contract_extracted_terms.deliverables && campaign.contract_extracted_terms.deliverables.length > 0 && (
                        <Card className="p-6 border-border/50">
                          <h4 className="font-bold text-base mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Contract Deliverables Specification
                          </h4>
                          <div className="space-y-3">
                            {campaign.contract_extracted_terms.deliverables.map((del: any, idx: number) => (
                              <div key={idx} className="flex flex-wrap items-center justify-between p-3.5 rounded-lg bg-muted/30 border border-border/50 text-sm">
                                <div className="font-medium text-foreground">{del.description}</div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <Badge variant="secondary">{del.platform || campaign.platform}</Badge>
                                  {del.deadline && <span>Deadline: <strong className="text-foreground">{del.deadline}</strong></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="p-8 text-center text-muted-foreground space-y-3">
                      <FileSignature className="w-12 h-12 mx-auto text-muted-foreground/40" />
                      <p className="font-semibold text-base">Standard Legal Agreement Template</p>
                      <p className="text-xs max-w-md mx-auto">
                        Download the master contract above to review complete clauses, deliverables schedule, and payment milestones.
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* SUBMIT PROOF TAB                                                         */}
              {/* ========================================================================= */}
              {activeTab === 'submissions' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-indigo-400" />
                        Deliverables & Proof Submissions
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Submit live post URLs, metrics, and screenshots for brand review and milestone release.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-muted/40 border-border/50 text-xs py-1 px-3">
                        Total Submissions: <strong className="ml-1 text-foreground">{submissions.length}</strong>
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-950/30 border-emerald-500/40 text-emerald-400 text-xs py-1 px-3">
                        Approved: <strong className="ml-1">{submissions.filter(s => s.status === 'approved').length}</strong>
                      </Badge>
                    </div>
                  </div>

                  {/* Creator Submit Proof Form */}
                  {role === 'creator' && (
                    <Card className="p-6 border-indigo-500/30 bg-card shadow-lg space-y-6">
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <UploadCloud className="w-5 h-5 text-indigo-400" />
                          <div>
                            <h4 className="font-bold text-base text-foreground">Submit Deliverable & Insights Proof</h4>
                            <p className="text-xs text-muted-foreground">Upload content link, performance metrics, and professional dashboard screenshots for review.</p>
                          </div>
                        </div>
                        {isContractLocked ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                            <Lock className="w-3 h-3 mr-1" /> Contract Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[10px]">
                            Pending Contract Lock
                          </Badge>
                        )}
                      </div>

                      <form onSubmit={handleSubmitProof} className="space-y-5">
                        {/* Section 1: Milestone & Live Link */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                              Deliverable Milestone *
                            </label>
                            {extractedDeliverables.length > 0 ? (
                              <select 
                                className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                value={proofTitle}
                                onChange={(e) => setProofTitle(e.target.value)}
                                required
                              >
                                <option value="">Select deliverable milestone...</option>
                                {extractedDeliverables.map((del: any, idx: number) => (
                                  <option key={idx} value={del.description || del.title}>
                                    {del.description || del.title}
                                  </option>
                                ))}
                                <option value="Custom Reel / Post Deliverable">Custom Reel / Post Deliverable</option>
                              </select>
                            ) : (
                              <input 
                                type="text"
                                className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g. Instagram Reel 1 - Brand Review"
                                value={proofTitle}
                                onChange={(e) => setProofTitle(e.target.value)}
                                required
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                              Live Content URL (Post Link) *
                            </label>
                            <div className="relative">
                              <Link2 className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                              <input 
                                type="url"
                                className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="https://instagram.com/reel/... or https://youtube.com/..."
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Photo Submission - Insights & Professional Dashboard Screenshot */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-indigo-400" />
                              Insights & Professional Dashboard Photo / Screenshot
                            </label>
                            <span className="text-[11px] text-indigo-400 font-medium">Recommended for Brand & Admin Review</span>
                          </div>

                          {!proofPhotoPreview ? (
                            <label className="group relative border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 transition-all text-center">
                              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                                <FileImage className="w-6 h-6" />
                              </div>
                              <p className="font-semibold text-sm text-foreground">
                                Click or drag & drop Insights / Dashboard screenshot
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                Upload screenshots of your Instagram / YouTube / TikTok Professional Dashboard & Content Insights showing total Reach, Impressions, and Engagement Rate.
                              </p>
                              <p className="text-[10px] text-muted-foreground/80 mt-2 font-mono">
                                Supports PNG, JPG, JPEG, WEBP (Max 25MB)
                              </p>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                              />
                            </label>
                          ) : (
                            <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-500/5 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="relative group cursor-pointer" onClick={() => setExpandedImageModal({ url: proofPhotoPreview, title: proofInsightsPhoto?.name || 'Insights Screenshot' })}>
                                  <img 
                                    src={proofPhotoPreview} 
                                    alt="Insights Screenshot Preview" 
                                    className="w-20 h-20 object-cover rounded-lg border border-border/80 shadow-md group-hover:opacity-90 transition-opacity" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                    <ZoomIn className="w-5 h-5" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <p className="font-bold text-sm text-foreground">{proofInsightsPhoto?.name}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {proofInsightsPhoto ? `${(proofInsightsPhoto.size / 1024 / 1024).toFixed(2)} MB • Ready for submission` : ''}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedImageModal({ url: proofPhotoPreview, title: proofInsightsPhoto?.name || 'Insights Screenshot' })}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> Preview Full Screenshot
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground border border-border/60 transition-colors">
                                  Change Photo
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                                  />
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePhotoSelect(null)}
                                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 3: Engagement Metrics Inputs */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                            Content Insights & Performance Overview (Optional)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Engagement Rate
                              </span>
                              <input 
                                type="text"
                                placeholder="e.g. 5.8%"
                                value={proofEngagementRate}
                                onChange={(e) => setProofEngagementRate(e.target.value)}
                                className="w-full h-8 px-2 rounded-md bg-background/80 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-cyan-400" /> Total Reach
                              </span>
                              <input 
                                type="text"
                                placeholder="e.g. 38,400"
                                value={proofReach}
                                onChange={(e) => setProofReach(e.target.value)}
                                className="w-full h-8 px-2 rounded-md bg-background/80 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Impressions
                              </span>
                              <input 
                                type="text"
                                placeholder="e.g. 45,200"
                                value={proofImpressions}
                                onChange={(e) => setProofImpressions(e.target.value)}
                                className="w-full h-8 px-2 rounded-md bg-background/80 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-400" /> Likes / Reactions
                              </span>
                              <input 
                                type="text"
                                placeholder="e.g. 2,850"
                                value={proofLikes}
                                onChange={(e) => setProofLikes(e.target.value)}
                                className="w-full h-8 px-2 rounded-md bg-background/80 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-1">
                            <div>
                              <span className="text-[10px] text-muted-foreground block mb-1">Comments Count</span>
                              <input 
                                type="text"
                                placeholder="e.g. 320"
                                value={proofComments}
                                onChange={(e) => setProofComments(e.target.value)}
                                className="w-full h-7 px-2 rounded-md bg-muted/30 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block mb-1">Shares Count</span>
                              <input 
                                type="text"
                                placeholder="e.g. 140"
                                value={proofShares}
                                onChange={(e) => setProofShares(e.target.value)}
                                className="w-full h-7 px-2 rounded-md bg-muted/30 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block mb-1">Saves / Bookmarks</span>
                              <input 
                                type="text"
                                placeholder="e.g. 480"
                                value={proofSaves}
                                onChange={(e) => setProofSaves(e.target.value)}
                                className="w-full h-7 px-2 rounded-md bg-muted/30 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Performance & Overview Notes */}
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Performance Overview, Campaign Hashtags & Notes
                          </label>
                          <textarea 
                            rows={3}
                            className="w-full p-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Add details about engagement highlights, peak traffic times, viral spikes, or audience retention notes..."
                            value={proofDesc}
                            onChange={(e) => setProofDesc(e.target.value)}
                          />
                        </div>

                        {/* Footer: Additional file + Submit button */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/50">
                          <label className="cursor-pointer flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                            <Paperclip className="w-4 h-4 text-indigo-400" />
                            <span>{proofFile ? `Attached File: ${proofFile.name}` : 'Attach Additional PDF / Report (Optional)'}</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            />
                          </label>

                          <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-600/20"
                            disabled={submittingProof}
                          >
                            {submittingProof ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                            {submittingProof ? 'Submitting...' : 'Submit Proof for Brand Review'}
                          </Button>
                        </div>
                      </form>
                    </Card>
                  )}

                  {/* Submissions List */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-base text-foreground">Submitted Work & Milestones History</h4>

                    {loadingSubmissions ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <Card className="p-8 text-center text-muted-foreground space-y-2">
                        <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold">No deliverable proofs submitted yet.</p>
                        <p className="text-xs max-w-sm mx-auto">
                          Once the creator completes deliverables, submit the live link, performance overview, and insights screenshots here for review and milestone approval.
                        </p>
                      </Card>
                    ) : (
                      submissions.map((sub) => {
                        const hasPhoto = Boolean(sub.insights_image_path || (sub.attachment_path && sub.attachment_name?.match(/\.(png|jpe?g|webp|gif)$/i)));
                        const photoUrl = sub.insights_image_path || sub.attachment_path || '';

                        return (
                          <Card key={sub.id} className="p-5 border-border/50 bg-card/60 space-y-4 hover:border-border transition-all">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="font-bold text-base text-foreground">{sub.deliverable_title}</span>
                                  {sub.status === 'approved' ? (
                                    <Badge className="bg-emerald-600 text-white font-semibold text-xs gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Approved
                                    </Badge>
                                  ) : sub.status === 'revision_requested' ? (
                                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 font-semibold text-xs gap-1">
                                      <AlertCircle className="w-3 h-3" /> Changes Requested
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 bg-indigo-500/10 font-semibold text-xs gap-1">
                                      <Clock className="w-3 h-3" /> Pending Brand Review
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {sub.creator_name ? `by ${sub.creator_name}` : ''} on {new Date(sub.submitted_at).toLocaleString()}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <a 
                                  href={sub.live_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View Live Content Link
                                </a>
                              </div>
                            </div>

                            {/* Submitted Photo / Insights Screenshot Display */}
                            {hasPhoto && (
                              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="relative group cursor-pointer"
                                    onClick={() => setExpandedImageModal({ url: photoUrl, title: `${sub.deliverable_title} - Professional Dashboard & Insights` })}
                                  >
                                    <img 
                                      src={photoUrl} 
                                      alt="Insights Dashboard Screenshot" 
                                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-indigo-500/30 shadow-md group-hover:opacity-90 transition-opacity" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                      <Maximize2 className="w-5 h-5" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                      <ImageIcon className="w-3 h-3" /> Professional Dashboard & Insights Proof
                                    </span>
                                    <p className="text-xs font-bold text-foreground">
                                      {sub.insights_image_name || sub.attachment_name || 'Insights_Screenshot.png'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      Uploaded for engagement rate, impressions, and overview review.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedImageModal({ url: photoUrl, title: `${sub.deliverable_title} - Insights Screenshot` })}
                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 pt-1"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" /> Click to Zoom Full Screenshot
                                    </button>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                                  onClick={() => setExpandedImageModal({ url: photoUrl, title: `${sub.deliverable_title} - Insights Screenshot` })}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Inspect Insights
                                </Button>
                              </div>
                            )}

                            {/* Key Performance Metrics Overview Grid */}
                            {(sub.engagement_rate || sub.impressions_count || sub.reach_count || sub.likes_count || sub.comments_count || sub.shares_count || sub.saves_count) && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-muted/25 p-3 rounded-xl border border-border/40">
                                {sub.engagement_rate && (
                                  <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3 text-indigo-400" /> Engagement Rate
                                    </span>
                                    <p className="text-sm font-bold text-indigo-400 mt-0.5">{sub.engagement_rate}</p>
                                  </div>
                                )}
                                {sub.reach_count && (
                                  <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                      <Users className="w-3 h-3 text-cyan-400" /> Total Reach
                                    </span>
                                    <p className="text-sm font-bold text-foreground mt-0.5">{sub.reach_count}</p>
                                  </div>
                                )}
                                {sub.impressions_count && (
                                  <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                      <BarChart3 className="w-3 h-3 text-emerald-400" /> Impressions
                                    </span>
                                    <p className="text-sm font-bold text-foreground mt-0.5">{sub.impressions_count}</p>
                                  </div>
                                )}
                                {(sub.likes_count || sub.comments_count || sub.shares_count || sub.saves_count) && (
                                  <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                      <Heart className="w-3 h-3 text-rose-400" /> Interactions
                                    </span>
                                    <p className="text-xs font-semibold text-foreground mt-0.5 flex flex-wrap gap-1.5">
                                      {sub.likes_count && <span>❤️ {sub.likes_count}</span>}
                                      {sub.comments_count && <span>💬 {sub.comments_count}</span>}
                                      {sub.shares_count && <span>🔁 {sub.shares_count}</span>}
                                      {sub.saves_count && <span>🔖 {sub.saves_count}</span>}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Overview / Description */}
                            {(sub.description || sub.overview_notes) && (
                              <div className="p-3 rounded-lg bg-muted/20 border border-border/40 text-xs text-muted-foreground space-y-1">
                                <span className="font-semibold text-[11px] text-foreground uppercase tracking-wider">Performance Overview & Notes:</span>
                                <p className="leading-relaxed">{sub.overview_notes || sub.description}</p>
                              </div>
                            )}

                            {/* Brand Feedback Box */}
                            {sub.brand_feedback && (
                              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                                  <AlertCircle className="w-4 h-4" /> Brand Revision Feedback:
                                </div>
                                <p className="text-foreground leading-relaxed pl-5">
                                  "{sub.brand_feedback}"
                                </p>
                                <div className="pt-2 pl-5">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1"
                                    onClick={() => setActiveTab('chat')}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" /> Negotiate / Chat with Brand
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Brand Review Actions (Brand Side) */}
                            {(role === 'brand' || role === 'admin') && sub.status === 'pending' && (
                              <div className="pt-3 border-t border-border/40 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                                    onClick={() => handleReviewProof(sub.id, 'approved')}
                                    disabled={reviewingProofId === sub.id}
                                  >
                                    {reviewingProofId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Approve Proof & Milestone
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-400 border-amber-500/40 hover:bg-amber-500/10 font-bold text-xs gap-1.5"
                                    onClick={() => handleReviewProof(sub.id, 'revision_requested')}
                                    disabled={reviewingProofId === sub.id}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Request Changes / Revision
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs font-semibold text-primary ml-auto gap-1"
                                    onClick={() => setActiveTab('chat')}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                                  </Button>
                                </div>

                                <input 
                                  type="text"
                                  className="w-full h-8 px-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                                  placeholder="Add optional revision feedback notes for creator before clicking Request Changes..."
                                  value={reviewFeedbackInput[sub.id] || ''}
                                  onChange={(e) => setReviewFeedbackInput(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                />
                              </div>
                            )}
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              )}


              {/* ========================================================================= */}
              {/* CHAT TAB (Negotiation & Real-Time Collaboration)                        */}
              {/* ========================================================================= */}
              {activeTab === 'chat' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Campaign Collaboration & Negotiation Room
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Real-time direct chat between brand and creator for contract negotiation, revisions, and feedback.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 border-border/60"
                        onClick={() => fetchMessages()}
                        disabled={loadingMessages}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                        Sync Chat
                      </Button>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs font-semibold">
                        🟢 Real-Time Live
                      </Badge>
                    </div>
                  </div>

                  <Card className="flex flex-col h-[520px] border-border/60 bg-card overflow-hidden">
                    {/* Chat Messages Stream */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4">
                      {loadingMessages && messages.length === 0 ? (
                        <div className="space-y-3">
                          <Skeleton className="h-12 w-3/4 rounded-xl" />
                          <Skeleton className="h-12 w-2/3 ml-auto rounded-xl" />
                          <Skeleton className="h-12 w-3/4 rounded-xl" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                          <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
                          <p className="font-semibold text-sm">No messages in this campaign room yet.</p>
                          <p className="text-xs max-w-sm">
                            Say hello, negotiate terms, or discuss deliverables proof directly with your campaign partner.
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.sender_id === user?.id || (user?.role && msg.sender_role === user.role);
                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                              <div className="flex items-center gap-2 px-1">
                                <span className="text-[11px] font-semibold text-foreground">
                                  {isMe ? 'You' : (msg.sender_name || (msg.sender_role === 'brand' ? 'Brand Partner' : 'Creator'))}
                                </span>
                                <Badge variant="outline" className={`text-[9px] py-0 px-1 uppercase ${
                                  msg.sender_role === 'brand' 
                                    ? 'border-indigo-500/40 text-indigo-400 bg-indigo-950/30' 
                                    : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                                }`}>
                                  {msg.sender_role}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className={`max-w-md p-3.5 rounded-2xl text-sm leading-relaxed ${
                                isMe 
                                  ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm' 
                                  : 'bg-muted border border-border/50 text-foreground rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="px-4 py-2 bg-muted/20 border-t border-border/40 flex items-center gap-2 overflow-x-auto hide-scrollbar text-xs">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">Quick:</span>
                      {[
                        '📄 I have uploaded the signed contract for your review.',
                        '🚀 I submitted the deliverable link in Submit Proof tab.',
                        '💬 Can we discuss minor revisions on the timeline?',
                        '🤝 Approved! Looking forward to next steps.'
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1 rounded-full bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 shrink-0 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 bg-muted/40 border-t border-border/50 flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 h-11 px-4 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Type a message or negotiation note... (Press Enter to send)"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-md"
                        disabled={sendingMessage || !chatInput.trim()}
                        onClick={() => handleSendMessage()}
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* ========================================================================= */}
              {/* PARTICIPANTS TAB (Brand/Admin)                                           */}
              {/* ========================================================================= */}
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
                          ₹{Number(analytics.committedBudget).toLocaleString()}
                          <IndianRupee className="w-4 h-4 text-emerald-400 opacity-60" />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {analytics.approved} Creators Approved
                        </div>
                      </Card>

                      <Card className="p-4 bg-muted/20 border-border/50">
                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Conversion Rate</div>
                        <div className="text-2xl font-black mt-1 text-foreground flex items-center justify-between">
                          {analytics.conversionRate}%
                          <TrendingUp className="w-4 h-4 text-emerald-500 opacity-60" />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Avg Fee: ₹{Number(analytics.avgProposedFee).toLocaleString()}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Filter and Sort Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {['all', 'submitted', 'shortlisted', 'interviewing', 'approved', 'rejected'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setParticipantStatusFilter(status)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                              participantStatusFilter === status
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={participantSortBy}
                        onChange={(e) => setParticipantSortBy(e.target.value as any)}
                        className="bg-background border border-border/60 text-xs rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                      >
                        <option value="fit_score">Sort: Match Fit (High → Low)</option>
                        <option value="fee_asc">Sort: Proposed Fee (Low → High)</option>
                        <option value="fee_desc">Sort: Proposed Fee (High → Low)</option>
                        <option value="newest">Sort: Newest Applications</option>
                      </select>
                    </div>
                  </div>

                  {/* Applications List */}
                  {loadingApps ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full rounded-2xl" />
                      <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                  ) : processedApplications.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-semibold">No participants found matching this filter.</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {processedApplications.map((app) => (
                        <Card key={app.id} className="p-6 border-border/50 bg-card/60 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-foreground">{app.creator_name}</h4>
                                <Badge variant="outline" className="text-xs uppercase font-bold">
                                  {app.status}
                                </Badge>
                                {app.signed_contract_name && (
                                  <Badge className="bg-emerald-600 text-white text-[10px] font-semibold gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Signed Contract Ready
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Proposed Fee: <strong className="text-foreground">₹{Number(app.proposed_fee).toLocaleString()}</strong> • Applied on {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">AI Fit Score</div>
                              <div className="text-2xl font-black text-emerald-400 flex items-center justify-end gap-1">
                                <Sparkles className="w-4 h-4" />
                                {Number(app.fit_score || 0).toFixed(1)}
                              </div>
                            </div>
                          </div>

                          {isDirectInviteApplication(app) ? (
                            <p className="text-xs text-indigo-300 italic">
                              🔗 Enrolled directly via custom invite link (No proposal pitch required).
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              "{app.pitch_message}"
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
                            <div className="flex items-center gap-2">
                              {!isDirectInviteApplication(app) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs font-semibold"
                                  onClick={() => navigate(`/applications/${app.id}`)}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Full Proposal
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-[11px] font-semibold text-indigo-400 border-indigo-500/30 bg-indigo-950/20 px-2 py-1">
                                  🔗 Direct Invite Acceptance
                                </Badge>
                              )}

                              {app.signed_contract_name && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs font-semibold text-indigo-300 border-indigo-500/40"
                                  onClick={() => handleDownloadSignedContract(app.creator_id)}
                                  disabled={downloadingSigned}
                                >
                                  <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Download Signed Copy
                                </Button>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {app.status === 'approved' ? (
                                <>
                                  <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold gap-1 py-1 px-2.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved Creator
                                  </Badge>

                                  {app.signed_contract_name && !app.is_contract_locked && (
                                    <Button
                                      size="sm"
                                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-sm"
                                      onClick={() => handleLockContract(app.id, app.creator_id)}
                                      disabled={lockingContract}
                                    >
                                      {lockingContract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                                      Lock & Seal Contract
                                    </Button>
                                  )}

                                  {app.is_contract_locked && (
                                    <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-300 bg-emerald-950/40 font-semibold gap-1 py-1 px-2.5">
                                      <Lock className="w-3.5 h-3.5 text-emerald-400" /> Contract Locked & Active
                                    </Badge>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs font-semibold text-primary gap-1"
                                    onClick={() => setActiveTab('chat')}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs font-semibold text-emerald-400 gap-1"
                                    onClick={() => setActiveTab('submissions')}
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" /> Proof Desk
                                  </Button>
                                </>
                              ) : app.status === 'rejected' ? (
                                <>
                                  <Badge variant="outline" className="text-xs border-rose-500/40 text-rose-400 bg-rose-950/20 font-semibold">
                                    Application Rejected
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    disabled={updatingAppId === app.id}
                                    onClick={() => void handleStatusUpdate(app.id, 'shortlisted')}
                                  >
                                    Reconsider
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {app.status === 'submitted' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs"
                                      disabled={updatingAppId === app.id}
                                      onClick={() => void handleStatusUpdate(app.id, 'shortlisted')}
                                    >
                                      Shortlist
                                    </Button>
                                  )}
                                  {(app.status === 'submitted' || app.status === 'shortlisted') && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-xs"
                                      disabled={updatingAppId === app.id}
                                      onClick={() => void handleStatusUpdate(app.id, 'interviewing')}
                                    >
                                      Interview
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
                                </>
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

              {campaign.status === 'draft' && (role === 'brand' || role === 'admin') && (
                <Card className="p-6 border-accent/20 bg-accent/5 backdrop-blur-md shadow-glow-accent space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="font-bold text-xs tracking-wider uppercase">Fund & Launch Campaign</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This campaign is currently in <strong>Draft</strong>. To activate it and allow Creators to view, shortlist, and submit proposals, you must deposit and fund the campaign's prize budget (<strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(campaign.budget))}</strong>) into Crevio's secure Escrow Vault.
                  </p>
                  
                  <div className="text-xs bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 text-foreground">
                    Available Wallet Balance: <span className="font-bold text-emerald-400">₹{Number(wallet?.available_balance || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {Number(wallet?.available_balance || 0) >= Number(campaign.budget) ? (
                      <>
                        <Button 
                          className="w-full font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-glow-emerald h-11 text-xs uppercase"
                          disabled={busyAction !== null}
                          onClick={handleFundCampaignWithWallet}
                        >
                          {busyAction === 'wallet' ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Transferring...</span>
                          ) : (
                            <span>Pay with Wallet Balance</span>
                          )}
                        </Button>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors text-center mt-1"
                          onClick={handleFundCampaign}
                          disabled={busyAction !== null}
                        >
                          Or, Pay with Razorpay Gateway
                        </button>
                      </>
                    ) : (
                      <>
                        <Button 
                          className="w-full font-bold text-white bg-accent hover:bg-accent/80 shadow-glow-accent h-11 text-xs uppercase"
                          disabled={busyAction !== null}
                          onClick={handleFundCampaign}
                        >
                          {busyAction === 'razorpay' ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Preparing Gateway...</span>
                          ) : busyAction === 'verify' ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Securing Signature...</span>
                          ) : (
                            <span>Fund Campaign with Razorpay</span>
                          )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center">
                          Top up your wallet in the <Link to="/wallet" className="underline text-accent">Wallet Hub</Link> to pay via balance.
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              )}
              
              <Card className="p-6 border-border/50 shadow-xl shadow-black/5 bg-gradient-to-b from-card to-background">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Prize Pool / Budget</p>
                      {campaign.status === 'active' || (campaign as any).escrow_status === 'held' ? (
                        <Badge className="bg-emerald-600 text-white text-xs font-bold gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-3xl font-black text-foreground flex items-center gap-1">
                      <span className="text-emerald-500 font-bold text-2xl">₹</span>
                      {Number(campaign.budget).toLocaleString()}
                    </p>

                    {campaign.status === 'active' || (campaign as any).escrow_status === 'held' ? (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span>Funds 100% Submitted & Escrowed</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Brand has deposited the full ₹{Number(campaign.budget).toLocaleString()} into Crevio Escrow. Payment is 100% secured and guaranteed for accepted creators.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Clock className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>Awaiting Escrow Deposit</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Campaign budget will be locked in escrow upon brand funding.
                        </p>
                      </div>
                    )}
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
                        <div className="space-y-2">
                          <Button 
                            className="w-full font-bold h-11 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => setActiveTab('submissions')}
                          >
                            <CheckSquare className="w-4 h-4 mr-2" /> Submit Deliverables Proof
                          </Button>
                          {!isDirectInviteApplication(creatorApplication) && (
                            <Button 
                              variant="outline"
                              className="w-full font-semibold text-xs"
                              onClick={() => navigate(`/applications/${creatorApplication.id}`)}
                            >
                              View Your Proposal
                            </Button>
                          )}
                        </div>
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
                      <div className="space-y-2">
                        <Button 
                          variant="outline"
                          className="w-full font-semibold text-xs gap-1.5"
                          onClick={handleDownloadContract}
                          disabled={downloadingContract}
                        >
                          <Download className="w-3.5 h-3.5" /> Download Master Agreement
                        </Button>
                        <Button 
                          className="w-full font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                          onClick={() => setActiveTab('submissions')}
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Review Deliverables Proof
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </div>

      </div>



      {/* Full-Screen Screenshot & Insights Lightbox Modal */}
      {expandedImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setExpandedImageModal(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center bg-card/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-border/60 mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate max-w-md sm:max-w-xl">
                  {expandedImageModal.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={expandedImageModal.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setExpandedImageModal(null)}
                  className="p-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="w-full flex-1 overflow-auto flex items-center justify-center rounded-xl bg-black/40 p-2">
              <img 
                src={expandedImageModal.url} 
                alt={expandedImageModal.title}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

