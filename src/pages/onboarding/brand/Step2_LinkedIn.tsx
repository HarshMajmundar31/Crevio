import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Linkedin, ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { verifyLinkedIn, verifyLinkedInCustomOAuth } from '@/lib/api';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

export default function Step2_LinkedIn({ onNext, onBack }: Step2Props) {
  const { user, refreshUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLinked, setIsLinked] = useState(() => !!user?.linkedinLinked);
  const [profile, setProfile] = useState<{ name: string; picture: string; email?: string } | null>(() => {
    if (user?.linkedinData) {
      return {
        name: user.linkedinData.name || '',
        picture: user.linkedinData.picture || '',
        email: user.linkedinData.email || '',
      };
    }
    return null;
  });
  const [showSimulationOption, setShowSimulationOption] = useState(false);
  const { toast } = useToast();

  // Custom LinkedIn OAuth 2.0: Check for callback parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'crevio_custom_linkedin_oauth_state') {
      // Clear code from URL to keep the URL clean
      window.history.replaceState({}, document.title, window.location.pathname);
      handleCustomOAuthExchange(code);
    }
  }, []);

  // Exchange OAuth code for live LinkedIn profile details
  const handleCustomOAuthExchange = async (code: string) => {
    setIsVerifying(true);
    try {
      const redirectUri = window.location.origin + "/onboarding/brand";
      
      console.log(`[LinkedIn Custom OAuth] Exchanging authorization code...`);
      const result: any = await verifyLinkedInCustomOAuth(code, redirectUri);
      
      setIsLinked(true);
      if (result.profile) {
        setProfile(result.profile);
      }
      
      // Refresh user context so the parent App and AuthContext get the updated step
      await refreshUser();
      
      toast({
        title: "LinkedIn Connected!",
        description: `Professional profile for ${result.profile?.name || 'you'} successfully imported via Custom OAuth.`,
      });
    } catch (error) {
      console.error('LinkedIn Custom OAuth Exchange Error:', error);
      setShowSimulationOption(true); // Provide simulator button as backup if client app is not live
      toast({
        title: "OAuth Connection Failed",
        description: error instanceof Error ? error.message : "Could not complete LinkedIn authentication.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Launch direct, custom LinkedIn OAuth 2.0 authorization
  const handleLinkLinkedIn = async () => {
    setIsVerifying(true);
    try {
      const clientId = "77qea0nmnbyyml";
      const redirectUri = window.location.origin + "/onboarding/brand";
      const scope = "openid profile email";
      const state = "crevio_custom_linkedin_oauth_state";

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}`;

      toast({
        title: "Connecting to LinkedIn",
        description: "Redirecting you to the secure LinkedIn consent page...",
      });

      // Redirect the user's browser directly to LinkedIn's OAuth server
      window.location.href = authUrl;
    } catch (error) {
      console.error('LinkedIn Redirect Error:', error);
      toast({
        title: "Redirect Failed",
        description: "Could not initialize direct LinkedIn authorization.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  const handleSimulateConnection = async () => {
    setIsVerifying(true);
    try {
      const result: any = await verifyLinkedIn(true); // Call backend with simulate = true
      setIsLinked(true);
      if (result.profile) {
        setProfile(result.profile);
      }
      
      // Refresh user context so that the DB step updates
      await refreshUser();
      
      toast({
        title: "LinkedIn Simulated",
        description: `Professional profile for ${result.profile?.name || 'you'} successfully simulated.`,
      });
    } catch (error) {
      console.error('LinkedIn Simulation Error:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "Could not simulate LinkedIn account.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0077b5]/10 mb-4">
          <Linkedin className="w-8 h-8 text-[#0077b5]" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Verify Professional Identity</h2>
        <p className="text-muted-foreground">Link your LinkedIn profile to build trust with creators and unlock insights.</p>
      </div>

      <div className="bg-muted/30 border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">Professional Verification</h4>
            <p className="text-sm text-muted-foreground">Import your job title, company association, and verified status.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">Company Page Connection</h4>
            <p className="text-sm text-muted-foreground">Link your official LinkedIn Company Page to your Crevio workspace.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!isLinked ? (
          <div className="space-y-3 w-full">
            <Button 
              onClick={handleLinkLinkedIn}
              className="w-full h-14 text-lg font-bold bg-[#0077b5] hover:bg-[#0077b5]/90 text-white shadow-lg hover:scale-[1.02] transition-all"
              disabled={isVerifying}
            >
              {isVerifying && !showSimulationOption ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying Connection...
                </>
              ) : (
                <>
                  <Linkedin className="w-5 h-5 mr-2" />
                  Connect Direct LinkedIn OAuth
                </>
              )}
            </Button>
            
            {showSimulationOption && (
              <Button
                variant="outline"
                onClick={handleSimulateConnection}
                className="w-full h-12 text-sm border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all font-semibold"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Simulate LinkedIn Connection (Dev Fallback)
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border bg-[#0077b5]/5 border-[#0077b5]/20 flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile?.picture ? (
                  <img src={profile.picture} alt={profile.name} className="w-14 h-14 rounded-full border-2 border-[#0077b5]/30 object-cover shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#0077b5] flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{profile?.name || 'Account Linked'}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Professional LinkedIn Profile Imported</p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>

            <div className="border-t border-dashed pt-4 grid grid-cols-2 gap-4 text-sm bg-background/40 p-4 rounded-xl border">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Verification Method</p>
                <p className="font-medium mt-0.5 text-foreground">LinkedIn OAuth 2.0 (OIDC)</p>
              </div>
              {profile?.email && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">LinkedIn Email</p>
                  <p className="font-medium mt-0.5 text-foreground truncate">{profile.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Connection Status</p>
                <p className="font-medium text-emerald-500 mt-0.5 flex items-center gap-1">
                  Active
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Data Scope Authorized</p>
                <p className="font-medium mt-0.5 text-foreground">openid, profile, email</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1 h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1 h-12 gradient-primary"
            disabled={!isLinked}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-center text-muted-foreground italic">
        *We only pull professional data. We never post on your behalf without permission.
      </p>
    </div>
  );
}
