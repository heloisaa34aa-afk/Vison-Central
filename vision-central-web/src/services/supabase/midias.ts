import { supabase } from '../../lib/supabase';
import { Midia } from '../../types';
import { storageServiceSupabase } from './storage';

export function mapDbToMidia(db: any): Midia {
  return {
    id: db.id,
    nome: db.nome || '',
    url: db.origem === 'url' ? (db.url_externa || '') : (db.url_storage || ''),
    origem: db.origem || 'storage',
    url_storage: db.url_storage || null,
    url_externa: db.url_externa || null,
    tipo: (db.tipo || 'image') as any,
    duracao: db.duracao !== undefined ? Number(db.duracao) : 10,
    tamanho: db.tamanho || undefined,
    clienteId: db.cliente_id || undefined
  };
}

export function mapMidiaToDb(midia: Midia): any {
  return {
    id: midia.id,
    nome: midia.nome,
    tipo: midia.tipo,
    origem: midia.origem || 'storage',
    url_storage: midia.origem === 'url' ? null : (midia.url_storage || midia.url),
    url_externa: midia.origem === 'url' ? (midia.url_externa || midia.url) : null,
    duracao: midia.duracao,
    tamanho: midia.tamanho || null,
    cliente_id: midia.clienteId || null
  };
}

export const midiasService = {
  async getMidias(): Promise<Midia[]> {
    try {
      const { data, error } = await supabase.from('midias').select('*');
      if (error) {
        console.warn('Erro ao buscar mídias:', error);
        return [];
      }
      return data ? data.map(mapDbToMidia) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async saveMidia(midia: Midia): Promise<boolean> {
    try {
      const dbData = mapMidiaToDb(midia);
      const { error } = await supabase.from('midias').upsert(dbData);
      if (error) {
        console.warn('Erro ao salvar mídia:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteMidia(id: string): Promise<boolean> {
    try {
      // 1. Obter a URL da mídia primeiro
      const { data: mediaData, error: fetchError } = await supabase
        .from('midias')
        .select('url_storage')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.warn('Erro ao buscar mídia para exclusão:', fetchError);
      }

      // 2. Deletar os vínculos em playlist_midias primeiro para evitar violações de FK
      try {
        await supabase.from('playlist_midias').delete().eq('midia_id', id);
      } catch (e) {
        console.warn('Aviso ao deletar mídias de playlists:', e);
      }

      // 3. Deletar do banco de dados
      const { error: deleteError } = await supabase.from('midias').delete().eq('id', id);
      if (deleteError) {
        console.warn('Erro ao deletar mídia do banco:', deleteError);
        return false;
      }

      // 4. Deletar do storage se a URL estiver disponível
      if (mediaData && mediaData.url_storage) {
        await storageServiceSupabase.deleteMediaFile(mediaData.url_storage);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
