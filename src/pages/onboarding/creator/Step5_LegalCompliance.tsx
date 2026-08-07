import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, ArrowLeft, CheckCircle2, Lock, Sparkles,
  RefreshCw, FileText, AlertCircle, Check
} from 'lucide-react';
import { apiSaveCreatorOnboarding } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Step5Props {
  formData: any;
  onBack: () => void;
}

export default function Step5_LegalCompliance({ formData, onBack }: Step5Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [termsAgreed, setTermsAgreed] = useState(true);
  const [contractLockingAgreed, setContractLockingAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed || !contractLockingAgreed) {
      toast({
        title: 'Agreement Required',
        description: 'Please accept the platform terms and contract locking agreement.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPayload = {
        ...formData,
        legalAccepted: true,
        completedAt: new Date().toISOString(),
      };

      const res = await apiSaveCreatorOnboarding(finalPayload);
      if (res.success) {
        toast({
          title: 'Creator Onboarding Complete! 🎉',
          description: 'Your verified creator profile is active. Welcome to Crevio Marketplace.',
        });

        await refreshUser();
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: 'Failed to finalize creator onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-mono tracking-wider">
            Step 5 of 5
          </Badge>
          <span className="text-xs text-muted-foreground">• Legal & Compliance Finalization</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Finalize Creator Verification
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Review your verified details and accept Crevio's automated contract execution rules to launch your Creator Hub.
        </p>
      </div>

      {/* Onboarding Summary Box */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3 text-xs">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          Creator Profile Summary
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-border/50">
          <div>
            <span className="text-muted-foreground text-[10px] uppercase block">Handle</span>
            <span className="font-bold text-foreground">{formData.handle || '@creator'}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] uppercase block">Niche</span>
            <span className="font-semibold text-accent">{formData.niche || 'Digital Creator'}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] uppercase block">Meta Verified</span>
            <span className="font-semibold text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {formData.verifiedMeta?.followersCount ? `${formData.verifiedMeta.followersCount.toLocaleString()} Followers` : 'OAuth Verified'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex flex-wrap gap-4 text-muted-foreground text-[11px]">
          <span>Reel Rate: <strong className="text-foreground">${formData.reelRate || 1500}</strong></span>
          <span>YouTube Rate: <strong className="text-foreground">${formData.youtubeRate || 3500}</strong></span>
          <span>Exclusivity: <strong className="text-foreground">{formData.exclusivityDays || 30} Days</strong></span>
        </div>
      </div>

      <form onSubmit={handleFinalSubmit} className="space-y-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <div className="text-xs">
              <p className="font-semibold text-foreground">Crevio Creator Terms & Conditions</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                I agree to represent my creative portfolio truthfully, fulfill agreed contract deliverables within specified SLA deadlines, and maintain professional communications with brand partners.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-border/50">
            <input
              type="checkbox"
              checked={contractLockingAgreed}
              onChange={(e) => setContractLockingAgreed(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <div className="text-xs">
              <p className="font-semibold text-foreground">Immutable Agreement & Escrow Milestone Protection</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                I understand that once a contract is signed and locked, deliverable terms and escrow payouts cannot be unilaterally altered, guaranteeing fair execution for both sides.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="text-xs gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !termsAgreed || !contractLockingAgreed}
            className="gradient-primary text-primary-foreground text-xs gap-2 px-8 h-12 font-bold shadow-lg"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Finalizing Profile...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-accent" />
                Complete Onboarding & Access Dashboard
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
