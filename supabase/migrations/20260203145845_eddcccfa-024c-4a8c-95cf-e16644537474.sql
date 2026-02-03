-- Create table for storing map drawings (paint strokes)
CREATE TABLE public.map_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  layer INTEGER DEFAULT 0,
  tool_type TEXT NOT NULL DEFAULT 'brush',
  color TEXT NOT NULL DEFAULT '#ffffff',
  brush_size INTEGER DEFAULT 10,
  opacity DOUBLE PRECISION DEFAULT 1,
  points JSONB NOT NULL DEFAULT '[]',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.map_drawings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own drawings" ON public.map_drawings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own drawings" ON public.map_drawings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own drawings" ON public.map_drawings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own drawings" ON public.map_drawings FOR DELETE USING (auth.uid() = user_id);

-- Create table for map layers configuration
CREATE TABLE public.map_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  layer_type TEXT NOT NULL DEFAULT 'custom',
  layer_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  opacity DOUBLE PRECISION DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.map_layers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own layers" ON public.map_layers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own layers" ON public.map_layers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own layers" ON public.map_layers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own layers" ON public.map_layers FOR DELETE USING (auth.uid() = user_id);