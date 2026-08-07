import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, ChevronRight, Upload, Briefcase, FileText, Palette, IndianRupee, Calendar, Target, Loader2 } from 'lucide-react';
import { createCampaign, AUTH_TOKEN_KEY, getApiBaseUrl } from '@/lib/api';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { CampaignAIAssistant } from '@/components/CampaignAIAssistant';

const STEPS = [
  { id: 'basics', title: 'Campaign Basics', icon: Briefcase },
  { id: 'requirements', title: 'Requirements', icon: FileText },
  { id: 'visuals', title: 'Visual Identity', icon: Palette },
  { id: 'contract', title: 'Ingest Contract', icon: Upload },
  { id: 'review', title: 'Review & Launch', icon: CheckCircle2 }
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  
  // Step 1 & 2 state
  const [formData, setFormData] = useState({
    title: '', goal: '', targetAudience: '', description: '',
    deliverablesSummary: '', timelineSummary: '', platform: '',
    budgetMin: '', budgetMax: '', contentRights: '', deadline: '',
    coverImageUrl: '', highlightColor: '#4f46e5'
  });
  const [requirements, setRequirements] = useState<string[]>(['Must follow brand guidelines']);
  const [requirementInput, setRequirementInput] = useState('');

  // Step 4 state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedTerms, setParsedTerms] = useState<any>(null);

  const handleNext = async () => {
    if (currentStep === 2) { // Moving from Visuals -> Contract (Create Campaign)
      if (!formData.title || !formData.budgetMin || !formData.deadline) {
        toast({ title: "Missing Fields", description: "Please fill all required basics.", variant: "destructive" });
        return;
      }
      try {
        const res = await createCampaign({
          title: formData.title,
          goal: formData.goal || 'General Awareness',
          targetAudience: formData.targetAudience || 'General',
          description: formData.description || 'Campaign description',
          deliverablesSummary: formData.deliverablesSummary || 'See contract',
          timelineSummary: formData.timelineSummary || 'TBD',
          platform: formData.platform || 'Instagram',
          budgetMin: Number(formData.budgetMin) || 0,
          budgetMax: Number(formData.budgetMax) || 0,
          contentRights: formData.contentRights || 'Standard',
          deadline: formData.deadline,
          requirements: requirements.filter(r => r.trim()),
          coverImageUrl: formData.coverImageUrl,
          highlightColor: formData.highlightColor,
        });
        
        setCreatedCampaignId(res.campaignId);
        setCurrentStep(3);
      } catch (err) {
        toast({ title: "Error creating campaign", description: String(err), variant: "destructive" });
      }
    } else if (currentStep === 3) { // Moving from Contract -> Review
      if (!parsedTerms) {
        toast({ title: "Parse Contract", description: "Please upload and parse a contract first.", variant: "destructive" });
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) { // Finish
      toast({ title: "Campaign Launched", description: "Your campaign is now live." });
      navigate(`/campaigns/${createdCampaignId}`);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleApplyData = (data: any) => {
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      goal: data.goal || prev.goal,
      targetAudience: data.targetAudience || prev.targetAudience,
      description: data.description || prev.description,
      deliverablesSummary: data.deliverablesSummary || prev.deliverablesSummary,
      timelineSummary: data.timelineSummary || prev.timelineSummary,
      platform: data.platform || prev.platform,
      budgetMin: data.budgetMin !== undefined ? String(data.budgetMin) : prev.budgetMin,
      budgetMax: data.budgetMax !== undefined ? String(data.budgetMax) : prev.budgetMax,
      contentRights: data.contentRights || prev.contentRights,
    }));
    
    if (data.requirements && Array.isArray(data.requirements) && data.requirements.length > 0) {
      setRequirements(data.requirements);
    }
    
    toast({ title: "AI Data Applied", description: "The form has been updated with AI suggestions." });
  };

  const handleUploadContract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !createdCampaignId) return;
    
    setContractFile(file);
    setIsUploading(true);

    try {
      let token = await getToken();
      if (!token) {
        token = localStorage.getItem(AUTH_TOKEN_KEY);
      }
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch(`${getApiBaseUrl()}/api/contracts/upload-for-campaign/${createdCampaignId}`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);
      
      const parseRes = await fetch(`${getApiBaseUrl()}/api/contracts/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rawText: uploadData.rawText })
      });
      
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error);
      
      setParsedTerms(parseData.parsedData);
      toast({ title: "Contract Parsed", description: "AI successfully extracted terms." });
      
    } catch (err) {
      toast({ title: "Upload Failed", description: String(err), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (user?.role !== 'brand' && user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-20"><p>Only brands or admins can create campaigns.</p></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20">
        <Button variant="ghost" onClick={() => navigate('/campaigns')} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Campaigns
        </Button>

        <div className="mb-10">
          <h1 className="text-3xl font-extrabold mb-2 text-foreground">Campaign Setup Studio</h1>
          <p className="text-muted-foreground text-lg">Define requirements, setup visuals, and ingest legal templates.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="space-y-12">
            {/* Stepper */}
            <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} 
            />
          </div>
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                  isCurrent ? 'bg-background border-primary text-primary shadow-lg shadow-primary/20 scale-110' :
                  'bg-muted border-muted-foreground/30 text-muted-foreground'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold ${isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 border-border/50 shadow-xl bg-card/50 backdrop-blur-sm min-h-[400px]">
              
              {/* STEP 1: BASICS */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="text-primary" /> Basic Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Campaign Title *</Label>
                      <Input placeholder="e.g. Summer Launch" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Platform</Label>
                      <Select value={formData.platform} onValueChange={v => setFormData({...formData, platform: v})}>
                        <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="YouTube">YouTube</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Min ($) *</Label>
                      <Input type="number" placeholder="5000" value={formData.budgetMin} onChange={e => setFormData({...formData, budgetMin: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Max ($) *</Label>
                      <Input type="number" placeholder="10000" value={formData.budgetMax} onChange={e => setFormData({...formData, budgetMax: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline *</Label>
                      <Input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea placeholder="Describe the campaign briefly..." rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>
              )}

              {/* STEP 1: REQUIREMENTS */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-primary" /> Campaign Requirements</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Goal / Objective</Label>
                      <Input placeholder="e.g. General Awareness" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Input placeholder="e.g. Tech Enthusiasts 18-24" value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deliverables Summary</Label>
                    <Textarea placeholder="e.g. 1 Instagram Reel, 2 Stories" rows={3} value={formData.deliverablesSummary} onChange={e => setFormData({...formData, deliverablesSummary: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Timeline / Schedule Summary</Label>
                    <Textarea placeholder="e.g. Drafts by 5th, Go Live by 10th" rows={2} value={formData.timelineSummary} onChange={e => setFormData({...formData, timelineSummary: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Content Rights & Exclusivity</Label>
                    <Input placeholder="e.g. 30 days exclusivity, digital rights" value={formData.contentRights} onChange={e => setFormData({...formData, contentRights: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Specific Requirements</Label>
                    <div className="flex gap-2 mb-2">
                      <Input placeholder="e.g. Must mention promo code" value={requirementInput} onChange={e => setRequirementInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if(requirementInput) { setRequirements([...requirements, requirementInput]); setRequirementInput(''); } } }} />
                      <Button variant="secondary" type="button" onClick={() => { if(requirementInput) { setRequirements([...requirements, requirementInput]); setRequirementInput(''); } }}>Add</Button>
                    </div>
                    <div className="space-y-2">
                      {requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border/50">
                          <span className="text-sm">{req}</span>
                          <Button variant="ghost" size="sm" type="button" className="h-6 w-6 p-0 text-destructive" onClick={() => setRequirements(requirements.filter((_, i) => i !== idx))}>&times;</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: VISUALS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Palette className="text-primary" /> Brand Visuals</h2>
                  <p className="text-muted-foreground">Make your campaign stand out on the platform with premium hackathon-style aesthetics.</p>
                  
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <div className="flex gap-3">
                        <Input 
                          placeholder="Image URL or upload from PC" 
                          value={formData.coverImageUrl} 
                          onChange={e => setFormData({...formData, coverImageUrl: e.target.value})} 
                          className="flex-1"
                        />
                        <div className="relative shrink-0">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({...formData, coverImageUrl: reader.result as string});
                                  toast({ title: "Image Selected", description: "Cover image preview generated from local file." });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button type="button" variant="secondary" className="pointer-events-none">
                            <Upload className="w-4 h-4 mr-2" /> Upload PC
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">High resolution landscape image (16:9 ratio recommended).</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Highlight Color (Hex)</Label>
                      <div className="flex gap-3">
                        <Input type="color" className="w-16 h-10 p-1" value={formData.highlightColor} onChange={e => setFormData({...formData, highlightColor: e.target.value})} />
                        <Input type="text" className="flex-1" value={formData.highlightColor} onChange={e => setFormData({...formData, highlightColor: e.target.value})} />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-border/50 overflow-hidden relative h-48" style={{
                      background: formData.coverImageUrl ? `url(${formData.coverImageUrl}) center/cover` : `linear-gradient(135deg, ${formData.highlightColor} 0%, #000 100%)`
                    }}>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <h3 className="text-white text-2xl font-bold">{formData.title || 'Campaign Preview'}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTRACT INGESTION */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="text-primary" /> Contract Ingestion</h2>
                  
                  {!parsedTerms ? (
                     <div 
                      className="border-2 border-dashed border-border/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                     >
                       <input type="file" className="hidden" ref={fileInputRef} accept=".pdf,.doc,.docx" onChange={handleUploadContract} />
                       {isUploading ? (
                         <div className="flex flex-col items-center">
                           <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                           <p className="font-semibold">AI is analyzing contract terms...</p>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center">
                           <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                             <Upload className="w-8 h-8 text-muted-foreground" />
                           </div>
                           <h3 className="font-bold text-lg mb-1">Upload Legal Template</h3>
                           <p className="text-sm text-muted-foreground mb-4">PDF, DOC, or DOCX up to 10MB</p>
                           <Button variant="outline">Browse Files</Button>
                         </div>
                       )}
                     </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                          <p className="font-bold">Contract Parsed Successfully</p>
                          <p className="text-sm text-emerald-500/80">Confidence Score: {parsedTerms.confidenceScore}%</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="p-4 bg-muted/30">
                          <Label className="text-xs text-muted-foreground">Extracted Value</Label>
                          <p className="text-2xl font-bold flex items-center"><IndianRupee className="w-5 h-5 text-emerald-500"/> {parsedTerms.totalValue}</p>
                        </Card>
                        <Card className="p-4 bg-muted/30">
                          <Label className="text-xs text-muted-foreground">Deliverables Found</Label>
                          <p className="text-2xl font-bold flex items-center"><Target className="w-5 h-5 text-primary mr-2"/> {parsedTerms.deliverables?.length || 0}</p>
                        </Card>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => { setContractFile(null); setParsedTerms(null); }}>Re-upload</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: REVIEW */}
              {currentStep === 4 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">Ready to Launch!</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Your campaign "{formData.title}" is fully configured with an automated contract workflow and is ready to accept applications.
                  </p>
                </div>
              )}

            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-8">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || isUploading}
          >
            Back
          </Button>
          
            <div className="flex items-center gap-3">
              {currentStep === 3 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep(4)}
                  disabled={isUploading}
                >
                  Skip for now
                </Button>
              )}
              <Button 
                size="lg" 
                className="font-bold px-8"
                onClick={handleNext}
                disabled={isUploading || (currentStep === 3 && !parsedTerms)}
              >
                {currentStep === 2 ? 'Create Campaign & Proceed' : currentStep === 4 ? 'Launch Campaign' : 'Next Step'}
                {currentStep !== 4 && <ChevronRight className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </div>
          </div>
          
          <div className="hidden lg:block sticky top-6">
            <CampaignAIAssistant onApplyData={handleApplyData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
