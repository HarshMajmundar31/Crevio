import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import {
  ArrowLeft, FileText, CheckCircle2, ShieldCheck, Lock, Clock,
  DollarSign, ExternalLink, Sparkles, Upload, Share2, Mail,
  AlertTriangle, Play, ShieldAlert, ArrowRight, Layers, FileCheck,
  Building, RefreshCw
} from 'lucide-react';

interface StageContract {
  id: string;
  creatorName: string;
  creatorHandle: string;
  value: number;
  deliverableTitle: string;
  platform: string;
  slaRemaining: string;
  signedFileUrl?: string;
  signedFileHash?: string;
  submittedEvidenceUrl?: string;
  evidenceHash?: string;
  aiVerificationScore?: number;
}

export default function CampaignExecutionTimeline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeStage, setActiveStage] = useState<number>(3); // Default Stage 3: Signed Upload
  const [isLoading, setIsLoading] = useState(false);

  // Campaign Mock Data with Stages
  const campaignData = {
    id: id || 'CMP-2026-081',
    title: 'Summer Glow Launch 2026',
    code: '#CMP-2026-081',
    platform: 'YouTube & Instagram',
    budget: 250000,
    lockedEscrow: 180000,
    progressPercent: 72,
    health: 'ON_TRACK',
    stages: [
      {
        stageNumber: 1,
        title: '1. Ingestion & Parse',
        count: 2,
        status: 'DRAFT',
        contracts: [
          { id: 'CR-9901', creatorName: 'Pending Creator', creatorHandle: 'Unassigned', value: 10000, deliverableTitle: '1x YouTube Video (>8 mins)', platform: 'YouTube', slaRemaining: '24 Hours' }
        ]
      },
      {
        stageNumber: 2,
        title: '2. Creator Onboarded',
        count: 3,
        status: 'PENDING',
        contracts: [
          { id: 'CR-9912', creatorName: 'Alex Tech', creatorHandle: '@alex_vlogs', value: 12500, deliverableTitle: '1x YouTube Integration', platform: 'YouTube', slaRemaining: '18 Hours' }
        ]
      },
      {
        stageNumber: 3,
        title: '3. Signed PDF Upload',
        count: 2,
        status: 'SIGNED_REVIEW',
        contracts: [
          {
            id: 'CR-9921',
            creatorName: 'Sarah Beauty',
            creatorHandle: '@beauty_sarah',
            value: 15000,
            deliverableTitle: '1x Dedicated Review Video + 2x Stories',
            platform: 'YouTube & IG',
            slaRemaining: '12 Hours',
            signedFileUrl: 'contract_cr9921_signed_sarah.pdf',
            signedFileHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e'
          },
          {
            id: 'CR-9922',
            creatorName: 'John Glam',
            creatorHandle: '@glam_john',
            value: 8500,
            deliverableTitle: '2x Instagram Reels',
            platform: 'Instagram',
            slaRemaining: '36 Hours',
            signedFileUrl: 'contract_cr9922_signed_john.pdf',
            signedFileHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
          }
        ]
      },
      {
        stageNumber: 4,
        title: '4. Escrow Locked',
        count: 4,
        status: 'LOCKED',
        contracts: [
          { id: 'CR-9930', creatorName: 'Mia Lifestyle', creatorHandle: '@mia_lifestyle', value: 20000, deliverableTitle: 'Dedicated Campaign Series', platform: 'TikTok', slaRemaining: '3 Days' }
        ]
      },
      {
        stageNumber: 5,
        title: '5. Executing & Evidence',
        count: 10,
        status: 'EXECUTING',
        contracts: [
          {
            id: 'CR-9940',
            creatorName: 'Glow Tech',
            creatorHandle: '@glow_tech',
            value: 18000,
            deliverableTitle: 'YouTube Review Video Published',
            platform: 'YouTube',
            slaRemaining: '4 Hours Review SLA',
            submittedEvidenceUrl: 'https://youtube.com/watch?v=acme_glow_review',
            evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            aiVerificationScore: 99.1
          }
        ]
      },
      {
        stageNumber: 6,
        title: '6. Completed',
        count: 3,
        status: 'COMPLETED',
        contracts: [
          { id: 'CR-9950', creatorName: 'Emma Beauty', creatorHandle: '@emma_beauty', value: 15000, deliverableTitle: 'Completed Campaign Deliverable', platform: 'YouTube', slaRemaining: 'Settled' }
        ]
      }
    ]
  };

  const currentStageObj = campaignData.stages.find(s => s.stageNumber === activeStage) || campaignData.stages[2];

  const handleStageAction = (actionName: string, contractId: string) => {
    toast({
      title: `${actionName} Executed`,
      description: `Contract ${contractId} updated in Crevio Execution Matrix.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/campaigns">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground gap-1">
                  <ArrowLeft className="w-3 h-3" /> Campaigns
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">/</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-mono">
                Execution Lifecycle Studio
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {campaignData.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Code: <span className="font-mono text-foreground font-semibold">{campaignData.code}</span> • Platform: {campaignData.platform}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/contracts/studio">
              <Button size="sm" className="gap-2 text-xs bg-primary text-primary-foreground font-medium shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                Upload New Contract
              </Button>
            </Link>
          </div>
        </div>

        {/* Campaign Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-card border border-border">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Campaign Budget</span>
            <span className="text-sm font-bold text-foreground font-mono">${campaignData.budget.toLocaleString()} USD</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Escrow Locked</span>
            <span className="text-sm font-bold text-primary font-mono">${campaignData.lockedEscrow.toLocaleString()} USD</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Overall Execution</span>
            <div className="flex items-center gap-2">
              <Progress value={campaignData.progressPercent} className="h-2 flex-1" />
              <span className="text-xs font-bold font-mono text-foreground">{campaignData.progressPercent}%</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">Campaign Health</span>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
              {campaignData.health}
            </Badge>
          </div>
        </div>

        {/* UNSTOP-STYLE CONTRACT EXECUTION STAGE NAVIGATION BAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono text-muted-foreground">
              Contract Execution Lifecycle Stages (6)
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">CLICK STAGE TO INSPECT CARDS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {campaignData.stages.map((stg) => (
              <button
                key={stg.stageNumber}
                onClick={() => setActiveStage(stg.stageNumber)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  activeStage === stg.stageNumber
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                    : 'border-border/60 bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    STAGE 0{stg.stageNumber}
                  </span>
                  <Badge 
                    variant={activeStage === stg.stageNumber ? 'default' : 'secondary'}
                    className="text-[10px] font-mono px-1.5 py-0"
                  >
                    {stg.count}
                  </Badge>
                </div>
                <div className="text-xs font-bold text-foreground truncate">
                  {stg.title.split('. ')[1]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE STAGE CARDS WORKSPACE AREA */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] font-mono uppercase">
                  ACTIVE STAGE {currentStageObj.stageNumber}
                </Badge>
                <h2 className="text-sm font-bold text-foreground">{currentStageObj.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{currentStageObj.description}</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{currentStageObj.contracts.length} Contracts in this stage</span>
          </div>

          {/* Execution Cards List */}
          <div className="space-y-4 pt-1">
            {currentStageObj.contracts.map((c: any) => (
              <div key={c.id} className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3.5 hover:border-border transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground text-sm">#{c.id}</span>
                      <span className="text-xs text-muted-foreground">• Creator: <strong className="text-foreground">{c.creatorName}</strong> ({c.creatorHandle})</span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{c.deliverableTitle}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-foreground text-sm">${c.value.toLocaleString()} USD</span>
                    <Badge variant="outline" className="text-[10px] font-mono text-amber-500 border-amber-500/30">
                      SLA: {c.slaRemaining}
                    </Badge>
                  </div>
                </div>

                {/* Stage Specific Contextual Metadata */}
                {/* Stage 3: Signed PDF Upload Metadata */}
                {activeStage === 3 && c.signedFileUrl && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">Signed Acceptance File Uploaded by Creator</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">VERIFIED CHECKSUM</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground break-all">
                      SHA-256: {c.signedFileHash}
                    </div>
                  </div>
                )}

                {/* Stage 5: Executing & Submitted Evidence Review Metadata */}
                {activeStage === 5 && c.submittedEvidenceUrl && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-foreground">Live Evidence Submission Active</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-emerald-500 border-emerald-500/30">
                        {c.aiVerificationScore}% CREVIO MATCH SCORE
                      </Badge>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">
                      Submitted URL: <a href={c.submittedEvidenceUrl} target="_blank" rel="noreferrer" className="text-primary underline">{c.submittedEvidenceUrl}</a>
                    </div>
                  </div>
                )}

                {/* Contextual Action Buttons for this stage */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
                  {activeStage === 1 && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleStageAction('Inspect Parsed Data', c.id)}>
                        Inspect Parsed Data
                      </Button>
                      <Button size="sm" className="text-xs h-8" onClick={() => handleStageAction('Assign Creator', c.id)}>
                        Assign Creator
                      </Button>
                    </>
                  )}

                  {activeStage === 2 && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleStageAction('Copy Onboarding Link', c.id)}>
                        <Share2 className="w-3.5 h-3.5" /> Copy Invite Link
                      </Button>
                      <Button size="sm" variant="secondary" className="text-xs h-8 gap-1.5" onClick={() => handleStageAction('Run AI Matcher', c.id)}>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Run AI Creator Matcher
                      </Button>
                    </>
                  )}

                  {activeStage === 3 && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleStageAction('Inspect Signed PDF', c.id)}>
                        <FileText className="w-3.5 h-3.5" /> Inspect Signed PDF
                      </Button>
                      <Button size="sm" className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium" onClick={() => handleStageAction('Fund & Lock Escrow', c.id)}>
                        <ShieldCheck className="w-3.5 h-3.5" /> Fund & Lock Escrow (${c.value.toLocaleString()})
                      </Button>
                    </>
                  )}

                  {activeStage === 4 && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleStageAction('View Cryptographic Certificate', c.id)}>
                        <Lock className="w-3.5 h-3.5 text-purple-400" /> View Immutable Vault Certificate
                      </Button>
                    </>
                  )}

                  {activeStage === 5 && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleStageAction('Inspect Video Proof', c.id)}>
                        Inspect Video Proof
                      </Button>
                      <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={() => handleStageAction('Approve & Release Escrow', c.id)}>
                        Approve & Release Escrow Payout
                      </Button>
                    </>
                  )}

                  {activeStage === 6 && (
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleStageAction('Download Audit Package', c.id)}>
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Download Audit Trail Package (ZIP)
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
