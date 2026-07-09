-- ============================================================
-- MIGRATION: 20260709_reviews_profiles_fk.sql
-- Fixes 400 PGRST200: the frontend requests the embed
-- `profiles!reviews_reviewer_id_fkey` on reviews, but no such
-- foreign key exists (reviews had 0 FKs at all). Verified no
-- orphaned reviewer_id rows exist before adding the constraint
-- (reviews table is currently empty).
-- ============================================================

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
