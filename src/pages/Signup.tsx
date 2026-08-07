import { SignUp, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Briefcase, Lock } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

export default function Signup() {
  const { isSignedIn } = useClerkAuth();
  const { isAuthenticated, onboardingRequired } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isSignedIn && onboardingRequired) {
    return <Navigate to="/choose-role" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
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

            <h1 className="text-4xl font-bold mb-4">
              Join the Future of<br />Contract Management
            </h1>
            <p className="text-primary-foreground/60 text-lg mb-8">
              Create your account and start managing contracts with transparency and automation.
            </p>

            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Secure & encrypted platform' },
                { icon: Lock, text: 'Immutable contract locking' },
                { icon: Briefcase, text: 'Multi-platform campaign support' },
                { icon: ArrowRight, text: 'Automated compliance checks' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                    <feature.icon className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-primary-foreground/80">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <LogoIcon className="w-8 h-8 shrink-0" />
            <span className="text-xl font-bold">Crevio</span>
          </div>

          <div className="space-y-4">
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/login"
              forceRedirectUrl="/choose-role"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
