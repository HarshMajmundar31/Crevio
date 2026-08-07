import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, ArrowLeft, PartyPopper, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { completeOnboarding } from '@/lib/api';

interface Step6Props {
  onBack: () => void;
}

export default function Step6_Legal({ onBack }: Step6Props) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedEscrow, setAgreedEscrow] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async () => {
    if (!agreedTerms || !agreedEscrow) return;

    setIsFinishing(true);
    try {
      await completeOnboarding();
      await refreshUser();
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-bounce">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Legal Agreements</h2>
        <p className="text-muted-foreground">Please review and accept the terms to finalize your onboarding.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Brand Terms of Service</Label>
            <ScrollArea className="h-32 w-full rounded-md border p-4 bg-muted/50 text-xs text-muted-foreground leading-relaxed">
              <p className="mb-4">
                This Brand Terms of Service (the "Agreement") is a legal agreement between you ("Brand") and Crevio 
                governing your use of the platform and automated contract services.
              </p>
              <p className="mb-4">
                1. OWNERSHIP: All campaigns created on Crevio remain the intellectual property of the Brand...
              </p>
              <p className="mb-4">
                2. COMPLIANCE: Brand agrees to follow all platform rules regarding contract execution...
              </p>
              <p>
                3. PRIVACY: We handle your data in accordance with our Global Privacy Policy...
              </p>
            </ScrollArea>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setAgreedTerms(!agreedTerms)}>
            <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(checked) => setAgreedTerms(checked as boolean)} />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                I accept the Brand Terms of Service
              </label>
              <p className="text-xs text-muted-foreground">
                I acknowledge that I have read and understand the terms above.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Escrow & Payment Agreement</Label>
            <ScrollArea className="h-32 w-full rounded-md border p-4 bg-muted/50 text-xs text-muted-foreground leading-relaxed">
              <p className="mb-4">
                By using Crevio payments, you agree to the Escrow Protection terms. Funds are held in a secure 
                escrow account until contract rules are automatically verified by the Crevio engine.
              </p>
              <p className="mb-4">
                1. FUNDING: Brand must fund the escrow before a contract can be accepted by a creator...
              </p>
              <p>
                2. DISPUTES: Automated decisions are final unless a manual audit is requested...
              </p>
            </ScrollArea>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setAgreedEscrow(!agreedEscrow)}>
            <Checkbox id="escrow" checked={agreedEscrow} onCheckedChange={(checked) => setAgreedEscrow(checked as boolean)} />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="escrow" className="text-sm font-medium leading-none cursor-pointer">
                I accept the Escrow & Payment Agreement
              </label>
              <p className="text-xs text-muted-foreground">
                This is required for handling contract payments through the system.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button variant="outline" onClick={onBack} className="flex-1 h-14" disabled={isFinishing}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleFinish} 
            className="flex-2 flex-[2] h-14 text-lg font-bold gradient-accent shadow-glow-accent hover:scale-[1.02] transition-all"
            disabled={!agreedTerms || !agreedEscrow || isFinishing}
          >
            {isFinishing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Finalizing Setup...
              </>
            ) : (
              <>
                Complete Onboarding
                <PartyPopper className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
