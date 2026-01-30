import { Badge } from '@/components/ui/badge';
import { CaseStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<CaseStatus, { class: string; label: string }> = {
    active: { class: 'bg-status-active text-white', label: 'Active' },
    assigned: { class: 'bg-status-assigned text-white', label: 'Assigned' },
    resolved: { class: 'bg-status-resolved text-white', label: 'Resolved' },
  };

  const variant = variants[status];

  return (
    <Badge variant="outline" className={cn(variant.class, className)}>
      {variant.label}
    </Badge>
  );
}
