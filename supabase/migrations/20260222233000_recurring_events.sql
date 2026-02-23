-- 20260222233000_recurring_events.sql
-- Create scheduling tables for recurring raids

-- 1. Add last_schedule_sync to guilds_managed
ALTER TABLE public.guilds_managed
ADD COLUMN IF NOT EXISTS last_schedule_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create the guild_raid_schedule table
CREATE TABLE IF NOT EXISTS public.guild_raid_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES public.guilds_managed(guild_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    destination TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one schedule per day per guild for now
    UNIQUE (guild_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.guild_raid_schedule ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view
CREATE POLICY "Anyone in guild can view schedule"
    ON public.guild_raid_schedule FOR SELECT
    USING (true);

-- Policy: Only GM can manage schedule
CREATE POLICY "GM can manage schedule"
    ON public.guild_raid_schedule FOR ALL
    USING (public.is_current_gm())
    WITH CHECK (public.is_current_gm());

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.guild_raid_schedule
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
