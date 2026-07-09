import { supabase } from '../../lib/supabase';
import { Cliente } from '../../types';

export function mapDbToCliente(db: any): Cliente {
  return {
    id: db.id,
    nome: db.nome || '',
    categoria: db.categoria || '',
    status: (db.status as any) || 'Ativo',
    quantidadeTelas: db.screens_count !== undefined ? Number(db.screens_count) : 1,
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
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) {
        console.warn('Erro ao buscar clientes:', error);
        return [];
      }
      return data ? data.map(mapDbToCliente) : [];
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
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar cliente:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
