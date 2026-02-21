-- Insert storage bucket 'guild_assets'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('guild_assets', 'guild_assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage objects in 'guild_assets'
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'guild_assets');

CREATE POLICY "Authenticated users can upload" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'guild_assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'guild_assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'guild_assets' AND auth.role() = 'authenticated');
