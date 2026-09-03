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
  apiAdminReleaseEscrow,
  apiAdminRefundEscrow,
  apiGetAdminEscrows,
  apiAdminSettleDispute,
  apiGetAuditLogs,
  apiDownloadCampaignContract,
  apiDownloadSignedContract,
  AdminOverviewStats,
  AdminActivityItem,
  AdminCampaignItem,
  AdminContractItem,
  AdminApplicationItem,
  AdminMessageItem,
  AdminUserItem,
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
  Instagram
} from 'lucide-react';
import { toast } from 'sonner';
import InstagramAnalyticsDashboard from '@/components/InstagramAnalyticsDashboard';

type AdminTab = 'overview' | 'campaigns' | 'contracts' | 'applications' | 'messages' | 'users' | 'escrows' | 'audits' | 'instagram';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Overview Data
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [activityStream, setActivityStream] = useState<AdminActivityItem[]>([]);

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

  // Initial Data Load
  const fetchAllAdminData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, campaignsRes, contractsRes, appsRes, msgsRes, usersRes, escrowsRes, auditRes] = await Promise.all([
        apiAdminGetOverview().catch(() => null),
        apiAdminGetCampaigns().catch(() => ({ campaigns: [] })),
        apiAdminGetContracts().catch(() => ({ contracts: [] })),
        apiAdminGetApplications().catch(() => ({ applications: [] })),
        apiAdminGetMessages().catch(() => ({ messages: [] })),
        apiAdminGetUsers().catch(() => ({ users: [] })),
        apiGetAdminEscrows().catch(() => ({ escrows: [] })),
        apiGetAuditLogs().catch(() => ({ logs: [] }))
      ]);

      if (overviewRes) {
        setOverviewStats(overviewRes.stats);
        setActivityStream(overviewRes.activityStream);
      }
      if (campaignsRes) setCampaigns(campaignsRes.campaigns);
      if (contractsRes) setContracts(contractsRes.contracts);
      if (appsRes) setApplications(appsRes.applications);
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
          { id: 'instagram', label: '📸 Instagram Analytics', icon: Instagram },
          { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Briefcase },
          { id: 'contracts', label: `Contracts (${contracts.length})`, icon: FileText },
          { id: 'applications', label: `Applications (${applications.length})`, icon: CheckCircle2 },
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

    </DashboardLayout>
  );
}

