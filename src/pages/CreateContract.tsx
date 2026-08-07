import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, DollarSign, FileText, User, Upload } from 'lucide-react';
import { getApplications, ingestContract, type ApiCampaignApplication } from '@/lib/api';

export default function CreateContract() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    applicationId: '',
    campaignId: '',
    creatorId: '',
    paymentAmount: '',
    deadline: '',
    notes: '',
  });
  const [applications, setApplications] = useState<ApiCampaignApplication[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedApplication = applications.find((application) => application.id === formData.applicationId) || null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getApplications({ status: 'approved' });
        const approved = (result.applications || []).filter((application) => !application.contract_id);
        setApplications(approved);

        const presetApplicationId = searchParams.get('applicationId');
        if (presetApplicationId && approved.some((application) => application.id === presetApplicationId)) {
          const preset = approved.find((application) => application.id === presetApplicationId);
          if (preset) {
            setFormData((previous) => ({
              ...previous,
              applicationId: preset.id,
              campaignId: preset.campaign_id,
              creatorId: preset.creator_id,
              paymentAmount: String(preset.proposed_fee || ''),
            }));
          }
        }
      } catch {
        setApplications([]);
      }
    };

    void loadData();
  }, [searchParams]);

  const handleApplicationChange = (applicationId: string) => {
    const application = applications.find((item) => item.id === applicationId);
    if (!application) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      applicationId,
      campaignId: application.campaign_id,
      creatorId: application.creator_id,
      paymentAmount: String(application.proposed_fee || ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.applicationId || !formData.campaignId || !formData.creatorId || !formData.paymentAmount || !contractFile) {
      toast({
        title: 'Missing Information',
        description: 'Approved application, campaign, creator, payment amount, and contract document are required.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await ingestContract({
        applicationId: formData.applicationId,
        campaignId: formData.campaignId,
        creatorId: formData.creatorId,
        paymentAmount: formData.paymentAmount,
        contractDeadline: formData.deadline || undefined,
        notes: formData.notes || undefined,
        file: contractFile,
      });

      toast({
        title: 'Brand-Signed Contract Uploaded',
        description: 'Contract moved to pending for creator e-sign, then final submission lock flow.',
      });
      navigate('/contracts');
    } catch (error) {
      toast({
        title: 'Ingestion Failed',
        description: error instanceof Error ? error.message : 'Unable to ingest contract document.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'brand' && user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Only brands or admins can ingest contracts.</p>
          <Button onClick={() => navigate('/contracts')} className="mt-4">
            View Contracts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/contracts')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upload Brand-Signed Contract</h1>
            <p className="text-muted-foreground">Crevio manages the contract process after brand signed upload: creator e-sign, final submission lock, then task execution.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract Context
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Approved Application *</Label>
                  <Select value={formData.applicationId} onValueChange={handleApplicationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((application) => (
                        <SelectItem key={application.id} value={application.id}>
                          {application.campaign_title} - {application.creator_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Creator</Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication?.creator_name || 'Select application'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campaign</Label>
                <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                  {selectedApplication?.campaign_title || 'Select application'}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Payment Amount ($) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-10"
                      value={formData.paymentAmount}
                      onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contract Deadline</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contract Document *</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept=".pdf,.md,.txt"
                    onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                    required
                  />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Supported formats: PDF, Markdown, text.</p>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Optional notes for creator/admin monitoring"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/contracts')}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? 'Ingesting...' : 'Upload & Extract Terms'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
