-- Create maps table
CREATE TABLE public.maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  grid_width INTEGER NOT NULL DEFAULT 20,
  grid_height INTEGER NOT NULL DEFAULT 15,
  cell_size INTEGER NOT NULL DEFAULT 40,
  background_color TEXT DEFAULT '#1a1a2e',
  background_image_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create map tokens table
CREATE TABLE public.map_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  token_type TEXT DEFAULT 'character',
  image_url TEXT,
  color TEXT DEFAULT '#ef4444',
  size INTEGER DEFAULT 1,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  layer INTEGER DEFAULT 1,
  is_visible BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for maps
CREATE POLICY "Users can view their own maps" 
ON public.maps FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own maps" 
ON public.maps FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maps" 
ON public.maps FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maps" 
ON public.maps FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for map tokens
CREATE POLICY "Users can view tokens on their maps" 
ON public.map_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tokens on their maps" 
ON public.map_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update tokens on their maps" 
ON public.map_tokens FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete tokens on their maps" 
ON public.map_tokens FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_maps_updated_at
BEFORE UPDATE ON public.maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_map_tokens_updated_at
BEFORE UPDATE ON public.map_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();