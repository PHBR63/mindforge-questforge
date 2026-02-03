-- Create map_assets table for custom assets placed on maps
CREATE TABLE public.map_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'object',
  asset_key TEXT NOT NULL,
  name TEXT,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  rotation DOUBLE PRECISION DEFAULT 0,
  scale DOUBLE PRECISION DEFAULT 1,
  layer INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  custom_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.map_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assets" ON public.map_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assets" ON public.map_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON public.map_assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON public.map_assets
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_map_assets_updated_at
  BEFORE UPDATE ON public.map_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();