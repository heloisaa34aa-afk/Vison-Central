import { supabase } from '../../lib/supabase';
import { Tv } from '../../types';

export function mapDbToTv(db: any): Tv {
  const parts = (db.nome || '').split(' | ');
  const baseNome = parts[0] || '';
  const resolucao = parts[1] || '1920x1080';
  const orientacao = (parts[2] || 'Horizontal') as 'Horizontal' | 'Vertical';
  const modoReproducao = parts[3] || 'Autoplay';
  const proporcao = parts[4] || '16:9';
  const modoExibicao = parts[5] || 'contain';
  const brilho = parts[6] !== undefined ? parseInt(parts[6], 10) : 100;
  const contraste = parts[7] !== undefined ? parseInt(parts[7], 10) : 100;
  const saturacao = parts[8] !== undefined ? parseInt(parts[8], 10) : 100;
  const zoom = parts[9] !== undefined ? parseInt(parts[9], 10) : 100;
  const volume = parts[10] !== undefined ? parseInt(parts[10], 10) : 50;
  const tempoTransicao = parts[11] !== undefined ? parseInt(parts[11], 10) : 10;

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
    modoReproducao,
    proporcao,
    modoExibicao,
    brilho: isNaN(brilho) ? 100 : brilho,
    contraste: isNaN(contraste) ? 100 : contraste,
    saturacao: isNaN(saturacao) ? 100 : saturacao,
    zoom: isNaN(zoom) ? 100 : zoom,
    volume: isNaN(volume) ? 50 : volume,
    tempoTransicao: isNaN(tempoTransicao) ? 10 : tempoTransicao
  };
}

export function mapTvToDb(tv: Tv): any {
  const fullNome = [
    tv.nome || '',
    tv.resolucao || '1920x1080',
    tv.orientacao || 'Horizontal',
    tv.modoReproducao || 'Autoplay',
    tv.proporcao || '16:9',
    tv.modoExibicao || 'contain',
    tv.brilho !== undefined ? tv.brilho : 100,
    tv.contraste !== undefined ? tv.contraste : 100,
    tv.saturacao !== undefined ? tv.saturacao : 100,
    tv.zoom !== undefined ? tv.zoom : 100,
    tv.volume !== undefined ? tv.volume : 50,
    tv.tempoTransicao !== undefined ? tv.tempoTransicao : 10
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
