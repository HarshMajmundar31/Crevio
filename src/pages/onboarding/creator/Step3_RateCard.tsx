import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ArrowRight, ArrowLeft, Shield, Video, Instagram, Youtube, Lock } from 'lucide-react';

interface Step3Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function Step3_RateCard({ initialData, onNext, onBack }: Step3Props) {
  const [reelRate, setReelRate] = useState(initialData.reelRate || 15000);
  const [youtubeRate, setYoutubeRate] = useState(initialData.youtubeRate || 35000);
  const [tiktokRate, setTiktokRate] = useState(initialData.tiktokRate || 12000);
  const [exclusivityDays, setExclusivityDays] = useState(initialData.exclusivityDays || 30);
  const [usageRights, setUsageRights] = useState(initialData.usageRights || '1 Year Digital & Social Media Usage Rights Included');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      reelRate: Number(reelRate) || 0,
      youtubeRate: Number(youtubeRate) || 0,
      tiktokRate: Number(tiktokRate) || 0,
      exclusivityDays: Number(exclusivityDays) || 30,
      usageRights,
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
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-mono tracking-wider">
            Step 3 of 5
          </Badge>
          <span className="text-xs text-muted-foreground">• Baseline Deliverable Rate Card</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Establish Your Rate Card & Terms
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Set baseline pricing for contract generation. Brands use these figures to auto-draft campaign agreements with zero budget ambiguity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-card/60">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              Instagram Reel (60s)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">₹</span>
              <Input
                type="number"
                value={reelRate}
                onChange={(e) => setReelRate(e.target.value)}
                className="text-xs h-10 pl-7"
                min={0}
                required
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">Includes 1x Reel + 1x Story</span>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-card/60">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              YouTube Video Review
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">₹</span>
              <Input
                type="number"
                value={youtubeRate}
                onChange={(e) => setYoutubeRate(e.target.value)}
                className="text-xs h-10 pl-7"
                min={0}
                required
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">Dedicated or 60s Integration</span>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-card/60">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-500" />
              TikTok Short Post
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">₹</span>
              <Input
                type="number"
                value={tiktokRate}
                onChange={(e) => setTiktokRate(e.target.value)}
                className="text-xs h-10 pl-7"
                min={0}
                required
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">1x Vertical Short Content</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Category Exclusivity Window</label>
            <select
              value={exclusivityDays}
              onChange={(e) => setExclusivityDays(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="0">No Exclusivity Required</option>
              <option value="30">30 Days Category Exclusivity</option>
              <option value="60">60 Days Category Exclusivity</option>
              <option value="90">90 Days Category Exclusivity</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Content Usage Rights License</label>
            <select
              value={usageRights}
              onChange={(e) => setUsageRights(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="1 Year Digital & Social Media Usage Rights Included">1 Year Digital & Organic Social License</option>
              <option value="6 Months Paid Ad Usage Rights Included">6 Months Organic + Paid Ads License</option>
              <option value="Perpetual Organic Digital Rights">Perpetual Organic Digital License</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="text-xs gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button type="submit" className="gradient-primary text-primary-foreground text-xs gap-2 px-6 h-10 font-semibold">
            Continue to Portfolio Setup
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
