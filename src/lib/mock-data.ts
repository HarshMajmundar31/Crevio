export type UserRole = 'brand' | 'creator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboardingStep?: number;
  avatar?: string;
  linkedinLinked?: boolean;
  linkedinData?: any;
  onboardingDraft?: any;
}

export interface Campaign {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  description: string;
  platform: string;
  budget: number;
  deadline: string;
  requirements: string[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Contract {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  status: 'draft' | 'pending' | 'accepted' | 'locked' | 'executed' | 'completed' | 'disputed';
  paymentAmount: number;
  deliverables: Deliverable[];
  rules: ContractRule[];
  createdAt: string;
  lockedAt?: string;
  executedAt?: string;
}

export interface Deliverable {
  id: string;
  description: string;
  platform: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submittedAt?: string;
}

export interface ContractRule {
  id: string;
  type: 'deliverable' | 'deadline' | 'compliance';
  description: string;
  passed?: boolean;
}

export interface DecisionRecord {
  id: string;
  contractId: string;
  decision: 'success' | 'failure';
  confidenceScore: number;
  reasons: string[];
  evaluatedAt: string;
}

export const mockUsers: User[] = [
  { id: 'b1', name: 'Nike Digital', email: 'brand@nike.com', role: 'brand' },
  { id: 'b2', name: 'Spotify Ads', email: 'ads@spotify.com', role: 'brand' },
  { id: 'c1', name: 'Priya Sharma', email: 'priya@creator.com', role: 'creator' },
  { id: 'c2', name: 'Alex Johnson', email: 'alex@creator.com', role: 'creator' },
  { id: 'a1', name: 'System Admin', email: 'admin@crevio.com', role: 'admin' },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp1', brandId: 'b1', brandName: 'Nike Digital',
    title: 'Summer Fitness Challenge 2026',
    description: 'Promote new summer collection through fitness-focused content.',
    platform: 'Instagram', budget: 25000, deadline: '2026-06-30',
    requirements: ['3 Instagram Reels', 'Brand mentions in caption', 'FTC disclosure'],
    status: 'active', createdAt: '2026-03-01',
  },
  {
    id: 'camp2', brandId: 'b2', brandName: 'Spotify Ads',
    title: 'Podcast Discovery Campaign',
    description: 'Drive awareness for new podcast features among Gen Z audience.',
    platform: 'YouTube', budget: 18000, deadline: '2026-05-15',
    requirements: ['2 YouTube videos', 'App walkthrough', 'Discount code integration'],
    status: 'active', createdAt: '2026-03-10',
  },
  {
    id: 'camp3', brandId: 'b1', brandName: 'Nike Digital',
    title: 'Back to School Athletics',
    description: 'Target college students for back-to-school athletic gear.',
    platform: 'TikTok', budget: 15000, deadline: '2026-08-15',
    requirements: ['5 TikTok videos', 'Hashtag challenge participation'],
    status: 'draft', createdAt: '2026-03-20',
  },
];

export const mockContracts: Contract[] = [
  {
    id: 'con1', campaignId: 'camp1', campaignTitle: 'Summer Fitness Challenge 2026',
    brandId: 'b1', brandName: 'Nike Digital', creatorId: 'c1', creatorName: 'Priya Sharma',
    status: 'locked', paymentAmount: 8000,
    deliverables: [
      { id: 'd1', description: '3 Instagram Reels featuring summer collection', platform: 'Instagram', deadline: '2026-06-15', status: 'submitted', submittedAt: '2026-06-12' },
      { id: 'd2', description: 'Brand mention in story', platform: 'Instagram', deadline: '2026-06-20', status: 'pending' },
    ],
    rules: [
      { id: 'r1', type: 'deliverable', description: 'Platform must match Instagram', passed: true },
      { id: 'r2', type: 'deliverable', description: 'Post count >= 3', passed: true },
      { id: 'r3', type: 'deadline', description: 'Submitted before deadline', passed: true },
      { id: 'r4', type: 'compliance', description: 'FTC disclosure present', passed: undefined },
    ],
    createdAt: '2026-03-05', lockedAt: '2026-03-08',
  },
  {
    id: 'con2', campaignId: 'camp2', campaignTitle: 'Podcast Discovery Campaign',
    brandId: 'b2', brandName: 'Spotify Ads', creatorId: 'c2', creatorName: 'Alex Johnson',
    status: 'executed', paymentAmount: 6000,
    deliverables: [
      { id: 'd3', description: '2 YouTube videos with app walkthrough', platform: 'YouTube', deadline: '2026-05-10', status: 'verified', submittedAt: '2026-05-08' },
      { id: 'd4', description: 'Discount code integration', platform: 'YouTube', deadline: '2026-05-12', status: 'verified', submittedAt: '2026-05-11' },
    ],
    rules: [
      { id: 'r5', type: 'deliverable', description: 'Platform must match YouTube', passed: true },
      { id: 'r6', type: 'deliverable', description: 'Post count >= 2', passed: true },
      { id: 'r7', type: 'deadline', description: 'Submitted before deadline', passed: true },
      { id: 'r8', type: 'compliance', description: 'FTC disclosure present', passed: true },
      { id: 'r9', type: 'compliance', description: 'No prohibited content', passed: true },
    ],
    createdAt: '2026-03-12', lockedAt: '2026-03-14', executedAt: '2026-05-13',
  },
  {
    id: 'con3', campaignId: 'camp1', campaignTitle: 'Summer Fitness Challenge 2026',
    brandId: 'b1', brandName: 'Nike Digital', creatorId: 'c2', creatorName: 'Alex Johnson',
    status: 'pending', paymentAmount: 9000,
    deliverables: [
      { id: 'd5', description: '3 Instagram Reels', platform: 'Instagram', deadline: '2026-06-25', status: 'pending' },
    ],
    rules: [
      { id: 'r10', type: 'deliverable', description: 'Platform must match Instagram' },
      { id: 'r11', type: 'deadline', description: 'Submitted before deadline' },
      { id: 'r12', type: 'compliance', description: 'FTC disclosure present' },
    ],
    createdAt: '2026-03-18',
  },
];

export const mockDecisions: DecisionRecord[] = [
  {
    id: 'dec1', contractId: 'con2', decision: 'success', confidenceScore: 1.0,
    reasons: ['All deliverables verified', 'Submitted before deadline', 'FTC disclosure present', 'No prohibited content detected'],
    evaluatedAt: '2026-05-13',
  },
];
