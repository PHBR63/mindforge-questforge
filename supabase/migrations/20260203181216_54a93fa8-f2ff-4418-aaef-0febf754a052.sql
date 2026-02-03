-- Create table for placed tiles on maps
CREATE TABLE public.map_tiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tile_id TEXT NOT NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  rotation INTEGER NOT NULL DEFAULT 0,
  scale NUMERIC NOT NULL DEFAULT 1.0,
  is_visible BOOLEAN DEFAULT true,
  layer INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.map_tiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own tiles"
ON public.map_tiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tiles"
ON public.map_tiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiles"
ON public.map_tiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tiles"
ON public.map_tiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster map queries
CREATE INDEX idx_map_tiles_map_id ON public.map_tiles(map_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_map_tiles_updated_at
BEFORE UPDATE ON public.map_tiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();