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

      query = query.order('iniciado_em', { ascending: true }).order('id', { ascending: true });

      let allData: HistoricoReproducao[] = [];
      let from = 0;
      let limit = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const to = from + limit - 1;
        const { data, error } = await query.range(from, to);

        if (error) {
          console.error('Erro ao buscar histórico de reprodução:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...(data as HistoricoReproducao[])];
          if (data.length < limit) {
            fetchMore = false;
          } else {
            from += limit;
          }
        } else {
          fetchMore = false;
        }
      }

      return allData;
    } catch (error) {
      console.error('Erro na requisição do histórico de reprodução:', error);
      throw error;
    }
  }
};
