import { supabase } from '../../lib/supabase';
import { Tv } from '../../types';

export function mapDbToTv(db: any): Tv {
  const parts = (db.nome || '').split(' | ');
  const baseNome = parts[0] || '';
  const resolucao = parts[1] || '1920x1080';
  const orientacao = (parts[2] || 'Horizontal') as 'Horizontal' | 'Vertical';
  const modoReproducao = parts[3] || 'Autoplay';

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
    resolucao,
    orientacao,
    modoReproducao
  };
}

export function mapTvToDb(tv: Tv): any {
  const fullNome = [
    tv.nome || '',
    tv.resolucao || '1920x1080',
    tv.orientacao || 'Horizontal',
    tv.modoReproducao || 'Autoplay'
  ].join(' | ');

  return {
    id: tv.id,
    cliente_id: tv.clienteId,
    nome: fullNome,
    token: tv.token,
    status: tv.status,
    uptime: tv.uptime,
    ultima_sincronizacao: tv.ultimaSincronizacao || new Date().toISOString(),
    playlist_id: tv.playlistId || null,
    ultima_conexao: tv.ultimaConexao || new Date().toISOString()
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
