import { supabase } from '../../lib/supabase';

export interface HistoricoResumoItem {
  midia_nome: string;
  midia_tipo: string;
  exibicoes: number;
  tempo_total: number;
  tempo_medio: number;
}

export interface HistoricoResumo {
  list: HistoricoResumoItem[];
  totalExibicoes: number;
  tempoGeral: number;
  midiaMaisExibida: string;
}

interface HistoricoResumoRow {
  midia_nome: string | null;
  midia_tipo: string | null;
  duracao_segundos: number | string | null;
}

export const historicoService = {
  async buscarResumoPorPeriodo(params: {
    clienteId?: string;
    tvId?: string;
    dataInicio: string;
    dataFim: string;
  }): Promise<HistoricoResumo> {
    const pageSize = 1000;
    const aggregate = new Map<string, HistoricoResumoItem>();
    let totalExibicoes = 0;
    let tempoGeral = 0;
    let from = 0;

    try {
      while (true) {
        let query = supabase
          .from('historico_reproducao')
          .select('midia_nome,midia_tipo,duracao_segundos')
          .gte('iniciado_em', params.dataInicio)
          .lte('iniciado_em', params.dataFim)
          .order('iniciado_em', { ascending: true })
          .range(from, from + pageSize - 1);

        if (params.clienteId) query = query.eq('cliente_id', params.clienteId);
        if (params.tvId) query = query.eq('tv_id', params.tvId);

        const { data, error } = await query;
        if (error) throw error;

        const rows = Array.isArray(data) ? (data as HistoricoResumoRow[]) : [];
        for (const row of rows) {
          const nome = row.midia_nome || 'Mídia sem nome';
          const tipo = row.midia_tipo || 'desconhecido';
          const duration = Math.max(0, Number(row.duracao_segundos) || 0);
          const key = `${nome}\u0000${tipo}`;
          const current = aggregate.get(key) || {
            midia_nome: nome,
            midia_tipo: tipo,
            exibicoes: 0,
            tempo_total: 0,
            tempo_medio: 0
          };

          current.exibicoes += 1;
          current.tempo_total += duration;
          aggregate.set(key, current);
          totalExibicoes += 1;
          tempoGeral += duration;
        }

        if (rows.length < pageSize) break;
        from += pageSize;

        // Libera a interface entre páginas para não travar navegadores móveis.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }

      const list = Array.from(aggregate.values())
        .map((item) => ({
          ...item,
          tempo_medio: item.exibicoes > 0 ? Math.round(item.tempo_total / item.exibicoes) : 0
        }))
        .sort((a, b) => b.tempo_total - a.tempo_total);

      return {
        list,
        totalExibicoes,
        tempoGeral,
        midiaMaisExibida: list[0]?.midia_nome || 'Nenhuma'
      };
    } catch (error) {
      console.error('Erro ao buscar resumo do histórico de reprodução:', error);
      throw error;
    }
  }
};
