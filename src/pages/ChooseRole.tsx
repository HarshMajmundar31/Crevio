import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Briefcase, Sparkles } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ChooseRole() {
  const navigate = useNavigate();
  const { isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { onboard, isAuthenticated, isLoading, onboardingRequired } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSignedIn) {
    return <Navigate to="/signup" replace />;
  }

  if (isAuthenticated && !onboardingRequired) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSelectRole = async (role: 'brand' | 'creator') => {
    setIsSubmitting(true);
    try {
      const result = await onboard(role);
      if (result.ok) {
        toast({
          title: 'Welcome!',
          description: `Your ${role} account has been set up successfully.`,
        });
        if (role === 'brand') {
          navigate('/onboarding/brand');
        } else {
          navigate('/onboarding/creator');
        }
      } else {
        toast({
          title: 'Setup Failed',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] animate-pulse-soft" />
          <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 grid-pattern opacity-20" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <LogoIcon className="w-10 h-10 shrink-0" />
              <div>
                <span className="text-2xl font-bold tracking-wide">Crevio</span>
                <p className="text-[10px] text-primary-foreground/40 uppercase tracking-[0.2em]">Autonomous Contract Engine</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">Complete Your Profile</h1>
            <p className="text-primary-foreground/60 text-lg mb-8">
              Select your role to unlock the full potential of Crevio. This choice is permanent.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          <div>
            <h2 className="text-3xl font-bold mb-2">Identify Your Account</h2>
            <p className="text-muted-foreground">
              Account: {clerkUser?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please choose how you will use the platform.
            </p>
          </div>

          <Button
            className="w-full h-auto py-4 justify-start gap-3 gradient-primary text-primary-foreground"
            onClick={() => handleSelectRole('brand')}
            disabled={isSubmitting || isLoading}
          >
            <Briefcase className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">I am a Brand</p>
              <p className="text-xs opacity-90">Create campaigns and manage contracts</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-4 justify-start gap-3"
            onClick={() => handleSelectRole('creator')}
            disabled={isSubmitting || isLoading}
          >
            <Sparkles className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">I am a Creator</p>
              <p className="text-xs text-muted-foreground">Browse campaigns and submit deliverables</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By selecting a role, you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="pt-4 mt-6 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => signOut()}
              disabled={isSubmitting || isLoading}
            >
              Sign out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}