import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Step1_Workspace from './brand/Step1_Workspace';
import Step2_LinkedIn from './brand/Step2_LinkedIn';
import Step3_BrandProfile from './brand/Step3_BrandProfile';
import Step5_InviteTeam from './brand/Step5_InviteTeam';
import Step6_Legal from './brand/Step6_Legal';

import { LogoIcon } from '@/components/LogoIcon';

const steps = [
  { id: 1, title: 'Workspace', description: 'Create your brand space' },
  { id: 2, title: 'LinkedIn', description: 'Verify professional identity' },
  { id: 3, title: 'Profile', description: 'Company details' },
  { id: 5, title: 'Team', description: 'Invite your colleagues' },
  { id: 6, title: 'Legal', description: 'Accept agreements' },
];

export default function BrandOnboarding() {
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(() => {
    // If we have an authorization code from LinkedIn redirect, make sure we mount Step 2
    // so the callback exchange logic runs and displays the verified profile immediately!
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      return 2;
    }
    return user?.onboardingStep || 1;
  });
  
  const [direction, setDirection] = useState(0);

  const nextStep = () => {
    setDirection(1);
    setCurrentStep((prev) => {
      const next = steps.find((s) => s.id > prev);
      return next ? next.id : prev;
    });
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep((prev) => {
      const reversed = [...steps].reverse();
      const next = reversed.find((s) => s.id < prev);
      return next ? next.id : prev;
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1_Workspace onNext={nextStep} />;
      case 2: return <Step2_LinkedIn onNext={nextStep} onBack={prevStep} />;
      case 3: return <Step3_BrandProfile onNext={nextStep} onBack={prevStep} />;
      case 5: return <Step5_InviteTeam onNext={nextStep} onBack={prevStep} />;
      case 6: return <Step6_Legal onBack={prevStep} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header / Stepper */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-9 h-9 shrink-0" />
              <div>
                <span className="font-bold text-lg tracking-tight text-foreground">Crevio Brand Onboarding</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider -mt-0.5">Workspace & Identity Setup</p>
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
            </div>
          </div>

          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const stepIndex = index + 1;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive ? 'border-primary bg-primary text-primary-foreground shadow-glow-primary scale-110' : 
                      isCompleted ? 'border-accent bg-accent text-accent-foreground' : 
                      'border-muted bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span>{index + 1}</span>}
                  </div>
                  <div className={`mt-2 text-xs font-semibold uppercase tracking-wider hidden md:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                </div>
              );
            })}
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
              <motion.div 
                className="h-full bg-primary shadow-glow-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-x-hidden">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-card border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
              
              <div className="relative z-10">
                {renderStep()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Help */}
      <footer className="py-8 px-6 text-center text-sm text-muted-foreground">
        Need help? Contact our <a href="#" className="text-primary hover:underline">support team</a> or read the <a href="#" className="text-primary hover:underline">documentation</a>.
      </footer>
    </div>
  );
}
