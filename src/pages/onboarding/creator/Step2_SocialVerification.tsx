import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Lock, Youtube, Video } from 'lucide-react';
import InstagramConnectCard from '@/components/InstagramConnectCard';
import { InstagramAccountResponse } from '@/lib/api';

interface Step2Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function Step2_SocialVerification({ initialData, onNext, onBack }: Step2Props) {
  const [youtubeChannel, setYoutubeChannel] = useState(initialData.youtubeChannel || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialData.tiktokHandle || '');
  const [instagramAccount, setInstagramAccount] = useState<InstagramAccountResponse | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      instagramAccount,
      instagramHandle: instagramAccount?.connected ? `@${instagramAccount.username}` : '',
      youtubeChannel,
      tiktokHandle: tiktokHandle ? (tiktokHandle.startsWith('@') ? tiktokHandle : `@${tiktokHandle}`) : '',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px] uppercase font-mono tracking-wider">
            Step 2 of 5
          </Badge>
          <span className="text-xs text-muted-foreground">• Read-Only Graph API Integration</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Connect your Instagram
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your Instagram Creator or Business account so we can show your follower count and stats.
        </p>
      </div>

      {/* Security Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-accent">Read-Only & Encrypted OAuth Protection</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            This integration is strictly <strong className="text-foreground">read-only</strong>. We only display your profile metrics and never post or manage anything on your behalf. Access tokens are encrypted at rest (AES-256-GCM).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Official Instagram Connect Card Component */}
        <InstagramConnectCard
          variant="full"
          showStubToggle={true}
          onAccountChange={(acc) => setInstagramAccount(acc)}
        />

        {/* Additional Optional Social Channels */}
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

        {/* Action Controls Footer */}
        <div className="pt-4 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="text-xs gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNext({ instagramAccount: null, skipSocial: true })}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Skip for now
            </button>

            <Button type="submit" className="gradient-primary text-primary-foreground text-xs gap-2 px-6 h-10 font-semibold">
              Continue to Rate Card Setup
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
