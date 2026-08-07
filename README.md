# Crevio - Crevio

A comprehensive contract and event management system for managing brand-creator collaborations, campaigns, and compliance decisions.

## 🎯 Project Overview

Crevio (Autonomous Contract Execution & Monitoring System) is a sophisticated web application designed to automate and manage contracts between brands and content creators. It provides a transparent, rule-based platform for campaign management, contract execution, and automated decision-making.

**Academic Project**: Parul University • 2026-2027

## ✨ Features

- **Multi-Role Authentication**: Support for Brand, Creator, and Admin roles
- **Campaign Management**: Create and manage marketing campaigns across multiple platforms
- **Contract Lifecycle**: Draft → Pending → Accepted → Locked → Executed → Completed
- **Deliverable Tracking**: Monitor submission and verification of campaign deliverables
- **Automated Decision Engine**: AI-powered contract compliance verification with confidence scoring
- **Real-time Dashboard**: Track contracts, payments, and campaign performance
- **Activity Feed**: Live updates on contract and campaign activities
- **Immutable Contracts**: Cryptographically locked contracts after acceptance
- **Rule-Based Execution**: Automated evaluation of deliverables, deadlines, and compliance

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3.1** - Modern UI library with hooks
- **TypeScript 5.8.3** - Type-safe development
- **Vite 5.4.19** - Fast build tool with HMR

### Routing & State Management
- **React Router DOM 6.30.1** - Client-side routing
- **TanStack React Query 5.83.0** - Server state management
- **Context API** - Authentication state management

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (50+ components)
- **shadcn/ui** - Pre-built component library
- **Framer Motion 12.38.0** - Animation library
- **Lucide React 0.462.0** - Icon library

### Form Management
- **React Hook Form 7.61.1** - Performant form handling
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers 3.10.0** - Form validation integration

### Data Visualization
- **Recharts 2.15.4** - Chart library for analytics

### Development Tools
- **ESLint 9.32.0** - Code linting
- **Vitest 3.2.4** - Unit testing framework
- **Playwright 1.57.0** - E2E testing
- **TypeScript ESLint** - TypeScript linting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Crevio

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev

# Build for production
npm run build
# or
bun run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
Crevio/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components (50+ components)
│   │   ├── DashboardLayout.tsx
│   │   ├── StatCard.tsx
│   │   ├── ContractStatusBadge.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── AnimatedCounter.tsx
│   │   └── NavLink.tsx
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.tsx
│   ├── pages/            # Route pages
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Campaigns.tsx
│   │   ├── Contracts.tsx
│   │   ├── ContractDetail.tsx
│   │   ├── Decisions.tsx
│   │   ├── UsersPage.tsx
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── lib/              # Utilities & mock data
│   │   ├── mock-data.ts
│   │   └── utils.ts
│   ├── hooks/            # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── test/             # Test files
│   │   ├── example.test.ts
│   │   └── setup.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Application entry point
│   ├── index.css         # Global styles
│   └── vite-env.d.ts     # Vite type definitions
├── .gitignore
├── package.json
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
├── postcss.config.js     # PostCSS configuration
├── vitest.config.ts      # Vitest configuration
├── playwright.config.ts  # Playwright configuration
└── README.md
```

## 🔐 Available Routes

- `/` - Landing page with role-based login
- `/dashboard` - Main dashboard (protected)
- `/campaigns` - Campaign management (protected)
- `/contracts` - Contract listing (protected)
- `/contracts/:id` - Contract details (protected)
- `/decisions` - Decision engine records (protected)
- `/users` - User management (protected, admin only)

## 👥 Mock Users

Development includes pre-configured mock users for testing:

### Brand Account
- **Email**: brand@nike.com
- **Name**: Nike Digital
- **Role**: Brand
- **Access**: Create campaigns, manage contracts

### Creator Account
- **Email**: priya@creator.com
- **Name**: Priya Sharma
- **Role**: Creator
- **Access**: Browse campaigns, track deliverables

### Admin Account
- **Email**: admin@crevio.com
- **Name**: System Admin
- **Role**: Admin
- **Access**: Full system access, decision engine monitoring

## 🎨 Key Features Explained

### Contract Lifecycle

1. **Draft** - Initial contract creation
2. **Pending** - Awaiting creator acceptance
3. **Accepted** - Creator has accepted terms
4. **Locked** - Contract is immutable and cryptographically locked
5. **Executed** - Contract rules have been evaluated
6. **Completed** - All deliverables verified and payment processed
7. **Disputed** - Issues requiring manual resolution

### Decision Engine

The automated decision engine evaluates contracts based on:
- **Deliverable Rules**: Platform matching, post count verification
- **Deadline Rules**: Submission timing validation
- **Compliance Rules**: FTC disclosure, content policy checks
- **Confidence Scoring**: 0-100% confidence in decision accuracy

### Multi-Platform Support

- Instagram (Reels, Stories, Posts)
- YouTube (Videos, Shorts)
- TikTok (Videos)
- Podcast platforms

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests with Playwright
npx playwright test

# Open Playwright UI
npx playwright test --ui
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue tones for main actions
- **Accent**: Teal/cyan for highlights
- **Success**: Green for completed states
- **Warning**: Orange for pending states
- **Destructive**: Red for errors/disputes

### Animations
- Fade-in effects for page transitions
- Scale transitions for interactive elements
- Slide animations for navigation
- Pulse effects for live indicators
- Shimmer loading states

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Crevio
```

## 📦 Build & Deployment

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Build for development (with source maps)
npm run build:dev
```

The build output will be in the `dist/` directory.

## 🤝 Contributing

This is an academic project. For contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Private - All rights reserved

## 🎓 Academic Information

**Institution**: Parul University  
**Academic Year**: 2026-2027  
**Project Type**: Crevio

## 🚧 Future Enhancements

- [ ] Backend API integration
- [ ] Real blockchain/smart contract integration
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] AI-powered creator matching
- [ ] Multi-language support
- [ ] Mobile application (React Native)
- [ ] Email notification system
- [ ] Document signing integration

## 📞 Support

For questions or issues, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by Parul University Students**
