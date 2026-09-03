import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowRight, Search, Filter, Lock, Trash2, Download, FileCheck, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { deleteContract, getContracts, apiDownloadCampaignContract, apiDownloadSignedContract } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ContractRow = {
  id: string;
  campaign_id: string;
  campaign_title?: string;
  brand_id: string;
  brand_name: string;
  creator_id: string;
  creator_name: string;
  status: string;
  payment_amount: number | string;
  total_deliverables: number | string;
  verified_deliverables: number | string;
  contract_file_name?: string;
  signed_contract_name?: string;
  is_contract_locked?: boolean;
  contract_type?: string;
};

export default function Contracts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = user?.role || 'brand';
  
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const result = await getContracts({
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setContracts(result.contracts as ContractRow[]);
    } catch (error) {
      toast({
        title: 'Failed to load contracts',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContracts();
  }, [debouncedSearch, statusFilter]);

  const handleDeleteContract = async (contract: ContractRow) => {
    const confirmDelete = window.confirm(`Delete contract ${contract.id}? This will mark it as cancelled.`);
    if (!confirmDelete) {
      return;
    }

    try {
      await deleteContract(contract.id);
      toast({ title: 'Contract Deleted', description: 'Contract has been marked as cancelled.' });
      await loadContracts();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unable to delete contract.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadMaster = async (contract: ContractRow) => {
    const campaignId = contract.campaign_id;
    if (!campaignId) return;
    try {
      setDownloadingId(`master_${contract.id}`);
      await apiDownloadCampaignContract(campaignId);
      toast({ title: 'Download Complete', description: 'Master contract PDF saved.' });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Unable to download master contract.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSigned = async (contract: ContractRow) => {
    const campaignId = contract.campaign_id;
    if (!campaignId) return;
    try {
      setDownloadingId(`signed_${contract.id}`);
      await apiDownloadSignedContract(campaignId, role === 'brand' ? contract.creator_id : undefined);
      toast({ title: 'Download Complete', description: 'Signed contract PDF saved.' });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Unable to download signed contract.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const verifiedCount = (contract: ContractRow) => Number(contract.verified_deliverables || 0);
  const deliverableCount = (contract: ContractRow) => Number(contract.total_deliverables || 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{role === 'admin' ? 'All Contracts' : 'My Contracts'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${contracts.length} contract${contracts.length === 1 ? '' : 's'} registered in system`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <Search className="w-3.5 h-3.5" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search contracts..."
              className="h-6 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter className="w-3 h-3 mr-1.5" /> Filter
          </Button>
          {(role === 'brand' || role === 'admin') && (
            <Button 
              className="gradient-primary text-primary-foreground font-medium text-xs"
              onClick={() => navigate('/campaigns/new')}
            >
              + New Campaign Contract
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 max-w-xs">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Campaign & Contract</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">{role === 'brand' ? 'Creator' : 'Brand'}</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Amount</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Deliverables</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && contracts.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"></td>
                  </tr>
                ))
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                    No contracts found. Upload a contract during campaign setup to view it here.
                  </td>
                </tr>
              ) : contracts.map((contract, i) => (
                <motion.tr
                  key={contract.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                        {contract.status === 'locked' ? (
                          <Lock className="w-4 h-4 text-accent" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[240px]">
                          {contract.campaign_title || contract.campaign_id || 'Contract'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {contract.id}
                          </span>
                          {contract.signed_contract_name && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                              Signed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">
                    {role === 'brand' ? (contract.creator_name || 'Open Roster') : (contract.brand_name || 'Brand Partner')}
                  </td>
                  <td className="p-4 text-sm font-semibold tabular-nums">
                    ${Number(contract.payment_amount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <ContractStatusBadge status={contract.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${deliverableCount(contract) === 0 ? 0 : (verifiedCount(contract) / deliverableCount(contract)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {verifiedCount(contract)}/{deliverableCount(contract)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Master Contract Download */}
                      {contract.campaign_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                          disabled={downloadingId === `master_${contract.id}`}
                          onClick={() => void handleDownloadMaster(contract)}
                          title="Download Campaign Master Contract PDF"
                        >
                          <Download className="w-3.5 h-3.5 mr-1 text-primary" /> Master PDF
                        </Button>
                      )}

                      {/* Signed Contract Download */}
                      {contract.signed_contract_name && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          disabled={downloadingId === `signed_${contract.id}`}
                          onClick={() => void handleDownloadSigned(contract)}
                          title="Download Creator Signed Contract PDF"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" /> Signed PDF
                        </Button>
                      )}

                      {/* View Workspace / Contract */}
                      {contract.campaign_id ? (
                        <Link to={`/campaigns/${contract.campaign_id}?from=contracts`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                            Workspace <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                            View <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      )}

                      {(role === 'brand' || role === 'admin') && contract.status !== 'cancelled' && contract.contract_type === 'direct' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                          onClick={() => void handleDeleteContract(contract)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
