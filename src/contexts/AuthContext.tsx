import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User, UserRole } from '@/lib/mock-data';
import { apiGetCurrentUser, apiOnboardUser, AUTH_TOKEN_KEY } from '@/lib/api';

type OnboardingRole = Exclude<UserRole, 'admin'>;

interface AuthContextType {
  user: User | null;
  onboardingRequired: boolean;
  isSessionActive: boolean;
  isLoading: boolean;
  onboard: (role: OnboardingRole) => Promise<{ ok: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  getRedirectPath: () => string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toContextUser(user: { id: string; name: string; email: string; role: UserRole; onboardingStep?: number; linkedinLinked?: boolean; linkedinData?: any; onboardingDraft?: any }): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    onboardingStep: user.onboardingStep,
    linkedinLinked: user.linkedinLinked,
    linkedinData: user.linkedinData,
    onboardingDraft: user.onboardingDraft,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      setOnboardingRequired(false);
      setIsLoading(false);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }

    try {
      setIsLoading(true);
      const result = await apiGetCurrentUser();
      console.log('[AuthContext] refreshUser Result:', {
        hasUser: !!result.user,
        needsOnboarding: result.needsOnboarding,
        role: result.user?.role,
        step: result.user?.onboardingStep
      });

      if (result.user) {
        setUser(toContextUser(result.user));
        setOnboardingRequired(Boolean(result.needsOnboarding));
      } else {
        setUser(null);
        setOnboardingRequired(Boolean(result.needsOnboarding));
      }
    } catch {
      setUser(null);
      setOnboardingRequired(true);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    void refreshUser();
  }, [isLoaded, refreshUser]);

  const onboard = async (role: OnboardingRole): Promise<{ ok: boolean; error?: string }> => {
    try {
      const result = await apiOnboardUser(role);
      setUser(toContextUser(result.user));
      setOnboardingRequired(Boolean(result.needsOnboarding));
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete onboarding.';
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setOnboardingRequired(false);
    await signOut({ redirectUrl: '/login' });
  };

  const getRedirectPath = (): string | null => {
    console.log('[AuthContext] Calculating redirect path...', { 
      isLoading, 
      isSignedIn, 
      onboardingRequired, 
      userRole: user?.role,
      userOnboardingStep: user?.onboardingStep
    });

    if (isLoading) return null;
    if (!isSignedIn) return '/login';
    
    // User is logged in but not in our DB yet
    if (onboardingRequired && !user) {
      console.log('[AuthContext] Redirecting to /choose-role (missing user in DB)');
      return '/choose-role';
    }
    
    // User has a role but hasn't finished onboarding
    if (onboardingRequired && user) {
      if (user.role === 'brand') {
        console.log('[AuthContext] Redirecting to /onboarding/brand');
        return '/onboarding/brand';
      }
      if (user.role === 'creator') {
        console.log('[AuthContext] Redirecting to /onboarding/creator');
        return '/onboarding/creator';
      }
    }
    
    console.log('[AuthContext] Final Decision:', {
      onboardingRequired,
      hasUser: !!user,
      role: user?.role,
      step: user?.onboardingStep,
      path: onboardingRequired && user && user.role === 'brand' ? '/onboarding/brand' : '/dashboard'
    });

    console.log('[AuthContext] Redirecting to final destination');
    return '/dashboard';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      onboardingRequired,
      isSessionActive: Boolean(isSignedIn),
      isLoading,
      onboard,
      refreshUser,
      logout,
      getRedirectPath,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
