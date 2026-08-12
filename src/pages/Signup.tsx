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
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#E8364F] via-[#D61B8C] to-[#9D4EDD] text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-orange-400/15 blur-[120px] animate-pulse-soft" />
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

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
              Join Verified Creators & Brands
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-sm">
              Join the Future of<br />Contract Automation
            </h1>
            <p className="text-white/90 text-lg mb-8 max-w-lg leading-relaxed font-medium">
              Create your account to publish briefs, accept proposals, and automate contract milestone releases.
            </p>

            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Guaranteed milestone approvals' },
                { icon: Lock, text: 'Immutable contract term locking' },
                { icon: Briefcase, text: 'Multi-platform creator marketplace' },
                { icon: ArrowRight, text: 'Automated AI compliance check' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 max-w-md"
                >
                  <div className="w-7 h-7 rounded-lg bg-yellow-400 text-slate-900 flex items-center justify-center font-bold shadow-sm shrink-0">
                    <feature.icon className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="text-white font-medium text-sm">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-orange-50/40 via-pink-50/30 to-purple-50/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <LogoIcon className="w-10 h-10 shrink-0" />
            <span className="text-2xl font-extrabold text-foreground">Crevio</span>
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
