-- Bu dosya mevcut PostgreSQL yöneticisi tarafından bir defa çalıştırılır.
-- Parolayı çalıştırmadan önce güvenli bir değerle değiştirin.
CREATE ROLE qiraat_app WITH LOGIN PASSWORD 'CHANGE_ME';
CREATE DATABASE qiraat_atlas OWNER qiraat_app;

\connect qiraat_atlas
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

