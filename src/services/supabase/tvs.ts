import { supabase } from '../../lib/supabase';
import { Tv } from '../../types';

export function mapDbToTv(db: any): Tv {
  const parts = (db.nome || '').split(' | ');
  const baseNome = parts[0] || '';
  const orientacao = (db.orientacao || 'Horizontal') as 'Horizontal' | 'Vertical';
  
  return {
    id: db.id,
    clienteId: db.cliente_id || '',
    nome: baseNome,
    status: (db.status as any) || 'Offline',
    uptime: db.uptime || '0h 0m',
    token: db.token || '',
    ultimaSincronizacao: db.ultima_sincronizacao || '',
    playlistId: db.playlist_id || undefined,
    ultimaConexao: db.ultima_conexao || undefined,
    orientacao,
    modo_exibicao: db.modo_exibicao || 'Autoplay',
    proporcao: db.proporcao || 'contain',
    brilho: db.brilho !== undefined ? db.brilho : 100,
    contraste: db.contraste !== undefined ? db.contraste : 100,
    saturacao: db.saturacao !== undefined ? db.saturacao : 100,
    zoom: db.zoom !== undefined ? db.zoom : 100,
    volume: db.volume !== undefined ? db.volume : 50,
    tempo_transicao: db.tempo_transicao !== undefined ? db.tempo_transicao : 3
  };
}

export function mapTvToDb(tv: Tv): any {
  return {
    id: tv.id,
    cliente_id: tv.clienteId,
    nome: tv.nome || '',
    token: tv.token,
    status: tv.status,
    uptime: tv.uptime,
    ultima_sincronizacao: tv.ultimaSincronizacao || new Date().toISOString(),
    playlist_id: tv.playlistId || null,
    ultima_conexao: tv.ultimaConexao || new Date().toISOString(),
    orientacao: tv.orientacao || 'Horizontal',
    proporcao: tv.proporcao || 'contain',
    modo_exibicao: tv.modo_exibicao || 'Autoplay',
    brilho: tv.brilho !== undefined ? tv.brilho : 100,
    contraste: tv.contraste !== undefined ? tv.contraste : 100,
    saturacao: tv.saturacao !== undefined ? tv.saturacao : 100,
    zoom: tv.zoom !== undefined ? tv.zoom : 100,
    volume: tv.volume !== undefined ? tv.volume : 50,
    tempo_transicao: tv.tempo_transicao !== undefined ? tv.tempo_transicao : 3
  };
}

export const tvsService = {
  async getTvs(): Promise<Tv[]> {
    try {
      const { data, error } = await supabase.from('tvs').select('*');
      if (error) {
        console.warn('Erro ao buscar TVs:', error);
        return [];
      }
      return data ? data.map(mapDbToTv) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async saveTv(tv: Tv): Promise<boolean> {
    try {
      tv.ultimaSincronizacao = new Date().toISOString();
      const dbData = mapTvToDb(tv);
      const { error } = await supabase.from('tvs').upsert(dbData);
      if (error) {
        console.warn('Erro ao salvar TV:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteTv(id: string): Promise<boolean> {
    try {
      // 1. Deletar os logs associados à TV primeiro para garantir que não haja restrição de FK
      try {
        await supabase.from('logs').delete().eq('tv_id', id);
      } catch (e) {
        console.warn('Aviso ao deletar logs da TV:', e);
      }

      // 2. Deletar a TV do banco de dados
      const { error } = await supabase.from('tvs').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar TV:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
