-- Local dev seed. Runs after migrations on `supabase start` / `supabase db reset`.
-- Safe to re-run (idempotent via ON CONFLICT).

-- Drink categories (the app reads these to render filters).
insert into public.categories (slug, label, sort_order) values
  ('hot-coffee',  'Hot Coffee',  1),
  ('iced-coffee', 'Iced Coffee', 2),
  ('matcha',      'Matcha',      3),
  ('tea',         'Tea',         4),
  ('refresher',   'Refresher',   5)
on conflict (slug) do nothing;

-- Demo shops.
insert into public.shops (id, name, address, latitude, longitude) values
  ('11111111-1111-1111-1111-111111111111', 'Trailhead Coffee', '100 Summit Ave, Seattle, WA', 47.6062, -122.3321),
  ('22222222-2222-2222-2222-222222222222', 'Fog & Foam',       '250 Marina Blvd, San Francisco, CA', 37.8060, -122.4230)
on conflict (id) do nothing;

-- Demo drinks.
insert into public.drinks (id, name) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'Matcha Latte'),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'Cortado'),
  ('aaaaaaa1-0000-0000-0000-000000000003', 'Iced Hojicha')
on conflict (id) do nothing;

-- Menu items (shop_drinks).
insert into public.shop_drinks (id, shop_id, drink_id, price) values
  ('bbbbbbb1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000001', 5.50),
  ('bbbbbbb1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000002', 4.25),
  ('bbbbbbb1-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'aaaaaaa1-0000-0000-0000-000000000003', 5.00)
on conflict (id) do nothing;

-- A couple of demo reviews (null user = seed data). The avg_rating trigger
-- recomputes shop_drinks.avg_rating from these on insert.
insert into public.reviews (shop_drink_id, rating, comment) values
  ('bbbbbbb1-0000-0000-0000-000000000001', 5, 'Best matcha latte in town, perfectly balanced.'),
  ('bbbbbbb1-0000-0000-0000-000000000001', 4, 'Great but a touch sweet for me.'),
  ('bbbbbbb1-0000-0000-0000-000000000003', 5, 'So smooth and toasty.')
on conflict do nothing;
