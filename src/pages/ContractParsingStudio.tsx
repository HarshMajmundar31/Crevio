import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, 
  Share2, Mail, Users, ArrowLeft, Eye, ShieldCheck, Copy,
  ExternalLink, Search, RefreshCw, Layers
} from 'lucide-react';

export default function ContractParsingStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [file, setContractFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isParsed, setIsParsed] = useState(false);

  // Extracted Parsed Data State
  const [parsedData, setParsedData] = useState({
    brandName: 'Acme Cosmetics Inc.',
    campaignName: 'Summer Glow Launch 2026',
    totalValue: '125000',
    currency: 'INR',
    confidenceScore: 96.8,
    deliverables: [
      { id: '1', platform: 'YouTube', format: 'Dedicated Video (>8 mins)', dueDate: '2026-08-15', amount: '100000', confidence: 98 },
      { id: '2', platform: 'Instagram', format: '1x Story + Reel', dueDate: '2026-08-20', amount: '25000', confidence: 95 }
    ],
    clauses: {
      usageRights: '90 Days Digital Ad Rights',
      exclusivity: 'No Beauty Competitor Posts during campaign window',
      evidenceReq: 'Public Live URL + High-Res RAW Asset Submission'
    }
  });

  // Creator Assignment State
  const [creatorMode, setCreatorMode] = useState<'DIRECT_EMAIL' | 'INVITE_LINK' | 'AI_MATCH'>('DIRECT_EMAIL');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [selectedRecommendedCreator, setSelectedRecommendedCreator] = useState<string | null>(null);

  // Mock Recommended Creators for AI Matching Mode
  const aiRecommendedCreators = [
    { id: 'cr_101', name: 'Sarah Tech (@beauty_sarah)', subscriberCount: '450k', platform: 'YouTube', reliability: '99.4%', avgVelocity: '3.2 Days', matchScore: '98%' },
    { id: 'cr_102', name: 'Alex Glow (@alex_skincare)', subscriberCount: '280k', platform: 'Instagram', reliability: '97.8%', avgVelocity: '2.5 Days', matchScore: '94%' },
    { id: 'cr_103', name: 'Mia Vlogs (@beauty_mia)', subscriberCount: '620k', platform: 'TikTok', reliability: '96.5%', avgVelocity: '4.0 Days', matchScore: '91%' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setContractFile(uploaded);
    setIsParsing(true);

    // Compute client-side SHA-256 Checksum simulation
    const arrayBuffer = await uploaded.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setFileHash(hashHex);

    // Simulate AI Parser Processing Pass
    setTimeout(() => {
      setIsParsing(false);
      setIsParsed(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.crevio.io';
      const generatedLink = `${origin}/invite/cr_${Math.floor(1000 + Math.random() * 9000)}_x8b`;
      setInviteLink(generatedLink);
      toast({
        title: 'Contract Successfully Parsed',
        description: `Extracted parameters with ${parsedData.confidenceScore}% confidence. SHA-256 Checksum computed.`,
      });
    }, 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Link Copied to Clipboard',
      description: 'Send this onboarding invite link to your chosen creator.',
    });
  };

  const handleConfirmAndIssue = () => {
    toast({
      title: 'Contract Issued to Creator',
      description: 'Awaiting creator review and signed contract acceptance upload.',
    });
    navigate('/contracts');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <Link to="/contracts">
              <Button variant="outline" size="icon" className="w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-mono">
                  Crevio Ingestion Engine
                </Badge>
                <span className="text-xs text-muted-foreground">• Side-by-Side Dual Pane Verification</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Contract Ingestion & AI Parsing Studio
              </h1>
            </div>
          </div>

          {isParsed && (
            <Button onClick={handleConfirmAndIssue} className="gap-2 bg-primary text-primary-foreground font-medium shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Confirm & Issue Contract
            </Button>
          )}
        </div>

        {/* Upload Dropzone if file not uploaded */}
        {!contractFile && (
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center space-y-4 max-w-2xl mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Upload Contract Document (.PDF or .DOCX)</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Crevio will compute the cryptographic SHA-256 checksum and parse deliverables, payment terms, and compliance rules.
              </p>
            </div>
            <div>
              <Input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="contract-upload-input"
              />
              <Label htmlFor="contract-upload-input" className="cursor-pointer">
                <Button variant="default" className="gap-2 text-xs" asChild>
                  <span>
                    <FileText className="w-3.5 h-3.5" /> Select Legal Document
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        )}

        {/* Dual Pane Studio View */}
        {contractFile && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Pane: Original Document Viewer (5/12 cols) */}
            <div className="lg:col-span-5 rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col h-[700px]">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{contractFile.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  {(contractFile.size / 1024).toFixed(1)} KB
                </Badge>
              </div>

              {/* SHA-256 Checksum Display */}
              <div className="p-2.5 rounded bg-muted/40 border border-border/50 text-[10px] font-mono space-y-0.5">
                <span className="text-muted-foreground uppercase tracking-wider block">SHA-256 Document Checksum:</span>
                <span className="text-primary truncate block">{fileHash || 'Calculating checksum...'}</span>
              </div>

              {/* Document Visualizer Simulation */}
              <div className="flex-1 bg-muted/20 border border-border/40 rounded-lg p-4 font-serif text-xs text-foreground/80 overflow-y-auto space-y-3">
                <div className="text-center font-bold text-sm text-foreground border-b pb-2">
                  SERVICES AGREEMENT FOR INFLUENCER CAMPAIGN
                </div>
                <p>
                  This Execution Agreement is entered into by <strong>{parsedData.brandName}</strong> ("Brand") for the 
                  campaign <strong>{parsedData.campaignName}</strong>.
                </p>
                <div className="p-2 bg-primary/10 border border-primary/20 rounded text-[11px] font-sans">
                  <strong>Extracted Parameter #1:</strong> Deliverable 1 - YouTube Dedicated Review Video (min 8 mins). Compensation: ₹{Number(parsedData.deliverables[0].amount).toLocaleString()} INR.
                </div>
                <p>
                  Deliverable Due Date: <strong>{parsedData.deliverables[0].dueDate}</strong>. Creator agrees to submit proof of publication link.
                </p>
                <div className="p-2 bg-primary/10 border border-primary/20 rounded text-[11px] font-sans">
                  <strong>Extracted Parameter #2:</strong> Deliverable 2 - Instagram 1x Story + Reel. Compensation: ₹{Number(parsedData.deliverables[1].amount).toLocaleString()} INR.
                </div>
                <p>
                  Usage Rights: {parsedData.clauses.usageRights}.
                </p>
              </div>
            </div>

            {/* Right Pane: Structured Extracted Data & Creator Assignment Studio (7/12 cols) */}
            <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 space-y-5 overflow-y-auto h-[700px]">
              {/* Parsing Progress or Confidence Meter */}
              {isParsing ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <h3 className="text-sm font-semibold">Crevio Natural Language Parser Active...</h3>
                  <p className="text-xs text-muted-foreground">Extracting execution rules, milestones, deadlines, and checksums.</p>
                </div>
              ) : (
                <>
                  {/* Confidence Header */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-xs font-semibold text-foreground">Parser Extraction Complete</span>
                        <p className="text-[10px] text-muted-foreground">High confidence extraction verified against Crevio legal schema.</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 font-mono text-xs">
                      {parsedData.confidenceScore}% CONFIDENCE
                    </Badge>
                  </div>

                  {/* Section 1: Extracted Parameters */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono text-muted-foreground">
                      1. Extracted Campaign & Payment Rules
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded bg-muted/30 border border-border/50">
                        <span className="text-[10px] text-muted-foreground block">Brand Name</span>
                        <span className="font-semibold">{parsedData.brandName}</span>
                      </div>
                      <div className="p-2.5 rounded bg-muted/30 border border-border/50">
                        <span className="text-[10px] text-muted-foreground block">Total Escrow Value</span>
                        <span className="font-semibold text-primary font-mono">₹{Number(parsedData.totalValue).toLocaleString()} INR</span>
                      </div>
                    </div>

                    {/* Extracted Deliverables Table */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-foreground">Extracted Deliverables ({parsedData.deliverables.length})</span>
                      <div className="border border-border/50 rounded-lg overflow-hidden text-xs">
                        {parsedData.deliverables.map((del) => (
                          <div key={del.id} className="flex items-center justify-between p-2.5 border-b border-border/40 last:border-0 bg-muted/20">
                            <div>
                              <span className="font-semibold text-foreground">{del.platform}: {del.format}</span>
                              <p className="text-[10px] text-muted-foreground font-mono">Due Date: {del.dueDate}</p>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-semibold text-foreground">₹{Number(del.amount).toLocaleString()} INR</span>
                              <span className="text-[9px] text-emerald-500 block">Match Score: {del.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Creator Assignment & Onboarding Selector */}
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono text-muted-foreground">
                      2. Creator Assignment & Onboarding Workflow
                    </h3>

                    {/* Selector Options */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={creatorMode === 'DIRECT_EMAIL' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => setCreatorMode('DIRECT_EMAIL')}
                      >
                        <Mail className="w-3.5 h-3.5" /> Email Invite
                      </Button>
                      <Button
                        variant={creatorMode === 'INVITE_LINK' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => setCreatorMode('INVITE_LINK')}
                      >
                        <Share2 className="w-3.5 h-3.5" /> Shareable Link
                      </Button>
                      <Button
                        variant={creatorMode === 'AI_MATCH' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => setCreatorMode('AI_MATCH')}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Creator Matcher
                      </Button>
                    </div>

                    {/* Mode Content A: Direct Email */}
                    {creatorMode === 'DIRECT_EMAIL' && (
                      <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <Label htmlFor="creator-email-input" className="text-xs">Creator Email Address</Label>
                        <div className="flex gap-2">
                          <Input
                            id="creator-email-input"
                            type="email"
                            placeholder="e.g. creator@youtube.com"
                            value={creatorEmail}
                            onChange={(e) => setCreatorEmail(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Button size="sm" className="text-xs h-8 shrink-0">Send Invitation</Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Crevio will dispatch a secure portal link. Creator will download, review, and re-upload the signed contract PDF.
                        </p>
                      </div>
                    )}

                    {/* Mode Content B: Invite Link */}
                    {creatorMode === 'INVITE_LINK' && (
                      <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <Label className="text-xs">Unique Creator Onboarding Link</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={inviteLink} className="text-xs h-8 font-mono bg-background" />
                          <Button size="sm" variant="outline" onClick={handleCopyLink} className="text-xs h-8 gap-1.5 shrink-0">
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Share this link directly via DM or WhatsApp. Anyone with this link can view terms and submit signed contract acceptance.
                        </p>
                      </div>
                    )}

                    {/* Mode Content C: AI Creator Matcher (Fallback when brand has no creator in mind) */}
                    {creatorMode === 'AI_MATCH' && (
                      <div className="space-y-2.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">Matched Creators for ₹1,25,000 YouTube Campaign</span>
                          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                            CREVIO SUITABILITY ENGINE
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {aiRecommendedCreators.map((rec) => (
                            <div 
                              key={rec.id}
                              onClick={() => setSelectedRecommendedCreator(rec.id)}
                              className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                                selectedRecommendedCreator === rec.id
                                  ? 'border-primary bg-primary/10 shadow-sm'
                                  : 'border-border/50 bg-card hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground">{rec.name}</span>
                                <Badge variant="secondary" className="text-[9px] font-mono">
                                  {rec.matchScore} MATCH
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                <span>Platform: {rec.platform}</span>
                                <span>Reliability: {rec.reliability}</span>
                                <span>Avg Velocity: {rec.avgVelocity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
