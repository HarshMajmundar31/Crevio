import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/30' },
  accepted: { label: 'Accepted', className: 'bg-primary/15 text-primary border-primary/30' },
  locked: { label: 'Locked', className: 'bg-accent/15 text-accent border-accent/30' },
  executed: { label: 'Executed', className: 'bg-success/15 text-success border-success/30' },
  completed: { label: 'Completed', className: 'bg-success/15 text-success border-success/30' },
  disputed: { label: 'Disputed', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  active: { label: 'Active', className: 'bg-accent/15 text-accent border-accent/30' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Submitted', className: 'bg-primary/15 text-primary border-primary/30' },
  verified: { label: 'Verified', className: 'bg-success/15 text-success border-success/30' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function ContractStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
