-- Migration: create_reviews table
-- Created: 2026-04-09

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  contract_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, contract_id)
);

CREATE INDEX reviews_reviewed_idx ON reviews(reviewed_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users write own reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid()::uuid);
