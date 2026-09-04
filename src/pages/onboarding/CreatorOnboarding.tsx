import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, UserCheck, Sparkles, LogOut } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Step1_CreatorProfile from './creator/Step1_CreatorProfile';
import Step2_SocialVerification from './creator/Step2_SocialVerification';
import Step3_RateCard from './creator/Step3_RateCard';
import Step4_Portfolio from './creator/Step4_Portfolio';
import Step5_LegalCompliance from './creator/Step5_LegalCompliance';

const steps = [
  { id: 1, title: 'Profile', description: 'Creator Identity & Niche' },
  { id: 2, title: 'Verification', description: 'Meta Graph API Verification' },
  { id: 3, title: 'Rate Card', description: 'Baseline Pricing & Terms' },
  { id: 4, title: 'Portfolio', description: 'Past Work Samples' },
  { id: 5, title: 'Finalize', description: 'Terms & Launch' },
];

export default function CreatorOnboarding() {
  const { logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    handle: '',
    niche: '',
    bio: '',
    targetAudienceLocation: 'Global & North America',
    targetAgeBand: '18-34',
    instagramHandle: '',
    youtubeChannel: '',
    tiktokHandle: '',
    verifiedMeta: null,
    reelRate: 1500,
    youtubeRate: 3500,
    tiktokRate: 1200,
    exclusivityDays: 30,
    usageRights: '1 Year Digital & Social Media Usage Rights Included',
    portfolio: [],
  });

  const handleStepNext = (stepData: any) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleStepBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header & Progress Stepper */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-9 h-9 shrink-0" />
              <div>
                <span className="font-bold text-lg tracking-tight text-foreground">Crevio Creator Setup</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider -mt-0.5">Verified Creator Verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-muted-foreground bg-accent/10 border border-accent/20 px-3 py-1 rounded-full hidden sm:inline-flex">
                Step {currentStep} of {steps.length}: <span className="text-foreground ml-1">{steps[currentStep - 1].title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 transition-colors text-xs font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </Button>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="relative flex justify-between items-center">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'border-accent bg-accent text-accent-foreground shadow-lg scale-110'
                        : isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-border/80 bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{stepNumber}</span>}
                  </div>
                  <span className={`mt-2 text-[10px] font-semibold uppercase tracking-wider hidden sm:block ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Step Form */}
      <main className="max-w-2xl w-full mx-auto px-6 py-8 flex-1 flex flex-col justify-center">
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <Step1_CreatorProfile key="step1" initialData={formData} onNext={handleStepNext} />
            )}
            {currentStep === 2 && (
              <Step2_SocialVerification key="step2" initialData={formData} onNext={handleStepNext} onBack={handleStepBack} />
            )}
            {currentStep === 3 && (
              <Step3_RateCard key="step3" initialData={formData} onNext={handleStepNext} onBack={handleStepBack} />
            )}
            {currentStep === 4 && (
              <Step4_Portfolio key="step4" initialData={formData} onNext={handleStepNext} onBack={handleStepBack} />
            )}
            {currentStep === 5 && (
              <Step5_LegalCompliance key="step5" formData={formData} onBack={handleStepBack} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span>© {new Date().getFullYear()} Crevio. Creator Onboarding System.</span>
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            Meta Graph API Verified Security
          </span>
        </div>
      </footer>
    </div>
  );
}
