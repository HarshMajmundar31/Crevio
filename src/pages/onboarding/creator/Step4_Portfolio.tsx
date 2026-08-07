import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ArrowRight, ArrowLeft, Plus, Trash2, FastForward, Sparkles } from 'lucide-react';

interface Step4Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function Step4_Portfolio({ initialData, onNext, onBack }: Step4Props) {
  const [portfolio, setPortfolio] = useState<Array<{ title: string; url: string }>>(
    initialData.portfolio && initialData.portfolio.length > 0
      ? initialData.portfolio
      : [{ title: '', url: '' }]
  );

  const handleAddSample = () => {
    if (portfolio.length < 3) {
      setPortfolio([...portfolio, { title: '', url: '' }]);
    }
  };

  const handleRemoveSample = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...portfolio];
    updated[index][field] = value;
    setPortfolio(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSamples = portfolio.filter((p) => p.url.trim().length > 0);
    onNext({ portfolio: validSamples });
  };

  const handleSkip = () => {
    onNext({ portfolio: [] });
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
            Step 4 of 5
          </Badge>
          <span className="text-xs text-muted-foreground">• Portfolio & Campaign Work Samples</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Showcase Your Best Campaign Work
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Link up to 3 past video deliverables or campaign URLs to demonstrate your content execution quality to brands.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          {portfolio.map((sample, index) => (
            <div key={index} className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                  Work Sample #{index + 1}
                </span>
                {portfolio.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSample(index)}
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Campaign / Brand Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Nike Summer Unboxing Reel"
                    value={sample.title}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Video / Post URL</label>
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/p/..."
                    value={sample.url}
                    onChange={(e) => handleChange(index, 'url', e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {portfolio.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSample}
            className="w-full text-xs border-dashed gap-2 h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Work Sample
          </Button>
        )}

        <div className="pt-4 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="text-xs gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {/* Prominent Skip Option as requested */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-10 px-4"
            >
              <FastForward className="w-3.5 h-3.5" />
              Skip for Now
            </Button>

            <Button type="submit" className="gradient-primary text-primary-foreground text-xs gap-2 px-6 h-10 font-semibold">
              Continue to Legal Agreement
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
