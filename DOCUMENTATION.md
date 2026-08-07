# Crevio Project Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Models](#data-models)
3. [Authentication Flow](#authentication-flow)
4. [Contract Lifecycle](#contract-lifecycle)
5. [Decision Engine](#decision-engine)
6. [API Integration Guide](#api-integration-guide)
7. [Component Library](#component-library)

## Architecture Overview

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│           React Application             │
├─────────────────────────────────────────┤
│  React Router (Client-side Routing)     │
├─────────────────────────────────────────┤
│  React Query (Server State Management)  │
├─────────────────────────────────────────┤
│  Context API (Auth State)               │
├─────────────────────────────────────────┤
│  Components (UI Layer)                  │
└─────────────────────────────────────────┘
```

### Technology Stack Layers

1. **Presentation Layer**: React + TypeScript
2. **Styling Layer**: Tailwind CSS + shadcn/ui
3. **State Management**: React Query + Context API
4. **Routing**: React Router v6
5. **Build Tool**: Vite
6. **Testing**: Vitest + Playwright

## Data Models

### User Model

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
  avatar?: string;
}
```

### Campaign Model

```typescript
interface Campaign {
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
```

### Contract Model

```typescript
interface Contract {
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
```

### Deliverable Model

```typescript
interface Deliverable {
  id: string;
  description: string;
  platform: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submittedAt?: string;
}
```

### Contract Rule Model

```typescript
interface ContractRule {
  id: string;
  type: 'deliverable' | 'deadline' | 'compliance';
  description: string;
  passed?: boolean;
}
```

### Decision Record Model

```typescript
interface DecisionRecord {
  id: string;
  contractId: string;
  decision: 'success' | 'failure';
  confidenceScore: number;
  reasons: string[];
  evaluatedAt: string;
}
```

## Authentication Flow

### Current Implementation (Mock)

```
1. User selects role on landing page
2. AuthContext.login(role) is called
3. Mock user is retrieved from mockUsers array
4. User state is set in AuthContext
5. User is redirected to /dashboard
6. Protected routes check isAuthenticated
```

### Future Implementation (Real Auth)

```
1. User enters credentials
2. POST /api/auth/login
3. Receive JWT token
4. Store token in localStorage/cookie
5. Set user state in AuthContext
6. Redirect to /dashboard
7. Include token in API requests
8. Refresh token when expired
```

## Contract Lifecycle

### State Transitions

```
Draft → Pending → Accepted → Locked → Executed → Completed
                                    ↓
                                Disputed
```

### State Descriptions

1. **Draft**: Contract is being created by brand
2. **Pending**: Sent to creator, awaiting acceptance
3. **Accepted**: Creator has accepted the terms
4. **Locked**: Contract is immutable, work can begin
5. **Executed**: Decision engine has evaluated deliverables
6. **Completed**: All deliverables verified, payment processed
7. **Disputed**: Issues requiring manual resolution

### Business Rules

- Only brands can create contracts
- Only creators can accept contracts
- Contracts cannot be modified after locking
- Deliverables must be submitted before deadline
- All rules must pass for successful execution

## Decision Engine

### Evaluation Process

```
1. Contract reaches "locked" state
2. Creator submits deliverables
3. Decision engine evaluates:
   - Deliverable rules (platform, count)
   - Deadline rules (submission timing)
   - Compliance rules (FTC, content policy)
4. Calculate confidence score (0-1)
5. Generate decision record
6. Update contract status
7. Trigger payment if successful
```

### Rule Types

#### Deliverable Rules
- Platform matching
- Post count verification
- Content format validation

#### Deadline Rules
- Submission before deadline
- Milestone completion timing

#### Compliance Rules
- FTC disclosure presence
- Prohibited content detection
- Brand guideline adherence

### Confidence Scoring

```
Confidence = (Passed Rules / Total Rules) × 100%
```

## API Integration Guide

### Recommended API Structure

```
/api/auth
  POST /login
  POST /logout
  POST /refresh
  GET  /me

/api/users
  GET    /users
  GET    /users/:id
  POST   /users
  PUT    /users/:id
  DELETE /users/:id

/api/campaigns
  GET    /campaigns
  GET    /campaigns/:id
  POST   /campaigns
  PUT    /campaigns/:id
  DELETE /campaigns/:id

/api/contracts
  GET    /contracts
  GET    /contracts/:id
  POST   /contracts
  PUT    /contracts/:id
  POST   /contracts/:id/accept
  POST   /contracts/:id/lock
  POST   /contracts/:id/execute

/api/deliverables
  GET    /deliverables
  POST   /deliverables
  PUT    /deliverables/:id
  POST   /deliverables/:id/submit
  POST   /deliverables/:id/verify

/api/decisions
  GET    /decisions
  GET    /decisions/:id
  POST   /decisions/evaluate/:contractId
```

### Integration Steps

1. Create API service layer in `src/services/`
2. Replace mock data with API calls
3. Implement error handling
4. Add loading states
5. Implement caching with React Query
6. Add optimistic updates

## Component Library

### Core Components

#### DashboardLayout
- Main layout wrapper
- Sidebar navigation
- Header with user info
- Responsive design

#### StatCard
- Display metrics
- Animated counters
- Trend indicators
- Icon support

#### ContractStatusBadge
- Visual status indicator
- Color-coded by status
- Consistent styling

#### ProgressRing
- Circular progress indicator
- Animated transitions
- Percentage display

#### ActivityFeed
- Real-time activity list
- Icon-based items
- Timestamp display

### UI Components (shadcn/ui)

All components in `src/components/ui/` are from shadcn/ui:
- Button, Input, Select, Checkbox
- Dialog, Sheet, Popover
- Table, Card, Badge
- Toast, Alert, Progress
- And 40+ more components

### Custom Hooks

#### useAuth
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

#### useToast
```typescript
const { toast } = useToast();
toast({ title: "Success", description: "Action completed" });
```

## Styling Guide

### Tailwind Utilities

Custom utilities defined in `index.css`:
- `.glass-card` - Glassmorphism effect
- `.glass-card-elevated` - Elevated glass card
- `.gradient-primary` - Primary gradient
- `.gradient-accent` - Accent gradient
- `.gradient-hero` - Hero section gradient
- `.shadow-glow-accent` - Glowing shadow effect

### Color System

```css
--primary: Blue tones (215, 80%, 28%)
--accent: Teal/Cyan (174, 62%, 40%)
--success: Green (152, 60%, 40%)
--warning: Orange (38, 92%, 50%)
--destructive: Red (0, 72%, 51%)
```

### Animation Classes

- `animate-fade-in` - Fade in effect
- `animate-scale-in` - Scale in effect
- `animate-pulse-soft` - Soft pulse effect
- `animate-shimmer` - Shimmer loading effect

## Performance Optimization

### Current Optimizations

1. **Code Splitting**: React.lazy for route-based splitting
2. **Memoization**: React.memo for expensive components
3. **Debouncing**: Search inputs debounced
4. **Image Optimization**: Lazy loading images
5. **Bundle Size**: Tree-shaking unused code

### Future Optimizations

1. Implement virtual scrolling for large lists
2. Add service worker for offline support
3. Optimize bundle with dynamic imports
4. Implement CDN for static assets
5. Add compression (gzip/brotli)

## Security Considerations

### Current Implementation

- Client-side route protection
- Mock authentication
- No sensitive data storage

### Production Requirements

1. Implement JWT authentication
2. Add CSRF protection
3. Sanitize user inputs
4. Implement rate limiting
5. Add security headers
6. Use HTTPS only
7. Implement proper CORS
8. Add XSS protection
9. Validate all data server-side
10. Implement audit logging

## Deployment Guide

### Build Process

```bash
npm run build
```

Output: `dist/` directory

### Deployment Platforms

#### Vercel
```bash
vercel --prod
```

#### Netlify
```bash
netlify deploy --prod
```

#### AWS S3 + CloudFront
```bash
aws s3 sync dist/ s3://your-bucket
aws cloudfront create-invalidation
```

### Environment Variables

Set these in your deployment platform:
- `VITE_API_URL`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in vite.config.ts
2. **Module not found**: Run `npm install`
3. **Build fails**: Clear node_modules and reinstall
4. **Types error**: Run `npm run build` to check TypeScript errors

### Debug Mode

Enable debug logging:
```typescript
localStorage.setItem('debug', 'crevio:*');
```

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router Docs](https://reactrouter.com)

---

**Last Updated**: 2024
**Version**: 1.0.0
