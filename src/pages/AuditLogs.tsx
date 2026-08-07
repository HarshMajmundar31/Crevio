import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldCheck, Search, Filter, Download, Lock, CheckCircle2,
  FileText, ExternalLink, RefreshCw, Layers, ShieldAlert, Key
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  contractNumber: string;
  eventType: string;
  actor: string;
  actorRole: 'BRAND' | 'CREATOR' | 'ACEE_ENGINE' | 'TREASURY';
  sha256Hash: string;
  parentHash: string;
  payloadSummary: string;
  verificationStatus: 'VERIFIED' | 'TAMPER_ALERT';
}

export default function AuditLogs() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Cryptographically Hash-Chained Mock Audit Log
  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: 'AUD-9910',
      timestamp: '2026-07-27 14:28:10 UTC',
      contractNumber: '#ACEE-9921',
      eventType: 'ESCROW_FUNDED_AND_LOCKED',
      actor: 'Brand Org Vault',
      actorRole: 'BRAND',
      sha256Hash: 'a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9',
      parentHash: '7e8d9c0b1a2f3e4d5c6b7a8f9a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f',
      payloadSummary: 'Funded $15,000 USD to ACEE Multi-Sig Escrow Vault. Lock flag toggled to IMMUTABLE.',
      verificationStatus: 'VERIFIED'
    },
    {
      id: 'AUD-9909',
      timestamp: '2026-07-27 12:15:44 UTC',
      contractNumber: '#ACEE-9921',
      eventType: 'SIGNED_CONTRACT_PDF_REUPLOADED',
      actor: 'Sarah Beauty (@beauty_sarah)',
      actorRole: 'CREATOR',
      sha256Hash: '7e8d9c0b1a2f3e4d5c6b7a8f9a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f',
      parentHash: '3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d',
      payloadSummary: 'Uploaded signed contract acceptance PDF. SHA-256 match confirmed against parsed terms.',
      verificationStatus: 'VERIFIED'
    },
    {
      id: 'AUD-9908',
      timestamp: '2026-07-27 09:30:12 UTC',
      contractNumber: '#ACEE-9910',
      eventType: 'EVIDENCE_URL_VERIFIED',
      actor: 'ACEE Compliance Crawler v2.4',
      actorRole: 'ACEE_ENGINE',
      sha256Hash: '3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d',
      parentHash: '1a2f3e4d5c6b7a8f9a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b',
      payloadSummary: 'Scraped YouTube Video ID acme_glow_review. Verified brand mention & disclosure tag.',
      verificationStatus: 'VERIFIED'
    },
    {
      id: 'AUD-9907',
      timestamp: '2026-07-26 18:02:00 UTC',
      contractNumber: '#ACEE-9880',
      eventType: 'CONTRACT_PARSED_BY_AI',
      actor: 'ACEE Ingestion Engine',
      actorRole: 'ACEE_ENGINE',
      sha256Hash: '1a2f3e4d5c6b7a8f9a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b',
      parentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      payloadSummary: 'Parsed 3 deliverables and 2 usage rights clauses with 98.4% confidence score.',
      verificationStatus: 'VERIFIED'
    }
  ];

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mockAuditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `acee_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: 'Audit Logs Exported',
      description: 'Downloaded cryptographically verifiable JSON log package.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-mono">
                Immutable Ledger
              </Badge>
              <span className="text-xs text-muted-foreground">• Cryptographic SHA-256 Hash Chain</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Audit Trail & Verification Logs
            </h1>
          </div>

          <Button onClick={handleExportJson} variant="outline" className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Export Verifiable JSON
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search contract #, hash, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 text-xs h-8">
                <SelectValue placeholder="Filter Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Event Types</SelectItem>
                <SelectItem value="ESCROW">Escrow Events</SelectItem>
                <SelectItem value="SIGNED">Signed PDF Uploads</SelectItem>
                <SelectItem value="EVIDENCE">Evidence Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="space-y-3">
          {mockAuditLogs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl border border-border bg-card space-y-3 hover:border-border/80 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {log.id}
                  </Badge>
                  <span className="font-mono font-bold text-foreground text-xs">{log.contractNumber}</span>
                  <span className="text-xs font-semibold text-primary">• {log.eventType}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[9px] font-mono gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {log.verificationStatus}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">{log.timestamp}</span>
                </div>
              </div>

              <p className="text-xs text-foreground font-medium">{log.payloadSummary}</p>

              {/* Cryptographic Hash Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2.5 rounded bg-muted/40 border border-border/50 text-[10px] font-mono">
                <div>
                  <span className="text-muted-foreground uppercase tracking-wider block">SHA-256 Hash:</span>
                  <span className="text-primary truncate block">{log.sha256Hash}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-wider block">Parent Block Hash:</span>
                  <span className="text-muted-foreground truncate block">{log.parentHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
