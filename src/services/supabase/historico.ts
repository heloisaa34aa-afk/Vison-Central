import { supabase } from '../../lib/supabase';
import { HistoricoReproducao } from '../../types';

export const historicoService = {
  async buscarPorPeriodo(params: {
    clienteId?: string;
    tvId?: string;
    dataInicio: string; // ISO
    dataFim: string;    // ISO
  }): Promise<HistoricoReproducao[]> {
    try {
      let query = supabase
        .from('historico_reproducao')
        .select('*')
        .gte('iniciado_em', params.dataInicio)
        .lte('iniciado_em', params.dataFim);

      if (params.clienteId) {
        query = query.eq('cliente_id', params.clienteId);
      }
      
      if (params.tvId) {
        query = query.eq('tv_id', params.tvId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar histórico de reprodução:', error);
        return [];
      }

      return data as HistoricoReproducao[];
    } catch (error) {
      console.error('Erro na requisição do histórico de reprodução:', error);
      return [];
    }
  }
};
