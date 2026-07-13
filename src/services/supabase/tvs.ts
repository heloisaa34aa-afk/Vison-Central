import { supabase } from '../../lib/supabase';
import { Tv } from '../../types';

function getLocalConfigs(id: string): any {
  try {
    const raw = localStorage.getItem(`tv_configuracoes_${id}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading local TV config:', e);
  }
  return {};
}

function saveLocalConfigs(id: string, configs: any): void {
  try {
    localStorage.setItem(`tv_configuracoes_${id}`, JSON.stringify(configs));
  } catch (e) {
    console.warn('Error saving local TV config:', e);
  }
}

export function mapDbToTv(db: any): Tv {
  const parts = (db.nome || '').split(' | ');
  const baseNome = parts[0] || '';
  const resolucao = db.resolucao || '1920x1080';
  const orientacao = (db.orientacao || 'Horizontal') as 'Horizontal' | 'Vertical';
  
  const local = getLocalConfigs(db.id);

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
    modoReproducao: local.modoReproducao || 'Autoplay',
    proporcao: local.proporcao || 'contain',
    brilho: local.brilho !== undefined ? local.brilho : 100,
    contraste: local.contraste !== undefined ? local.contraste : 100,
    zoom: local.zoom !== undefined ? local.zoom : 100,
    volume: local.volume !== undefined ? local.volume : 50,
    tempoTransicao: local.tempoTransicao !== undefined ? local.tempoTransicao : 3,
    versaoConfiguracao: db.versao_configuracao !== undefined ? db.versao_configuracao : 1,
    ultimaAtualizacao: db.ultima_atualizacao || db.ultima_conexao || ''
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
    resolucao: tv.resolucao || '1920x1080',
    versao_configuracao: tv.versaoConfiguracao !== undefined ? tv.versaoConfiguracao : 1,
    ultima_atualizacao: tv.ultimaAtualizacao || new Date().toISOString()
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
      // 1. Buscar a TV existente para comparar configurações
      const { data: existing, error: fetchError } = await supabase
        .from('tvs')
        .select('*')
        .eq('id', tv.id)
        .maybeSingle();

      let nextVersao = tv.versaoConfiguracao !== undefined ? tv.versaoConfiguracao : 1;
      let nextUltimaAtualizacao = tv.ultimaAtualizacao || new Date().toISOString();

      const oldLocal = getLocalConfigs(tv.id);

      if (!fetchError && existing) {
        const currentPlaylistId = existing.playlist_id || undefined;
        const currentOrientacao = existing.orientacao || undefined;
        const currentResolucao = existing.resolucao || undefined;
        const currentNome = (existing.nome || '').split(' | ')[0] || '';

        const hasConfigChanged = 
          tv.playlistId !== currentPlaylistId ||
          tv.orientacao !== currentOrientacao ||
          tv.resolucao !== currentResolucao ||
          tv.nome !== currentNome ||
          tv.modoReproducao !== oldLocal.modoReproducao ||
          tv.proporcao !== oldLocal.proporcao ||
          tv.brilho !== oldLocal.brilho ||
          tv.contraste !== oldLocal.contraste ||
          tv.zoom !== oldLocal.zoom ||
          tv.volume !== oldLocal.volume ||
          tv.tempoTransicao !== oldLocal.tempoTransicao;

        if (hasConfigChanged) {
          nextVersao = (existing.versao_configuracao || 0) + 1;
          nextUltimaAtualizacao = new Date().toISOString();
        } else {
          nextVersao = existing.versao_configuracao !== undefined ? existing.versao_configuracao : 1;
          nextUltimaAtualizacao = existing.ultima_atualizacao || existing.ultima_conexao || new Date().toISOString();
        }
      } else {
        nextVersao = 1;
        nextUltimaAtualizacao = new Date().toISOString();
      }

      // Atualizar as propriedades no objeto que recebemos para manter o estado local consistente
      tv.versaoConfiguracao = nextVersao;
      tv.ultimaAtualizacao = nextUltimaAtualizacao;

      // Salvar as configurações extras localmente
      saveLocalConfigs(tv.id, {
        modoReproducao: tv.modoReproducao,
        proporcao: tv.proporcao,
        brilho: tv.brilho,
        contraste: tv.contraste,
        zoom: tv.zoom,
        volume: tv.volume,
        tempoTransicao: tv.tempoTransicao
      });

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
