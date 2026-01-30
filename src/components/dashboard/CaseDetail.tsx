import { useState, useEffect } from 'react';
import { Case, Message } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { MapPin, User, AlertTriangle, Clock, CheckCircle, RotateCcw, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface CaseDetailProps {
  caseData: Case;
  onUpdate: () => void;
}

export function CaseDetail({ caseData, onUpdate }: CaseDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${caseData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `case_id=eq.${caseData.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseData.id]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('case_id', caseData.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!assignee.trim()) {
      toast.error('Please enter volunteer name');
      return;
    }

    setUpdating(true);
    const { error } = await supabase
      .from('cases')
      .update({ assigned_to: assignee.trim(), status: 'assigned' })
      .eq('id', caseData.id);

    if (error) {
      toast.error('Failed to assign case');
    } else {
      toast.success('Case assigned successfully');
      setAssignee('');
      onUpdate();
    }
    setUpdating(false);
  };

  const handleStatusChange = async (newStatus: 'resolved' | 'active') => {
    setUpdating(true);
    const { error } = await supabase
      .from('cases')
      .update({ status: newStatus })
      .eq('id', caseData.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Case ${newStatus === 'resolved' ? 'resolved' : 'reopened'}`);
      onUpdate();
    }
    setUpdating(false);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={caseData.priority} />
              <StatusBadge status={caseData.status} />
              {caseData.escalation_needed && (
                <span className="flex items-center gap-1 text-sm text-destructive font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Escalation Needed
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground uppercase">{caseData.language}</span>
          </div>
          <CardTitle className="text-lg capitalize mt-2">{caseData.category} Emergency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(caseData.created_at), 'MMM d, HH:mm')}</span>
            </div>
            {caseData.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{caseData.location}</span>
              </div>
            )}
            {caseData.assigned_to && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{caseData.assigned_to}</span>
              </div>
            )}
            <div className="text-muted-foreground">
              Urgency Score: <span className="font-bold text-foreground">{caseData.urgency_score}</span>/100
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {caseData.status !== 'resolved' && (
              <>
                <div className="flex gap-2 flex-1 min-w-[200px]">
                  <Input
                    placeholder="Volunteer name"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAssign} disabled={updating} size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                </div>
                <Button
                  onClick={() => handleStatusChange('resolved')}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                  className="text-status-resolved border-status-resolved hover:bg-status-resolved/10"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Resolved
                </Button>
              </>
            )}
            {caseData.status === 'resolved' && (
              <Button
                onClick={() => handleStatusChange('active')}
                disabled={updating}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reopen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 pb-4">
          <ScrollArea className="h-full pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-muted-foreground">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-muted-foreground">No messages yet</span>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {caseData.triage_data && typeof caseData.triage_data === 'object' && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Triage Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
              {JSON.stringify(caseData.triage_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
