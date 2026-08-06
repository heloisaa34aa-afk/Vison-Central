CREATE TABLE IF NOT EXISTS feed_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id TEXT REFERENCES playlists(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    perfil TEXT NOT NULL,
    intervalo_horas INTEGER NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultima_execucao TIMESTAMPTZ,
    ultimo_item_id TEXT,
    criado_em TIMESTAMPTZ DEFAULT now()
);
