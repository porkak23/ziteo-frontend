-- Migration 20260531_occasional_listings
-- Add support for occasional listings
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'professional'
    CHECK (seller_type IN ('professional','occasional')),
  ADD COLUMN IF NOT EXISTS item_condition text
    CHECK (item_condition IN ('nuevo','usado'));

CREATE INDEX IF NOT EXISTS idx_products_seller_type ON public.products(seller_type);
