-- database.sql
-- VisionCentral Supabase Database Schema

-- Enable UUID extension if needed (though we can use text IDs as well)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clientes Table
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    cidade TEXT NOT NULL,
    bairro TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo',
    icon_type TEXT DEFAULT 'store',
    orientation TEXT NOT NULL DEFAULT 'Horizontal',
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    playlist_id TEXT,
    ticker_text TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TVs (Devices) Table
CREATE TABLE IF NOT EXISTS tvs (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    playlist_id TEXT REFERENCES playlists(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Offline',
    uptime TEXT DEFAULT '0h 0m',
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_conexao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    orientacao TEXT DEFAULT 'Horizontal',
    resolucao TEXT DEFAULT '1920x1080',
    versao_configuracao INTEGER DEFAULT 1,
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Midias Table
CREATE TABLE IF NOT EXISTS midias (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'image' or 'video'
    url_storage TEXT NOT NULL,
    tamanho TEXT,
    duracao INTEGER NOT NULL DEFAULT 10,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Playlist Midias (M-to-M link table)
CREATE TABLE IF NOT EXISTS playlist_midias (
    id TEXT PRIMARY KEY,
    playlist_id TEXT REFERENCES playlists(id) ON DELETE CASCADE,
    midia_id TEXT REFERENCES midias(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    duracao INTEGER NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Configuracoes Table
CREATE TABLE IF NOT EXISTS configuracoes (
    id TEXT PRIMARY KEY,
    cliente_id TEXT UNIQUE REFERENCES clientes(id) ON DELETE CASCADE,
    orientacao TEXT NOT NULL DEFAULT 'Horizontal',
    resolucao TEXT NOT NULL DEFAULT '1920x1080',
    autoplay BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    tv_id TEXT REFERENCES tvs(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error'
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint to clientes table for playlist_id if table exists
-- ALTER TABLE clientes ADD CONSTRAINT fk_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL;
