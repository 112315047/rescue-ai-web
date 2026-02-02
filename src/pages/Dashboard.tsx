import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Case } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsPanel } from '@/components/dashboard/StatsPanel';
import { CaseCard } from '@/components/dashboard/CaseCard';
import { CaseDetail } from '@/components/dashboard/CaseDetail';
import { MapPanel } from '@/components/dashboard/MapPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Inbox, LayoutDashboard, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as api from '@/services/api';

const Dashboard = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  useEffect(() => {
    fetchCases();

    // Subscribe to real-time updates
    // NOTE: Keeping Supabase Realtime for immediate dashboard updates as a progressive enhancement.
    // If strict API-only is required, this block can be removed and we rely on polling/manual refresh.
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
    try {
        const data = await api.getCases();
        console.log('Dashboard: Fetched cases:', data?.length);
        setCases(data || []);
    } catch (error) {
        console.error('Error fetching cases:', error);
    } finally {
        setLoading(false);
    }
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

      <main className="flex-1 container px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time emergency situational awareness
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCases}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <StatsPanel cases={cases} />

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0">
          {/* Left Column: Cases List (4/12) */}
          <Card className="xl:col-span-4 flex flex-col h-[700px] xl:h-[800px] bg-background/50 backdrop-blur-sm border-primary/10 overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-primary" />
                  Incidents
                </CardTitle>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="active" className="text-xs px-2">
                      Active
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1">
                        {activeCasesCount}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="text-xs px-2">
                      Resolved
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-3">
              <ScrollArea className="h-[calc(100vh-450px)] xl:h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center opacity-50">
                    <Inbox className="h-8 w-8 mb-2" />
                    <p className="text-sm">No cases found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
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

          {/* Right Column: Map & Detail (8/12) */}
          <div className="xl:col-span-8 flex flex-col gap-4 min-h-0">
            {/* Top: Map */}
            <div className="h-[400px] shrink-0">
              <MapPanel 
                cases={cases} 
                selectedCaseId={selectedCase?.id} 
                onCaseSelect={setSelectedCase}
              />
            </div>

            {/* Bottom: Detail */}
            <div className="flex-1 min-h-0">
              {selectedCase ? (
                <CaseDetail caseData={selectedCase} onUpdate={fetchCases} />
              ) : (
                <Card className="h-full flex items-center justify-center border-dashed border-2 bg-muted/5">
                  <div className="text-center opacity-50">
                    <LayoutDashboard className="h-12 w-12 mx-auto mb-3" />
                    <h3 className="font-semibold">Incident Command View</h3>
                    <p className="text-sm">Select an incident from the map or list to begin triage</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
