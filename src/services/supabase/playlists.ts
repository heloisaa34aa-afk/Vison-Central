import { supabase } from '../../lib/supabase';
import { Playlist } from '../../types';

export const playlistsService = {
  async getPlaylists(fallback: Playlist[]): Promise<Playlist[]> {
    try {
      const { data: playlistsData, error: plError } = await supabase.from('playlists').select('*');
      if (plError) {
        // Fallback to alternate table directly
        const { data: altData, error: altError } = await supabase.from('playlists').select('*');
        if (!altError && altData) {
          return altData.map((db: any) => ({
            id: db.id,
            name: db.nome || db.name || '',
            mediaIds: db.mediaIds || db.media_ids || []
          }));
        }
        return fallback;
      }

      if (!playlistsData) return fallback;

      // Query relations from playlist_midias
      const { data: relations, error: relError } = await supabase
        .from('playlist_midias')
        .select('*')
        .order('ordem', { ascending: true });

      const relationMap: Record<string, string[]> = {};
      if (!relError && relations) {
        relations.forEach((rel: any) => {
          if (!relationMap[rel.playlist_id]) {
            relationMap[rel.playlist_id] = [];
          }
          relationMap[rel.playlist_id].push(rel.midia_id);
        });
      }

      return playlistsData.map((pl: any) => {
        return {
          id: pl.id,
          name: pl.nome || pl.name || '',
          mediaIds: relationMap[pl.id] || pl.mediaIds || pl.media_ids || []
        };
      });
    } catch (e) {
      console.error(e);
      return fallback;
    }
  },

  async savePlaylist(playlist: Playlist): Promise<boolean> {
    try {
      // 1. Save playlist itself
      const { error: plError } = await supabase.from('playlists').upsert({
        id: playlist.id,
        nome: playlist.name
      });

      if (plError) {
        // Fallback
        const { error: altError } = await supabase.from('playlists').upsert({
          id: playlist.id,
          name: playlist.name,
          mediaIds: playlist.mediaIds
        });
        if (altError) return false;
        return true;
      }

      // 2. Delete existing relations
      await supabase.from('playlist_midias').delete().eq('playlist_id', playlist.id);

      // 3. Insert new relations
      if (playlist.mediaIds && playlist.mediaIds.length > 0) {
        const relations = playlist.mediaIds.map((mediaId, idx) => ({
          id: `${playlist.id}-${mediaId}-${idx}-${Date.now()}`,
          playlist_id: playlist.id,
          midia_id: mediaId,
          ordem: idx,
          duracao: 10
        }));

        await supabase.from('playlist_midias').insert(relations);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deletePlaylist(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) {
        await supabase.from('playlists').delete().eq('id', id);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
