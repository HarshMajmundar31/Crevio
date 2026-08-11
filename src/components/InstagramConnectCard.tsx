import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Instagram, CheckCircle2, Lock, AlertCircle, RefreshCw, LogOut, Sparkles, ExternalLink
} from 'lucide-react';
import {
  apiGetInstagramAccount,
  apiGetInstagramConnectUrl,
  apiDisconnectInstagram,
  InstagramAccountResponse
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface InstagramConnectCardProps {
  variant?: 'full' | 'compact' | 'banner';
  onAccountChange?: (account: InstagramAccountResponse) => void;
  showStubToggle?: boolean;
}

const STUB_INSTAGRAM_ACCOUNT: InstagramAccountResponse = {
  connected: true,
  platformUserId: 'ig_user_1029384756',
  username: 'sarah_creates',
  displayName: 'Sarah Jenkins',
  profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  accountType: 'CREATOR',
  followersCount: 142500,
  mediaCount: 348,
  connectedAt: new Date().toISOString(),
  needsReconnect: false,
};

export default function InstagramConnectCard({
  variant = 'full',
  onAccountChange,
  showStubToggle = true,
}: InstagramConnectCardProps) {
  const { toast } = useToast();

  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [useStubPreview, setUseStubPreview] = useState<boolean>(false);

  const [accountState, setAccountState] = useState<InstagramAccountResponse>({ connected: false });

  // 1. Fetch connected account state & check OAuth URL return parameters
  useEffect(() => {
    const fetchAccountStatus = async () => {
      setIsLoadingAccount(true);

      // Check URL search parameters from Instagram OAuth callback redirect
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const instagramStatus = urlParams.get('instagram');
        const reason = urlParams.get('reason');

        if (instagramStatus) {
          if (instagramStatus === 'connected') {
            toast({
              title: 'Instagram Connected!',
              description: 'Your Instagram Creator/Business account was verified successfully.',
            });
          } else if (instagramStatus === 'denied') {
            toast({
              title: 'Connection Cancelled',
              description: 'Instagram access request was denied. You can connect anytime later.',
              variant: 'destructive',
            });
          } else if (instagramStatus === 'error') {
            toast({
              title: 'Connection Error',
              description: reason ? `Failed to connect: ${reason.replace(/_/g, ' ')}` : 'Could not complete Instagram connection.',
              variant: 'destructive',
            });
          }

          // Clean query parameters from URL without page reload
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      // Fetch connected account status from API
      try {
        const res = await apiGetInstagramAccount();
        if (res && res.connected) {
          setAccountState(res);
          onAccountChange?.(res);
        } else {
          setAccountState({ connected: false });
          onAccountChange?.({ connected: false });
        }
      } catch (err) {
        setAccountState({ connected: false });
        onAccountChange?.({ connected: false });
      } finally {
        setIsLoadingAccount(false);
      }
    };

    fetchAccountStatus();
  }, []);

  // 2. Handle "Connect Instagram" OAuth redirect initiation
  const handleConnectInstagram = async () => {
    setIsConnecting(true);
    try {
      const { url } = await apiGetInstagramConnectUrl();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No connect URL returned from server');
      }
    } catch (error: any) {
      toast({
        title: 'Connection Request Failed',
        description: error?.message || 'Could not initiate Instagram Login. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  // 3. Handle "Disconnect Instagram" action
  const handleDisconnectInstagram = async () => {
    setIsDisconnecting(true);
    try {
      await apiDisconnectInstagram();
      const updatedState = { connected: false };
      setAccountState(updatedState);
      setUseStubPreview(false);
      onAccountChange?.(updatedState);
      toast({
        title: 'Instagram Disconnected',
        description: 'Your Instagram account has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Disconnect Failed',
        description: error?.message || 'Failed to disconnect account.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const activeAccount = useStubPreview ? STUB_INSTAGRAM_ACCOUNT : accountState;
  const isAccountConnected = activeAccount.connected;

  // Render Banner / Dashboard variant
  if (variant === 'banner') {
    return (
      <div className="p-4 rounded-xl border border-border/80 bg-card/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm shrink-0">
            <Instagram className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Instagram Creator Identity</span>
              {isAccountConnected ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] gap-1 px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] text-muted-foreground">
                  Not Connected
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoadingAccount ? (
                'Checking connection status...'
              ) : isAccountConnected ? (
                <>
                  Handle: <strong className="text-foreground">@{activeAccount.username}</strong> • Followers:{' '}
                  <strong className="text-foreground">{Number(activeAccount.followersCount || 0).toLocaleString()}</strong> • Posts:{' '}
                  <strong className="text-foreground">{activeAccount.mediaCount}</strong>
                </>
              ) : (
                'Connect your Instagram Creator or Business account to show verified metrics to brands.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAccountConnected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnectInstagram}
              disabled={isDisconnecting}
              className="text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
            >
              {isDisconnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleConnectInstagram}
              disabled={isConnecting || isLoadingAccount}
              className="gradient-accent text-accent-foreground text-xs gap-1.5 font-semibold h-8"
            >
              {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Instagram className="w-3.5 h-3.5" />}
              Connect Instagram
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render Full Card variant (used in Profile & Onboarding)
  return (
    <div className="p-5 rounded-xl border border-border/80 bg-card/60 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground block">Instagram Account</span>
            <span className="text-[11px] text-muted-foreground">Direct Instagram Login (Read-Only API)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showStubToggle && (
            <button
              type="button"
              onClick={() => {
                const next = !useStubPreview;
                setUseStubPreview(next);
                onAccountChange?.(next ? STUB_INSTAGRAM_ACCOUNT : accountState);
              }}
              className="text-[10px] flex items-center gap-1 font-mono text-muted-foreground hover:text-accent transition-colors bg-muted/30 px-2 py-0.5 rounded-full border border-border/60"
            >
              <Sparkles className="w-2.5 h-2.5 text-accent" />
              {useStubPreview ? 'Demo Mode' : 'Preview Demo'}
            </button>
          )}

          {isAccountConnected && (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-1 px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingAccount ? (
        <div className="p-6 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin text-accent" />
          Fetching Instagram connection status...
        </div>
      ) : isAccountConnected ? (
        /* Connected State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-card via-card to-emerald-500/5 border border-emerald-500/20 space-y-4"
        >
          {/* Reconnect Banner */}
          {activeAccount.needsReconnect && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Instagram authorization expired. Reconnect to resume live metrics.</span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleConnectInstagram}
                className="gradient-accent text-accent-foreground text-[11px] h-7 px-3"
              >
                Reconnect
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {activeAccount.profilePictureUrl ? (
                <img
                  src={activeAccount.profilePictureUrl}
                  alt={activeAccount.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center font-bold text-accent text-lg">
                  {activeAccount.username?.[0]?.toUpperCase() || 'I'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-foreground">@{activeAccount.username}</span>
                  <Badge variant="outline" className="text-[9px] bg-accent/10 text-accent border-accent/20 font-mono">
                    {activeAccount.accountType || 'CREATOR'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground block">{activeAccount.displayName || activeAccount.username}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnectInstagram}
              disabled={isDisconnecting}
              className="text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
            >
              {isDisconnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Disconnect
            </Button>
          </div>

          {/* Account Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60">
            <div className="p-2.5 rounded-lg bg-background/60 border border-border/40">
              <span className="text-muted-foreground text-[10px] uppercase font-mono tracking-wider block">Followers</span>
              <span className="font-extrabold text-foreground text-base">
                {Number(activeAccount.followersCount || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-background/60 border border-border/40">
              <span className="text-muted-foreground text-[10px] uppercase font-mono tracking-wider block">Published Posts</span>
              <span className="font-extrabold text-foreground text-base">
                {Number(activeAccount.mediaCount || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-background/60 border border-border/40 col-span-2 sm:col-span-1">
              <span className="text-muted-foreground text-[10px] uppercase font-mono tracking-wider block">Connection Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                {activeAccount.connectedAt ? 'Active & Verified' : 'Connected'}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Not Connected State */
        <div className="p-6 rounded-xl border border-dashed border-border/80 bg-background/40 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <Instagram className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-semibold text-sm text-foreground">No Instagram account connected</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              Connect your Instagram Creator or Business account to import your verified follower count and engagement stats.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleConnectInstagram}
            disabled={isConnecting}
            className="gradient-accent text-accent-foreground text-xs gap-2 px-6 h-10 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting to Instagram...
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4" />
                Connect Instagram
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
