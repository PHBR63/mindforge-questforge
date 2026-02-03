-- Create table for 3D models in maps
CREATE TABLE public.map_3d_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  -- Position in grid units
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  position_z NUMERIC NOT NULL DEFAULT 0,
  -- Rotation in degrees
  rotation_x NUMERIC NOT NULL DEFAULT 0,
  rotation_y NUMERIC NOT NULL DEFAULT 0,
  rotation_z NUMERIC NOT NULL DEFAULT 0,
  -- Scale multiplier
  scale NUMERIC NOT NULL DEFAULT 1.0,
  -- Layer for ordering
  layer INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  -- Animation settings
  animation_name TEXT,
  animation_playing BOOLEAN DEFAULT false,
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.map_3d_models ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own 3D models" 
ON public.map_3d_models FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own 3D models" 
ON public.map_3d_models FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 3D models" 
ON public.map_3d_models FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 3D models" 
ON public.map_3d_models FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_map_3d_models_updated_at
BEFORE UPDATE ON public.map_3d_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_map_3d_models_map_id ON public.map_3d_models(map_id);