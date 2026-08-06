import { supabase } from '../../lib/supabase';
import { FeedSource } from '../../types';

export const feedSourcesService = {
  async getAll(): Promise<FeedSource[]> {
    try {
      const { data, error } = await supabase
        .from('feed_sources')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fontes de feed:', error);
        return [];
      }

      return data as FeedSource[];
    } catch (error) {
      console.error('Erro na requisição das fontes de feed:', error);
      return [];
    }
  },

  async getByPlaylist(playlistId: string): Promise<FeedSource[]> {
    try {
      const { data, error } = await supabase
        .from('feed_sources')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fontes de feed da playlist:', error);
        return [];
      }

      return data as FeedSource[];
    } catch (error) {
      console.error('Erro na requisição das fontes de feed da playlist:', error);
      return [];
    }
  },

  async create(source: Omit<FeedSource, 'id' | 'criado_em' | 'ultima_execucao' | 'ultimo_item_id'>): Promise<FeedSource | null> {
    try {
      const { data, error } = await supabase
        .from('feed_sources')
        .insert([source])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar fonte de feed:', error);
        return null;
      }

      return data as FeedSource;
    } catch (error) {
      console.error('Erro na requisição de criação da fonte de feed:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Omit<FeedSource, 'id' | 'tipo' | 'criado_em'>>): Promise<FeedSource | null> {
    try {
      const { data, error } = await supabase
        .from('feed_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar fonte de feed:', error);
        return null;
      }

      return data as FeedSource;
    } catch (error) {
      console.error('Erro na requisição de atualização da fonte de feed:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feed_sources')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar fonte de feed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro na requisição de exclusão da fonte de feed:', error);
      return false;
    }
  }
};
