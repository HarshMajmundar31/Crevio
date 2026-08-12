import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#E8364F] via-[#D61B8C] to-[#9D4EDD] text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-orange-400/20 blur-[120px] animate-pulse-soft" />
          <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] rounded-full bg-purple-400/25 blur-[140px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 grid-pattern opacity-10" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-14 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <LogoIcon className="w-12 h-12 shrink-0" />
              <div>
                <span className="text-3xl font-extrabold tracking-wide text-white drop-shadow-sm">Crevio</span>
                <p className="text-[10px] text-white/80 uppercase tracking-[0.2em] font-semibold">Autonomous Contract Engine</p>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-sm">Select Your Account Type</h1>
            <p className="text-white/90 text-lg mb-8 max-w-lg leading-relaxed font-medium">
              Choose your role to unlock targeted tools, contract briefs, and campaign analytics.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-orange-50/40 via-pink-50/30 to-purple-50/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          <div>
            <h2 className="text-3xl font-extrabold mb-2">Identify Your Account</h2>
            <p className="text-muted-foreground text-sm">
              Account: <span className="font-semibold text-foreground">{clerkUser?.primaryEmailAddress?.emailAddress}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please select how you intend to use Crevio.
            </p>
          </div>

          <Button
            className="w-full h-auto py-5 justify-start gap-4 gradient-brand text-white border-0 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all"
            onClick={() => handleSelectRole('brand')}
            disabled={isSubmitting || isLoading}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-base">I am a Brand</p>
              <p className="text-xs text-white/90">Publish briefs, set milestones & manage contracts</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-white" />
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-5 justify-start gap-4 bg-white border-pink-200 hover:border-pink-400 hover:bg-pink-50/50 shadow-md shadow-purple-500/5 transition-all"
            onClick={() => handleSelectRole('creator')}
            disabled={isSubmitting || isLoading}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-bold text-base text-foreground">I am a Creator</p>
              <p className="text-xs text-muted-foreground">Browse active briefs & submit campaign deliverables</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By selecting a role, you agree to our <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link> and <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>

          <div className="pt-4 mt-6 border-t border-pink-100">
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