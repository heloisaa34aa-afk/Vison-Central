import { supabase } from '../../lib/supabase';
import { Playlist } from '../../types';

export const playlistsService = {
  async getPlaylists(): Promise<Playlist[]> {
    try {
      const { data: playlistsData, error: plError } = await supabase.from('playlists').select('*');
      if (plError) {
        console.warn('Erro ao buscar playlists:', plError);
        return [];
      }

      if (!playlistsData) return [];

      // Buscar relações de playlist_midias
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
          nome: pl.nome || '',
          midiasIds: relationMap[pl.id] || [],
          clienteId: pl.cliente_id || undefined
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async savePlaylist(playlist: Playlist): Promise<boolean> {
    try {
      // 1. Salvar a playlist em si
      const { error: plError } = await supabase.from('playlists').upsert({
        id: playlist.id,
        nome: playlist.nome,
        cliente_id: playlist.clienteId || null
      });

      if (plError) {
        console.warn('Erro ao salvar playlist:', plError);
        return false;
      }

      // 2. Deletar as relações existentes em playlist_midias
      await supabase.from('playlist_midias').delete().eq('playlist_id', playlist.id);

      // 3. Inserir as novas relações em playlist_midias
      if (playlist.midiasIds && playlist.midiasIds.length > 0) {
        const relations = playlist.midiasIds.map((midiaId, idx) => ({
          id: `${playlist.id}-${midiaId}-${idx}-${Date.now()}`,
          playlist_id: playlist.id,
          midia_id: midiaId,
          ordem: idx,
          duracao: 10
        }));

        const { error: relError } = await supabase.from('playlist_midias').insert(relations);
        if (relError) {
          console.warn('Erro ao salvar mídias da playlist:', relError);
          return false;
        }
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
        console.warn('Erro ao deletar playlist:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
