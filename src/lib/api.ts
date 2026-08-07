export const AUTH_TOKEN_KEY = 'crevio_auth_token';

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (url && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return url;
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
    throw new Error(payload?.error || `Request failed: ${response.status}`);
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


