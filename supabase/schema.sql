-- Expense Tracker schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

-- ========== profiles ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  default_currency text not null default 'INR',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-readable" on public.profiles;
create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles are self-writable" on public.profiles;
create policy "profiles are self-writable" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles are self-updatable" on public.profiles;
create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

-- ========== categories ==========
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  icon text not null default '📦',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories crud own" on public.categories;
create policy "categories crud own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== expenses ==========
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  description text,
  merchant text,
  payment_method text,
  expense_date date not null default current_date,
  receipt_url text,
  is_recurring boolean not null default false,
  recurrence_interval text check (recurrence_interval in ('weekly', 'monthly', 'yearly')),
  parent_recurring_id uuid references public.expenses(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);
create index if not exists expenses_category_idx on public.expenses (category_id);

alter table public.expenses enable row level security;

drop policy if exists "expenses crud own" on public.expenses;
create policy "expenses crud own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== budgets ==========
-- One row per category = that category's recurring monthly budget.
-- category_id = null means an overall "total spending" budget.
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

alter table public.budgets enable row level security;

drop policy if exists "budgets crud own" on public.budgets;
create policy "budgets crud own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ========== income ==========
create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'Other',
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  notes text,
  income_date date not null default current_date,
  is_recurring boolean not null default false,
  recurrence_interval text check (recurrence_interval in ('weekly', 'monthly', 'yearly')),
  parent_recurring_id uuid references public.income(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists income_user_date_idx on public.income (user_id, income_date desc);

alter table public.income enable row level security;

drop policy if exists "income crud own" on public.income;
create policy "income crud own" on public.income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== auto-provision profile + default categories on signup ==========
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color, icon)
  values
    (new.id, 'Food & Dining', '#f97316', '🍔'),
    (new.id, 'Transport', '#3b82f6', '🚗'),
    (new.id, 'Housing', '#8b5cf6', '🏠'),
    (new.id, 'Utilities', '#06b6d4', '💡'),
    (new.id, 'Shopping', '#ec4899', '🛍️'),
    (new.id, 'Health', '#ef4444', '💊'),
    (new.id, 'Entertainment', '#eab308', '🎬'),
    (new.id, 'Travel', '#14b8a6', '✈️'),
    (new.id, 'Education', '#6366f1', '📚'),
    (new.id, 'Other', '#64748b', '📦')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== storage bucket for uploaded / imported receipts ==========
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "receipts are self-readable" on storage.objects;
create policy "receipts are self-readable" on storage.objects
  for select using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "receipts are self-writable" on storage.objects;
create policy "receipts are self-writable" on storage.objects
  for insert with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "receipts are self-deletable" on storage.objects;
create policy "receipts are self-deletable" on storage.objects
  for delete using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
