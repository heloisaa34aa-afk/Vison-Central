import { supabase } from '../../lib/supabase';
import { Tv } from '../../types';

export function mapDbToTv(db: any): Tv {
  const parts = (db.nome || '').split(' | ');
  const baseNome = parts[0] || '';
  const orientacao = (db.orientacao || 'horizontal') as 'horizontal' | 'vertical';
  
  console.log(
    "[TV REALTIME]",
    db.id,
    db.status,
    db.ultima_conexao
  );

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
    tempo_transicao: db.tempo_transicao !== undefined ? db.tempo_transicao : 3,
    rotacao: db.rotacao !== undefined ? Number(db.rotacao) : 0,
    resolucao: db.resolucao || '1920x1080',
    conteudos_online: typeof db.conteudos_online === 'string' ? JSON.parse(db.conteudos_online) : (db.conteudos_online || []),
    texto_superior: db.texto_superior || '',
    texto_superior_cor: db.texto_superior_cor || '#ffffff',
    texto_superior_tamanho: db.texto_superior_tamanho || 'base',
    texto_superior_alinhamento: db.texto_superior_alinhamento || 'center',
    texto_superior_visivel: db.texto_superior_visivel || false,
    texto_inferior: db.texto_inferior || '',
    texto_inferior_cor: db.texto_inferior_cor || '#ffffff',
    texto_inferior_tamanho: db.texto_inferior_tamanho || 'base',
    texto_inferior_alinhamento: db.texto_inferior_alinhamento || 'center',
    texto_inferior_visivel: db.texto_inferior_visivel || false,
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
    orientacao: tv.orientacao,
    modo_exibicao: tv.modo_exibicao,
    proporcao: tv.proporcao,
    brilho: tv.brilho,
    contraste: tv.contraste,
    saturacao: tv.saturacao,
    zoom: tv.zoom,
    volume: tv.volume,
    tempo_transicao: tv.tempo_transicao,
    rotacao: tv.rotacao !== undefined ? String(tv.rotacao) : '0',
    resolucao: tv.resolucao || '1920x1080',
  };
}

export const tvsService = {
  async getTvs(): Promise<Tv[]> {
    try {
    const { data, error } = await supabase
      .from('tvs')
      .select('*');

    console.log("========== TVS ==========");
    console.log(data);

    if (error) {
      console.warn("Erro ao buscar TVs:", error);
      return [];
    }

    const tvs = data ? data.map(mapDbToTv) : [];

    console.log("========== TVS MAPEADAS ==========");
    console.log(tvs);

    return tvs;

  } catch (e) {
    console.error("Erro em getTvs:", e);
    return [];
  }
},

  async saveTv(tv: Tv): Promise<boolean> {
    try {
      console.log("VisionCentral: salvando rotacao", tv.rotacao);
      tv.ultimaSincronizacao = new Date().toISOString();
      const dbData = mapTvToDb(tv);
      const response = await supabase.from('tvs').upsert(dbData);
      console.log("VisionCentral: rotacao salva", response);
      if (response.error) {
        console.warn('Erro ao salvar TV:', response.error);
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
