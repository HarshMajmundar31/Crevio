import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2,
  Lock, Sparkles, Youtube, Video, Instagram, AlertCircle
} from 'lucide-react';
import { apiVerifyMetaAccount } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Step2Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function Step2_SocialVerification({ initialData, onNext, onBack }: Step2Props) {
  const { toast } = useToast();

  const [instagramHandle, setInstagramHandle] = useState(initialData.instagramHandle || initialData.handle || '');
  const [youtubeChannel, setYoutubeChannel] = useState(initialData.youtubeChannel || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialData.tiktokHandle || '');

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedMeta, setVerifiedMeta] = useState<any>(initialData.verifiedMeta || null);

  const handleVerifyMeta = async () => {
    if (!instagramHandle.trim()) {
      toast({
        title: 'Handle Required',
        description: 'Please enter your Instagram handle to query Meta Graph API.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiVerifyMetaAccount(instagramHandle.trim());
      if (res.data) {
        setVerifiedMeta(res.data);
        toast({
          title: 'Meta Graph API Verification Successful!',
          description: `Verified @${res.data.handle.replace(/^@/, '')} with ${res.data.followersCount.toLocaleString()} authentic followers.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'Could not connect to Meta Graph API. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      instagramHandle: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
      youtubeChannel,
      tiktokHandle: tiktokHandle ? (tiktokHandle.startsWith('@') ? tiktokHandle : `@${tiktokHandle}`) : '',
      verifiedMeta,
    });
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
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px] uppercase font-mono tracking-wider">
            Step 2 of 5
          </Badge>
          <span className="text-xs text-muted-foreground">• Meta Graph API Verification</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Verify Social Channel Authenticity
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your Instagram handle via Meta Graph API. Crevio verifies your follower count and engagement <strong className="text-foreground">without requiring your password or credentials</strong>.
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-accent">100% Zero-Password Privacy Guarantee</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            We use OAuth API metadata tokens to query public Graph metrics. We never ask for or store account passwords.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Instagram Verification Block */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" />
              <span className="font-bold text-sm">Instagram Business / Creator Account</span>
            </div>
            {verifiedMeta && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-1">
                <CheckCircle2 className="w-3 h-3" /> Meta Verified
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="@instagram_handle"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="text-xs h-10"
              required
            />
            <Button
              type="button"
              onClick={handleVerifyMeta}
              disabled={isVerifying || !instagramHandle.trim()}
              className="gradient-accent text-accent-foreground text-xs gap-2 shrink-0 font-semibold h-10"
            >
              {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Verify via Meta API
            </Button>
          </div>

          {/* Verified Meta Badge Card */}
          {verifiedMeta && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{verifiedMeta.handle}</span>
                  {verifiedMeta.isVerified && (
                    <span className="bg-blue-500 text-white rounded-full p-0.5 text-[9px]">✓</span>
                  )}
                  <span className="text-muted-foreground text-[11px]">({verifiedMeta.name})</span>
                </div>
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500">
                  {verifiedMeta.verificationSource}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Follower Reach</span>
                  <span className="font-bold text-foreground text-sm">{verifiedMeta.followersCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Published Posts</span>
                  <span className="font-bold text-foreground text-sm">{verifiedMeta.mediaCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Category</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{verifiedMeta.category}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Additional Social Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              YouTube Channel URL / Handle (Optional)
            </label>
            <Input
              type="text"
              placeholder="youtube.com/@channel or @youtube_handle"
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              className="text-xs h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-500" />
              TikTok Handle (Optional)
            </label>
            <Input
              type="text"
              placeholder="@tiktok_username"
              value={tiktokHandle}
              onChange={(e) => setTiktokHandle(e.target.value)}
              className="text-xs h-10"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="text-xs gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button type="submit" className="gradient-primary text-primary-foreground text-xs gap-2 px-6 h-10 font-semibold">
            Continue to Rate Card Setup
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
