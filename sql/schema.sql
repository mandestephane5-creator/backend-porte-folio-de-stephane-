-- =========================================================
-- Schema complet — Stephane Mande CMS
-- A executer dans Supabase SQL Editor (remplace l'ancien schema.sql)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- messages (formulaire contact + demarrer un projet)
-- ---------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact', 'projet')),
  first_name text,
  last_name text,
  email text not null,
  phone text,
  project_type text,
  budget text,
  message text not null,
  status text not null default 'nouveau' check (status in ('nouveau', 'lu', 'traite', 'archive')),
  created_at timestamptz default now()
);
create index if not exists idx_messages_status on messages(status);
create index if not exists idx_messages_type on messages(type);

-- ---------------------------------------------------------
-- projects
-- completion_status = statut honnete affiche au visiteur (termine / en cours / prototype)
-- publish_status = statut editorial du CMS (brouillon / publie / archive)
-- ---------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  tagline text,
  description text,
  main_image text,
  additional_images text[] default '{}',
  category text,
  tech_stack text[] default '{}',
  features text[] default '{}',
  project_date date,
  completion_status text not null default 'prototype' check (completion_status in ('termine', 'en_developpement', 'prototype', 'maquette')),
  publish_status text not null default 'brouillon' check (publish_status in ('brouillon', 'publie', 'archive')),
  github_url text,
  live_url text,
  video_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_projects_publish on projects(publish_status);

-- ---------------------------------------------------------
-- domains + solutions (secteurs de la section "Solutions")
-- ---------------------------------------------------------
create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  image_url text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists solutions (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references domains(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_solutions_domain on solutions(domain_id);

-- ---------------------------------------------------------
-- services
-- ---------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- skill_categories + skills
-- ---------------------------------------------------------
create table if not exists skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references skill_categories(id) on delete set null,
  name text not null,
  icon text,
  level text,
  active boolean default true,
  sort_order int default 0
);
create index if not exists idx_skills_category on skills(category_id);

-- ---------------------------------------------------------
-- hero_content (ligne unique)
-- ---------------------------------------------------------
create table if not exists hero_content (
  id int primary key default 1,
  eyebrow text,
  title text,
  description text,
  primary_btn_text text,
  primary_btn_link text,
  secondary_btn_text text,
  secondary_btn_link text,
  image_url text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ---------------------------------------------------------
-- about_content (ligne unique)
-- ---------------------------------------------------------
create table if not exists about_content (
  id int primary key default 1,
  title text,
  description text,
  image_url text,
  updated_at timestamptz default now(),
  constraint single_row_about check (id = 1)
);

-- ---------------------------------------------------------
-- journey_entries
-- ---------------------------------------------------------
create table if not exists journey_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('formation', 'autodidacte')),
  period text,
  title text not null,
  institution text,
  description text,
  technology text,
  attestation_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- articles (blog)
-- ---------------------------------------------------------
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  image_url text,
  category text,
  tags text[] default '{}',
  author text default 'Stéphane Mande',
  status text not null default 'brouillon' check (status in ('brouillon', 'publie', 'archive')),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_articles_status on articles(status);

-- ---------------------------------------------------------
-- media
-- ---------------------------------------------------------
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text,
  size_bytes int,
  storage_path text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- theme_settings (ligne unique)
-- ---------------------------------------------------------
create table if not exists theme_settings (
  id int primary key default 1,
  bg_primary text default '#ffffff',
  bg_secondary text default '#f1f2f6',
  card_color text default '#ffffff',
  color_primary text default '#7c5cff',
  color_secondary text default '#6a49f2',
  color_accent text default '#7c5cff',
  color_accent_secondary text default '#a78bfa',
  text_primary text default '#05060a',
  text_secondary text default '#7a8096',
  border_color text default 'rgba(5,6,10,0.08)',
  button_color text default '#7c5cff',
  default_mode text default 'system' check (default_mode in ('dark', 'light', 'system')),
  updated_at timestamptz default now(),
  constraint single_row_theme check (id = 1)
);

-- ---------------------------------------------------------
-- site_settings (ligne unique)
-- ---------------------------------------------------------
create table if not exists site_settings (
  id int primary key default 1,
  first_name text,
  last_name text,
  display_name text,
  professional_title text,
  short_description text,
  email text,
  phone text,
  whatsapp text,
  logo_url text,
  favicon_url text,
  copyright_text text,
  updated_at timestamptz default now(),
  constraint single_row_settings check (id = 1)
);

-- ---------------------------------------------------------
-- seo_settings (ligne unique)
-- ---------------------------------------------------------
create table if not exists seo_settings (
  id int primary key default 1,
  seo_title text,
  meta_description text,
  keywords text,
  og_title text,
  og_description text,
  og_image_url text,
  site_name text,
  updated_at timestamptz default now(),
  constraint single_row_seo check (id = 1)
);

-- ---------------------------------------------------------
-- social_links
-- ---------------------------------------------------------
create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  icon text,
  active boolean default true,
  sort_order int default 0
);

-- ---------------------------------------------------------
-- navigation_links
-- ---------------------------------------------------------
create table if not exists navigation_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  visible boolean default true,
  sort_order int default 0
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table admin_users enable row level security;
alter table messages enable row level security;
alter table projects enable row level security;
alter table domains enable row level security;
alter table solutions enable row level security;
alter table services enable row level security;
alter table skill_categories enable row level security;
alter table skills enable row level security;
alter table hero_content enable row level security;
alter table about_content enable row level security;
alter table journey_entries enable row level security;
alter table articles enable row level security;
alter table media enable row level security;
alter table theme_settings enable row level security;
alter table site_settings enable row level security;
alter table seo_settings enable row level security;
alter table social_links enable row level security;
alter table navigation_links enable row level security;

create policy "Public peut inserer un message" on messages for insert to anon with check (true);
create policy "Public lit les projets publies" on projects for select to anon using (publish_status = 'publie');
create policy "Public lit les domaines actifs" on domains for select to anon using (active = true);
create policy "Public lit les solutions" on solutions for select to anon using (true);
create policy "Public lit les services actifs" on services for select to anon using (active = true);
create policy "Public lit les categories de competences" on skill_categories for select to anon using (true);
create policy "Public lit les competences actives" on skills for select to anon using (active = true);
create policy "Public lit le hero" on hero_content for select to anon using (true);
create policy "Public lit la section a propos" on about_content for select to anon using (true);
create policy "Public lit le parcours" on journey_entries for select to anon using (true);
create policy "Public lit les articles publies" on articles for select to anon using (status = 'publie');
create policy "Public lit le theme" on theme_settings for select to anon using (true);
create policy "Public lit les parametres du site" on site_settings for select to anon using (true);
create policy "Public lit le seo" on seo_settings for select to anon using (true);
create policy "Public lit les reseaux actifs" on social_links for select to anon using (active = true);
create policy "Public lit la navigation visible" on navigation_links for select to anon using (visible = true);

-- Aucune policy publique sur admin_users et media : uniquement le service_role (serveur backend).
-- Toutes les ECRITURES (insert/update/delete) passent exclusivement par l'API protegee.

-- =========================================================
-- Donnees de depart
-- =========================================================
insert into projects (title, slug, tagline, description, tech_stack, completion_status, publish_status, sort_order) values
('KOZ SERVICES', 'koz-services', 'Site web pour une entreprise d''importation et de vente de vehicules.',
 'Une maquette de site multi-pages, consultable en ligne, qui oriente chaque demande vers WhatsApp.',
 array['HTML','CSS','JavaScript','WhatsApp'], 'maquette', 'publie', 1),
('EduBF / Zentech School', 'edubf-zentech-school', 'Plateforme de gestion scolaire pensee pour eleves, parents et enseignants.',
 'Une plateforme complete centralisant les eleves, enseignants, parents et classes, avec des roles utilisateurs distincts.',
 array['React','React Native','Expo','Next.js','Node.js','Prisma','PostgreSQL','Supabase'], 'en_developpement', 'publie', 2),
('Zentech', 'zentech', 'Reflexion autour d''une solution e-commerce adaptee au contexte local.',
 'Une plateforme e-commerce avec catalogue, gestion de commandes et de stock, pensee pour integrer des paiements comme Orange Money.',
 array['React','Node.js','E-commerce','Paiement local'], 'prototype', 'publie', 3),
('Vorelix', 'vorelix', 'Application mobile de communication scolaire pour les parents.',
 'Une application mobile centree sur la communication entre l''ecole et les familles.',
 array['React Native','Expo'], 'prototype', 'publie', 4),
('Ecole Horizon', 'ecole-horizon', 'Plateforme scolaire pour la digitalisation d''un etablissement.',
 'Un site presentant l''etablissement et centralisant les ressources utiles aux eleves par niveau.',
 array['HTML','CSS','JavaScript'], 'termine', 'publie', 5)
on conflict (slug) do nothing;

insert into theme_settings (id) values (1) on conflict (id) do nothing;
insert into hero_content (id) values (1) on conflict (id) do nothing;
insert into about_content (id) values (1) on conflict (id) do nothing;
insert into social_links (name, url, icon, active, sort_order)
select 'GitHub', 'https://github.com/mandestephane5-creator', 'fa-brands fa-github', true, 1
where not exists (select 1 from social_links);
insert into site_settings (id, first_name, last_name, display_name, professional_title, email, whatsapp, copyright_text)
  values (1, 'Stéphane', 'Mande', 'Stéphane Mande', 'Développeur Web & Mobile', 'Emmanuelmande263@gmail.com', '22665074260', '© Stéphane Mande. Tous droits réservés.')
  on conflict (id) do nothing;
insert into seo_settings (id, seo_title, meta_description, site_name)
  values (1, 'Stéphane Mande — Développeur Web & Mobile', 'Développeur web et mobile autodidacte base a Ouagadougou.', 'Stéphane Mande')
  on conflict (id) do nothing;

-- =========================================================
-- Stockage des images (Supabase Storage)
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;
