import { supabase } from '../../lib/supabase';
import { Cliente } from '../../types';

export function mapDbToCliente(db: any): Cliente {
  return {
    id: db.id,
    nome: db.nome || '',
    categoria: db.categoria || '',
    status: (db.status as any) || 'Ativo',
    quantidadeTelas: 1,
    cidade: db.cidade || '',
    bairro: db.bairro || '',
    tipoIcone: (db.icon_type || 'store') as any,
    orientacao: (db.orientation || 'Horizontal') as any,
    fusoHorario: db.timezone || 'America/Sao_Paulo',
    playlistId: db.playlist_id || undefined,
    textoTicker: db.ticker_text || undefined
  };
}

export function mapClienteToDb(cliente: Cliente): any {
  return {
    id: cliente.id,
    nome: cliente.nome,
    categoria: cliente.categoria,
    status: cliente.status,
    cidade: cliente.cidade,
    bairro: cliente.bairro,
    icon_type: cliente.tipoIcone,
    orientation: cliente.orientacao,
    timezone: cliente.fusoHorario,
    playlist_id: cliente.playlistId || null,
    ticker_text: cliente.textoTicker || null
  };
}

export const clientesService = {
  async getClientes(): Promise<Cliente[]> {
    try {
      const { data: clientsData, error: clientsError } = await supabase.from('clientes').select('*');
      if (clientsError) {
        console.warn('Erro ao buscar clientes:', clientsError);
        return [];
      }
      if (!clientsData) return [];

      const { data: tvsData, error: tvsError } = await supabase.from('tvs').select('cliente_id');
      const tvsCountMap: Record<string, number> = {};
      if (!tvsError && tvsData) {
        tvsData.forEach((tv: any) => {
          const cId = tv.cliente_id;
          if (cId) {
            tvsCountMap[cId] = (tvsCountMap[cId] || 0) + 1;
          }
        });
      }

      return clientsData.map((db: any) => {
        const mapped = mapDbToCliente(db);
        mapped.quantidadeTelas = tvsCountMap[db.id] || 0;
        return mapped;
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async saveCliente(cliente: Cliente): Promise<boolean> {
    try {
      const dbData = mapClienteToDb(cliente);
      const { error } = await supabase.from('clientes').upsert(dbData);
      if (error) {
        console.warn('Erro ao salvar cliente:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteCliente(id: string): Promise<boolean> {
    try {
      // 1. Desvincular playlist do cliente para quebrar dependência circular
      try {
        await supabase.from('clientes').update({ playlist_id: null }).eq('id', id);
      } catch (e) {
        console.warn('Aviso ao desvincular playlist do cliente:', e);
      }

      // 2. Buscar todas as playlists deste cliente
      let playlistIds: string[] = [];
      try {
        const { data: playlistsData } = await supabase
          .from('playlists')
          .select('id')
          .eq('cliente_id', id);
        playlistIds = playlistsData ? playlistsData.map(p => p.id) : [];
      } catch (e) {
        console.warn('Aviso ao buscar playlists do cliente:', e);
      }

      // 3. Buscar todas as mídias deste cliente
      let midiaIds: string[] = [];
      let midiasData: any[] = [];
      try {
        const { data } = await supabase
          .from('midias')
          .select('id, url_storage')
          .eq('cliente_id', id);
        midiasData = data || [];
        midiaIds = midiasData.map(m => m.id);
      } catch (e) {
        console.warn('Aviso ao buscar mídias do cliente:', e);
      }

      // 4. Buscar todas as TVs deste cliente
      let tvIds: string[] = [];
      try {
        const { data: tvsData } = await supabase
          .from('tvs')
          .select('id')
          .eq('cliente_id', id);
        tvIds = tvsData ? tvsData.map(t => t.id) : [];
      } catch (e) {
        console.warn('Aviso ao buscar TVs do cliente:', e);
      }

      // 5. Deletar vínculos de playlist_midias (de playlists e mídias do cliente)
      if (playlistIds.length > 0) {
        try {
          await supabase
            .from('playlist_midias')
            .delete()
            .in('playlist_id', playlistIds);
        } catch (e) {
          console.warn('Aviso ao deletar vínculos de playlist_midias por playlist_id:', e);
        }
      }
      if (midiaIds.length > 0) {
        try {
          await supabase
            .from('playlist_midias')
            .delete()
            .in('midia_id', midiaIds);
        } catch (e) {
          console.warn('Aviso ao deletar vínculos de playlist_midias por midia_id:', e);
        }
      }

      // 6. Deletar logs associados às TVs do cliente
      if (tvIds.length > 0) {
        try {
          await supabase
            .from('logs')
            .delete()
            .in('tv_id', tvIds);
        } catch (e) {
          console.warn('Aviso ao deletar logs das TVs do cliente:', e);
        }
      }

      // 7. Desvincular playlists em qualquer TV do cliente antes de excluí-la
      try {
        await supabase
          .from('tvs')
          .update({ playlist_id: null })
          .eq('cliente_id', id);
      } catch (e) {
        console.warn('Aviso ao desvincular playlists das TVs do cliente:', e);
      }

      // 8. Deletar todas as TVs deste cliente
      try {
        await supabase
          .from('tvs')
          .delete()
          .eq('cliente_id', id);
      } catch (e) {
        console.warn('Aviso ao deletar TVs do cliente:', e);
      }

      // 9. Deletar todas as playlists deste cliente
      try {
        await supabase
          .from('playlists')
          .delete()
          .eq('cliente_id', id);
      } catch (e) {
        console.warn('Aviso ao deletar playlists do cliente:', e);
      }

      // 10. Deletar arquivos físicos no storage para as mídias do cliente
      if (midiasData.length > 0) {
        try {
          const { storageServiceSupabase } = await import('./storage');
          for (const midia of midiasData) {
            if (midia.url_storage) {
              await storageServiceSupabase.deleteMediaFile(midia.url_storage);
            }
          }
        } catch (e) {
          console.warn('Aviso ao deletar arquivos físicos do storage:', e);
        }

        // 11. Deletar mídias do banco de dados
        try {
          await supabase.from('midias').delete().in('id', midiaIds);
        } catch (e) {
          console.warn('Aviso ao deletar mídias do banco de dados:', e);
        }
      }

      // 12. Deletar as configurações deste cliente
      try {
        await supabase
          .from('configuracoes')
          .delete()
          .eq('cliente_id', id);
      } catch (e) {
        console.warn('Aviso ao deletar configurações do cliente:', e);
      }

      // 13. Finalmente, deletar o cliente do banco de dados
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar cliente:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Falha geral ao deletar cliente:', e);
      return false;
    }
  }
};
