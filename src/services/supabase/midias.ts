import { supabase } from '../../lib/supabase';
import { Media } from '../../types';

export function mapDbToMedia(db: any): Media {
  return {
    id: db.id,
    name: db.nome || db.name || '',
    url: db.url_storage || db.url || '',
    type: (db.tipo || db.type || 'image') as any,
    duration: db.duracao !== undefined ? Number(db.duracao) : Number(db.duration || 10),
    size: db.tamanho || db.size || ''
  };
}

export function mapMediaToDb(media: Media): any {
  return {
    id: media.id,
    nome: media.name,
    tipo: media.type,
    url_storage: media.url,
    duracao: media.duration,
    tamanho: media.size || null
  };
}

export const midiasService = {
  async getMedia(fallback: Media[]): Promise<Media[]> {
    try {
      const { data, error } = await supabase.from('midias').select('*');
      if (error) {
        // Fallback to alternate table 'media'
        const { data: altData, error: altError } = await supabase.from('media').select('*');
        if (!altError && altData) {
          return altData.map(mapDbToMedia);
        }
        console.warn('Erro ao buscar mídias:', error);
        return fallback;
      }
      return data ? data.map(mapDbToMedia) : fallback;
    } catch (e) {
      console.error(e);
      return fallback;
    }
  },

  async saveMedia(media: Media): Promise<boolean> {
    try {
      const dbData = mapMediaToDb(media);
      const { error } = await supabase.from('midias').upsert(dbData);
      if (error) {
        // Fallback to alternate table 'media'
        const { error: altError } = await supabase.from('media').upsert({
          id: media.id,
          name: media.name,
          url: media.url,
          type: media.type,
          duration: media.duration,
          size: media.size || null
        });
        if (altError) {
          console.warn('Erro ao salvar mídia:', altError);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteMedia(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('midias').delete().eq('id', id);
      if (error) {
        await supabase.from('media').delete().eq('id', id);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
