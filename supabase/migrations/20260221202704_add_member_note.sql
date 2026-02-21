-- Add note column to guild_members
ALTER TABLE "public"."guild_members" 
ADD COLUMN "note" text;
