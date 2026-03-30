-- Migration 008: Add thumbnail URL column to listing_photos
--
-- Stores the public URL of the pre-generated 400px WebP thumbnail.
-- Nullable: existing photos and external URLs keep NULL and continue
-- working through Next.js on-the-fly resizing.
--
-- Rollback: ALTER TABLE public.listing_photos DROP COLUMN IF EXISTS public_url_thumb;

ALTER TABLE public.listing_photos
  ADD COLUMN IF NOT EXISTS public_url_thumb text NULL;

COMMENT ON COLUMN public.listing_photos.public_url_thumb IS
  'Public URL of the pre-generated 400px WebP thumbnail. NULL for legacy photos or external URLs.';
