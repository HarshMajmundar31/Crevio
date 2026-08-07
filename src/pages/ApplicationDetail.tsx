import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getApplicationDetail, type ApiApplicationEvent, type ApiCampaignApplication } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock3, FileText, ShieldCheck } from 'lucide-react';

function formatEventLabel(eventType: string) {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [application, setApplication] = useState<ApiCampaignApplication | null>(null);
  const [events, setEvents] = useState<ApiApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const result = await getApplicationDetail(id);
        setApplication(result.application);
        setEvents(result.events || []);
      } catch (error) {
        toast({
          title: 'Failed to load application detail',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, toast]);

  const negotiationTimeline = useMemo(() => {
    if (!application) {
      return [];
    }

    const items = [
      {
        label: 'Application Submitted',
        value: application.created_at,
        detail: 'Creator submitted proposal and initial fit scoring completed.',
      },
      {
        label: 'Brand Review Status',
        value: application.reviewed_at || null,
        detail: application.status,
      },
      {
        label: 'Negotiation Notes',
        value: application.updated_at,
        detail: application.negotiation_notes || 'No negotiation notes saved yet.',
      },
      {
        label: 'Usage Rights',
        value: application.updated_at,
        detail: application.usage_rights || 'Pending',
      },
      {
        label: 'Exclusivity Terms',
        value: application.updated_at,
        detail: application.exclusivity_terms || 'Pending',
      },
      {
        label: 'Revision Terms',
        value: application.updated_at,
        detail: application.revision_terms || 'Pending',
      },
      {
        label: 'Payout Terms',
        value: application.updated_at,
        detail: application.payout_terms || 'Pending',
      },
      {
        label: 'Contract Linked',
        value: application.contract_id ? application.updated_at : null,
        detail: application.contract_id || 'No contract linked yet.',
      },
    ];

    return items;
  }, [application]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
            <Card className="p-5 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="py-10 text-sm text-muted-foreground">Application not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link to="/applications" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Applications
        </Link>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{application.campaign_title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Creator: {application.creator_name} | Brand: {application.brand_name}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Application ID: {application.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Status</p>
              <p className="text-sm font-semibold mt-1">{application.status}</p>
              {application.contract_id && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to={`/contracts/${application.contract_id}`}>Open Linked Contract</Link>
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" />
              <h2 className="font-semibold">Negotiation Timeline</h2>
            </div>
            <div className="space-y-4">
              {negotiationTimeline.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{item.label}</p>
                    <span className="text-xs text-muted-foreground">
                      {item.value ? new Date(item.value).toLocaleString() : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4" />
              <h2 className="font-semibold">Audit Event Log</h2>
            </div>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {events.length === 0 && (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">No events recorded yet.</div>
              )}
              {events.map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{formatEventLabel(event.event_type)}</p>
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <Clock3 className="mr-1 h-3 w-3" />
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actor: {event.actor_name || event.actor_user_id || 'system'}
                  </p>
                  <pre className="mt-2 overflow-auto rounded bg-muted/50 p-2 text-[11px]">{JSON.stringify(event.payload || {}, null, 2)}</pre>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
