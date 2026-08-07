import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BrandOnboarding from "./pages/onboarding/BrandOnboarding";
import CreatorOnboarding from "./pages/onboarding/CreatorOnboarding";
import CreatorProfile from "./pages/CreatorProfile";
import type { UserRole } from "@/lib/mock-data";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ChooseRole from "./pages/ChooseRole";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignExecutionTimeline from "./pages/CampaignExecutionTimeline";
import ApplyToCampaign from "./pages/ApplyToCampaign";
import Contracts from "./pages/Contracts";
import CreateContract from "./pages/CreateContract";
import ContractDetail from "./pages/ContractDetail";
import ContractParsingStudio from "./pages/ContractParsingStudio";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Decisions from "./pages/Decisions";
import UsersPage from "./pages/UsersPage";
import WalletHub from "./pages/WalletHub";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import CampaignDetail from "./pages/CampaignDetail";
import AuditLogs from "./pages/AuditLogs";

const queryClient = new QueryClient();

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Loading Crevio...</h1>
        <p className="text-sm text-muted-foreground mt-2">Initializing authentication session</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, getRedirectPath } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;
  
  const redirectPath = getRedirectPath();
  console.log(`[ProtectedRoute] Path: ${location.pathname}, Redirect: ${redirectPath}`);
  
  // getRedirectPath returns '/dashboard' as the default safe destination for fully authenticated users.
  // We should not force a redirect to '/dashboard' if they are already on a valid protected route.
  if (redirectPath && redirectPath !== '/dashboard' && redirectPath !== location.pathname) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { isLoading, getRedirectPath, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;
  
  const redirectPath = getRedirectPath();
  console.log(`[RoleRoute] Path: ${location.pathname}, Redirect: ${redirectPath}`);
  
  if (redirectPath && redirectPath !== '/dashboard' && redirectPath !== location.pathname) {
    return <Navigate to={redirectPath} replace />;
  }
  
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, getRedirectPath, isSessionActive } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isSessionActive) {
    return <>{children}</>;
  }

  const redirectPath = getRedirectPath();
  console.log(`[PublicRoute] Path: ${location.pathname}, Redirect: ${redirectPath}`);

  // If we are at a public path (login/signup/choose-role) but we should be elsewhere, redirect
  // We exclude '/' from this so the Landing page is always accessible even if logged out.
  const isPublicPath = 
    location.pathname.startsWith('/login') || 
    location.pathname.startsWith('/signup') ||
    location.pathname.startsWith('/choose-role');
  
  if (isPublicPath && redirectPath && redirectPath !== location.pathname) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const auth = useAuth();
  console.log('[AppRoutes] Auth State:', { 
    isLoading: auth.isLoading, 
    onboardingRequired: auth.onboardingRequired, 
    role: auth.user?.role 
  });

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/*" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/choose-role" element={<PublicRoute><ChooseRole /></PublicRoute>} />
        <Route path="/signup/*" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/onboarding/brand" element={<ProtectedRoute><BrandOnboarding /></ProtectedRoute>} />
        <Route path="/onboarding/creator" element={<ProtectedRoute><CreatorOnboarding /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><CreatorProfile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/campaigns/create" element={<RoleRoute roles={["brand", "admin"]}><CreateCampaign /></RoleRoute>} />
        <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetail /></ProtectedRoute>} />
        <Route path="/campaigns/:id/timeline" element={<ProtectedRoute><CampaignExecutionTimeline /></ProtectedRoute>} />
        <Route path="/campaigns/:id/apply" element={<RoleRoute roles={["creator"]}><ApplyToCampaign /></RoleRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
        <Route path="/contracts/create" element={<RoleRoute roles={["brand", "admin"]}><CreateContract /></RoleRoute>} />
        <Route path="/contracts/studio" element={<RoleRoute roles={["brand", "admin"]}><ContractParsingStudio /></RoleRoute>} />
        <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletHub /></ProtectedRoute>} />
        <Route path="/admin" element={<RoleRoute roles={["admin"]}><AdminDashboard /></RoleRoute>} />
        <Route path="/decisions" element={<ProtectedRoute><Decisions /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/users" element={<RoleRoute roles={["admin"]}><UsersPage /></RoleRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
