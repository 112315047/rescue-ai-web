import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Case } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsPanel } from '@/components/dashboard/StatsPanel';
import { CaseCard } from '@/components/dashboard/CaseCard';
import { CaseDetail } from '@/components/dashboard/CaseDetail';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  useEffect(() => {
    fetchCases();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('cases-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCases((prev) => [payload.new as Case, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCases((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Case) : c))
            );
            // Update selected case if it's the one being updated
            if (selectedCase?.id === payload.new.id) {
              setSelectedCase(payload.new as Case);
            }
          } else if (payload.eventType === 'DELETE') {
            setCases((prev) => prev.filter((c) => c.id !== payload.old.id));
            if (selectedCase?.id === payload.old.id) {
              setSelectedCase(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCase?.id]);

  const fetchCases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('urgency_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
    } else {
      setCases(data || []);
    }
    setLoading(false);
  };

  const filteredCases = cases.filter((c) => {
    if (filter === 'active') return c.status !== 'resolved';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  const activeCasesCount = cases.filter((c) => c.status !== 'resolved').length;
  const resolvedCasesCount = cases.filter((c) => c.status === 'resolved').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container px-4 py-4 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Operations Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time emergency case management
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCases}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <StatsPanel cases={cases} />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Cases List */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cases</CardTitle>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="active" className="text-xs px-3">
                      Active
                      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                        {activeCasesCount}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="text-xs px-3">
                      Resolved
                      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                        {resolvedCasesCount}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="all" className="text-xs px-3">
                      All
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4">
              <ScrollArea className="h-full pr-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-muted-foreground">Loading cases...</span>
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No cases found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCases.map((c) => (
                      <CaseCard
                        key={c.id}
                        caseData={c}
                        onClick={() => setSelectedCase(c)}
                        isSelected={selectedCase?.id === c.id}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Case Detail */}
          <div className="flex flex-col min-h-0">
            {selectedCase ? (
              <CaseDetail caseData={selectedCase} onUpdate={fetchCases} />
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Select a Case</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on a case to view details and manage it
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
