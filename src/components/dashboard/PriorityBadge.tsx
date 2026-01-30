import { Badge } from '@/components/ui/badge';
import { CasePriority } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: CasePriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants: Record<CasePriority, string> = {
    P1: 'priority-p1',
    P2: 'priority-p2',
    P3: 'priority-p3',
    P4: 'priority-p4',
  };

  return (
    <Badge className={cn('font-bold', variants[priority], className)}>{priority}</Badge>
  );
}
