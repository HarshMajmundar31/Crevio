import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  apiAdminGetOverview,
  apiAdminGetCampaigns,
  apiAdminCreateCampaign,
  apiAdminUpdateCampaign,
  apiAdminDeleteCampaign,
  apiAdminGetContracts,
  apiAdminCreateContract,
  apiAdminUpdateContract,
  apiAdminDeleteContract,
  apiAdminGetApplications,
  apiAdminUpdateApplicationStatus,
  apiAdminDeleteApplication,
  apiAdminGetMessages,
  apiAdminPostMessage,
  apiAdminDeleteMessage,
  apiAdminGetUsers,
  apiAdminCreateUser,
  apiAdminUpdateUser,
  apiAdminAdjustUserBalance,
  apiAdminDeleteUser,
  apiAdminGetProofs,
  apiAdminUpdateProofStatus,
  apiAdminDeleteProof,
  apiAdminReleaseEscrow,
  apiAdminRefundEscrow,
  apiGetAdminEscrows,
  apiAdminSettleDispute,
  apiGetAuditLogs,
  apiDownloadCampaignContract,
  apiDownloadSignedContract,
  apiAdminGetTreasuryOverview,
  apiAdminGetEmailOverview,
  apiAdminGetEmailLogs,
  apiAdminSendTestEmail,
  apiAdminSendBroadcastEmail,
  apiAdminGetEmailTemplates,
  AdminOverviewStats,
  AdminActivityItem,
  AdminCampaignItem,
  AdminContractItem,
  AdminApplicationItem,
  AdminMessageItem,
  AdminUserItem,
  AdminProofItem,
  ApiEscrowHolding,
  AdminTreasuryOverviewResponse,
  EmailOverviewResponse,
  EmailLog,
  EmailTemplateDefinition
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
  AlertTriangle,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Shield,
  Plus,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  Download,
  Send,
  X,
  DollarSign,
  Filter,
  Eye,
  Check,
  XCircle,
  HelpCircle,
  Clock,
  Instagram,
  Image as ImageIcon,
  CheckSquare,
  Maximize2,
  ZoomIn,
  BarChart3,
  Heart,
  CreditCard,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Copy,
  Mail,
  SendHorizontal,
  Radio,
  CheckCheck,
  Terminal,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import InstagramAnalyticsDashboard from '@/components/InstagramAnalyticsDashboard';

type AdminTab = 'overview' | 'payments' | 'emails' | 'instagram' | 'campaigns' | 'contracts' | 'applications' | 'proofs' | 'messages' | 'users' | 'escrows' | 'audits';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Overview Data
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [activityStream, setActivityStream] = useState<AdminActivityItem[]>([]);
  const [treasuryOverview, setTreasuryOverview] = useState<AdminTreasuryOverviewResponse | null>(null);

  // Campaigns Data & States
  const [campaigns, setCampaigns] = useState<AdminCampaignItem[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('all');
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdminCampaignItem | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    goal: '',
    target_audience: '',
    deliverables_summary: '',
    platform: 'Instagram',
    budget: 50000,
    deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active' as const
  });

  // Contracts Data & States
  const [contracts, setContracts] = useState<AdminContractItem[]>([]);
  const [contractSearch, setContractSearch] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('all');
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState<AdminContractItem | null>(null);
  const [contractForm, setContractForm] = useState({
    brand_id: '',
    creator_id: '',
    campaign_id: '',
    payment_amount: 25000,
    contract_deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
    status: 'pending' as const
  });

  // Applications Data & States
  const [applications, setApplications] = useState<AdminApplicationItem[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');

  // Proofs & Deliverables Data & States
  const [proofs, setProofs] = useState<AdminProofItem[]>([]);
  const [proofSearch, setProofSearch] = useState('');
  const [proofStatusFilter, setProofStatusFilter] = useState('all');
  const [proofLightbox, setProofLightbox] = useState<{ url: string; title: string } | null>(null);
  const [updatingProofId, setUpdatingProofId] = useState<string | null>(null);
  const [adminProofFeedback, setAdminProofFeedback] = useState<{ [id: string]: string }>({});

  // Messages Data & States
  const [messages, setMessages] = useState<AdminMessageItem[]>([]);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgCampaignFilter, setMsgCampaignFilter] = useState('');
  const [adminBroadcastMsg, setAdminBroadcastMsg] = useState('');
  const [adminBroadcastCampaignId, setAdminBroadcastCampaignId] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Users Data & States
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [adjustingWalletUser, setAdjustingWalletUser] = useState<AdminUserItem | null>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState('');
  const [walletAdjustReason, setWalletAdjustReason] = useState('');
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    role: 'creator',
    initial_balance: 10000
  });

  // Escrows & Disputes
  const [escrows, setEscrows] = useState<ApiEscrowHolding[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<ApiEscrowHolding | null>(null);
  const [creatorPercent, setCreatorPercent] = useState<number>(50);
  const [isSettling, setIsSettling] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Resend & Autonomous Email Engine State
  const [emailOverview, setEmailOverview] = useState<EmailOverviewResponse | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateDefinition[]>([]);
  const [emailLogsFilter, setEmailLogsFilter] = useState({ status: 'all', template: 'all', search: '' });
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailForm, setTestEmailForm] = useState({
    to: 'crevio.admin@gmail.com',
    templateName: 'welcome_user',
    customSubject: '',
    customMessage: '',
    mode: 'template' as 'template' | 'custom'
  });
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<EmailTemplateDefinition | null>(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: 'all' as 'all' | 'creators' | 'brands' | 'admin',
    subject: '',
    message: '',
    actionUrl: '',
    actionText: ''
  });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<EmailLog | null>(null);

  // Initial Data Load
  const fetchAllAdminData = async () => {
    try {
      setIsLoading(true);
      const [
        overviewRes, 
        campaignsRes, 
        contractsRes, 
        appsRes, 
        proofsRes, 
        msgsRes, 
        usersRes, 
        escrowsRes, 
        auditRes, 
        treasuryRes,
        emailOverviewRes,
        emailTemplatesRes,
        emailLogsRes
      ] = await Promise.all([
        apiAdminGetOverview().catch(() => null),
        apiAdminGetCampaigns().catch(() => ({ campaigns: [] })),
        apiAdminGetContracts().catch(() => ({ contracts: [] })),
        apiAdminGetApplications().catch(() => ({ applications: [] })),
        apiAdminGetProofs().catch(() => ({ proofs: [] })),
        apiAdminGetMessages().catch(() => ({ messages: [] })),
        apiAdminGetUsers().catch(() => ({ users: [] })),
        apiGetAdminEscrows().catch(() => ({ escrows: [] })),
        apiGetAuditLogs().catch(() => ({ logs: [] })),
        apiAdminGetTreasuryOverview().catch(() => null),
        apiAdminGetEmailOverview().catch(() => null),
        apiAdminGetEmailTemplates().catch(() => ({ templates: [] })),
        apiAdminGetEmailLogs({ limit: 50 }).catch(() => ({ logs: [] }))
      ]);

      if (overviewRes) {
        setOverviewStats(overviewRes.stats);
        setActivityStream(overviewRes.activityStream);
      }
      if (treasuryRes && treasuryRes.success) {
        setTreasuryOverview(treasuryRes);
      }
      if (emailOverviewRes) {
        setEmailOverview(emailOverviewRes);
      }
      if (emailTemplatesRes) {
        setEmailTemplates(emailTemplatesRes.templates);
      }
      if (emailLogsRes && emailLogsRes.logs) {
        setEmailLogs(emailLogsRes.logs);
      }
      if (campaignsRes) setCampaigns(campaignsRes.campaigns);
      if (contractsRes) setContracts(contractsRes.contracts);
      if (appsRes) setApplications(appsRes.applications);
      if (proofsRes) setProofs(proofsRes.proofs);
      if (msgsRes) setMessages(msgsRes.messages);
      if (usersRes) setUsers(usersRes.users);
      if (escrowsRes) {
        setEscrows(escrowsRes.escrows);
        const disputed = escrowsRes.escrows.filter(e => e.status === 'disputed');
        if (disputed.length > 0 && !selectedDispute) {
          setSelectedDispute(disputed[0]);
        }
      }
      if (auditRes) setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      toast.error('Failed to load some admin data');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const formatAmount = (num: string | number) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(isNaN(val) ? 0 : val);
  };

  // ==============================
  // CAMPAIGN HANDLERS
  // ==============================
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiAdminCreateCampaign(campaignForm);
      if (res.success) {
        toast.success(`Campaign "${campaignForm.title}" created successfully!`);
        setShowCreateCampaignModal(false);
        setCampaignForm({
          title: '',
          description: '',
          goal: '',
          target_audience: '',
          deliverables_summary: '',
          platform: 'Instagram',
          budget: 50000,
          deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'active'
        });
        const ref = await apiAdminGetCampaigns();
        setCampaigns(ref.campaigns);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create campaign');
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    try {
      const res = await apiAdminUpdateCampaign(editingCampaign.id, editingCampaign);
      if (res.success) {
        toast.success(`Campaign "${editingCampaign.title}" updated.`);
        setEditingCampaign(null);
        const ref = await apiAdminGetCampaigns();
        setCampaigns(ref.campaigns);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete campaign "${title}" (${id}) and all associated applications, contracts, and proofs?`)) return;
    try {
      const res = await apiAdminDeleteCampaign(id);
      if (res.success) {
        toast.success(`Campaign "${title}" deleted.`);
        setCampaigns(prev => prev.filter(c => c.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete campaign');
    }
  };

  const handleQuickCampaignStatus = async (id: string, status: any) => {
    try {
      const res = await apiAdminUpdateCampaign(id, { status });
      if (res.success) {
        toast.success(`Campaign status updated to ${status}.`);
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  // ==============================
  // CONTRACT HANDLERS
  // ==============================
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiAdminCreateContract(contractForm);
      if (res.success) {
        toast.success(`Contract created successfully!`);
        setShowCreateContractModal(false);
        const ref = await apiAdminGetContracts();
        setContracts(ref.contracts);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create contract');
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    try {
      const res = await apiAdminUpdateContract(editingContract.id, editingContract);
      if (res.success) {
        toast.success(`Contract #${editingContract.id.substring(0, 8)} updated.`);
        setEditingContract(null);
        const ref = await apiAdminGetContracts();
        setContracts(ref.contracts);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update contract');
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm(`Permanently delete Contract #${id.substring(0, 8)}?`)) return;
    try {
      const res = await apiAdminDeleteContract(id);
      if (res.success) {
        toast.success(`Contract deleted.`);
        setContracts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete contract');
    }
  };

  // ==============================
  // APPLICATION HANDLERS
  // ==============================
  const handleApplicationStatus = async (id: string, status: string) => {
    try {
      const res = await apiAdminUpdateApplicationStatus(id, status);
      if (res.success) {
        toast.success(`Application marked as ${status}.`);
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update application');
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm(`Permanently delete this application entry?`)) return;
    try {
      const res = await apiAdminDeleteApplication(id);
      if (res.success) {
        toast.success('Application removed.');
        setApplications(prev => prev.filter(a => a.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete application');
    }
  };

  // ==============================
  // PROOF & DELIVERABLE HANDLERS
  // ==============================
  const handleAdminUpdateProofStatus = async (id: string, status: 'approved' | 'revision_requested' | 'rejected') => {
    try {
      setUpdatingProofId(id);
      const feedback = adminProofFeedback[id] || '';
      const res = await apiAdminUpdateProofStatus(id, { status, brand_feedback: feedback });
      if (res.success) {
        toast.success(`Proof submission marked as ${status.replace('_', ' ')}.`);
        const ref = await apiAdminGetProofs();
        setProofs(ref.proofs);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update proof status');
    } finally {
      setUpdatingProofId(null);
    }
  };

  const handleAdminDeleteProof = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete proof submission for "${title}"?`)) return;
    try {
      const res = await apiAdminDeleteProof(id);
      if (res.success) {
        toast.success('Proof submission deleted.');
        setProofs(prev => prev.filter(p => p.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete proof');
    }
  };


  // ==============================
  // MESSAGES & BROADCAST HANDLERS
  // ==============================
  const handleSendAdminBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBroadcastCampaignId || !adminBroadcastMsg.trim()) {
      toast.error('Select a campaign and write a message');
      return;
    }
    try {
      setIsSendingMsg(true);
      const res = await apiAdminPostMessage({
        campaign_id: adminBroadcastCampaignId,
        message: `📢 [Admin Broadcast]: ${adminBroadcastMsg.trim()}`
      });
      if (res.success) {
        toast.success('Admin message posted to campaign workspace.');
        setAdminBroadcastMsg('');
        const ref = await apiAdminGetMessages();
        setMessages(ref.messages);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message');
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Delete this message from chat history?')) return;
    try {
      const res = await apiAdminDeleteMessage(id);
      if (res.success) {
        toast.success('Message deleted.');
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete message');
    }
  };

  // ==============================
  // USER HANDLERS
  // ==============================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiAdminCreateUser(userForm);
      if (res.success) {
        toast.success(`User ${userForm.full_name} created successfully!`);
        setShowCreateUserModal(false);
        setUserForm({ full_name: '', email: '', role: 'creator', initial_balance: 10000 });
        const ref = await apiAdminGetUsers();
        setUsers(ref.users);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await apiAdminUpdateUser(editingUser.id, editingUser);
      if (res.success) {
        toast.success(`User ${editingUser.full_name} updated.`);
        setEditingUser(null);
        const ref = await apiAdminGetUsers();
        setUsers(ref.users);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingWalletUser) return;
    const num = parseFloat(walletAdjustAmount);
    if (isNaN(num)) {
      toast.error('Enter a valid amount (+ to credit, - to debit)');
      return;
    }
    try {
      const res = await apiAdminAdjustUserBalance(adjustingWalletUser.id, num, walletAdjustReason);
      if (res.success) {
        toast.success(`Wallet balance updated for ${adjustingWalletUser.full_name}. New Balance: ₹${res.wallet.available_balance}`);
        setAdjustingWalletUser(null);
        setWalletAdjustAmount('');
        setWalletAdjustReason('');
        const ref = await apiAdminGetUsers();
        setUsers(ref.users);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to adjust balance');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete user account for ${name} (${id})? This cannot be undone.`)) return;
    try {
      const res = await apiAdminDeleteUser(id);
      if (res.success) {
        toast.success(`User ${name} deleted.`);
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user');
    }
  };

  // ==============================
  // ESCROW & DISPUTES
  // ==============================
  const handleSettleDispute = async () => {
    if (!selectedDispute) return;
    try {
      setIsSettling(true);
      const bPercent = 100 - creatorPercent;
      const res = await apiAdminSettleDispute(selectedDispute.contract_id, creatorPercent, bPercent);
      if (res.success) {
        toast.success(`Dispute settled successfully! Creator credited ₹${res.creatorShare.toLocaleString('en-IN')}, Brand refunded ₹${res.brandShare.toLocaleString('en-IN')}.`);
        setSelectedDispute(null);
        const ref = await apiGetAdminEscrows();
        setEscrows(ref.escrows);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to settle dispute');
    } finally {
      setIsSettling(false);
    }
  };

  const handleReleaseEscrow = async (id: string) => {
    if (!confirm(`Force release escrow #${id.substring(0, 8)} to creator?`)) return;
    try {
      const res = await apiAdminReleaseEscrow(id);
      if (res.success) {
        toast.success('Escrow released to creator wallet.');
        const ref = await apiGetAdminEscrows();
        setEscrows(ref.escrows);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to release escrow');
    }
  };

  const handleRefundEscrow = async (id: string) => {
    if (!confirm(`Force refund escrow #${id.substring(0, 8)} back to brand?`)) return;
    try {
      const res = await apiAdminRefundEscrow(id);
      if (res.success) {
        toast.success('Escrow refunded to brand wallet.');
        const ref = await apiGetAdminEscrows();
        setEscrows(ref.escrows);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to refund escrow');
    }
  };

  // ==============================
  // RESEND EMAIL HANDLERS
  // ==============================
  const handleSendTestEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testEmailForm.to) {
      toast.error('Recipient email is required');
      return;
    }
    try {
      setIsSendingTestEmail(true);
      const res = await apiAdminSendTestEmail({
        to: testEmailForm.to,
        templateName: testEmailForm.templateName,
        customSubject: testEmailForm.mode === 'custom' ? testEmailForm.customSubject : undefined,
        customMessage: testEmailForm.mode === 'custom' ? testEmailForm.customMessage : undefined,
      });

      if (res.success) {
        toast.success(`Live Test Email dispatched successfully to ${res.recipient}! Resend ID: ${res.resendId || 'Simulated'}`);
      } else {
        toast.error(`Email delivery notice: ${res.error || 'Failed to dispatch'}`);
      }

      // Refresh overview and logs
      const [over, logs] = await Promise.all([
        apiAdminGetEmailOverview().catch(() => null),
        apiAdminGetEmailLogs({ limit: 50 }).catch(() => ({ logs: [] }))
      ]);
      if (over) setEmailOverview(over);
      if (logs && logs.logs) setEmailLogs(logs.logs);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.subject || !broadcastForm.message) {
      toast.error('Subject and message are required');
      return;
    }
    try {
      setIsSendingBroadcast(true);
      const res = await apiAdminSendBroadcastEmail(broadcastForm);
      if (res.success) {
        toast.success(`Broadcast sent! Delivered to ${res.successCount} of ${res.totalRecipients} recipients.`);
        setShowBroadcastModal(false);
        setBroadcastForm({
          targetAudience: 'all',
          subject: '',
          message: '',
          actionUrl: '',
          actionText: ''
        });
        const [over, logs] = await Promise.all([
          apiAdminGetEmailOverview().catch(() => null),
          apiAdminGetEmailLogs({ limit: 50 }).catch(() => ({ logs: [] }))
        ]);
        if (over) setEmailOverview(over);
        if (logs && logs.logs) setEmailLogs(logs.logs);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const refreshEmailLogs = async () => {
    try {
      const res = await apiAdminGetEmailLogs({
        status: emailLogsFilter.status,
        template: emailLogsFilter.template,
        search: emailLogsFilter.search,
        limit: 50
      });
      if (res && res.logs) {
        setEmailLogs(res.logs);
      }
      const over = await apiAdminGetEmailOverview().catch(() => null);
      if (over) setEmailOverview(over);
      toast.success('Email logs synchronized');
    } catch (err: any) {
      toast.error('Failed to refresh email logs');
    }
  };

  // Filtered lists
  const filteredCampaigns = campaigns.filter(c => {
    const matchesQuery = !campaignSearch || 
      c.title.toLowerCase().includes(campaignSearch.toLowerCase()) || 
      c.brand_name?.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c.platform.toLowerCase().includes(campaignSearch.toLowerCase());
    const matchesStatus = campaignStatusFilter === 'all' || c.status === campaignStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredContracts = contracts.filter(c => {
    const matchesQuery = !contractSearch || 
      c.id.toLowerCase().includes(contractSearch.toLowerCase()) || 
      c.brand_name?.toLowerCase().includes(contractSearch.toLowerCase()) ||
      c.creator_name?.toLowerCase().includes(contractSearch.toLowerCase()) ||
      c.campaign_title?.toLowerCase().includes(contractSearch.toLowerCase());
    const matchesStatus = contractStatusFilter === 'all' || c.status === contractStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredApps = applications.filter(a => {
    const matchesQuery = !appSearch || 
      a.creator_name?.toLowerCase().includes(appSearch.toLowerCase()) || 
      a.brand_name?.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.campaign_title?.toLowerCase().includes(appSearch.toLowerCase());
    const matchesStatus = appStatusFilter === 'all' || a.status === appStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredProofs = proofs.filter(p => {
    const matchesQuery = !proofSearch || 
      p.deliverable_title?.toLowerCase().includes(proofSearch.toLowerCase()) || 
      p.creator_name?.toLowerCase().includes(proofSearch.toLowerCase()) ||
      p.creator_email?.toLowerCase().includes(proofSearch.toLowerCase()) ||
      p.brand_name?.toLowerCase().includes(proofSearch.toLowerCase()) ||
      p.campaign_title?.toLowerCase().includes(proofSearch.toLowerCase());
    const matchesStatus = proofStatusFilter === 'all' || p.status === proofStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredMessages = messages.filter(m => {
    const matchesQuery = !msgSearch || 
      m.message.toLowerCase().includes(msgSearch.toLowerCase()) || 
      m.sender_name.toLowerCase().includes(msgSearch.toLowerCase()) ||
      m.campaign_title?.toLowerCase().includes(msgSearch.toLowerCase());
    const matchesCamp = !msgCampaignFilter || m.campaign_id === msgCampaignFilter;
    return matchesQuery && matchesCamp;
  });

  const filteredUsers = users.filter(u => {
    const matchesQuery = !userSearch || 
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesQuery && matchesRole;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return log.id?.toLowerCase().includes(q) ||
      log.actor?.toLowerCase().includes(q) ||
      log.eventType?.toLowerCase().includes(q) ||
      log.contractNumber?.toLowerCase().includes(q) ||
      log.sha256Hash?.toLowerCase().includes(q);
  });

  const disputes = escrows.filter(e => e.status === 'disputed');

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            Crevio Super-Admin Console
            <Shield className="w-5 h-5 text-accent" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Platform-wide control center: campaigns, contracts, chats, users, escrow, and cryptographic ledger.</p>
        </div>
        <button 
          onClick={fetchAllAdminData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg font-medium border self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Platform Data
        </button>
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex border-b border-muted/50 mb-6 gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Overview & Pulse', icon: Activity },
          { id: 'payments', label: '💳 Razorpay & Test Sandbox', icon: CreditCard },
          { id: 'emails', label: `📧 Resend & Autonomous Mail (${emailOverview?.metrics.totalSent ?? 0})`, icon: Mail },
          { id: 'instagram', label: '📸 Instagram Analytics', icon: Instagram },
          { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Briefcase },
          { id: 'contracts', label: `Contracts (${contracts.length})`, icon: FileText },
          { id: 'applications', label: `Applications (${applications.length})`, icon: CheckCircle2 },
          { id: 'proofs', label: `Deliverable Proofs (${proofs.length})`, icon: CheckSquare },
          { id: 'messages', label: `Chat History (${messages.length})`, icon: MessageSquare },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'escrows', label: `Escrow & Disputes (${disputes.length})`, icon: Scale },
          { id: 'audits', label: 'Audit Trail', icon: ShieldAlert },
        ].map(tab => {

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`pb-3 px-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'escrows' && disputes.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-warning animate-ping ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] py-12">
          <div className="w-12 h-12 rounded-full border-4 border-muted border-t-accent animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Synchronizing platform data across database...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ========================================== */}
          {/* TAB 1: OVERVIEW & SYSTEM PULSE */}
          {/* ========================================== */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Platform Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Registered Users</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{overviewStats?.users?.total_users || users.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {overviewStats?.users?.total_creators || 0} creators · {overviewStats?.users?.total_brands || 0} brands · {overviewStats?.users?.total_admins || 0} admins
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Campaign Budget</p>
                  <p className="text-2xl font-bold text-accent mt-1">
                    {formatAmount(overviewStats?.campaigns?.total_budget_volume || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {overviewStats?.campaigns?.active_campaigns || 0} active · {overviewStats?.campaigns?.completed_campaigns || 0} completed
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Locked Escrow Pool</p>
                  <p className="text-2xl font-bold text-warning mt-1">
                    {formatAmount(overviewStats?.escrow?.total_held_escrow || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatAmount(overviewStats?.escrow?.total_released_escrow || 0)} settled to date
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Platform Interactions</p>
                  <p className="text-2xl font-bold text-success mt-1">
                    {(overviewStats?.totalApplications || 0) + (overviewStats?.totalMessages || 0)} Events
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {overviewStats?.totalApplications || 0} proposals · {overviewStats?.totalMessages || 0} chat messages
                  </p>
                </div>
              </div>

              {/* Razorpay Test Mode Telemetry Callout */}
              <div className="glass-card-elevated p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background to-indigo-500/10 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">Razorpay Sandbox & Test Mode Telemetry</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          SANDBOX ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tracking test money orders, HMAC signatures, test escrow holdings, and simulated card/UPI transactions.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                  >
                    Open Payment Monitor <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-background/60 p-3 rounded-xl border border-border/60">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Test Gateway Inflow</p>
                    <p className="text-lg font-black text-foreground mt-0.5">
                      {formatAmount(treasuryOverview?.testModeTelemetry?.metrics?.total_razorpay_inflow || 0)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Simulated deposits</span>
                  </div>

                  <div className="bg-background/60 p-3 rounded-xl border border-border/60">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Test Escrow</p>
                    <p className="text-lg font-black text-amber-400 mt-0.5">
                      {formatAmount(treasuryOverview?.testModeTelemetry?.metrics?.razorpay_escrow_held || 0)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Locked campaign funds</span>
                  </div>

                  <div className="bg-background/60 p-3 rounded-xl border border-border/60">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Verified Test Orders</p>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">
                      {treasuryOverview?.testModeTelemetry?.metrics?.total_razorpay_payments || 0} / {treasuryOverview?.testModeTelemetry?.metrics?.total_razorpay_orders || 0}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {treasuryOverview?.testModeTelemetry?.metrics?.verification_rate || 100}% signature rate
                    </span>
                  </div>

                  <div className="bg-background/60 p-3 rounded-xl border border-border/60">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Simulated Gateway Fees</p>
                    <p className="text-lg font-black text-indigo-400 mt-0.5">
                      {formatAmount(treasuryOverview?.testModeTelemetry?.metrics?.simulated_gateway_fees || 0)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">2% + 18% GST estimate</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Activity Stream */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    <h3 className="font-bold text-sm">Live Platform Activity Stream</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">Real-time ledger events</span>
                </div>

                <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                  {activityStream.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground">No recent activity logged on platform.</p>
                  ) : (
                    activityStream.map((act, i) => (
                      <div key={i} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            act.event_type === 'campaign_created' ? 'bg-accent' :
                            act.event_type === 'application_submitted' ? 'bg-warning' : 'bg-success'
                          }`} />
                          <div>
                            <p className="font-semibold text-foreground">{act.description}</p>
                            <p className="text-[11px] text-muted-foreground">
                              By <span className="font-medium text-foreground">{act.actor_name}</span> ({act.actor_role})
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(act.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 2: RAZORPAY TEST MODE & PAYMENTS HUB */}
          {/* ========================================== */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Header Banner */}
              <div className="glass-card-elevated p-6 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-accent/10 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                        💳 Razorpay Test Mode & Sandbox Telemetry
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        DEVELOPER SANDBOX ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-3xl">
                      Tracking simulated money inflows, Razorpay test payment IDs (<code className="text-amber-300 font-mono">pay_...</code>), test orders (<code className="text-amber-300 font-mono">order_...</code>), cryptographic HMAC-SHA256 signature verifications, and escrow lifecycle events.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/wallet"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/80 flex items-center gap-1.5 shadow-glow-accent transition-all"
                    >
                      <Wallet className="w-4 h-4" /> Platform Treasury Hub
                    </a>
                  </div>
                </div>

                {/* Gateway Details Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-border/50 text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Environment:</span>{' '}
                    <span className="font-mono text-amber-300">Razorpay Developer Sandbox (Test Mode)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Key ID:</span>{' '}
                    <span className="font-mono text-foreground bg-muted/80 px-2 py-0.5 rounded">
                      {treasuryOverview?.testModeTelemetry?.gatewayInfo?.keyId || 'rzp_test_••••••••'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Currency:</span>{' '}
                    <span className="font-mono text-emerald-400 font-bold">INR (₹)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Webhook / Signatures:</span>{' '}
                    <span className="text-emerald-400 font-semibold">HMAC-SHA256 Verified</span>
                  </div>
                </div>
              </div>

              {/* 4 Core Test Mode KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 border-l-4 border-l-indigo-500 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Test Gateway Inflow</span>
                    <Coins className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-black text-foreground">
                    {formatAmount(treasuryOverview?.testModeTelemetry?.metrics?.total_razorpay_inflow || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Gross funds deposited via Razorpay Checkout
                  </p>
                </div>

                <div className="glass-card p-5 border-l-4 border-l-amber-500 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Test Escrow Held</span>
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-amber-400">
                    {formatAmount(treasuryOverview?.testModeTelemetry?.metrics?.razorpay_escrow_held || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Locked in active campaign milestones
                  </p>
                </div>

                <div className="glass-card p-5 border-l-4 border-l-emerald-500 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified Test Orders</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-emerald-400">
                    {treasuryOverview?.testModeTelemetry?.metrics?.total_razorpay_payments || 0}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      / {treasuryOverview?.testModeTelemetry?.metrics?.total_razorpay_orders || 0}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {treasuryOverview?.testModeTelemetry?.metrics?.verification_rate || 100}% signature verification success
                  </p>
                </div>

                <div className="glass-card p-5 border-l-4 border-l-rose-500 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Simulated Gateway Fees</span>
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-2xl font-black text-rose-400">
                    {formatAmount(treasuryOverview?.testModeTelemetry?.metrics?.simulated_gateway_fees || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Calculated standard 2.36% (2% + 18% GST)
                  </p>
                </div>
              </div>

              {/* Middle Section: Flow Pipeline + Sandbox Cheatsheet */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Razorpay Test Lifecycle Flow */}
                <div className="glass-card p-6 lg:col-span-2 space-y-4">
                  <div className="border-b border-border/50 pb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Razorpay Test Mode Financial Pipeline
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      End-to-end milestone lifecycle for simulated platform transactions
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <p className="font-bold text-foreground">Brand Deposit</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Brand initiates top-up via Razorpay Checkout modal in test mode.
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-indigo-300">
                        order_...
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <p className="font-bold text-foreground">Escrow Lock</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        HMAC signature verified, money locked into smart platform escrow vault.
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-mono text-amber-400">
                        status: held
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <p className="font-bold text-foreground">Proof Submission</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Creator uploads deliverables, live links & dashboard screenshots.
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/10 text-[10px] font-mono text-cyan-400">
                        proofs review
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        4
                      </div>
                      <p className="font-bold text-foreground">Creator Payout</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Brand or Admin approves work, escrow automatically disburses funds.
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] font-mono text-emerald-400">
                        status: settled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Razorpay Sandbox Credentials Cheatsheet */}
                <div className="glass-card p-6 space-y-4">
                  <div className="border-b border-border/50 pb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-amber-400">
                      <CreditCard className="w-4 h-4" />
                      Sandbox Testing Reference
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Use these credentials in the deposit modal
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Test Card Number</p>
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-xs text-foreground font-bold">4012 0000 0000 0000</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('4012000000000000');
                            toast.success('Test Card copied to clipboard!');
                          }}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          title="Copy Card"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">CVV: <span className="font-mono text-foreground">123</span> · Expiry: <span className="font-mono text-foreground">12/32</span></p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Test UPI ID (VPA)</p>
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-xs text-emerald-400 font-bold">success@razorpay</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('success@razorpay');
                            toast.success('Test UPI copied to clipboard!');
                          }}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          title="Copy UPI"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Fails with: <span className="font-mono text-rose-400">failure@razorpay</span></p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Test Netbanking & OTP</p>
                      <p className="text-[11px] text-foreground font-semibold">Any Indian Bank (SBI, HDFC, ICICI)</p>
                      <p className="text-[10px] text-muted-foreground">Simulated OTP: <span className="font-mono text-accent font-bold">123456</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Razorpay & Gateway Transactions Feed */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      Recent Platform Transactions Ledger
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Live feed of simulated deposits, play credit seeds, and escrow disbursement events
                    </p>
                  </div>
                  <a
                    href="/wallet"
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    View Complete Ledger <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/50 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Gateway / Reference</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {treasuryOverview?.recentTransactions && treasuryOverview.recentTransactions.length > 0 ? (
                        treasuryOverview.recentTransactions.map((txn) => {
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
                              <td className="py-2.5 px-3 font-mono text-[10px]">
                                {txn.razorpay_payment_id ? (
                                  <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    🧪 {txn.razorpay_payment_id.substring(0, 14)}...
                                  </span>
                                ) : txn.txn_type === 'seed' ? (
                                  <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                    🌱 Seed Credits
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Internal Ledger</span>
                                )}
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
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            No recent transactions recorded in this session.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB: RESEND & AUTONOMOUS EMAIL ENGINE */}
          {/* ========================================== */}
          {activeTab === 'emails' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Resend Gateway Status Banner */}
              <div className="glass-card-elevated p-6 border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-card">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-glow-accent shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-foreground">Resend Email Gateway & Autonomous Mail Engine</h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {emailOverview?.gateway.status === 'connected' ? 'Connected & Authenticated' : 'Simulated Gateway'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          SDK v6.26.0
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Transactional email engine powered by Resend API with modern dark-violet responsive templates and autonomous platform activity triggers.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    <button
                      onClick={() => setShowBroadcastModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-glow-accent transition-all"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      Platform Broadcast
                    </button>
                    <button
                      onClick={refreshEmailLogs}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg font-medium border transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync Logs
                    </button>
                  </div>
                </div>

                {/* Gateway Credentials Quick Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-border/40 text-xs">
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active API Key</span>
                    <div className="flex items-center justify-between font-mono font-semibold text-foreground">
                      <span>{emailOverview?.gateway.maskedKey || 're_RdM9••••••••tiG4'}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verified Sender</span>
                    <div className="font-mono font-semibold text-accent truncate">
                      {emailOverview?.gateway.senderEmail || 'Crevio <notifications@crevio.co.in>'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Notification Inbox</span>
                    <div className="font-mono font-semibold text-indigo-300 truncate">
                      {emailOverview?.gateway.adminEmail || 'crevio.admin@gmail.com'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Telemetry KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 space-y-2 border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Dispatched</span>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <SendHorizontal className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {emailOverview?.metrics.totalAll ?? emailLogs.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    All-time transactional email dispatches
                  </p>
                </div>

                <div className="glass-card p-4 space-y-2 border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivered / Sent</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CheckCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono text-emerald-400">
                    {emailOverview?.metrics.totalSent ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Success Rate: <span className="font-bold text-emerald-400">{emailOverview?.metrics.successRate ?? '100%'}</span>
                  </p>
                </div>

                <div className="glass-card p-4 space-y-2 border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sent in Last 24h</span>
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono text-purple-300">
                    {emailOverview?.metrics.sentLast24h ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Active real-time platform triggers
                  </p>
                </div>

                <div className="glass-card p-4 space-y-2 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Autonomous Triggers</span>
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono text-amber-300">
                    8 Rules Active
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Auto-wired across lifecycle events
                  </p>
                </div>
              </div>

              {/* Split Workstation: Test Dispatcher (Left) & Autonomous Event Matrix (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Instant Test Email Dispatcher */}
                <div className="lg:col-span-5 glass-card p-6 space-y-4">
                  <div className="border-b border-border/50 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-accent" />
                        Live Test Email Dispatcher
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Test Resend delivery to verified recipient inbox
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      Interactive
                    </span>
                  </div>

                  <form onSubmit={handleSendTestEmail} className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold uppercase text-[10px] text-muted-foreground">Recipient Email Address</label>
                      <input
                        type="email"
                        required
                        value={testEmailForm.to}
                        onChange={e => setTestEmailForm({ ...testEmailForm, to: e.target.value })}
                        placeholder="crevio.admin@gmail.com"
                        className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        💡 Note: In Resend sandbox mode, emails deliver to <code className="text-accent font-bold">crevio.admin@gmail.com</code>.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border/50">
                      <button
                        type="button"
                        onClick={() => setTestEmailForm({ ...testEmailForm, mode: 'template' })}
                        className={`py-1.5 px-2 rounded-md font-bold transition-all text-center ${
                          testEmailForm.mode === 'template' ? 'bg-card text-accent shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Branded Template
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestEmailForm({ ...testEmailForm, mode: 'custom' })}
                        className={`py-1.5 px-2 rounded-md font-bold transition-all text-center ${
                          testEmailForm.mode === 'custom' ? 'bg-card text-accent shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Custom Text / HTML
                      </button>
                    </div>

                    {testEmailForm.mode === 'template' ? (
                      <div>
                        <label className="font-bold uppercase text-[10px] text-muted-foreground">Select Branded Template</label>
                        <select
                          value={testEmailForm.templateName}
                          onChange={e => setTestEmailForm({ ...testEmailForm, templateName: e.target.value })}
                          className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                        >
                          <option value="welcome_user">🌟 Welcome & Onboarding Template</option>
                          <option value="campaign_created">📢 Campaign Published Confirmation</option>
                          <option value="application_submitted">📬 Creator Application Received</option>
                          <option value="contract_signed">✍️ Contract E-Signed & Executed</option>
                          <option value="escrow_funded">🔒 Escrow Vault Funded Receipt</option>
                          <option value="proof_submitted">📸 Deliverables & Proofs Uploaded</option>
                          <option value="escrow_released">💰 Milestone Payout Disbursed</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="font-bold uppercase text-[10px] text-muted-foreground">Subject Line</label>
                          <input
                            type="text"
                            required={testEmailForm.mode === 'custom'}
                            value={testEmailForm.customSubject}
                            onChange={e => setTestEmailForm({ ...testEmailForm, customSubject: e.target.value })}
                            placeholder="e.g. Crevio Platform Announcement"
                            className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="font-bold uppercase text-[10px] text-muted-foreground">Message Body (HTML supported)</label>
                          <textarea
                            rows={4}
                            required={testEmailForm.mode === 'custom'}
                            value={testEmailForm.customMessage}
                            onChange={e => setTestEmailForm({ ...testEmailForm, customMessage: e.target.value })}
                            placeholder="Type custom message to send..."
                            className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                          />
                        </div>
                      </>
                    )}

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSendingTestEmail}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent transition-all disabled:opacity-50"
                      >
                        {isSendingTestEmail ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Dispatching via Resend...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Dispatch Test Email Now
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const tpl = emailTemplates.find(t => t.id === testEmailForm.templateName) || emailTemplates[0];
                          if (tpl) setSelectedTemplatePreview(tpl);
                        }}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border"
                        title="Preview Template HTML"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right: Autonomous Platform Triggers Matrix */}
                <div className="lg:col-span-7 glass-card p-6 space-y-4">
                  <div className="border-b border-border/50 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Autonomous Platform Event Triggers
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automated transactional email workflows connected across Crevio
                      </p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {emailTemplates.length || 8} Active Automations
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {[
                      {
                        id: 'welcome_user',
                        icon: '🌟',
                        title: 'User Onboarded',
                        role: 'Brand & Creator',
                        trigger: 'POST /api/auth/creator-onboard',
                        desc: 'Dispatches modern onboarding welcome with dashboard quick links.'
                      },
                      {
                        id: 'campaign_created',
                        icon: '📢',
                        title: 'Campaign Created',
                        role: 'Brand',
                        trigger: 'POST /api/campaigns',
                        desc: 'Notifies brand of successful campaign publishing & active matchmaking.'
                      },
                      {
                        id: 'application_submitted',
                        icon: '📬',
                        title: 'Application Received',
                        role: 'Brand',
                        trigger: 'POST /api/campaigns/:id/apply',
                        desc: 'Alerts brand when creator applies with rate, pitch, and AI fit score.'
                      },
                      {
                        id: 'contract_signed',
                        icon: '✍️',
                        title: 'Contract E-Signed',
                        role: 'Brand & Creator',
                        trigger: 'POST /api/contracts/:id/accept',
                        desc: 'Confirms cryptographic signature & triggers escrow lock prompt.'
                      },
                      {
                        id: 'escrow_funded',
                        icon: '🔒',
                        title: 'Escrow Vault Secured',
                        role: 'Brand & Creator',
                        trigger: 'POST /api/payments/verify-deposit',
                        desc: 'Issues Razorpay deposit receipt and locks creator collateral.'
                      },
                      {
                        id: 'proof_submitted',
                        icon: '📸',
                        title: 'Proof Uploaded',
                        role: 'Brand',
                        trigger: 'POST /api/campaigns/:id/proofs',
                        desc: 'Alerts brand when creator submits deliverables and media analytics.'
                      },
                      {
                        id: 'escrow_released',
                        icon: '💰',
                        title: 'Payout Disbursed',
                        role: 'Creator',
                        trigger: 'POST /api/contracts/:id/execute-decision',
                        desc: 'Congratulates creator and logs automated wallet balance credit.'
                      },
                      {
                        id: 'custom_broadcast',
                        icon: '📣',
                        title: 'Platform Broadcast',
                        role: 'All / Segmented',
                        trigger: 'POST /api/admin/emails/broadcast',
                        desc: 'Admin announcements, feature releases, and policy updates.'
                      }
                    ].map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                              <span>{item.icon}</span>
                              {item.title}
                            </span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                              {item.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                          <code className="text-[9px] font-mono text-muted-foreground truncate max-w-[150px]">
                            {item.trigger}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              const found = emailTemplates.find(t => t.id === item.id);
                              if (found) setSelectedTemplatePreview(found);
                            }}
                            className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Resend Dispatch Logs Table */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      Live Resend Dispatch & Audit Trail
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Real-time telemetry stream of all transactional emails sent via Resend
                    </p>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search recipient, ID..."
                        value={emailLogsFilter.search}
                        onChange={e => setEmailLogsFilter({ ...emailLogsFilter, search: e.target.value })}
                        className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-2 py-1 text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <select
                      value={emailLogsFilter.status}
                      onChange={e => setEmailLogsFilter({ ...emailLogsFilter, status: e.target.value })}
                      className="bg-muted/40 border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="sent">Sent (Delivered)</option>
                      <option value="failed">Failed (Error)</option>
                      <option value="simulated">Simulated</option>
                    </select>

                    <button
                      onClick={refreshEmailLogs}
                      className="p-1.5 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground border"
                      title="Reload Logs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Event / Template</th>
                        <th className="py-2.5 px-3">Recipient</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Resend ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {emailLogs
                        .filter(l => {
                          const matchesQuery = !emailLogsFilter.search ||
                            l.recipient_email.toLowerCase().includes(emailLogsFilter.search.toLowerCase()) ||
                            (l.subject && l.subject.toLowerCase().includes(emailLogsFilter.search.toLowerCase())) ||
                            (l.resend_id && l.resend_id.toLowerCase().includes(emailLogsFilter.search.toLowerCase()));
                          const matchesStatus = emailLogsFilter.status === 'all' || l.status === emailLogsFilter.status;
                          return matchesQuery && matchesStatus;
                        })
                        .map(log => {
                          return (
                            <tr 
                              key={log.id} 
                              onClick={() => setSelectedLogDetail(log)}
                              className="hover:bg-muted/30 cursor-pointer transition-colors group"
                            >
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  log.status === 'sent'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : log.status === 'simulated'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {log.status === 'sent' && <Check className="w-2.5 h-2.5" />}
                                  {log.status === 'failed' && <X className="w-2.5 h-2.5" />}
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                                  {log.template_name}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-medium text-foreground">{log.recipient_email}</div>
                                {log.recipient_name && (
                                  <div className="text-[10px] text-muted-foreground">{log.recipient_name}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 max-w-[240px] truncate text-muted-foreground">
                                {log.subject}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[10px] whitespace-nowrap">
                                {log.resend_id ? (
                                  <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                                    {log.resend_id.substring(0, 16)}...
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap flex items-center justify-between gap-2">
                                <span>
                                  {new Date(log.created_at).toLocaleString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                              </td>
                            </tr>
                          );
                        })}
                      {emailLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No transactional emails logged yet. Click "Dispatch Test Email Now" to test the Resend gateway.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 2: CAMPAIGNS MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === 'campaigns' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Campaign Control Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search campaigns, brands..."
                      value={campaignSearch}
                      onChange={e => setCampaignSearch(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <select
                    value={campaignStatusFilter}
                    onChange={e => setCampaignStatusFilter(e.target.value)}
                    className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-glow-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Campaign
                </button>
              </div>

              {/* Campaigns Table */}
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider bg-muted/20">
                        <th className="py-3 px-4">Campaign Title</th>
                        <th className="py-3 px-4">Brand</th>
                        <th className="py-3 px-4">Platform</th>
                        <th className="py-3 px-4">Budget</th>
                        <th className="py-3 px-4">Participants</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredCampaigns.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">No campaigns found matching filter.</td>
                        </tr>
                      ) : (
                        filteredCampaigns.map(camp => (
                          <tr key={camp.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-foreground">{camp.title}</p>
                              <span className="text-[10px] font-mono text-muted-foreground">{camp.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold">{camp.brand_name || 'System'}</p>
                              <p className="text-[10px] text-muted-foreground">{camp.brand_email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-semibold">{camp.platform}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-foreground">
                              {formatAmount(camp.budget)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-accent font-semibold">{camp.accepted_count || 0} active</span>
                              <span className="text-muted-foreground text-[10px]"> / {camp.applicants_count || 0} applicants</span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={camp.status}
                                onChange={e => handleQuickCampaignStatus(camp.id, e.target.value)}
                                className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 border bg-transparent ${
                                  camp.status === 'active' ? 'text-success border-success/30' :
                                  camp.status === 'completed' ? 'text-accent border-accent/30' : 'text-muted-foreground border-border'
                                }`}
                              >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a 
                                  href={`/campaigns/${camp.id}`} 
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open Workspace"
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => setEditingCampaign(camp)}
                                  title="Edit Campaign"
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-accent"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(camp.id, camp.title)}
                                  title="Delete Campaign"
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 3: CONTRACTS MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === 'contracts' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search contracts, parties..."
                      value={contractSearch}
                      onChange={e => setContractSearch(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <select
                    value={contractStatusFilter}
                    onChange={e => setContractStatusFilter(e.target.value)}
                    className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="locked">Locked</option>
                    <option value="executed">Executed</option>
                    <option value="completed">Completed</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateContractModal(true)}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-glow-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Contract
                </button>
              </div>

              {/* Contracts Table */}
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider bg-muted/20">
                        <th className="py-3 px-4">Contract ID</th>
                        <th className="py-3 px-4">Campaign</th>
                        <th className="py-3 px-4">Brand</th>
                        <th className="py-3 px-4">Creator</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">PDFs & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredContracts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">No contracts found.</td>
                        </tr>
                      ) : (
                        filteredContracts.map(ct => (
                          <tr key={ct.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-accent">
                              #{ct.id.substring(0, 8)}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold">{ct.campaign_title || 'Direct Contract'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{ct.brand_name}</p>
                              <p className="text-[10px] text-muted-foreground">{ct.brand_email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{ct.creator_name}</p>
                              <p className="text-[10px] text-muted-foreground">{ct.creator_email}</p>
                            </td>
                            <td className="py-3 px-4 font-bold text-foreground">
                              {formatAmount(ct.payment_amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ct.status === 'locked' || ct.status === 'executed' ? 'bg-accent/10 text-accent border border-accent/20' :
                                ct.status === 'completed' ? 'bg-success/10 text-success border border-success/20' :
                                ct.status === 'disputed' ? 'bg-warning/10 text-warning border border-warning/20' :
                                'bg-muted text-muted-foreground border border-border'
                              }`}>
                                {ct.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {ct.campaign_id && (
                                  <button
                                    onClick={() => apiDownloadCampaignContract(ct.campaign_id!)}
                                    title="Download Master PDF"
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-accent"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingContract(ct)}
                                  title="Edit Contract"
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-accent"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteContract(ct.id)}
                                  title="Delete Contract"
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 4: APPLICATIONS MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === 'applications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search applicants, proposals..."
                      value={appSearch}
                      onChange={e => setAppSearch(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <select
                    value={appStatusFilter}
                    onChange={e => setAppStatusFilter(e.target.value)}
                    className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="all">All Application Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              {/* Applications Table */}
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider bg-muted/20">
                        <th className="py-3 px-4">Creator</th>
                        <th className="py-3 px-4">Campaign</th>
                        <th className="py-3 px-4">Proposed Fee</th>
                        <th className="py-3 px-4">Pitch / Proposal</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredApps.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">No applications found.</td>
                        </tr>
                      ) : (
                        filteredApps.map(app => (
                          <tr key={app.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-foreground">{app.creator_name}</p>
                              <p className="text-[10px] text-muted-foreground">{app.creator_email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold">{app.campaign_title}</p>
                              <span className="text-[10px] text-muted-foreground">Brand: {app.brand_name}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-foreground">
                              {formatAmount(app.proposed_fee)}
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-muted-foreground text-[11px]">
                              {app.pitch_message || 'Direct invite participation'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                app.status === 'approved' ? 'bg-success/10 text-success border border-success/20' :
                                app.status === 'submitted' ? 'bg-accent/10 text-accent border border-accent/20' :
                                app.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                'bg-muted text-muted-foreground border border-border'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {app.status !== 'approved' && (
                                  <button
                                    onClick={() => handleApplicationStatus(app.id, 'approved')}
                                    title="Approve Proposal"
                                    className="p-1 hover:bg-success/10 text-muted-foreground hover:text-success rounded"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {app.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleApplicationStatus(app.id, 'rejected')}
                                    title="Reject Proposal"
                                    className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteApplication(app.id)}
                                  title="Delete Application"
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB: DELIVERABLE PROOFS & INSIGHTS REVIEW */}
          {/* ========================================== */}
          {activeTab === 'proofs' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Proofs Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search deliverables, creators, campaigns..."
                      value={proofSearch}
                      onChange={e => setProofSearch(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <select
                    value={proofStatusFilter}
                    onChange={e => setProofStatusFilter(e.target.value)}
                    className="bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="all">All Proof Statuses ({proofs.length})</option>
                    <option value="pending">Pending Review ({proofs.filter(p => p.status === 'pending').length})</option>
                    <option value="approved">Approved ({proofs.filter(p => p.status === 'approved').length})</option>
                    <option value="revision_requested">Revision Requested ({proofs.filter(p => p.status === 'revision_requested').length})</option>
                  </select>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing <strong className="text-foreground">{filteredProofs.length}</strong> of {proofs.length} proof submissions
                </div>
              </div>

              {/* Proofs Card Grid */}
              {filteredProofs.length === 0 ? (
                <div className="glass-card p-12 text-center text-muted-foreground space-y-2">
                  <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="font-semibold text-sm">No deliverable proofs found.</p>
                  <p className="text-xs max-w-sm mx-auto">
                    When creators submit deliverable proofs with live links and professional dashboard screenshots, they will appear here for super-admin and brand review.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredProofs.map(proof => {
                    const hasPhoto = Boolean(proof.insights_image_path || (proof.attachment_path && proof.attachment_name?.match(/\.(png|jpe?g|webp|gif)$/i)));
                    const photoUrl = proof.insights_image_path || proof.attachment_path || '';

                    return (
                      <div key={proof.id} className="glass-card p-5 space-y-4 hover:border-border transition-all">
                        {/* Header: Title & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm text-foreground">{proof.deliverable_title}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                proof.status === 'approved' ? 'bg-success/15 text-success border border-success/30' :
                                proof.status === 'revision_requested' ? 'bg-warning/15 text-warning border border-warning/30' :
                                'bg-primary/15 text-primary border border-primary/30'
                              }`}>
                                {proof.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Campaign: <strong className="text-foreground">{proof.campaign_title}</strong> {proof.brand_name ? `• Brand: ${proof.brand_name}` : ''}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Creator: <strong className="text-foreground">{proof.creator_name}</strong> ({proof.creator_email})
                            </p>
                          </div>

                          <a
                            href={proof.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Live Post
                          </a>
                        </div>

                        {/* Photo / Insights Screenshot Preview Card */}
                        {hasPhoto && (
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="relative group cursor-pointer shrink-0"
                                onClick={() => setProofLightbox({ url: photoUrl, title: `${proof.deliverable_title} - Dashboard Insights` })}
                              >
                                <img
                                  src={photoUrl}
                                  alt="Professional Dashboard Insights"
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-border shadow-sm group-hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  <ImageIcon className="w-3 h-3" /> Dashboard Screenshot
                                </span>
                                <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                                  {proof.insights_image_name || proof.attachment_name || 'Insights_Screenshot.png'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setProofLightbox({ url: photoUrl, title: `${proof.deliverable_title} - Dashboard Insights` })}
                                  className="text-[11px] text-accent hover:text-accent/80 font-semibold flex items-center gap-1 pt-0.5"
                                >
                                  <Eye className="w-3 h-3" /> Inspect High-Res
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setProofLightbox({ url: photoUrl, title: `${proof.deliverable_title} - Dashboard Insights` })}
                              className="px-2.5 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg font-medium border text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1"
                            >
                              <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                            </button>
                          </div>
                        )}

                        {/* Engagement Rate & KPI Metrics */}
                        {(proof.engagement_rate || proof.reach_count || proof.impressions_count || proof.likes_count || proof.comments_count || proof.shares_count || proof.saves_count) && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                            {proof.engagement_rate && (
                              <div className="p-1.5 rounded-lg bg-background/50 border border-border/50">
                                <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-primary" /> Engagement
                                </span>
                                <p className="text-xs font-bold text-primary mt-0.5">{proof.engagement_rate}</p>
                              </div>
                            )}
                            {proof.reach_count && (
                              <div className="p-1.5 rounded-lg bg-background/50 border border-border/50">
                                <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3 text-cyan-400" /> Reach
                                </span>
                                <p className="text-xs font-bold text-foreground mt-0.5">{proof.reach_count}</p>
                              </div>
                            )}
                            {proof.impressions_count && (
                              <div className="p-1.5 rounded-lg bg-background/50 border border-border/50">
                                <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3 text-success" /> Impressions
                                </span>
                                <p className="text-xs font-bold text-foreground mt-0.5">{proof.impressions_count}</p>
                              </div>
                            )}
                            {(proof.likes_count || proof.comments_count || proof.shares_count || proof.saves_count) && (
                              <div className="p-1.5 rounded-lg bg-background/50 border border-border/50">
                                <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-rose-400" /> Interactions
                                </span>
                                <p className="text-[10px] font-semibold text-foreground mt-0.5 flex flex-wrap gap-1">
                                  {proof.likes_count && <span>❤️{proof.likes_count}</span>}
                                  {proof.comments_count && <span>💬{proof.comments_count}</span>}
                                  {proof.shares_count && <span>🔁{proof.shares_count}</span>}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Overview & Notes */}
                        {(proof.description || proof.overview_notes) && (
                          <div className="p-2.5 rounded-lg bg-muted/15 border border-border/30 text-xs text-muted-foreground">
                            <span className="font-bold text-[10px] uppercase text-foreground block mb-0.5">Overview & Notes:</span>
                            <p className="line-clamp-3">{proof.overview_notes || proof.description}</p>
                          </div>
                        )}

                        {/* Feedback if any */}
                        {proof.brand_feedback && (
                          <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
                            <span className="font-bold text-[10px] uppercase block mb-0.5">Revision Feedback Note:</span>
                            <p>{proof.brand_feedback}</p>
                          </div>
                        )}

                        {/* Admin Action Controls */}
                        <div className="pt-2 border-t border-border/50 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add optional admin review notes..."
                              value={adminProofFeedback[proof.id] || ''}
                              onChange={e => setAdminProofFeedback({ ...adminProofFeedback, [proof.id]: e.target.value })}
                              className="flex-1 bg-muted/40 border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-accent"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {proof.status !== 'approved' && (
                                <button
                                  type="button"
                                  disabled={updatingProofId === proof.id}
                                  onClick={() => handleAdminUpdateProofStatus(proof.id, 'approved')}
                                  className="px-2.5 py-1 bg-success hover:bg-success/80 text-success-foreground text-xs font-bold rounded-lg flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                              )}
                              {proof.status !== 'revision_requested' && (
                                <button
                                  type="button"
                                  disabled={updatingProofId === proof.id}
                                  onClick={() => handleAdminUpdateProofStatus(proof.id, 'revision_requested')}
                                  className="px-2.5 py-1 bg-warning/20 hover:bg-warning/30 text-warning text-xs font-bold rounded-lg flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> Request Changes
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteProof(proof.id, proof.deliverable_title)}
                              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                              title="Delete Submission Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 5: GLOBAL CHAT HISTORY & MESSAGES */}
          {/* ========================================== */}
          {activeTab === 'messages' && (

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
              {/* Broadcast Announcement Form */}
              <div className="glass-card p-5 space-y-4 md:col-span-1 h-fit">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Send className="w-4 h-4 text-accent" />
                  <h3 className="font-bold text-sm">Post System / Admin Broadcast</h3>
                </div>
                <form onSubmit={handleSendAdminBroadcast} className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Campaign</label>
                    <select
                      value={adminBroadcastCampaignId}
                      onChange={e => setAdminBroadcastCampaignId(e.target.value)}
                      required
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="">Select campaign workspace...</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.id.substring(0, 8)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Message Announcement</label>
                    <textarea
                      rows={3}
                      placeholder="Type admin message or update..."
                      value={adminBroadcastMsg}
                      onChange={e => setAdminBroadcastMsg(e.target.value)}
                      required
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingMsg}
                    className="w-full py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-accent-foreground font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-glow-accent"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingMsg ? 'Broadcasting...' : 'Broadcast to Campaign'}
                  </button>
                </form>
              </div>

              {/* Chat Stream View */}
              <div className="glass-card p-5 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent" />
                    <h3 className="font-bold text-sm">Platform Chat Stream</h3>
                  </div>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={msgSearch}
                      onChange={e => setMsgSearch(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg pl-7 pr-2 py-1 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto pr-2 space-y-3">
                  {filteredMessages.length === 0 ? (
                    <p className="text-center py-8 text-xs text-muted-foreground">No chat messages found.</p>
                  ) : (
                    filteredMessages.map(msg => (
                      <div key={msg.id} className="pt-3 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{msg.sender_name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold ${
                              msg.sender_role === 'admin' ? 'bg-accent/20 text-accent' :
                              msg.sender_role === 'brand' ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
                            }`}>
                              {msg.sender_role}
                            </span>
                            <span className="text-[10px] text-muted-foreground">in <span className="text-foreground font-medium">{msg.campaign_title}</span></span>
                          </div>
                          <p className="text-foreground/90 bg-muted/30 p-2.5 rounded-lg text-xs leading-relaxed mt-1">
                            {msg.message}
                          </p>
                          <span className="text-[10px] font-mono text-muted-foreground block">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Delete message"
                          className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 6: USERS MANAGEMENT & WALLET CONTROL */}
          {/* ========================================== */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search users, emails, IDs..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                    className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="all">All Roles</option>
                    <option value="creator">Creators</option>
                    <option value="brand">Brands</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-glow-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add User
                </button>
              </div>

              {/* Users Table */}
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider bg-muted/20">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Wallet Balance</th>
                        <th className="py-3 px-4">Activity Stats</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">No users found.</td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-foreground">{u.full_name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'admin' ? 'bg-warning/10 text-warning border border-warning/20' :
                                u.role === 'brand' ? 'bg-primary/10 text-primary border border-primary/20' :
                                'bg-accent/10 text-accent border border-accent/20'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-foreground">{formatAmount(u.available_balance)}</p>
                              <p className="text-[10px] text-muted-foreground">{formatAmount(u.pending_escrow_balance)} pending</p>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-muted-foreground">
                              {u.campaigns_count || 0} camps · {u.contracts_count || 0} contracts · {u.applications_count || 0} apps
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                                <span className="text-[11px] text-muted-foreground">{u.is_active ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setAdjustingWalletUser(u)}
                                  title="Adjust Wallet Balance"
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-success rounded"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingUser(u)}
                                  title="Edit User & Role"
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-accent rounded"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.full_name)}
                                  title="Delete User"
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 7: ESCROW & DISPUTES RESOLUTION */}
          {/* ========================================== */}
          {activeTab === 'escrows' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
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
                          <AlertTriangle className="w-3 h-3" /> Disputed
                        </span>
                      </div>
                      <p className="font-semibold text-sm">{disc.brand_name} ↔ {disc.creator_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Value: {formatAmount(disc.amount)}</p>
                    </div>
                  ))
                )}

                {/* Global Escrow Holdings Mini-table */}
                <div className="glass-card p-4 space-y-2 mt-6">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">All Escrow Holdings ({escrows.length})</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {escrows.map(e => (
                      <div key={e.id} className="p-2 bg-muted/30 rounded flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold">{formatAmount(e.amount)} ({e.status})</p>
                          <p className="text-[10px] text-muted-foreground">{e.brand_name} → {e.creator_name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {e.status === 'held' && (
                            <>
                              <button
                                onClick={() => handleReleaseEscrow(e.id)}
                                title="Force Release to Creator"
                                className="px-2 py-0.5 bg-success/20 hover:bg-success/30 text-success text-[10px] font-bold rounded"
                              >
                                Release
                              </button>
                              <button
                                onClick={() => handleRefundEscrow(e.id)}
                                title="Force Refund to Brand"
                                className="px-2 py-0.5 bg-destructive/20 hover:bg-destructive/30 text-destructive text-[10px] font-bold rounded"
                              >
                                Refund
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <div className="border-b border-border pb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Scale className="w-5 h-5 text-warning" />
                        Dispute Settlement Board
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Slide to split locked contract budget between both parties.</p>
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

                    <div className="border-t border-border pt-5 flex justify-end gap-3">
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
                        {isSettling ? 'Settling in Database...' : 'Confirm Disbursement Settlement'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] bg-muted/15 rounded-2xl border border-dashed border-muted text-center p-6">
                    <Scale className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="font-bold text-sm text-muted-foreground">Select a dispute case from the left panel to execute an escrow settlement split override.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 8: AUDIT TRAIL & LEDGER */}
          {/* ========================================== */}
          {activeTab === 'audits' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-start gap-4 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-indigo-400 text-xs">
                <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Cryptographically Verifiable Audit Trail</h4>
                  <p className="mt-0.5 text-indigo-300/80">Every action on Crevio is hashed with SHA-256 and chained into an immutable parent hash structure.</p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search hashes, actors, events, contract numbers..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase font-bold tracking-wider bg-muted/20">
                        <th className="py-3 px-4">Audit ID</th>
                        <th className="py-3 px-4">Event Type</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">SHA-256 Signature</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">No audit logs found.</td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4 font-mono text-accent font-bold">
                              {log.id}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold">{log.eventType}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{log.actor}</p>
                              <span className="text-[9px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded">{log.actorRole}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                              {log.sha256Hash}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> VERIFIED
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 9: INSTAGRAM GRAPH API v25.0 ANALYTICS */}
          {/* ========================================== */}
          {activeTab === 'instagram' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <InstagramAnalyticsDashboard isAdminView={true} />
            </motion.div>
          )}

        </div>
      )}


      {/* ========================================== */}
      {/* MODAL: CREATE CAMPAIGN */}
      {/* ========================================== */}
      <AnimatePresence>
        {showCreateCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-accent" />
                  Create Platform Campaign
                </h3>
                <button onClick={() => setShowCreateCampaignModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Campaign Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Fitness Product Launch"
                    value={campaignForm.title}
                    onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Campaign details, objectives..."
                    value={campaignForm.description}
                    onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Platform</label>
                    <select
                      value={campaignForm.platform}
                      onChange={e => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Twitter / X">Twitter / X</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Budget (INR)</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={campaignForm.budget}
                      onChange={e => setCampaignForm({ ...campaignForm, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Deadline</label>
                    <input
                      type="date"
                      required
                      value={campaignForm.deadline}
                      onChange={e => setCampaignForm({ ...campaignForm, deadline: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Initial Status</label>
                    <select
                      value={campaignForm.status}
                      onChange={e => setCampaignForm({ ...campaignForm, status: e.target.value as any })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCreateCampaignModal(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Create Campaign</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL: EDIT CAMPAIGN */}
      {/* ========================================== */}
      <AnimatePresence>
        {editingCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-accent" />
                  Edit Campaign #{editingCampaign.id.substring(0, 8)}
                </h3>
                <button onClick={() => setEditingCampaign(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateCampaign} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Title</label>
                  <input
                    type="text"
                    required
                    value={editingCampaign.title}
                    onChange={e => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editingCampaign.description}
                    onChange={e => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Platform</label>
                    <input
                      type="text"
                      required
                      value={editingCampaign.platform}
                      onChange={e => setEditingCampaign({ ...editingCampaign, platform: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Budget (INR)</label>
                    <input
                      type="number"
                      required
                      value={editingCampaign.budget}
                      onChange={e => setEditingCampaign({ ...editingCampaign, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Status</label>
                    <select
                      value={editingCampaign.status}
                      onChange={e => setEditingCampaign({ ...editingCampaign, status: e.target.value as any })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Deadline</label>
                    <input
                      type="date"
                      value={editingCampaign.deadline ? editingCampaign.deadline.split('T')[0] : ''}
                      onChange={e => setEditingCampaign({ ...editingCampaign, deadline: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingCampaign(null)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL: CREATE CONTRACT */}
      {/* ========================================== */}
      <AnimatePresence>
        {showCreateContractModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Create Custom Contract
                </h3>
                <button onClick={() => setShowCreateContractModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateContract} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Select Brand</label>
                  <select
                    required
                    value={contractForm.brand_id}
                    onChange={e => setContractForm({ ...contractForm, brand_id: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="">Select Brand Account...</option>
                    {users.filter(u => u.role === 'brand' || u.role === 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Select Creator</label>
                  <select
                    required
                    value={contractForm.creator_id}
                    onChange={e => setContractForm({ ...contractForm, creator_id: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="">Select Creator Account...</option>
                    {users.filter(u => u.role === 'creator').map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Contract Value (INR)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={contractForm.payment_amount}
                      onChange={e => setContractForm({ ...contractForm, payment_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Contract Deadline</label>
                    <input
                      type="date"
                      required
                      value={contractForm.contract_deadline}
                      onChange={e => setContractForm({ ...contractForm, contract_deadline: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Contract Notes & Scope</label>
                  <textarea
                    rows={2}
                    placeholder="Deliverable terms and milestones..."
                    value={contractForm.notes}
                    onChange={e => setContractForm({ ...contractForm, notes: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCreateContractModal(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Create Contract</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL: CREATE USER */}
      {/* ========================================== */}
      <AnimatePresence>
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  Add New Platform User
                </h3>
                <button onClick={() => setShowCreateUserModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={userForm.full_name}
                    onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@crevio.io"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Account Role</label>
                    <select
                      value={userForm.role}
                      onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="creator">Creator</option>
                      <option value="brand">Brand</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Initial Wallet (INR)</label>
                    <input
                      type="number"
                      value={userForm.initial_balance}
                      onChange={e => setUserForm({ ...userForm, initial_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Create User</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL: EDIT USER & ROLE */}
      {/* ========================================== */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-accent" />
                  Edit User Profile & Role
                </h3>
                <button onClick={() => setEditingUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.full_name}
                    onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Role Assignment</label>
                    <select
                      value={editingUser.role}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="creator">Creator</option>
                      <option value="brand">Brand</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Account Status</label>
                    <select
                      value={editingUser.is_active ? 'active' : 'inactive'}
                      onChange={e => setEditingUser({ ...editingUser, is_active: e.target.value === 'active' })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Save User</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL: ADJUST USER WALLET */}
      {/* ========================================== */}
      <AnimatePresence>
        {adjustingWalletUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  Adjust Wallet Balance
                </h3>
                <button onClick={() => setAdjustingWalletUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
                <p className="font-bold text-foreground">{adjustingWalletUser.full_name}</p>
                <p className="text-muted-foreground">{adjustingWalletUser.email}</p>
                <p className="text-success font-bold mt-1">Current Balance: {formatAmount(adjustingWalletUser.available_balance)}</p>
              </div>
              <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Adjustment Amount (INR)</label>
                  <p className="text-[10px] text-muted-foreground mb-1">Enter positive (+5000) to credit or negative (-2000) to debit.</p>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="+5000 or -2000"
                    value={walletAdjustAmount}
                    onChange={e => setWalletAdjustAmount(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Reason / Audit Memo</label>
                  <input
                    type="text"
                    placeholder="e.g. Campaign settlement bonus or test credit"
                    value={walletAdjustReason}
                    onChange={e => setWalletAdjustReason(e.target.value)}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setAdjustingWalletUser(null)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-success hover:bg-success/80 text-success-foreground font-bold rounded-lg shadow-glow-success">Confirm Balance Adjustment</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Super-Admin Screenshot & Insights Lightbox Modal */}
      {proofLightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setProofLightbox(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center bg-card/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-border/60 mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate max-w-md sm:max-w-xl">
                  {proofLightbox.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={proofLightbox.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setProofLightbox(null)}
                  className="p-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="w-full flex-1 overflow-auto flex items-center justify-center rounded-xl bg-black/40 p-2">
              <img 
                src={proofLightbox.url} 
                alt={proofLightbox.title}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EMAIL TEMPLATE HTML PREVIEW */}
      {/* ========================================== */}
      {selectedTemplatePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedTemplatePreview(null)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-base text-foreground">
                    {selectedTemplatePreview.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300">
                    {selectedTemplatePreview.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedTemplatePreview.description} · Trigger: <code className="text-accent">{selectedTemplatePreview.trigger}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplatePreview(null)}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Iframe Preview Container */}
            <div className="w-full flex-1 min-h-[480px] rounded-xl overflow-hidden border border-border/60 bg-[#07050d]">
              <iframe
                title="Email Preview"
                srcDoc={selectedTemplatePreview.previewHtml}
                className="w-full h-full min-h-[480px] border-none"
                sandbox="allow-same-origin"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60 mt-4 text-xs">
              <span className="text-muted-foreground text-[11px]">
                Powered by Resend Transactional Email Engine
              </span>
              <button
                onClick={() => {
                  setTestEmailForm(prev => ({
                    ...prev,
                    templateName: selectedTemplatePreview.id,
                    mode: 'template'
                  }));
                  setSelectedTemplatePreview(null);
                  toast.info(`Selected "${selectedTemplatePreview.name}" for live test dispatch.`);
                }}
                className="px-3 py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Use in Test Dispatcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: PLATFORM-WIDE BROADCAST ANNOUNCEMENT */}
      {/* ========================================== */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      Platform Email Broadcast
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatch targeted announcements to active platform users via Resend
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowBroadcastModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Target Audience</label>
                  <select
                    value={broadcastForm.targetAudience}
                    onChange={e => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value as any })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent font-semibold"
                  >
                    <option value="all">👥 All Registered Users (Creators + Brands + Admins)</option>
                    <option value="creators">🎨 Verified Creators Only</option>
                    <option value="brands">💼 Enterprise Brands Only</option>
                    <option value="admin">🛡️ Platform Super-Admins</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Broadcast Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crevio 2.0: Instant Escrow Payouts & Instagram Media Sync"
                    value={broadcastForm.subject}
                    onChange={e => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Announcement Message (HTML / Markdown supported)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write announcement body..."
                    value={broadcastForm.message}
                    onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Call To Action URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://crevio.io/campaigns"
                      value={broadcastForm.actionUrl}
                      onChange={e => setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">CTA Button Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Explore Opportunities"
                      value={broadcastForm.actionText}
                      onChange={e => setBroadcastForm({ ...broadcastForm, actionText: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowBroadcastModal(false)} 
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSendingBroadcast}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-glow-accent flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSendingBroadcast ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Dispatched Broadcast...
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="w-3.5 h-3.5" />
                        Send Broadcast Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* MODAL: EMAIL LOG INSPECTION & TELEMETRY */}
      {/* ========================================== */}
      <AnimatePresence>
        {selectedLogDetail && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedLogDetail(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-xl w-full bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      Email Dispatch Telemetry Log
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">ID: {selectedLogDetail.id}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLogDetail(null)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Status</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedLogDetail.status === 'sent'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : selectedLogDetail.status === 'simulated'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {selectedLogDetail.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Template</span>
                    <p className="font-mono font-semibold text-foreground mt-0.5">{selectedLogDetail.template_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Recipient</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedLogDetail.recipient_email}</p>
                    {selectedLogDetail.recipient_name && <p className="text-[10px] text-muted-foreground">{selectedLogDetail.recipient_name}</p>}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Resend ID</span>
                    <p className="font-mono text-[11px] text-accent mt-0.5 break-all">{selectedLogDetail.resend_id || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Subject</span>
                  <p className="p-2.5 rounded-lg bg-muted/40 border border-border/50 font-medium text-foreground mt-1">
                    {selectedLogDetail.subject}
                  </p>
                </div>

                {selectedLogDetail.error_message && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-rose-400">Resend Error Detail</span>
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] mt-1 space-y-1">
                      <p>{selectedLogDetail.error_message}</p>
                      {selectedLogDetail.error_message.includes('own email address') && (
                        <p className="text-[10px] text-amber-300 font-sans pt-1 border-t border-rose-500/20">
                          💡 <strong>Resend Sandbox Restriction:</strong> To send emails to domains other than <code className="font-mono font-bold">crevio.admin@gmail.com</code>, add and verify your custom domain in Resend Dashboard.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedLogDetail.metadata && Object.keys(selectedLogDetail.metadata).length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Event Metadata</span>
                    <pre className="p-2.5 rounded-lg bg-black/40 border border-border/50 font-mono text-[10px] text-muted-foreground mt-1 overflow-x-auto max-h-32">
                      {JSON.stringify(selectedLogDetail.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[10px]">
                  {new Date(selectedLogDetail.created_at).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}


