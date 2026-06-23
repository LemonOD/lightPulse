-- Drop existing tables if re-initializing
drop table if exists confirmations cascade;
drop table if exists reports cascade;
drop table if exists areas cascade;

-- 1. Create the 'areas' table
create table areas (
  id text primary key,
  name text not null,
  slug text not null,
  lat double precision not null,
  lng double precision not null,
  description text,
  region text,
  current_status text check (current_status in ('UNKNOWN', 'LIGHT_AVAILABLE', 'LIGHT_OUT', 'LOW_VOLTAGE')) default 'UNKNOWN',
  last_reported_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the 'reports' table
create table reports (
  id uuid default gen_random_uuid() primary key,
  area_id text references areas(id) on delete cascade not null,
  status text check (status in ('LIGHT_AVAILABLE', 'LIGHT_OUT', 'LOW_VOLTAGE')) not null,
  comment text,
  latitude double precision,
  longitude double precision,
  device_id text not null,
  confidence_score integer default 1 not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create the 'confirmations' table
create table confirmations (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references reports(id) on delete cascade not null,
  device_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(report_id, device_id)
);

-- Enable RLS (Row Level Security) - For this app, we'll allow anon read/write for demo purposes.
alter table areas enable row level security;
alter table reports enable row level security;
alter table confirmations enable row level security;

-- Create open policies for public access
create policy "Allow public read access on areas" on areas for select using (true);
create policy "Allow public insert access on areas" on areas for insert with check (true);
create policy "Allow public update access on areas" on areas for update using (true);

create policy "Allow public read access on reports" on reports for select using (true);
create policy "Allow public insert access on reports" on reports for insert with check (true);
create policy "Allow public update access on reports" on reports for update using (true);

create policy "Allow public read access on confirmations" on confirmations for select using (true);
create policy "Allow public insert access on confirmations" on confirmations for insert with check (true);

-- Grant basic privileges to Supabase roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.confirmations TO anon, authenticated;
