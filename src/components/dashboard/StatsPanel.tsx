import { Case } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface StatsPanelProps {
  cases: Case[];
}

export function StatsPanel({ cases }: StatsPanelProps) {
  const activeCases = cases.filter((c) => c.status !== 'resolved');
  const criticalCases = cases.filter((c) => c.priority === 'P1' && c.status !== 'resolved');
  
  // Get today's resolved cases
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resolvedToday = cases.filter((c) => {
    const updatedAt = new Date(c.updated_at);
    return c.status === 'resolved' && updatedAt >= today;
  });

  const stats = [
    {
      title: 'Active Cases',
      value: activeCases.length,
      icon: Activity,
      color: 'text-status-active',
      bgColor: 'bg-status-active/10',
    },
    {
      title: 'Critical (P1)',
      value: criticalCases.length,
      icon: AlertTriangle,
      color: 'text-priority-p1',
      bgColor: 'bg-priority-p1/10',
    },
    {
      title: 'Resolved Today',
      value: resolvedToday.length,
      icon: CheckCircle,
      color: 'text-status-resolved',
      bgColor: 'bg-status-resolved/10',
    },
    {
      title: 'Avg Response',
      value: '< 2m',
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
