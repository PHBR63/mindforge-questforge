-- Create table for map floors (multiple levels)
CREATE TABLE public.map_floors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  floor_number INTEGER NOT NULL DEFAULT 0,
  height NUMERIC NOT NULL DEFAULT 3.0,
  floor_plan_url TEXT,
  floor_plan_opacity NUMERIC DEFAULT 0.5,
  floor_plan_scale NUMERIC DEFAULT 1.0,
  floor_plan_offset_x NUMERIC DEFAULT 0,
  floor_plan_offset_y NUMERIC DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for walls
CREATE TABLE public.map_walls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  floor_id UUID NOT NULL REFERENCES public.map_floors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_x NUMERIC NOT NULL,
  start_y NUMERIC NOT NULL,
  end_x NUMERIC NOT NULL,
  end_y NUMERIC NOT NULL,
  height NUMERIC NOT NULL DEFAULT 3.0,
  thickness NUMERIC NOT NULL DEFAULT 0.2,
  color TEXT DEFAULT '#808080',
  texture TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for wall openings (doors, windows)
CREATE TABLE public.map_wall_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_id UUID NOT NULL REFERENCES public.map_walls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  opening_type TEXT NOT NULL DEFAULT 'door',
  position_along_wall NUMERIC NOT NULL DEFAULT 0.5,
  width NUMERIC NOT NULL DEFAULT 1.0,
  height NUMERIC NOT NULL DEFAULT 2.0,
  elevation NUMERIC NOT NULL DEFAULT 0,
  color TEXT,
  is_open BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for light sources
CREATE TABLE public.map_lights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  floor_id UUID NOT NULL REFERENCES public.map_floors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  light_type TEXT NOT NULL DEFAULT 'point',
  position_x NUMERIC NOT NULL,
  position_y NUMERIC NOT NULL,
  position_z NUMERIC DEFAULT 2.5,
  color TEXT DEFAULT '#ffffff',
  intensity NUMERIC DEFAULT 1.0,
  range NUMERIC DEFAULT 10.0,
  cast_shadows BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.map_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_wall_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_lights ENABLE ROW LEVEL SECURITY;

-- RLS policies for map_floors
CREATE POLICY "Users can view their own map floors" 
ON public.map_floors FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own map floors" 
ON public.map_floors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own map floors" 
ON public.map_floors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own map floors" 
ON public.map_floors FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for map_walls
CREATE POLICY "Users can view their own map walls" 
ON public.map_walls FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own map walls" 
ON public.map_walls FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own map walls" 
ON public.map_walls FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own map walls" 
ON public.map_walls FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for map_wall_openings
CREATE POLICY "Users can view their own wall openings" 
ON public.map_wall_openings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wall openings" 
ON public.map_wall_openings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wall openings" 
ON public.map_wall_openings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wall openings" 
ON public.map_wall_openings FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for map_lights
CREATE POLICY "Users can view their own map lights" 
ON public.map_lights FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own map lights" 
ON public.map_lights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own map lights" 
ON public.map_lights FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own map lights" 
ON public.map_lights FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_map_floors_updated_at
BEFORE UPDATE ON public.map_floors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_map_walls_updated_at
BEFORE UPDATE ON public.map_walls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_map_wall_openings_updated_at
BEFORE UPDATE ON public.map_wall_openings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_map_lights_updated_at
BEFORE UPDATE ON public.map_lights
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();