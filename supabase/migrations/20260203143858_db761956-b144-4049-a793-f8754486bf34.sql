-- Create investigation boards table
CREATE TABLE public.investigation_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  background_color TEXT DEFAULT '#1a1a1a',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investigation clues table
CREATE TABLE public.investigation_clues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.investigation_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  clue_type TEXT DEFAULT 'evidence',
  image_url TEXT,
  color TEXT DEFAULT '#dc2626',
  position_x DOUBLE PRECISION NOT NULL DEFAULT 100,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 100,
  is_pinned BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investigation connections table (the strings/wires)
CREATE TABLE public.investigation_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.investigation_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_clue_id UUID NOT NULL REFERENCES public.investigation_clues(id) ON DELETE CASCADE,
  target_clue_id UUID NOT NULL REFERENCES public.investigation_clues(id) ON DELETE CASCADE,
  label TEXT,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investigation_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investigation_boards
CREATE POLICY "Users can view their own boards" ON public.investigation_boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" ON public.investigation_boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON public.investigation_boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.investigation_boards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for investigation_clues
CREATE POLICY "Users can view their own clues" ON public.investigation_clues
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clues" ON public.investigation_clues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clues" ON public.investigation_clues
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clues" ON public.investigation_clues
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for investigation_connections
CREATE POLICY "Users can view their own connections" ON public.investigation_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections" ON public.investigation_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON public.investigation_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON public.investigation_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_investigation_boards_updated_at
  BEFORE UPDATE ON public.investigation_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investigation_clues_updated_at
  BEFORE UPDATE ON public.investigation_clues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();