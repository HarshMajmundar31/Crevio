import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Briefcase, Users2, Link2, MapPin, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { updateWorkspaceProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
}

export default function Step3_BrandProfile({ onNext, onBack }: Step3Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    industry: '',
    size: '',
    website: '',
    location: '',
    bio: ''
  });

  const industries = [
    'Technology & Software',
    'Fashion & Apparel',
    'Food & Beverage',
    'Health & Wellness',
    'Lifestyle & Entertainment',
    'Finance & Fintech',
    'E-commerce'
  ];

  const sizes = [
    '1-10 Employees',
    '11-50 Employees',
    '51-200 Employees',
    '201-500 Employees',
    '500+ Employees'
  ];

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      await updateWorkspaceProfile({
        industry: formData.industry,
        company_size: formData.size,
        website: formData.website,
        hq_location: formData.location,
        bio: formData.bio
      });
      onNext();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Company Profile</h2>
        <p className="text-muted-foreground">Tell us more about your company to tailor your experience.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Industry
            </Label>
            <Select onValueChange={(val) => setFormData({ ...formData, industry: val })}>
              <SelectTrigger className="h-12 shadow-sm">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-primary" />
              Company Size
            </Label>
            <Select onValueChange={(val) => setFormData({ ...formData, size: val })}>
              <SelectTrigger className="h-12 shadow-sm">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Website URL
          </Label>
          <Input 
            placeholder="https://www.yourcompany.com" 
            className="h-12 shadow-sm"
            type="url"
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Headquarters
          </Label>
          <Input 
            placeholder="City, Country" 
            className="h-12 shadow-sm"
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Company Bio</Label>
          <Textarea 
            placeholder="A brief description of your brand's mission and what you're looking for in influencer partnerships..." 
            className="min-h-[120px] shadow-sm resize-none"
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1 h-12" disabled={isSubmitting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            className="flex-1 h-12 gradient-primary shadow-glow-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
