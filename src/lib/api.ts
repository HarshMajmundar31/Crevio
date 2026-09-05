export const AUTH_TOKEN_KEY = 'crevio_auth_token';

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (url) {
    return url.replace(/\/+$/, '');
  }
  return '';
}

const API_BASE_URL = getApiBaseUrl();

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ClerkSessionLike = {
  getToken: () => Promise<string | null>;
};

declare global {
  interface Window {
    Clerk?: {
      session?: ClerkSessionLike;
    };
  }
}

async function resolveAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const clerkToken = await window.Clerk?.session?.getToken?.();
    if (clerkToken) {
      return clerkToken;
    }
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, method: HttpMethod, body?: BodyInit | object, isFormData = false): Promise<T> {
  const token = await resolveAuthToken();
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body
      ? isFormData
        ? (body as BodyInit)
        : JSON.stringify(body)
      : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = payload?.details ? `${payload?.error || 'Error'}: ${payload.details}` : (payload?.error || `Request failed: ${response.status}`);
    throw new Error(errorMsg);
  }

  return payload as T;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
}

export interface ApiCurrentUserResponse {
  user: ApiUser | null;
  needsOnboarding: boolean;
  profile?: {
    id: string;
    email: string | null;
    name: string;
  };
}

export interface ApiContract {
  id: string;
  campaign_id: string;
  brand_id: string;
  brand_name: string;
  creator_id: string;
  creator_name: string;
  status: string;
  payment_amount: number | string;
  contract_deadline?: string;
  notes?: string;
  terms_hash?: string;
  created_at: string;
  updated_at?: string;
  accepted_at?: string;
  locked_at?: string;
  executed_at?: string;
  completed_at?: string;
  total_deliverables?: number | string;
  verified_deliverables?: number | string;
}

export interface ApiCampaign {
  id: string;
  brand_id: string;
  brand_name: string;
  title: string;
  goal?: string;
  target_audience?: string;
  description: string;
  deliverables_summary?: string;
  timeline_summary?: string;
  platform: string;
  budget: number | string;
  budget_min?: number | string;
  budget_max?: number | string;
  content_rights?: string;
  deadline: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  requirements: string[];
  has_applied?: boolean;
  cover_image_url?: string | null;
  highlight_color?: string | null;
  contract_file_name?: string | null;
  contract_extracted_terms?: any | null;
  contract_raw_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCampaignApplication {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_platform: string;
  campaign_status: string;
  campaign_goal?: string;
  campaign_target_audience?: string;
  campaign_budget_min?: number | string;
  campaign_budget_max?: number | string;
  creator_id: string;
  creator_name: string;
  brand_id: string;
  brand_name: string;
  pitch_message: string;
  platform_links: string[];
  audience_location: string;
  audience_age_band: string;
  audience_niche: string;
  engagement_snapshot: string;
  past_work_links: string[];
  proposed_deliverables: string;
  proposed_fee: number | string;
  proposed_payment_model: string;
  earliest_start_date: string;
  availability_notes: string;
  compliance_agreed: boolean;
  status: 'submitted' | 'shortlisted' | 'interviewing' | 'approved' | 'rejected' | 'withdrawn';
  audience_fit_score: number;
  engagement_quality_score: number;
  content_quality_score: number;
  reliability_score: number;
  budget_fit_score: number;
  fit_score: number;
  brand_notes?: string;
  negotiation_notes?: string;
  usage_rights?: string;
  exclusivity_terms?: string;
  revision_terms?: string;
  payout_terms?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  withdrawn_at?: string;
  contract_id?: string;
  signed_contract_path?: string;
  signed_contract_name?: string;
  signed_at?: string;
  is_contract_locked?: boolean;
  contract_locked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiApplicationEvent {
  id: string;
  application_id: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ApiDecisionListItem {
  id: string;
  contract_id: string;
  decision: 'success' | 'failure';
  confidence_score: number;
  evaluated_at: string;
  contract_status: string;
  brand_id: string;
  creator_id: string;
}

export interface ApiDirectoryUser {
  id: string;
  full_name: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
  avatar_url?: string | null;
  created_at: string;
}

export interface ApiDeliverable {
  id: string;
  contract_id: string;
  description: string;
  platform: string;
  deadline: string;
  status: string;
  submitted_at?: string;
  verified_at?: string;
  evidence_url?: string;
  reviewer_notes?: string;
}

export interface ApiRule {
  id: string;
  rule_type: 'deliverable' | 'deadline' | 'compliance';
  description: string;
  passed: boolean | null;
}

export interface ApiDecision {
  id: string;
  decision: 'success' | 'failure';
  confidence_score: number;
  evaluated_at: string;
  reasons: Array<{ reason_text: string }>;
}

export async function apiLogin(email: string, password: string) {
  return request<{ token: string; user: ApiUser }>('/api/auth/login', 'POST', { email, password });
}

export async function apiGetCurrentUser() {
  return request<ApiCurrentUserResponse>('/api/auth/me', 'GET');
}

export async function apiOnboardUser(role: 'brand' | 'creator') {
  const safeRole = encodeURIComponent(role);
  return request<{ user: ApiUser; needsOnboarding: boolean }>(`/api/auth/onboard?role=${safeRole}`, 'POST', { role });
}

export async function getCampaigns(filters?: {
  search?: string;
  status?: string;
  platform?: string;
}) {
  const query = new URLSearchParams();
  if (filters?.search) query.set('search', filters.search);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.platform) query.set('platform', filters.platform);
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return request<{ campaigns: ApiCampaign[] }>(`/api/campaigns${suffix}`, 'GET');
}

export async function createCampaign(input: {
  title: string;
  goal: string;
  targetAudience: string;
  description: string;
  deliverablesSummary: string;
  timelineSummary: string;
  platform: string;
  budgetMin: number;
  budgetMax: number;
  contentRights: string;
  deadline: string;
  requirements: string[];
  coverImageUrl?: string;
  highlightColor?: string;
}) {
  return request<{ campaignId: string }>('/api/campaigns', 'POST', input);
}

export async function getCampaign(campaignId: string) {
  return request<{ campaign: ApiCampaign }>(`/api/campaigns/${campaignId}`, 'GET');
}

export async function applyToCampaign(
  campaignId: string,
  input: {
    pitchMessage: string;
    platformLinks: string[];
    audienceLocation: string;
    audienceAgeBand: string;
    audienceNiche: string;
    engagementSnapshot: string;
    pastWorkLinks: string[];
    proposedDeliverables: string;
    proposedFee: number;
    proposedPaymentModel: string;
    earliestStartDate: string;
    availabilityNotes: string;
    complianceAgreed: boolean;
  }
) {
  return request<{ campaignId: string; applied: boolean; alreadyApplied: boolean; fitScore?: number }>(`/api/campaigns/${campaignId}/apply`, 'POST', input);
}

export async function getContracts(filters?: {
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (filters?.search) query.set('search', filters.search);
  if (filters?.status) query.set('status', filters.status);
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return request<{ contracts: ApiContract[] }>(`/api/contracts${suffix}`, 'GET');
}

export async function getContractDetail(contractId: string) {
  return request<{ contract: ApiContract; deliverables: ApiDeliverable[]; rules: ApiRule[]; decisions: ApiDecision[] }>(`/api/contracts/${contractId}`, 'GET');
}

export async function ingestContract(input: {
  applicationId: string;
  campaignId: string;
  creatorId: string;
  paymentAmount: string;
  contractDeadline?: string;
  notes?: string;
  file: File;
}) {
  const form = new FormData();
  form.set('applicationId', input.applicationId);
  form.set('campaignId', input.campaignId);
  form.set('creatorId', input.creatorId);
  form.set('paymentAmount', input.paymentAmount);
  if (input.contractDeadline) form.set('contractDeadline', input.contractDeadline);
  if (input.notes) form.set('notes', input.notes);
  form.set('file', input.file);

  return request<{ contractId: string; status: string }>('/api/contracts/ingest', 'POST', form, true);
}

export async function acceptContract(contractId: string) {
  return request<{ contractId: string; status: string }>(`/api/contracts/${contractId}/accept`, 'POST');
}

export async function lockContract(contractId: string, finalSubmissionUrl: string) {
  return request<{ contractId: string; status: string; termsHash: string }>(`/api/contracts/${contractId}/lock`, 'POST', {
    finalSubmissionUrl,
  });
}

export async function executeContract(contractId: string) {
  return request<{ contractId: string; status: string; decision: string; reasons: string[] }>(`/api/contracts/${contractId}/execute`, 'POST');
}

export async function updateDeliverableStatus(contractId: string, deliverableId: string, status: 'submitted' | 'verified' | 'rejected', evidenceUrl?: string) {
  return request(`/api/contracts/${contractId}/deliverables/${deliverableId}/status`, 'PATCH', { status, evidenceUrl });
}

export async function getContractDossier(contractId: string) {
  return request(`/api/contracts/${contractId}/dossier`, 'GET');
}

export async function deleteCampaign(campaignId: string) {
  return request<{ campaignId: string; status: string }>(`/api/campaigns/${campaignId}`, 'DELETE');
}

export async function deleteContract(contractId: string) {
  return request<{ contractId: string; status: string }>(`/api/contracts/${contractId}`, 'DELETE');
}

export async function getDecisions() {
  return request<{ decisions: ApiDecisionListItem[] }>('/api/decisions', 'GET');
}

export async function getUsers(role?: 'brand' | 'creator' | 'admin') {
  const suffix = role ? `?role=${encodeURIComponent(role)}` : '';
  return request<{ users: ApiDirectoryUser[] }>(`/api/users${suffix}`, 'GET');
}

export async function getApplications(filters?: {
  status?: string;
  campaignId?: string;
}) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.campaignId) query.set('campaignId', filters.campaignId);
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return request<{ applications: ApiCampaignApplication[] }>(`/api/applications${suffix}`, 'GET');
}

export async function getApplicationDetail(applicationId: string) {
  return request<{ application: ApiCampaignApplication; events: ApiApplicationEvent[] }>(`/api/applications/${applicationId}`, 'GET');
}

export async function updateApplicationStatus(
  applicationId: string,
  input: {
    status?: 'shortlisted' | 'interviewing' | 'approved' | 'rejected' | 'withdrawn';
    brandNotes?: string;
    negotiationNotes?: string;
    usageRights?: string;
    exclusivityTerms?: string;
    revisionTerms?: string;
    payoutTerms?: string;
  }
) {
  return request<{ applicationId: string; status: string }>(`/api/applications/${applicationId}/status`, 'PATCH', input);
}

// Brand Onboarding API Helpers
export async function createWorkspace(input: {
  name: string;
  slug: string;
  logo_url?: string;
}) {
  return request('/api/workspaces', 'POST', input);
}

export async function verifyLinkedIn(simulate = false) {
  return request(`/api/auth/linkedin/verify${simulate ? '?simulate=true' : ''}`, 'POST');
}

export async function verifyLinkedInCustomOAuth(code: string, redirectUri: string) {
  return request('/api/auth/linkedin/callback', 'POST', { code, redirectUri });
}

export async function updateWorkspaceProfile(input: {
  industry?: string;
  company_size?: string;
  website?: string;
  bio?: string;
  hq_location?: string;
}) {
  return request('/api/workspaces/profile', 'PATCH', input);
}

export async function inviteTeamMembers(input: {
  invitees: Array<{ email: string; role: string }>;
}) {
  return request('/api/workspaces/invite', 'POST', input);
}

export async function completeOnboarding() {
  return request('/api/workspaces/complete', 'POST');
}

export async function getCurrentWorkspace() {
  return request<{ workspace: any; members: any[] }>('/api/workspaces/current', 'GET');
}

// Brand Dashboard Architecture Phase 1 API Helpers
export interface DashboardSummaryData {
  executingContracts: {
    count: number;
    trend: string;
    sparkline: number[];
  };
  escrowCapital: {
    totalLocked: number;
    pendingRelease48h: number;
    currency: string;
  };
  complianceHealth: {
    indexScore: number;
    activeBreaches: number;
    status: 'OPTIMAL' | 'ATTENTION_NEEDED';
  };
  awaitingCreatorSignedUpload: {
    count: number;
    slaBreached72h: number;
  };
  signedPendingLock: {
    count: number;
    readyEscrow: number;
  };
}

export interface RiskAlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  contractNumber: string;
  creatorHandle: string;
  title: string;
  description: string;
  slaRemaining: string;
  recommendedActions: Array<{
    label: string;
    action: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  }>;
}

export interface ActivityStreamItem {
  id: string;
  timestamp: string;
  type: string;
  actor: string;
  description: string;
  badge: 'SUCCESS' | 'INFO' | 'NEUTRAL' | 'WARNING';
}

export interface CampaignHealthItem {
  id: string;
  name: string;
  budget: number;
  lockedEscrow: number;
  progressPercent: number;
  activeContracts: number;
  completedContracts: number;
  health: 'OPTIMAL' | 'ON_TRACK' | 'ATTENTION_NEEDED';
}

export async function getDashboardSummary() {
  return request<{ success: boolean; data: DashboardSummaryData }>('/api/v1/brand/dashboard/summary', 'GET');
}

export async function getDashboardRiskAlerts() {
  return request<{ success: boolean; data: RiskAlertItem[] }>('/api/v1/brand/dashboard/risk-alerts', 'GET');
}

export async function getDashboardActivityStream() {
  return request<{ success: boolean; data: ActivityStreamItem[] }>('/api/v1/brand/dashboard/activity-stream', 'GET');
}

export async function getDashboardCampaignHealth() {
  return request<{ success: boolean; data: CampaignHealthItem[] }>('/api/v1/brand/dashboard/campaign-health', 'GET');
}

export async function apiVerifyMetaAccount(handle: string) {
  return request<{
    success: boolean;
    data: {
      handle: string;
      name: string;
      followersCount: number;
      mediaCount: number;
      isVerified: boolean;
      category: string;
      verificationSource: string;
      verifiedAt: string;
    };
  }>('/api/auth/verify-meta', 'POST', { handle });
}

export async function apiSaveCreatorOnboarding(payload: Record<string, unknown>) {
  return request<{
    success: boolean;
    message: string;
    user: ApiUser;
  }>('/api/auth/creator-onboard', 'POST', payload);
}

// Payment & Escrow Wallet Typings
export interface ApiWallet {
  id: string;
  user_id: string;
  available_balance: string | number;
  pending_escrow_balance: string | number;
  currency: string;
  updated_at: string;
}

export interface ApiTransaction {
  id: string;
  wallet_id: string;
  amount: string | number;
  txn_type: 'seed' | 'deposit' | 'withdrawal' | 'escrow_debit' | 'escrow_credit' | 'escrow_refund';
  status: 'completed' | 'failed';
  description: string;
  reference_escrow_id?: string;
  created_at: string;
}

export interface ApiEscrowHolding {
  id: string;
  contract_id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  amount: string | number;
  status: 'awaiting_deposit' | 'held' | 'released' | 'refunded' | 'disputed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  contract_status?: string;
  brand_name?: string;
  brand_email?: string;
  creator_name?: string;
  creator_email?: string;
  created_at: string;
}

// Payment & Wallet API Functions
export async function apiGetWallet() {
  return request<{ wallet: ApiWallet; transactions: ApiTransaction[] }>('/api/payments/wallet', 'GET');
}

export async function apiCreateRazorpayOrder(contractId: string) {
  return request<{ orderId: string; amount: number; currency: string; keyId: string }>(
    `/api/payments/contracts/${contractId}/create-order`,
    'POST'
  );
}

export async function apiVerifyRazorpayPayment(contractId: string, payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
  return request<{ success: boolean; status: string }>(
    `/api/payments/contracts/${contractId}/verify-payment`,
    'POST',
    payload
  );
}

export async function apiGetAdminEscrows() {
  return request<{ escrows: ApiEscrowHolding[] }>('/api/payments/escrows', 'GET');
}

export async function apiAdminSettleDispute(contractId: string, creatorPercent: number, brandPercent: number) {
  return request<{ success: boolean; status: string; creatorShare: number; brandShare: number }>(
    `/api/payments/contracts/${contractId}/simulate-release`,
    'POST',
    { creatorPercent, brandPercent }
  );
}

export async function apiCreateDepositOrder(amount: number) {
  return request<{ orderId: string; amount: number; currency: string; keyId: string }>(
    '/api/payments/deposit/create-order',
    'POST',
    { amount }
  );
}

// ----- Admin Audit & Metrics -----
export async function apiGetAuditLogs() {
  return request<{ logs: any[] }>('/api/admin/audit-logs', 'GET');
}

export async function apiGetSystemMetrics() {
  return request<{ metrics: { globalAvailablePool: number, escrowLedgerCheck: number, isBalanced: boolean } }>('/api/admin/system-metrics', 'GET');
}

export async function apiVerifyDepositPayment(payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; amount: number }) {
  return request<{ success: boolean; balance: number }>(
    '/api/payments/deposit/verify',
    'POST',
    payload
  );
}

export async function apiWithdrawFunds(payload: { amount: number; paymentMethod: string; paymentDetails: string }) {
  return request<{ success: boolean; balance: number }>(
    '/api/payments/withdraw',
    'POST',
    payload
  );
}

export async function apiCreateCampaignOrder(campaignId: string) {
  return request<{ orderId: string; amount: number; currency: string; keyId: string }>(
    `/api/payments/campaigns/${campaignId}/create-order`,
    'POST'
  );
}

export async function apiVerifyCampaignPayment(campaignId: string, payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
  return request<{ success: boolean; status: string }>(
    `/api/payments/campaigns/${campaignId}/verify-payment`,
    'POST',
    payload
  );
}

export async function apiFundCampaignWithWallet(campaignId: string) {
  return request<{ success: boolean; status: string; balance: number }>(
    `/api/payments/campaigns/${campaignId}/fund-with-wallet`,
    'POST'
  );
}

export async function apiFundContractWithWallet(contractId: string) {
  return request<{ success: boolean; status: string; balance: number }>(
    `/api/payments/contracts/${contractId}/fund-with-wallet`,
    'POST'
  );
}

export interface ApiNotification {
  id: string;
  user_id: string;
  contract_id?: string;
  decision_id?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function apiGetNotifications() {
  return request<{ notifications: ApiNotification[] }>('/api/notifications', 'GET');
}

export async function apiMarkNotificationAsRead(id: string) {

  return request<{ success: boolean }>(`/api/notifications/${id}/read`, 'POST');
}

// ----- Instagram Connect & Graph API Helpers -----

export interface InstagramAccountResponse {
  connected: boolean;
  platformUserId?: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  accountType?: string;
  followersCount?: number;
  mediaCount?: number;
  connectedAt?: string;
  needsReconnect?: boolean;
}

export async function apiGetInstagramConnectUrl(returnUrl?: string): Promise<{ url: string }> {
  const queryStr = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
  return request<{ url: string }>(`/api/auth/instagram/connect-url${queryStr}`, 'GET');
}

export async function apiGetInstagramAccount(): Promise<InstagramAccountResponse> {
  try {
    return await request<InstagramAccountResponse>('/api/social/instagram/account', 'GET');
  } catch (err: any) {
    if (err?.status === 404 || err?.payload?.connected === false) {
      return { connected: false };
    }
    return { connected: false };
  }
}

export async function apiGetInstagramInsights(): Promise<{ available: boolean; reason?: string; metrics?: any[] }> {
  return request<{ available: boolean; reason?: string; metrics?: any[] }>('/api/social/instagram/insights', 'GET');
}

export async function apiDisconnectInstagram(): Promise<void> {
  return request<void>('/api/social/instagram/disconnect', 'DELETE');
}


export async function apiDirectJoinCampaign(campaignId: string): Promise<{ success: boolean; applicationId?: string; autoJoined?: boolean; alreadyJoined?: boolean; status?: string }> {
  return request<{ success: boolean; applicationId?: string; autoJoined?: boolean; alreadyJoined?: boolean; status?: string }>(
    `/api/campaigns/${campaignId}/direct-join`,
    'POST'
  );
}

export async function apiUploadCreatorSignedContract(campaignId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  return request<any>(`/api/campaigns/${campaignId}/upload-signed-contract`, 'POST', formData, true);
}

export interface ApiWorkingCampaign {
  id: string;
  brand_id: string;
  brand_name?: string;
  brand_email?: string;
  title: string;
  description: string;
  platform: string;
  goal?: string;
  target_audience?: string;
  deliverables_summary?: string;
  timeline_summary?: string;
  budget: number | string;
  budget_min?: number | string;
  budget_max?: number | string;
  content_rights?: string;
  deadline?: string;
  campaign_status: string;
  contract_file_name?: string;
  contract_extracted_terms?: any;
  cover_image_url?: string;
  highlight_color?: string;
  created_at?: string;
  application_id?: string;
  application_status?: string;
  proposed_fee?: number | string;
  signed_contract_name?: string;
  signed_at?: string;
  joined_at?: string;
  contract_id?: string;
  contract_status?: string;
  total_deliverables?: number;
  completed_deliverables?: number;
  escrow_status?: string;
  escrow_amount?: number | string;
  participants?: Array<{
    application_id: string;
    creator_id: string;
    creator_name: string;
    creator_email?: string;
    status: string;
    proposed_fee: number;
    signed_contract_name?: string;
    signed_at?: string;
    contract_id?: string;
    contract_status?: string;
  }>;
  accepted_creators_count?: number;
}

export async function apiGetWorkingCampaigns(): Promise<{ campaigns: ApiWorkingCampaign[] }> {
  return request<{ campaigns: ApiWorkingCampaign[] }>('/api/campaigns/working', 'GET');
}

export async function apiDownloadCampaignContract(campaignId: string, defaultFileName?: string): Promise<void> {
  const token = await resolveAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${API_BASE_URL}/api/campaigns/${campaignId}/contract/download`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let errorMsg = 'Failed to download campaign contract';
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errorMsg;
    } catch {
      const text = await res.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match ? match[1] : (defaultFileName || 'campaign_contract.pdf');

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function apiDownloadSignedContract(campaignId: string, creatorId?: string): Promise<void> {
  const token = await resolveAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${API_BASE_URL}/api/campaigns/${campaignId}/signed-contract/download${creatorId ? `?creatorId=${encodeURIComponent(creatorId)}` : ''}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let errorMsg = 'Failed to download signed contract';
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errorMsg;
    } catch {
      const text = await res.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match ? match[1] : 'signed_contract.pdf';

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function apiLockCampaignContract(
  campaignId: string,
  payload?: { applicationId?: string; creatorId?: string }
): Promise<{ success: boolean; is_contract_locked: boolean; contract_locked_at: string }> {
  return request<{ success: boolean; is_contract_locked: boolean; contract_locked_at: string }>(
    `/api/campaigns/${campaignId}/lock-contract`,
    'POST',
    payload || {}
  );
}

export interface ApiCampaignMessage {
  id: string;
  campaign_id: string;
  sender_id: string;
  recipient_id?: string;
  sender_role: 'creator' | 'brand' | 'admin';
  message: string;
  attachment_url?: string;
  attachment_name?: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export async function apiGetCampaignMessages(campaignId: string): Promise<{ messages: ApiCampaignMessage[] }> {
  return request<{ messages: ApiCampaignMessage[] }>(`/api/campaigns/${campaignId}/messages`, 'GET');
}

export async function apiSendCampaignMessage(
  campaignId: string,
  payload: { message: string; recipientId?: string; attachmentUrl?: string; attachmentName?: string }
): Promise<{ message: ApiCampaignMessage }> {
  return request<{ message: ApiCampaignMessage }>(`/api/campaigns/${campaignId}/messages`, 'POST', payload);
}

export interface ApiProofSubmission {
  id: string;
  campaign_id: string;
  creator_id: string;
  application_id?: string;
  deliverable_title: string;
  live_url: string;
  description?: string;
  attachment_path?: string;
  attachment_name?: string;
  insights_image_path?: string;
  insights_image_name?: string;
  engagement_rate?: string;
  impressions_count?: string;
  reach_count?: string;
  likes_count?: string;
  comments_count?: string;
  shares_count?: string;
  saves_count?: string;
  overview_notes?: string;
  status: 'pending' | 'approved' | 'revision_requested' | 'rejected';
  brand_feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
  created_at: string;
  creator_name?: string;
  creator_avatar?: string;
  creator_email?: string;
  creator_handle?: string;
}


export async function apiGetCampaignProofs(campaignId: string): Promise<{ submissions: ApiProofSubmission[] }> {
  return request<{ submissions: ApiProofSubmission[] }>(`/api/campaigns/${campaignId}/proof-submissions`, 'GET');
}

export async function apiSubmitCampaignProof(
  campaignId: string,
  formData: FormData
): Promise<{ submission: ApiProofSubmission }> {
  return request<{ submission: ApiProofSubmission }>(
    `/api/campaigns/${campaignId}/proof-submissions`,
    'POST',
    formData,
    true
  );
}

export async function apiReviewCampaignProof(
  campaignId: string,
  proofId: string,
  payload: { status: 'approved' | 'revision_requested' | 'rejected'; brandFeedback?: string }
): Promise<{ submission: ApiProofSubmission }> {
  return request<{ submission: ApiProofSubmission }>(
    `/api/campaigns/${campaignId}/proof-submissions/${proofId}/status`,
    'PATCH',
    payload
  );
}

// ==========================================
// Super-Admin Management API Types & Methods
// ==========================================

export interface AdminOverviewStats {
  users: {
    total_users: number;
    total_brands: number;
    total_creators: number;
    total_admins: number;
  };
  campaigns: {
    total_campaigns: number;
    active_campaigns: number;
    completed_campaigns: number;
    draft_campaigns: number;
    total_budget_volume: number;
  };
  contracts: {
    total_contracts: number;
    active_contracts: number;
    completed_contracts: number;
    disputed_contracts: number;
    total_contract_volume: number;
  };
  escrow: {
    total_escrows: number;
    total_held_escrow: number;
    total_released_escrow: number;
    disputed_escrows: number;
  };
  totalApplications: number;
  totalMessages: number;
  totalProofs: number;
}

export interface AdminActivityItem {
  event_type: string;
  id: string;
  description: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
}

export interface AdminCampaignItem {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_email: string;
  brand_avatar?: string;
  title: string;
  description: string;
  goal?: string;
  target_audience?: string;
  deliverables_summary?: string;
  timeline_summary?: string;
  platform: string;
  budget: number | string;
  budget_min?: number;
  budget_max?: number;
  deadline: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  contract_file_name?: string;
  applicants_count: number;
  accepted_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminContractItem {
  id: string;
  campaign_id?: string;
  campaign_title?: string;
  contract_file_name?: string;
  contract_extracted_terms?: any;
  brand_id: string;
  brand_name: string;
  brand_email: string;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  status: 'draft' | 'pending' | 'accepted' | 'locked' | 'executed' | 'completed' | 'disputed' | 'cancelled';
  payment_amount: number | string;
  contract_deadline?: string;
  notes?: string;
  signed_contract_name?: string;
  signed_at?: string;
  deliverables_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminApplicationItem {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_platform: string;
  campaign_budget: number | string;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  creator_avatar?: string;
  brand_id: string;
  brand_name: string;
  brand_email: string;
  pitch_message: string;
  proposed_fee: number | string;
  proposed_deliverables: string;
  earliest_start_date: string;
  status: 'submitted' | 'shortlisted' | 'interviewing' | 'approved' | 'rejected' | 'withdrawn';
  brand_notes?: string;
  signed_contract_name?: string;
  signed_at?: string;
  created_at: string;
}

export interface AdminMessageItem {
  id: string;
  campaign_id: string;
  campaign_title: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  sender_avatar?: string;
  sender_role: string;
  recipient_id?: string;
  recipient_name?: string;
  message: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}

export interface AdminUserItem {
  id: string;
  full_name: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
  avatar_url?: string;
  is_active: boolean;
  available_balance: number | string;
  pending_escrow_balance: number | string;
  campaigns_count: number;
  contracts_count: number;
  applications_count: number;
  created_at: string;
}

export interface AdminProofItem {
  id: string;
  campaign_id: string;
  campaign_title: string;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  brand_name: string;
  deliverable_title: string;
  live_url: string;
  description?: string;
  attachment_path?: string;
  attachment_name?: string;
  insights_image_path?: string;
  insights_image_name?: string;
  engagement_rate?: string;
  impressions_count?: string;
  reach_count?: string;
  likes_count?: string;
  comments_count?: string;
  shares_count?: string;
  saves_count?: string;
  overview_notes?: string;
  status: 'pending' | 'approved' | 'revision_requested' | 'rejected';
  brand_feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
  created_at: string;
}


// Admin Overview
export async function apiAdminGetOverview() {
  return request<{ stats: AdminOverviewStats; activityStream: AdminActivityItem[] }>('/api/admin/overview', 'GET');
}

// Admin Campaigns CRUD
export async function apiAdminGetCampaigns(params?: { q?: string; status?: string }) {
  const queryStr = new URLSearchParams(params as any).toString();
  return request<{ campaigns: AdminCampaignItem[] }>(`/api/admin/campaigns${queryStr ? `?${queryStr}` : ''}`, 'GET');
}

export async function apiAdminCreateCampaign(payload: Partial<AdminCampaignItem>) {
  return request<{ success: boolean; campaign: AdminCampaignItem }>('/api/admin/campaigns', 'POST', payload);
}

export async function apiAdminUpdateCampaign(id: string, payload: Partial<AdminCampaignItem>) {
  return request<{ success: boolean; campaign: AdminCampaignItem }>(`/api/admin/campaigns/${id}`, 'PATCH', payload);
}

export async function apiAdminDeleteCampaign(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/campaigns/${id}`, 'DELETE');
}

// Admin Contracts CRUD
export async function apiAdminGetContracts(params?: { q?: string; status?: string }) {
  const queryStr = new URLSearchParams(params as any).toString();
  return request<{ contracts: AdminContractItem[] }>(`/api/admin/contracts${queryStr ? `?${queryStr}` : ''}`, 'GET');
}

export async function apiAdminCreateContract(payload: { brand_id: string; creator_id: string; payment_amount: number; campaign_id?: string; contract_deadline?: string; notes?: string; status?: string }) {
  return request<{ success: boolean; contract: AdminContractItem }>('/api/admin/contracts', 'POST', payload);
}

export async function apiAdminUpdateContract(id: string, payload: Partial<AdminContractItem>) {
  return request<{ success: boolean; contract: AdminContractItem }>(`/api/admin/contracts/${id}`, 'PATCH', payload);
}

export async function apiAdminDeleteContract(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/contracts/${id}`, 'DELETE');
}

// Admin Applications
export async function apiAdminGetApplications(params?: { q?: string; status?: string }) {
  const queryStr = new URLSearchParams(params as any).toString();
  return request<{ applications: AdminApplicationItem[] }>(`/api/admin/applications${queryStr ? `?${queryStr}` : ''}`, 'GET');
}

export async function apiAdminUpdateApplicationStatus(id: string, status: string, brand_notes?: string) {
  return request<{ success: boolean; application: AdminApplicationItem }>(`/api/admin/applications/${id}/status`, 'PATCH', { status, brand_notes });
}

export async function apiAdminDeleteApplication(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/applications/${id}`, 'DELETE');
}

// Admin Chat & Messages
export async function apiAdminGetMessages(params?: { campaign_id?: string; q?: string }) {
  const queryStr = new URLSearchParams(params as any).toString();
  return request<{ messages: AdminMessageItem[] }>(`/api/admin/messages${queryStr ? `?${queryStr}` : ''}`, 'GET');
}

export async function apiAdminPostMessage(payload: { campaign_id: string; message: string; recipient_id?: string }) {
  return request<{ success: boolean; message: AdminMessageItem }>('/api/admin/messages', 'POST', payload);
}

export async function apiAdminDeleteMessage(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/messages/${id}`, 'DELETE');
}

// Admin Users CRUD & Wallet
export async function apiAdminGetUsers(params?: { q?: string; role?: string }) {
  const queryStr = new URLSearchParams(params as any).toString();
  return request<{ users: AdminUserItem[] }>(`/api/admin/users${queryStr ? `?${queryStr}` : ''}`, 'GET');
}

export async function apiAdminCreateUser(payload: { full_name: string; email: string; role: string; initial_balance?: number }) {
  return request<{ success: boolean; user: AdminUserItem }>('/api/admin/users', 'POST', payload);
}

export async function apiAdminUpdateUser(id: string, payload: Partial<AdminUserItem>) {
  return request<{ success: boolean; user: AdminUserItem }>(`/api/admin/users/${id}`, 'PATCH', payload);
}

export async function apiAdminAdjustUserBalance(id: string, amount: number, description?: string) {
  return request<{ success: boolean; wallet?: ApiWallet; newBalance?: number; transactionId?: string }>(`/api/admin/users/${id}/adjust-balance`, 'POST', { amount, description });
}

export async function apiAdminDeleteUser(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, 'DELETE');
}

// Admin Proof Submissions
export async function apiAdminGetProofs() {
  return request<{ proofs: AdminProofItem[] }>('/api/admin/proofs', 'GET');
}

export async function apiAdminUpdateProofStatus(id: string, status: string, brand_feedback?: string) {
  return request<{ success: boolean; proof: AdminProofItem }>(`/api/admin/proofs/${id}/status`, 'PATCH', { status, brand_feedback });
}

export async function apiAdminDeleteProof(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/proofs/${id}`, 'DELETE');
}

// Admin Escrow Actions
export async function apiAdminReleaseEscrow(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/escrows/${id}/release`, 'POST');
}

export async function apiAdminRefundEscrow(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/escrows/${id}/refund`, 'POST');
}

// Instagram Graph API v25.0 Analytics Interfaces
export interface InstagramProfile {
  id: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string | null;
  accountType: string;
  followersCount: number;
  mediaCount: number;
  biography?: string;
  tokenExpiresAt?: string;
  daysRemaining?: number;
  needsReconnect?: boolean;
}

export interface InstagramKPIs {
  followers: number;
  followersGrowthPct?: number;
  mediaCount: number;
  reach30d: number;
  reachGrowthPct?: number;
  profileViews30d: number;
  profileViewsGrowthPct?: number;
  impressions30d: number;
  avgEngagementRate: number;
}

export interface InstagramDailyTrend {
  date: string;
  reach: number;
  impressions: number;
  profileViews: number;
}

export interface InstagramAccountAnalyticsResponse {
  success: boolean;
  connected: boolean;
  isDemoData?: boolean;
  isLiveMeta?: boolean;
  profile: InstagramProfile;
  kpis: InstagramKPIs;
  dailyTrends: InstagramDailyTrend[];
}

export interface InstagramPostAnalytics {
  id: string;
  caption: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS' | string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  reach: number;
  impressions: number;
  saved: number;
  videoViews: number;
  engagementRate: number;
}

export interface InstagramMediaAnalyticsSummary {
  totalPostsAnalyzed: number;
  totalLikes: number;
  totalComments: number;
  totalReach: number;
  totalSaves: number;
  totalVideoViews: number;
  avgEngagementRate: number;
}

export interface InstagramMediaAnalyticsResponse {
  success: boolean;
  isLiveMeta?: boolean;
  posts: InstagramPostAnalytics[];
  summary: InstagramMediaAnalyticsSummary;
}

export async function apiGetInstagramAccountAnalytics(userId?: string) {
  const queryStr = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request<InstagramAccountAnalyticsResponse>(`/api/social/instagram/account-analytics${queryStr}`, 'GET');
}

export async function apiGetInstagramMediaAnalytics(userId?: string) {
  const queryStr = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request<InstagramMediaAnalyticsResponse>(`/api/social/instagram/media-analytics${queryStr}`, 'GET');
}

export async function apiExchangeInstagramToken(shortLivedToken: string, userId?: string) {
  return request<{
    success: boolean;
    message: string;
    account: any;
    expiresInDays: number;
    expiresAt: string;
  }>('/api/social/instagram/exchange-token', 'POST', { shortLivedToken, userId });
}

// ==========================================
// Admin Treasury & System Payments Monitoring
// ==========================================

export interface AdminTreasuryLiquidity {
  total_available: string | number;
  total_pending_escrow: string | number;
  brand_available: string | number;
  creator_available: string | number;
  admin_available: string | number;
  total_wallets: number;
}

export interface AdminTreasuryEscrow {
  total_held: string | number;
  total_released: string | number;
  total_refunded: string | number;
  total_disputed: string | number;
  total_escrows_count: number;
  held_count: number;
  disputed_count: number;
  released_count: number;
  refunded_count: number;
}

export interface AdminTreasuryVolume {
  total_inflow: string | number;
  total_withdrawn: string | number;
  total_settled_volume: string | number;
  total_refund_volume: string | number;
  total_transactions: number;
}

export interface AdminTreasuryTypeBreakdown {
  txn_type: string;
  count: number;
  total_volume: string | number;
}

export interface AdminTreasuryDailyTrend {
  date: string;
  inflow: number;
  outflow: number;
  escrow_locked: number;
  escrow_released: number;
  txn_count: number;
}

export interface AdminGlobalTransaction {
  id: string;
  wallet_id: string;
  amount: string | number;
  txn_type: 'seed' | 'deposit' | 'withdrawal' | 'escrow_debit' | 'escrow_credit' | 'escrow_refund';
  status: 'completed' | 'failed';
  description: string;
  reference_escrow_id?: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'brand' | 'creator' | 'admin';
  user_avatar?: string;
  currency: string;
  contract_id?: string;
  campaign_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  campaign_title?: string;
  is_test_mode?: boolean;
  gateway_type?: 'razorpay_test' | 'seed' | 'internal' | string;
}

export interface AdminRazorpayTestMetrics {
  gatewayInfo: {
    mode: 'test' | 'live' | string;
    keyId: string;
    isConfigured: boolean;
    environmentName: string;
    currency: string;
  };
  metrics: {
    total_razorpay_inflow: number;
    total_razorpay_orders: number;
    total_razorpay_payments: number;
    razorpay_escrow_held: number;
    razorpay_escrow_settled: number;
    razorpay_escrow_refunded: number;
    razorpay_disputed: number;
    seed_play_credits_volume: number;
    simulated_gateway_fees: number;
    verification_rate: number;
  };
}

export interface AdminTreasuryOverviewResponse {
  success: boolean;
  liquidity: AdminTreasuryLiquidity;
  escrow: AdminTreasuryEscrow;
  volume: AdminTreasuryVolume;
  typeBreakdown: AdminTreasuryTypeBreakdown[];
  dailyTrends: AdminTreasuryDailyTrend[];
  recentTransactions: AdminGlobalTransaction[];
  testModeTelemetry?: AdminRazorpayTestMetrics;
}

export interface AdminAllTransactionsResponse {
  success: boolean;
  transactions: AdminGlobalTransaction[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface AdminLedgerAuditResponse {
  success: boolean;
  isSolvent: boolean;
  auditTimestamp: string;
  stats: {
    totalWallets: number;
    totalAvailablePool: number;
    totalPendingEscrow: number;
    totalHeldEscrowVault: number;
    activeEscrowHoldingsCount: number;
    totalTransactionsCount: number;
    netTransactionSum: number;
    escrowDiscrepancy: number;
    isEscrowMatched: boolean;
  };
}

export async function apiAdminGetTreasuryOverview() {
  return request<AdminTreasuryOverviewResponse>('/api/payments/admin/treasury-overview', 'GET');
}

export async function apiAdminGetAllTransactions(params?: {
  q?: string;
  txn_type?: string;
  status?: string;
  role?: string;
  gateway_filter?: string;
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.q) queryParams.set('q', params.q);
  if (params?.txn_type && params.txn_type !== 'all') queryParams.set('txn_type', params.txn_type);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.role && params.role !== 'all') queryParams.set('role', params.role);
  if (params?.gateway_filter && params.gateway_filter !== 'all') queryParams.set('gateway_filter', params.gateway_filter);
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return request<AdminAllTransactionsResponse>(`/api/payments/admin/all-transactions${queryStr}`, 'GET');
}

export async function apiAdminRunLedgerAudit() {
  return request<AdminLedgerAuditResponse>('/api/payments/admin/ledger-audit', 'POST');
}

export interface AdminUserWalletSummary {
  id: string;
  full_name: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
  avatar_url?: string;
  available_balance: string | number;
  pending_escrow_balance: string | number;
  transaction_count: number;
}

export async function apiAdminGetUsersWalletsSummary() {
  return request<{ success: boolean; users: AdminUserWalletSummary[] }>('/api/payments/admin/users-wallets-summary', 'GET');
}

// ==========================================
// Resend & Autonomous Email Engine Management
// ==========================================

export interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name?: string | null;
  subject: string;
  template_name: string;
  status: 'sent' | 'failed' | 'simulated';
  resend_id?: string | null;
  error_message?: string | null;
  metadata?: any;
  created_at: string;
}

export interface EmailGatewayInfo {
  isConfigured: boolean;
  status: 'connected' | 'disconnected';
  provider: string;
  maskedKey: string;
  senderEmail: string;
  adminEmail: string;
  environment: string;
}

export interface EmailMetrics {
  totalAll: number;
  totalSent: number;
  totalFailed: number;
  totalSimulated: number;
  sentLast24h: number;
  successRate: string;
}

export interface EmailOverviewResponse {
  gateway: EmailGatewayInfo;
  metrics: EmailMetrics;
  templatesDistribution: { template_name: string; count: string | number }[];
  recentLogs: EmailLog[];
}

export interface EmailLogsResponse {
  logs: EmailLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailTemplateDefinition {
  id: string;
  name: string;
  trigger: string;
  description: string;
  previewHtml: string;
}

export interface EmailTemplatesResponse {
  templates: EmailTemplateDefinition[];
}

export interface SendTestEmailRequest {
  to?: string;
  templateName?: string;
  templateData?: any;
  customSubject?: string;
  customMessage?: string;
}

export interface SendBroadcastEmailRequest {
  targetAudience: 'all' | 'creators' | 'brands' | 'admin';
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export async function apiAdminGetEmailOverview() {
  return request<EmailOverviewResponse>('/api/admin/emails/overview', 'GET');
}

export async function apiAdminGetEmailLogs(params?: {
  page?: number;
  limit?: number;
  status?: string;
  template?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.template && params.template !== 'all') queryParams.set('template', params.template);
  if (params?.search) queryParams.set('search', params.search);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return request<EmailLogsResponse>(`/api/admin/emails/logs${queryStr}`, 'GET');
}

export async function apiAdminSendTestEmail(payload: SendTestEmailRequest) {
  return request<{
    success: boolean;
    status: string;
    logId: string;
    resendId?: string | null;
    recipient: string;
    error?: string | null;
  }>('/api/admin/emails/send-test', 'POST', payload);
}

export async function apiAdminSendBroadcastEmail(payload: SendBroadcastEmailRequest) {
  return request<{
    success: boolean;
    totalRecipients: number;
    successCount: number;
    failCount: number;
    targetAudience: string;
  }>('/api/admin/emails/broadcast', 'POST', payload);
}

export async function apiAdminGetEmailTemplates() {
  return request<EmailTemplatesResponse>('/api/admin/emails/templates', 'GET');
}

