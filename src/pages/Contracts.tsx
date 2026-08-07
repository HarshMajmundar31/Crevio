import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowRight, Search, Filter, Lock, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { deleteContract, getContracts } from '@/lib/api';
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
  brand_id: string;
  brand_name: string;
  creator_id: string;
  creator_name: string;
  status: string;
  payment_amount: number | string;
  total_deliverables: number | string;
  verified_deliverables: number | string;
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
  }, [toast, debouncedSearch, statusFilter]);

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

  const verifiedCount = (contract: ContractRow) => Number(contract.verified_deliverables || 0);
  const deliverableCount = (contract: ContractRow) => Number(contract.total_deliverables || 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{role === 'admin' ? 'All Contracts' : 'My Contracts'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{loading ? 'Loading...' : `${contracts.length} contracts`}</p>
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
              onClick={() => navigate('/contracts/create')}
            >
              + New Contract
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
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Contract</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">{role === 'brand' ? 'Creator' : 'Brand'}</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Amount</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Deliverables</th>
                <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4"></th>
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
              ) : contracts.map((contract, i) => (
                <motion.tr
                  key={contract.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        {contract.status === 'locked' ? (
                          <Lock className="w-4 h-4 text-accent" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{contract.campaign_id}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{contract.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{role === 'brand' ? contract.creator_name : contract.brand_name}</td>
                  <td className="p-4 text-sm font-semibold tabular-nums">${Number(contract.payment_amount).toLocaleString()}</td>
                  <td className="p-4"><ContractStatusBadge status={contract.status} /></td>
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
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/contracts/${contract.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>

                      {(role === 'brand' || role === 'admin') && contract.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => void handleDeleteContract(contract)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
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
