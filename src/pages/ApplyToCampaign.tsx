import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { applyToCampaign, getCampaign, type ApiCampaign } from '@/lib/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function ApplyToCampaign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [platformLinks, setPlatformLinks] = useState<string[]>(['']);
  const [pastWorkLinks, setPastWorkLinks] = useState<string[]>(['', '']);
  const [formData, setFormData] = useState({
    pitchMessage: '',
    audienceLocation: '',
    audienceAgeBand: '',
    audienceNiche: '',
    engagementSnapshot: '',
    proposedDeliverables: '',
    proposedFee: '',
    proposedPaymentModel: 'fixed_per_campaign',
    earliestStartDate: '',
    availabilityNotes: '',
    complianceAgreed: false,
  });

  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) {
        navigate('/campaigns');
        return;
      }

      try {
        setLoading(true);
        const result = await getCampaign(id);
        setCampaign(result.campaign || null);
      } catch (error) {
        toast({
          title: 'Unable to load campaign',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
        navigate('/campaigns');
      } finally {
        setLoading(false);
      }
    };

    void loadCampaign();
  }, [id, navigate, toast]);

  const normalizedPlatformLinks = useMemo(
    () => platformLinks.map((value) => value.trim()).filter(Boolean),
    [platformLinks]
  );

  const normalizedPastWorkLinks = useMemo(
    () => pastWorkLinks.map((value) => value.trim()).filter(Boolean),
    [pastWorkLinks]
  );

  const addPlatformLink = () => setPlatformLinks((previous) => [...previous, '']);
  const addPastWorkLink = () => setPastWorkLinks((previous) => [...previous, '']);

  const updatePlatformLink = (index: number, value: string) => {
    setPlatformLinks((previous) => previous.map((item, idx) => (idx === index ? value : item)));
  };

  const updatePastWorkLink = (index: number, value: string) => {
    setPastWorkLinks((previous) => previous.map((item, idx) => (idx === index ? value : item)));
  };

  const removePlatformLink = (index: number) => {
    setPlatformLinks((previous) => (previous.length > 1 ? previous.filter((_, idx) => idx !== index) : previous));
  };

  const removePastWorkLink = (index: number) => {
    setPastWorkLinks((previous) => (previous.length > 2 ? previous.filter((_, idx) => idx !== index) : previous));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    if (normalizedPlatformLinks.length < 1) {
      toast({
        title: 'Platform links required',
        description: 'Add at least one social profile link.',
        variant: 'destructive',
      });
      return;
    }

    if (normalizedPastWorkLinks.length < 2 || normalizedPastWorkLinks.length > 5) {
      toast({
        title: 'Past work links',
        description: 'Provide between 2 and 5 past work links.',
        variant: 'destructive',
      });
      return;
    }

    const fee = Number(formData.proposedFee || 0);
    if (!Number.isFinite(fee) || fee < 0) {
      toast({
        title: 'Invalid fee',
        description: 'Enter a valid proposed fee.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await applyToCampaign(id, {
        pitchMessage: formData.pitchMessage,
        platformLinks: normalizedPlatformLinks,
        audienceLocation: formData.audienceLocation,
        audienceAgeBand: formData.audienceAgeBand,
        audienceNiche: formData.audienceNiche,
        engagementSnapshot: formData.engagementSnapshot,
        pastWorkLinks: normalizedPastWorkLinks,
        proposedDeliverables: formData.proposedDeliverables,
        proposedFee: fee,
        proposedPaymentModel: formData.proposedPaymentModel,
        earliestStartDate: formData.earliestStartDate,
        availabilityNotes: formData.availabilityNotes,
        complianceAgreed: formData.complianceAgreed,
      });

      toast({
        title: 'Application submitted',
        description: 'Your proposal is now in the brand review queue.',
      });
      navigate('/applications');
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Unable to submit application.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'creator') {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Only creators can submit campaign applications.</p>
          <Button className="mt-4" onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !campaign) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-muted-foreground">Loading campaign...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
        </Button>

        <Card className="p-5">
          <h1 className="text-2xl font-bold">Apply to {campaign.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your full proposal for brand review. Platform: {campaign.platform}. Budget range:
            {' '}
            {campaign.budget_min || 0} - {campaign.budget_max || campaign.budget || 0}
          </p>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Pitch Message *</Label>
              <Textarea
                value={formData.pitchMessage}
                onChange={(event) => setFormData((prev) => ({ ...prev, pitchMessage: event.target.value }))}
                rows={4}
                placeholder="Explain why your audience and content style match this campaign."
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Audience Location *</Label>
                <Input
                  value={formData.audienceLocation}
                  onChange={(event) => setFormData((prev) => ({ ...prev, audienceLocation: event.target.value }))}
                  placeholder="India, Tier-1 cities"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Audience Age Band *</Label>
                <Input
                  value={formData.audienceAgeBand}
                  onChange={(event) => setFormData((prev) => ({ ...prev, audienceAgeBand: event.target.value }))}
                  placeholder="18-24"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Audience Niche *</Label>
                <Input
                  value={formData.audienceNiche}
                  onChange={(event) => setFormData((prev) => ({ ...prev, audienceNiche: event.target.value }))}
                  placeholder="Fitness lifestyle"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Engagement Snapshot *</Label>
              <Input
                value={formData.engagementSnapshot}
                onChange={(event) => setFormData((prev) => ({ ...prev, engagementSnapshot: event.target.value }))}
                placeholder="Avg engagement rate 6.2%, 1.8M monthly views"
                required
              />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Label>Platform Links (IG/TikTok/YouTube) *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPlatformLink}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {platformLinks.map((link, index) => (
              <div key={`platform-${index}`} className="flex items-center gap-2">
                <Input
                  value={link}
                  onChange={(event) => updatePlatformLink(index, event.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
                {platformLinks.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePlatformLink(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Label>Past Work Links (2-5) *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPastWorkLink}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {pastWorkLinks.map((link, index) => (
              <div key={`work-${index}`} className="flex items-center gap-2">
                <Input
                  value={link}
                  onChange={(event) => updatePastWorkLink(index, event.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {pastWorkLinks.length > 2 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePastWorkLink(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </Card>

          <Card className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Proposed Deliverables Package *</Label>
              <Textarea
                value={formData.proposedDeliverables}
                onChange={(event) => setFormData((prev) => ({ ...prev, proposedDeliverables: event.target.value }))}
                rows={3}
                placeholder="2 reels + 3 stories + 1 static carousel"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Proposed Fee *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.proposedFee}
                  onChange={(event) => setFormData((prev) => ({ ...prev, proposedFee: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Model *</Label>
                <Input
                  value={formData.proposedPaymentModel}
                  onChange={(event) => setFormData((prev) => ({ ...prev, proposedPaymentModel: event.target.value }))}
                  placeholder="fixed_per_campaign"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Earliest Start Date *</Label>
                <Input
                  type="date"
                  value={formData.earliestStartDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, earliestStartDate: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Availability Notes *</Label>
              <Textarea
                value={formData.availabilityNotes}
                onChange={(event) => setFormData((prev) => ({ ...prev, availabilityNotes: event.target.value }))}
                rows={3}
                placeholder="Available weekdays for revisions. Delivery window 10 days."
                required
              />
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="compliance"
                checked={formData.complianceAgreed}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, complianceAgreed: checked === true }))
                }
              />
              <Label htmlFor="compliance" className="text-sm leading-5">
                I agree to sponsored content compliance: disclose brand relationships clearly (ad/sponsored) and avoid false claims.
              </Label>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
