-- Add icon_url column to guilds_managed
ALTER TABLE "public"."guilds_managed"
ADD COLUMN "icon_url" text;
