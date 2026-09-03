import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getApplications,
  updateApplicationStatus,
  type ApiCampaignApplication,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const statusOptions = ['all', 'submitted', 'shortlisted', 'interviewing', 'approved', 'rejected', 'withdrawn'] as const;

type StatusOption = (typeof statusOptions)[number];

type DraftFields = {
  brandNotes: string;
  negotiationNotes: string;
  usageRights: string;
  exclusivityTerms: string;
  revisionTerms: string;
  payoutTerms: string;
};

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<ApiCampaignApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusOption>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});

  const loadApplications = async () => {
    try {
      setLoading(true);
      const result = await getApplications({ status: statusFilter === 'all' ? undefined : statusFilter });
      const rows = result.applications || [];
      setApplications(rows);
      setDrafts((previous) => {
        const next = { ...previous };
        for (const application of rows) {
          if (!next[application.id]) {
            next[application.id] = {
              brandNotes: application.brand_notes || '',
              negotiationNotes: application.negotiation_notes || '',
              usageRights: application.usage_rights || '',
              exclusivityTerms: application.exclusivity_terms || '',
              revisionTerms: application.revision_terms || '',
              payoutTerms: application.payout_terms || '',
            };
          }
        }
        return next;
      });
    } catch (error) {
      toast({
        title: 'Failed to load applications',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, [statusFilter]);

  const isBrandView = user?.role === 'brand' || user?.role === 'admin';
  const isCreatorView = user?.role === 'creator';

  const updateDraft = (id: string, field: keyof DraftFields, value: string) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] || {
          brandNotes: '',
          negotiationNotes: '',
          usageRights: '',
          exclusivityTerms: '',
          revisionTerms: '',
          payoutTerms: '',
        }),
        [field]: value,
      },
    }));
  };

  const saveNegotiationFields = async (application: ApiCampaignApplication) => {
    const draft = drafts[application.id];
    if (!draft) return;

    try {
      setSavingId(application.id);
      await updateApplicationStatus(application.id, {
        brandNotes: draft.brandNotes,
        negotiationNotes: draft.negotiationNotes,
        usageRights: draft.usageRights,
        exclusivityTerms: draft.exclusivityTerms,
        revisionTerms: draft.revisionTerms,
        payoutTerms: draft.payoutTerms,
      });
      toast({ title: 'Negotiation details saved' });
      await loadApplications();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unable to save details.',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const transitionStatus = async (
    application: ApiCampaignApplication,
    nextStatus: 'shortlisted' | 'interviewing' | 'approved' | 'rejected' | 'withdrawn'
  ) => {
    try {
      setSavingId(application.id);
      await updateApplicationStatus(application.id, { status: nextStatus });
      toast({ title: `Application moved to ${nextStatus}` });
      await loadApplications();
    } catch (error) {
      toast({
        title: 'Status update failed',
        description: error instanceof Error ? error.message : 'Unable to update application status.',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const statusBadgeClass = useMemo(
    () =>
      ({
        submitted: 'bg-blue-100 text-blue-700',
        shortlisted: 'bg-indigo-100 text-indigo-700',
        interviewing: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-rose-100 text-rose-700',
        withdrawn: 'bg-slate-100 text-slate-700',
      } as Record<string, string>),
    []
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{isCreatorView ? 'My Applications' : 'Application Inbox'}</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${applications.length} applications`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="application-status-filter" className="text-xs">Status</Label>
            <select
              id="application-status-filter"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusOption)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All' : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && applications.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex gap-2 items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
              <div className="rounded-md border bg-muted/20 p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </Card>
          ))
        ) : applications.map((application) => {
          const draft = drafts[application.id] || {
            brandNotes: '',
            negotiationNotes: '',
            usageRights: '',
            exclusivityTerms: '',
            revisionTerms: '',
            payoutTerms: '',
          };

          return (
            <Card key={application.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    className="text-left text-lg font-semibold hover:underline"
                    onClick={() => navigate(`/applications/${application.id}`)}
                  >
                    {application.campaign_title}
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {application.creator_name} {'->'} {application.brand_name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass[application.status] || 'bg-muted text-foreground'}`}
                >
                  {application.status}
                </span>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                <div>Audience fit: <strong>{Number(application.audience_fit_score).toFixed(1)}</strong></div>
                <div>Engagement: <strong>{Number(application.engagement_quality_score).toFixed(1)}</strong></div>
                <div>Content fit: <strong>{Number(application.content_quality_score).toFixed(1)}</strong></div>
                <div>Reliability: <strong>{Number(application.reliability_score).toFixed(1)}</strong></div>
                <div>Budget fit: <strong>{Number(application.budget_fit_score).toFixed(1)}</strong></div>
                <div>Overall fit: <strong>{Number(application.fit_score).toFixed(1)}</strong></div>
              </div>

              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <p><strong>Pitch:</strong> {application.pitch_message}</p>
                <p className="mt-2"><strong>Deliverables:</strong> {application.proposed_deliverables}</p>
                <p className="mt-2"><strong>Fee:</strong> ${Number(application.proposed_fee).toLocaleString()} ({application.proposed_payment_model})</p>
                <p className="mt-2"><strong>Start:</strong> {application.earliest_start_date}</p>
              </div>

              {isBrandView && (
                <div className="space-y-3 rounded-md border p-3">
                  <h3 className="text-sm font-semibold">Negotiation & Terms</h3>
                  <Textarea
                    rows={2}
                    placeholder="Brand notes"
                    value={draft.brandNotes}
                    onChange={(event) => updateDraft(application.id, 'brandNotes', event.target.value)}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Negotiation notes"
                    value={draft.negotiationNotes}
                    onChange={(event) => updateDraft(application.id, 'negotiationNotes', event.target.value)}
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Usage rights"
                      value={draft.usageRights}
                      onChange={(event) => updateDraft(application.id, 'usageRights', event.target.value)}
                    />
                    <Input
                      placeholder="Exclusivity terms"
                      value={draft.exclusivityTerms}
                      onChange={(event) => updateDraft(application.id, 'exclusivityTerms', event.target.value)}
                    />
                    <Input
                      placeholder="Revision terms"
                      value={draft.revisionTerms}
                      onChange={(event) => updateDraft(application.id, 'revisionTerms', event.target.value)}
                    />
                    <Input
                      placeholder="Payout terms"
                      value={draft.payoutTerms}
                      onChange={(event) => updateDraft(application.id, 'payoutTerms', event.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    {application.status !== 'approved' && application.status !== 'rejected' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === application.id}
                          onClick={() => void saveNegotiationFields(application)}
                        >
                          Save Terms
                        </Button>
                        {application.status === 'submitted' && (
                          <Button size="sm" variant="outline" disabled={savingId === application.id} onClick={() => void transitionStatus(application, 'shortlisted')}>
                            Shortlist
                          </Button>
                        )}
                        {(application.status === 'submitted' || application.status === 'shortlisted') && (
                          <Button size="sm" variant="outline" disabled={savingId === application.id} onClick={() => void transitionStatus(application, 'interviewing')}>
                            Interviewing
                          </Button>
                        )}
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={savingId === application.id} onClick={() => void transitionStatus(application, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" disabled={savingId === application.id} onClick={() => void transitionStatus(application, 'rejected')}>
                          Reject
                        </Button>
                      </>
                    ) : application.status === 'approved' ? (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        ✓ Creator Approved & Active
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                        Application Rejected
                      </span>
                    )}

                    {application.status === 'approved' && !application.contract_id && (
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={() => navigate(`/contracts/create?applicationId=${encodeURIComponent(application.id)}`)}
                      >
                        Start Contract Management
                      </Button>
                    )}

                    {application.contract_id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-auto"
                        onClick={() => navigate(`/contracts/${application.contract_id}`)}
                      >
                        Open Contract
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isCreatorView && ['submitted', 'shortlisted', 'interviewing'].includes(application.status) && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === application.id}
                    onClick={() => void transitionStatus(application, 'withdrawn')}
                  >
                    Withdraw Application
                  </Button>
                </div>
              )}
            </Card>
          );
        })}

        {!loading && applications.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No applications found for the selected filter.
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
