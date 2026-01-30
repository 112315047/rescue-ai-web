-- Create enum for case priority
CREATE TYPE public.case_priority AS ENUM ('P1', 'P2', 'P3', 'P4');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('active', 'assigned', 'resolved');

-- Create enum for case category
CREATE TYPE public.case_category AS ENUM ('medical', 'fire', 'trapped', 'shelter', 'food', 'water', 'mental', 'other');

-- Create enum for message sender
CREATE TYPE public.message_sender AS ENUM ('user', 'assistant');

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL DEFAULT 'en',
  location TEXT,
  priority case_priority DEFAULT 'P4',
  urgency_score INTEGER DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  category case_category DEFAULT 'other',
  escalation_needed BOOLEAN DEFAULT false,
  status case_status DEFAULT 'active',
  assigned_to TEXT,
  last_message TEXT,
  triage_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_messages_case_id ON public.messages(case_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_priority ON public.cases(priority);
CREATE INDEX idx_cases_urgency ON public.cases(urgency_score DESC);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (for hackathon demo mode - no auth required)
CREATE POLICY "Allow public read cases"
ON public.cases FOR SELECT
USING (true);

CREATE POLICY "Allow public insert cases"
ON public.cases FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update cases"
ON public.cases FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read messages"
ON public.messages FOR SELECT
USING (true);

CREATE POLICY "Allow public insert messages"
ON public.messages FOR INSERT
WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for cases updated_at
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();