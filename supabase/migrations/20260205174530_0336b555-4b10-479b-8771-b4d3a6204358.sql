-- Drop all map-related tables in correct order (respecting foreign key constraints)

-- First drop tables that reference other tables
DROP TABLE IF EXISTS public.map_wall_openings CASCADE;
DROP TABLE IF EXISTS public.map_lights CASCADE;
DROP TABLE IF EXISTS public.map_walls CASCADE;
DROP TABLE IF EXISTS public.map_floors CASCADE;
DROP TABLE IF EXISTS public.map_3d_models CASCADE;
DROP TABLE IF EXISTS public.map_assets CASCADE;
DROP TABLE IF EXISTS public.map_drawings CASCADE;
DROP TABLE IF EXISTS public.map_layers CASCADE;
DROP TABLE IF EXISTS public.map_tiles CASCADE;
DROP TABLE IF EXISTS public.map_tokens CASCADE;

-- Finally drop the parent table
DROP TABLE IF EXISTS public.maps CASCADE;