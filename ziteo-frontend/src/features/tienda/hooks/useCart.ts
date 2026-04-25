// SQL (documentación — NO ejecutar aquí, aplicar en Supabase Dashboard):
// CREATE TABLE IF NOT EXISTS orders (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   buyer_id uuid NOT NULL,
//   seller_id uuid NOT NULL,
//   status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
//   total numeric NOT NULL DEFAULT 0,
//   notes text,
//   created_at timestamp NOT NULL DEFAULT now()
// );
// CREATE TABLE IF NOT EXISTS order_items (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   order_id uuid NOT NULL REFERENCES orders(id),
//   product_id uuid NOT NULL,
//   quantity integer NOT NULL DEFAULT 1,
//   unit_price numeric NOT NULL,
//   created_at timestamp NOT NULL DEFAULT now()
// );
// ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
// ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users see own orders" ON orders FOR ALL USING (buyer_id = auth.uid()::uuid OR seller_id = auth.uid()::uuid);
// CREATE POLICY "Users see own order items" ON order_items FOR ALL USING (order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid()::uuid OR seller_id = auth.uid()::uuid));

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  sellerId: string
  imageUrl?: string
}

interface CartStore {
  items: CartItem[]
  /** Add an item to the cart. Pass `quantity` (default 1) to add multiple at once without N re-renders. */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clear: () => void
  total: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const qty = Math.max(1, Math.floor(quantity))
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: qty }] }
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQty: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) }
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            ),
          }
        }),

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'ziteo-cart' }
  )
)
