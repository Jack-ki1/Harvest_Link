-- HarvestLink MVP schema for Supabase (PostgreSQL)
-- Run in Supabase Dashboard > SQL Editor after creating a project.
-- This file does not configure payment processing or live USSD connectivity.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'buyer' check (role in ('farmer', 'buyer', 'institution')),
  phone text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare chosen_role text;
begin
  chosen_role := coalesce(new.raw_user_meta_data ->> 'role', 'buyer');
  if chosen_role not in ('farmer', 'buyer', 'institution') then chosen_role := 'buyer'; end if;
  insert into public.profiles (id, full_name, role, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), chosen_role, coalesce(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_harvestlink on auth.users;
create trigger on_auth_user_created_harvestlink
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('Vegetables', 'Fruits', 'Leafy greens', 'Roots & tubers')),
  price_per_unit numeric(12,2),
  unit text not null default 'kg',
  location text not null default '',
  available_quantity numeric(12,2) not null default 0 check (available_quantity >= 0),
  min_quantity numeric(12,2) not null default 1 check (min_quantity > 0),
  description text not null default '',
  image_url text,
  availability text not null default 'Availability to confirm',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  buyer_name text not null,
  buyer_phone text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit text not null default 'kg',
  delivery_location text not null,
  needed_by date,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.buyer_demands (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_name text not null,
  category text not null check (category in ('Vegetables', 'Fruits', 'Leafy greens', 'Roots & tubers')),
  quantity numeric(12,2) not null check (quantity > 0),
  unit text not null default 'kg',
  delivery_location text not null,
  needed_by date,
  grade_notes text not null default '',
  status text not null default 'open' check (status in ('open', 'matched', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.farmer_responses (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.buyer_demands(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  supply_quantity numeric(12,2) not null check (supply_quantity > 0),
  unit text not null default 'kg',
  proposed_price numeric(12,2) not null check (proposed_price > 0),
  notes text not null default '',
  status text not null default 'submitted' check (status in ('submitted', 'shortlisted', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (demand_id, farmer_id)
);

create index if not exists products_active_category_idx on public.products (is_active, category);
create index if not exists products_farmer_id_idx on public.products (farmer_id);
create index if not exists quote_requests_buyer_id_created_idx on public.quote_requests (buyer_id, created_at desc);
create index if not exists quote_requests_product_id_idx on public.quote_requests (product_id);
create index if not exists buyer_demands_status_date_idx on public.buyer_demands (status, needed_by);
create index if not exists buyer_demands_buyer_id_idx on public.buyer_demands (buyer_id);
create index if not exists farmer_responses_farmer_id_idx on public.farmer_responses (farmer_id);
create index if not exists farmer_responses_demand_id_idx on public.farmer_responses (demand_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.quote_requests enable row level security;
alter table public.buyer_demands enable row level security;
alter table public.farmer_responses enable row level security;

drop policy if exists "Members can read their own profile" on public.profiles;
create policy "Members can read their own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Anyone can read active produce" on public.products;
create policy "Anyone can read active produce" on public.products for select to anon, authenticated using (is_active = true);
drop policy if exists "Farmers can create their own produce listings" on public.products;
create policy "Farmers can create their own produce listings" on public.products for insert to authenticated with check (farmer_id = auth.uid() and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'farmer'));
drop policy if exists "Farmers can update their own produce listings" on public.products;
create policy "Farmers can update their own produce listings" on public.products for update to authenticated using (farmer_id = auth.uid()) with check (farmer_id = auth.uid());
drop policy if exists "Farmers can delete their own produce listings" on public.products;
create policy "Farmers can delete their own produce listings" on public.products for delete to authenticated using (farmer_id = auth.uid());

drop policy if exists "Buyers can create requests for themselves" on public.quote_requests;
create policy "Buyers can create requests for themselves" on public.quote_requests for insert to authenticated with check (buyer_id = auth.uid());
drop policy if exists "Buyers and relevant farmers can read requests" on public.quote_requests;
create policy "Buyers and relevant farmers can read requests" on public.quote_requests for select to authenticated using (
  buyer_id = auth.uid() or exists (select 1 from public.products p where p.id = quote_requests.product_id and p.farmer_id = auth.uid())
);
drop policy if exists "Relevant farmers can update request status" on public.quote_requests;
create policy "Relevant farmers can update request status" on public.quote_requests for update to authenticated using (
  exists (select 1 from public.products p where p.id = quote_requests.product_id and p.farmer_id = auth.uid())
) with check (
  exists (select 1 from public.products p where p.id = quote_requests.product_id and p.farmer_id = auth.uid())
);

drop policy if exists "Farmers can see open buyer demand and buyers can see their own" on public.buyer_demands;
create policy "Farmers can see open buyer demand and buyers can see their own" on public.buyer_demands for select to authenticated using (
  buyer_id = auth.uid() or (status = 'open' and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'farmer'))
);
drop policy if exists "Buyers can create their own demand" on public.buyer_demands;
create policy "Buyers can create their own demand" on public.buyer_demands for insert to authenticated with check (
  buyer_id = auth.uid() and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('buyer', 'institution'))
);
drop policy if exists "Buyers can update their own demand" on public.buyer_demands;
create policy "Buyers can update their own demand" on public.buyer_demands for update to authenticated using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
drop policy if exists "Buyers can cancel their own demand" on public.buyer_demands;
create policy "Buyers can cancel their own demand" on public.buyer_demands for delete to authenticated using (buyer_id = auth.uid());

drop policy if exists "Farmers can submit one offer per demand" on public.farmer_responses;
create policy "Farmers can submit one offer per demand" on public.farmer_responses for insert to authenticated with check (
  farmer_id = auth.uid() and exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'farmer')
  and exists (select 1 from public.buyer_demands d where d.id = demand_id and d.status = 'open')
);
drop policy if exists "Farmers and demand owners can read offers" on public.farmer_responses;
create policy "Farmers and demand owners can read offers" on public.farmer_responses for select to authenticated using (
  farmer_id = auth.uid() or exists (select 1 from public.buyer_demands d where d.id = farmer_responses.demand_id and d.buyer_id = auth.uid())
);
drop policy if exists "Farmers can update their own submitted offers" on public.farmer_responses;
create policy "Farmers can update their own submitted offers" on public.farmer_responses for update to authenticated using (farmer_id = auth.uid()) with check (farmer_id = auth.uid());

-- Table privileges are required in addition to RLS policies.
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select, insert on public.quote_requests to authenticated;
grant update (status) on public.quote_requests to authenticated;
grant select, insert, update, delete on public.buyer_demands to authenticated;
grant select, insert, update on public.farmer_responses to authenticated;

-- Suggested launch checklist before inviting real customers:
-- 1. Restrict project API keys, configure Auth email verification, and review RLS policies.
-- 2. Review and test the buyer_demands and farmer_responses workflow before inviting pilot customers.
-- 3. Add server-side validation/rate limiting, audit logs, dispute states and backups.
-- 4. Do not store payment card/mobile money credentials in these tables. Integrate a licensed payment provider separately.
