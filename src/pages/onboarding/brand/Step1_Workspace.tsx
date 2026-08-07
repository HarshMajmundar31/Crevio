import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Globe, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createWorkspace } from '@/lib/api';

interface Step1Props {
  onNext: () => void;
}

export default function Step1_Workspace({ onNext }: Step1Props) {
  const { user, refreshUser } = useAuth();
  const [workspaceName, setWorkspaceName] = useState(() => user?.onboardingDraft?.workspace?.name || '');
  const [workspaceSlug, setWorkspaceSlug] = useState(() => user?.onboardingDraft?.workspace?.slug || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Auto-generate slug from name (guarding against overwriting pre-loaded draft slug on first load)
  useEffect(() => {
    if (user?.onboardingDraft?.workspace?.slug && workspaceSlug === user.onboardingDraft.workspace.slug) {
      return;
    }
    const slug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setWorkspaceSlug(slug);
  }, [workspaceName]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName || !workspaceSlug) {
      toast({
        title: "Missing fields",
        description: "Please provide a workspace name.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Step 1: Create Workspace in Backend
      await createWorkspace({
        name: workspaceName,
        slug: workspaceSlug,
        // logo_url will be implemented with actual Cloudinary upload in future
      });
      
      await refreshUser();
      
      onNext();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Create Your Workspace</h2>
        <p className="text-muted-foreground">Build a home for your brand campaigns and contracts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <Label className="text-center font-medium">Workspace Logo</Label>
          <div className="relative group">
            <div 
              className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all duration-300 overflow-hidden ${
                logoPreview ? 'border-primary' : 'border-muted-foreground/20 hover:border-primary/50 bg-muted/30'
              }`}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {logoPreview && (
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">SVG, PNG, JPG (Max 2MB)</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Company Name
            </Label>
            <Input
              id="workspace-name"
              placeholder="e.g. Nike, Apple, Acme Corp"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="h-12 text-lg focus-visible:ring-primary shadow-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-slug" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Workspace URL
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                crevio.app/w/
              </span>
              <Input
                id="workspace-slug"
                placeholder="company-name"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="pl-[92px] h-12 font-mono text-sm focus-visible:ring-primary shadow-sm"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">This is your unique workspace identifier.</p>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 text-lg font-bold gradient-primary shadow-glow-primary hover:scale-[1.02] transition-all"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Workspace...
            </>
          ) : (
            <>
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
