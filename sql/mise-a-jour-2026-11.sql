-- =========================================================
-- Mise a jour de novembre 2026
-- A executer UNE FOIS dans Supabase > SQL Editor, sur une base
-- deja creee avec schema.sql. Le script peut etre relance sans risque.
-- =========================================================

-- 1. Envoi d'images depuis l'administration
alter table media add column if not exists storage_path text;

-- Bucket public "portfolio" : les visiteurs du site doivent voir les images.
-- 5 Mo maximum, images uniquement (pas de SVG, qui peut contenir du code).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Lignes uniques de l'accueil et de la section A propos
insert into hero_content (id) values (1) on conflict (id) do nothing;
insert into about_content (id) values (1) on conflict (id) do nothing;

-- 3. Coordonnees : remplace uniquement les valeurs d'exemple du premier schema.
--    Le site lit desormais ces reglages : ils doivent etre justes.
update site_settings set email = 'Emmanuelmande263@gmail.com'
  where id = 1 and (email is null or email = 'contact@example.com');
update site_settings set whatsapp = '22665074260'
  where id = 1 and (whatsapp is null or whatsapp = '22670123456');
update site_settings set phone = '+226 65 07 42 60'
  where id = 1 and phone is null;
update site_settings set copyright_text = '© Stéphane Mande. Tous droits réservés.'
  where id = 1 and (copyright_text is null or copyright_text = '© Stéphane Mande');

-- 4. Reseaux sociaux : GitHub par defaut si la liste est vide
insert into social_links (name, url, icon, active, sort_order)
select 'GitHub', 'https://github.com/mandestephane5-creator', 'fa-brands fa-github', true, 1
where not exists (select 1 from social_links);

-- 5. Statut "Maquette" pour les projets presentes avant realisation
alter table projects drop constraint if exists projects_completion_status_check;
alter table projects add constraint projects_completion_status_check
  check (completion_status in ('termine', 'en_developpement', 'prototype', 'maquette'));

-- 6. Le projet de depart "KOZ AUTO" correspond a la maquette KOZ SERVICES :
--    on l'aligne sur ce qu'affiche le site (uniquement s'il n'a pas ete modifie).
update projects set
  title = 'KOZ SERVICES',
  tagline = 'Proposition de site web pour un concessionnaire automobile de Ouagadougou.',
  description = 'Présenter en ligne les véhicules, les services et l''importation depuis le Canada, et faciliter les demandes de renseignements. Une maquette de site multi-pages, consultable en ligne, qui oriente chaque demande vers WhatsApp.',
  features = array['Catalogue avec filtres', 'Fiches véhicules', 'Panier de demandes', 'Simulateur de financement indicatif', 'Contact WhatsApp', 'Affichage adapté au téléphone'],
  tech_stack = array['HTML', 'CSS', 'JavaScript', 'WhatsApp'],
  live_url = 'https://koz-5.vercel.app/',
  completion_status = 'maquette'
where title = 'KOZ AUTO';
