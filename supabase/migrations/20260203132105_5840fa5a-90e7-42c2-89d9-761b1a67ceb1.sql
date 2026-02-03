-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system TEXT DEFAULT 'D&D 5e',
  status TEXT DEFAULT 'active',
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- NPCs table
CREATE TABLE public.npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  motivation TEXT,
  secrets TEXT,
  appearance TEXT,
  location TEXT,
  faction TEXT,
  status TEXT DEFAULT 'alive',
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own npcs" ON public.npcs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own npcs" ON public.npcs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own npcs" ON public.npcs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own npcs" ON public.npcs FOR DELETE USING (auth.uid() = user_id);

-- Locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  parent_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'city',
  population TEXT,
  government TEXT,
  notable_features TEXT,
  secrets TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own locations" ON public.locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own locations" ON public.locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own locations" ON public.locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own locations" ON public.locations FOR DELETE USING (auth.uid() = user_id);

-- Sessions/Chapters table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  planned_content TEXT,
  actual_events TEXT,
  session_date DATE,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- Mind Map Nodes table
CREATE TABLE public.mind_map_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  node_type TEXT DEFAULT 'idea',
  position_x DOUBLE PRECISION DEFAULT 0,
  position_y DOUBLE PRECISION DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nodes" ON public.mind_map_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own nodes" ON public.mind_map_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nodes" ON public.mind_map_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own nodes" ON public.mind_map_nodes FOR DELETE USING (auth.uid() = user_id);

-- Mind Map Connections table
CREATE TABLE public.mind_map_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  source_node_id UUID REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE NOT NULL,
  label TEXT,
  connection_type TEXT DEFAULT 'related',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mind_map_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" ON public.mind_map_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own connections" ON public.mind_map_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connections" ON public.mind_map_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own connections" ON public.mind_map_connections FOR DELETE USING (auth.uid() = user_id);

-- Timeline Events table
CREATE TABLE public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  era TEXT,
  importance TEXT DEFAULT 'normal',
  category TEXT DEFAULT 'world',
  related_npcs UUID[],
  related_locations UUID[],
  is_secret BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events" ON public.timeline_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.timeline_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.timeline_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.timeline_events FOR DELETE USING (auth.uid() = user_id);

-- Resources Library table
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resources" ON public.resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resources" ON public.resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resources" ON public.resources FOR DELETE USING (auth.uid() = user_id);

-- Factions table
CREATE TABLE public.factions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  allies TEXT,
  enemies TEXT,
  leader TEXT,
  headquarters TEXT,
  symbol_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own factions" ON public.factions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own factions" ON public.factions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own factions" ON public.factions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own factions" ON public.factions FOR DELETE USING (auth.uid() = user_id);

-- Quests table
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objectives TEXT,
  rewards TEXT,
  quest_giver TEXT,
  status TEXT DEFAULT 'available',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quests" ON public.quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quests" ON public.quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quests" ON public.quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quests" ON public.quests FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for campaign assets
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-assets', 'campaign-assets', true);

CREATE POLICY "Users can upload their own assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own assets" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own assets" ON storage.objects FOR UPDATE USING (bucket_id = 'campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own assets" ON storage.objects FOR DELETE USING (bucket_id = 'campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view campaign assets" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets');

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON public.npcs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mind_map_nodes_updated_at BEFORE UPDATE ON public.mind_map_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON public.timeline_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_factions_updated_at BEFORE UPDATE ON public.factions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON public.quests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();