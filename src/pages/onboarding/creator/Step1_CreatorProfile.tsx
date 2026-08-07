import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, User, Globe, Tag, Target, FileText } from 'lucide-react';

const NICHES = [
  'Tech & Gadgets', 'Fashion & Style', 'Fitness & Health',
  'Gaming & Esports', 'Beauty & Skincare', 'Lifestyle & Travel',
  'Finance & Business', 'Food & Cooking', 'Education & Self-Improvement'
];

interface Step1Props {
  initialData: any;
  onNext: (data: any) => void;
}

export default function Step1_CreatorProfile({ initialData, onNext }: Step1Props) {
  const [handle, setHandle] = useState(initialData.handle || '');
  const [niche, setNiche] = useState(initialData.niche || NICHES[0]);
  const [bio, setBio] = useState(initialData.bio || '');
  const [targetAudienceLocation, setTargetAudienceLocation] = useState(initialData.targetAudienceLocation || 'Global & North America');
  const [targetAgeBand, setTargetAgeBand] = useState(initialData.targetAgeBand || '18-34');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      niche,
      bio,
      targetAudienceLocation,
      targetAgeBand,
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
            Step 1 of 5
          </Badge>
          <span className="text-xs text-muted-foreground">• Identity & Audience Niche</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Define Your Creator Identity
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Provide your stage handle and content category so brands can discover your portfolio in the Crevio Creator Marketplace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            Creator Handle / Brand Username
          </label>
          <Input
            type="text"
            placeholder="@alex_techs or @sarah_style"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
            className="text-xs h-10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-accent" />
            Primary Content Category / Niche
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NICHES.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setNiche(item)}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  niche === item
                    ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                    : 'border-border/60 bg-background/50 hover:bg-muted text-muted-foreground'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-pink-500" />
            Creator Bio & Brand Pitch
          </label>
          <textarea
            placeholder="Describe your content style, audience engagement, and why brands love collaborating with you..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            required
            className="w-full text-xs p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Primary Audience Geography
            </label>
            <select
              value={targetAudienceLocation}
              onChange={(e) => setTargetAudienceLocation(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Global & North America">Global & North America</option>
              <option value="United States & Canada">United States & Canada</option>
              <option value="India & South Asia">India & South Asia</option>
              <option value="Europe & UK">Europe & UK</option>
              <option value="Worldwide">Worldwide / Cross-border</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Top Audience Age Band
            </label>
            <select
              value={targetAgeBand}
              onChange={(e) => setTargetAgeBand(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="18-24">18 - 24 (Gen Z)</option>
              <option value="25-34">25 - 34 (Millennial)</option>
              <option value="18-34">18 - 34 (Broad Young Adult)</option>
              <option value="35-44">35 - 44 (Professional)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" className="gradient-primary text-primary-foreground text-xs gap-2 px-6 h-10 font-semibold">
            Continue to Social Verification
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
