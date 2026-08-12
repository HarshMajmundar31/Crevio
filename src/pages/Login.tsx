import { Navigate } from 'react-router-dom';
import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/LogoIcon';

export default function Login() {
  const { isSignedIn } = useClerkAuth();

  if (isSignedIn) {
    return <Navigate to="/signup" replace />;
  }

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

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
              Creator & Brand Ecosystem
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-sm">
              Welcome Back to<br />Seamless Contracts
            </h1>
            <p className="text-white/90 text-lg mb-8 max-w-lg leading-relaxed font-medium">
              Sign in to manage active briefs, locked campaign terms, and automated milestone verification.
            </p>
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

          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            forceRedirectUrl="/signup"
          />
        </motion.div>
      </div>
    </div>
  );
}
