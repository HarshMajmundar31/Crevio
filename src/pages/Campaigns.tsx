import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import { deleteCampaign, getCampaigns, type ApiCampaign } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, IndianRupee, Tag, ArrowUpRight, Users, Search, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
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

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function Campaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = user?.role || 'brand';
  
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const result = await getCampaigns({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          platform: platformFilter === 'all' ? undefined : platformFilter,
        });
        setCampaigns(result.campaigns || []);
      } catch (error) {
        toast({
          title: 'Failed to load campaigns',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void loadCampaigns();
  }, [toast, debouncedSearch, statusFilter, platformFilter]);

  const handleDeleteCampaign = async (campaign: ApiCampaign) => {
    const confirmDelete = window.confirm(`Delete campaign "${campaign.title}"? This will mark it as cancelled.`);
    if (!confirmDelete) {
      return;
    }

    try {
      await deleteCampaign(campaign.id);
      toast({ title: 'Campaign Deleted', description: 'Campaign has been marked as cancelled.' });
      const result = await getCampaigns({
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        platform: platformFilter === 'all' ? undefined : platformFilter,
      });
      setCampaigns(result.campaigns || []);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unable to delete campaign.',
        variant: 'destructive',
      });
    }
  };

  const availablePlatforms = Array.from(new Set(campaigns.map((campaign) => campaign.platform))).filter(Boolean);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{role === 'creator' ? 'Browse Campaigns' : 'Campaigns'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{loading ? 'Loading...' : `${campaigns.length} campaigns found`}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <Search className="w-3.5 h-3.5" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaigns..."
              className="h-6 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
            />
          </div>

          <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter className="w-3 h-3 mr-1.5" /> Filter
          </Button>

          {(role === 'brand' || role === 'admin') && (
            <Button
              className="gradient-primary text-primary-foreground font-medium"
              onClick={() => navigate('/campaigns/create')}
            >
              + New Campaign
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 grid md:grid-cols-2 gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {availablePlatforms.map((platform) => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {loading && campaigns.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card-elevated overflow-hidden border border-border/50 flex flex-col h-[320px]">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 flex flex-col flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="mt-auto flex gap-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : campaigns.map(campaign => (
          <motion.div
            key={campaign.id}
            variants={stagger.item}
            className="glass-card-elevated overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 flex flex-col"
          >
            <div 
              className="relative h-40 overflow-hidden"
              style={{
                background: campaign.cover_image_url 
                  ? `url(${campaign.cover_image_url}) center/cover no-repeat` 
                  : campaign.highlight_color 
                    ? `linear-gradient(135deg, ${campaign.highlight_color} 0%, rgba(0,0,0,0.8) 100%)`
                    : 'linear-gradient(135deg, var(--primary) 0%, #1e1e1e 100%)'
              }}
            >
              {/* Overlay for readability if cover image is present */}
              {campaign.cover_image_url && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />}
              
              <div className="absolute top-3 left-3 flex gap-2">
                <ContractStatusBadge status={campaign.status} />
              </div>
              <div className="absolute top-3 right-3">
                <div className="bg-background/80 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-xs font-semibold flex items-center gap-1 shadow-sm text-foreground">
                  <IndianRupee className="w-3 h-3 text-emerald-500" />
                  ₹{Number(campaign.budget).toLocaleString()} Prize Pool
                </div>
              </div>
              
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                 <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 max-w-[80%]">
                    <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider block mb-0.5">
                      {!campaign.brand_name || campaign.brand_name.includes('ACEMS') ? 'Brand Partner' : campaign.brand_name}
                    </span>
                    <h3 className="text-white font-bold text-sm leading-tight truncate">{campaign.title}</h3>
                 </div>
              </div>
            </div>
            
            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">{campaign.description}</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded-md p-2 border border-border/50">
                  <Tag className="w-3.5 h-3.5 text-primary" /> 
                  <span className="truncate">{campaign.platform}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded-md p-2 border border-border/50">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> 
                  <span className="truncate">Ends {campaign.deadline}</span>
                </div>
              </div>

              {role === 'creator' && (
                <Button
                  size="sm"
                  className="w-full text-xs font-semibold mt-2 group/btn"
                  onClick={() => navigate(`/campaigns/${campaign.id}/apply`)}
                  disabled={Boolean(campaign.has_applied) || campaign.status !== 'active'}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  {campaign.has_applied
                    ? 'Application Submitted'
                    : 'Apply Now'}
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              )}

              {(role === 'brand' || role === 'admin') && (
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    View Details
                  </Button>
                  {campaign.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                      onClick={() => void handleDeleteCampaign(campaign)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </DashboardLayout>
  );
}
