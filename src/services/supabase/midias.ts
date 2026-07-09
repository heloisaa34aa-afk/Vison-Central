import { supabase } from '../../lib/supabase';
import { Midia } from '../../types';

export function mapDbToMidia(db: any): Midia {
  return {
    id: db.id,
    nome: db.nome || '',
    url: db.url_storage || '',
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
    url_storage: midia.url,
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
      const { error } = await supabase.from('midias').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar mídia:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
