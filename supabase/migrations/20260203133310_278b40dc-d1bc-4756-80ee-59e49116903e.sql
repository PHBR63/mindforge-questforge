
-- Create folders table for resource organization
CREATE TABLE public.resource_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.resource_folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id and is_favorite to resources table
ALTER TABLE public.resources 
ADD COLUMN folder_id UUID REFERENCES public.resource_folders(id) ON DELETE SET NULL,
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Enable RLS on folders
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;

-- Folder policies
CREATE POLICY "Users can view their own folders"
ON public.resource_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
ON public.resource_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.resource_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.resource_folders FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for folder updated_at
CREATE TRIGGER update_resource_folders_updated_at
BEFORE UPDATE ON public.resource_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
