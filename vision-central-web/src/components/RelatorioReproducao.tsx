import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../lib/storage';
import { historicoService, HistoricoResumo } from '../services/supabase/historico';
import { Cliente, Tv } from '../types';
import { Download, Calendar, Filter, FileText, Search } from 'lucide-react';

const EMPTY_REPORT: HistoricoResumo = {
  list: [], totalExibicoes: 0, tempoGeral: 0, midiaMaisExibida: 'Nenhuma'
};

export default function RelatorioReproducao() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tvs, setTvs] = useState<Tv[]>([]);
  
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedTv, setSelectedTv] = useState<string>('');
  
  // Default to last 7 days
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [aggregatedData, setAggregatedData] = useState<HistoricoResumo>(EMPTY_REPORT);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadBaseData();
  }, []);

  async function loadBaseData() {
    const [clientsData, tvsData] = await Promise.all([
      storageService.getClientes(),
      storageService.getTvs()
    ]);
    setClientes(Array.isArray(clientsData) ? clientsData.filter(Boolean) : []);
    setTvs(Array.isArray(tvsData) ? tvsData.filter(Boolean) : []);
  }

  const handleFetchData = async () => {
    if (!dataInicio || !dataFim) {
      alert('Selecione as datas de início e fim.');
      return;
    }

    if (dataInicio > dataFim) {
      setErrorMessage('A data inicial não pode ser posterior à data final.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      // Fix dates to start and end of day in ISO
      const start = new Date(`${dataInicio}T00:00:00Z`).toISOString();
      const end = new Date(`${dataFim}T23:59:59Z`).toISOString();
      
      const data = await historicoService.buscarResumoPorPeriodo({
        clienteId: selectedCliente || undefined,
        tvId: selectedTv || undefined,
        dataInicio: start,
        dataFim: end
      });
      const safeList = Array.isArray(data?.list) ? data.list.filter(Boolean) : [];
      setAggregatedData({
        list: safeList,
        totalExibicoes: Number(data?.totalExibicoes) || 0,
        tempoGeral: Number(data?.tempoGeral) || 0,
        midiaMaisExibida: String(data?.midiaMaisExibida || 'Nenhuma')
      });
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível carregar o relatório. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTvs = useMemo(() => {
    if (!selectedCliente) return tvs;
    return tvs.filter(tv => tv.clienteId === selectedCliente);
  }, [selectedCliente, tvs]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatShortTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min ${seconds % 60}s`;
  };

  const exportPDF = async () => {
    if (aggregatedData.list.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const previewWindow = isAppleMobile ? window.open('', '_blank') : null;

    try {
      // Só carrega o gerador quando o usuário exporta. Isso evita falhas do
      // jsPDF durante a abertura da página em navegadores iOS mais antigos.
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const autoTable = autoTableModule.default;
      const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Relatório de Mídias Reproduzidas', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const clienteName = selectedCliente ? clientes.find(c => c.id === selectedCliente)?.nome || 'Todos' : 'Todos os Clientes';
    const tvName = selectedTv ? tvs.find(t => t.id === selectedTv)?.nome || 'Todas' : 'Todas as TVs';
    
    doc.text(`Cliente: ${clienteName}`, 14, 30);
    doc.text(`TV: ${tvName}`, 14, 36);
    doc.text(`Período: ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`, 14, 42);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 48);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Resumo:', 14, 58);
    doc.setFontSize(10);
    doc.text(`Tempo Total: ${formatTime(aggregatedData.tempoGeral)}`, 14, 64);
    doc.text(`Total de Exibições: ${aggregatedData.totalExibicoes}`, 14, 70);
    doc.text(`Mídia Mais Exibida: ${aggregatedData.midiaMaisExibida}`, 14, 76);

    // Table
    const tableData = aggregatedData.list.map(item => [
      item.midia_nome,
      item.midia_tipo,
      item.exibicoes.toString(),
      formatTime(item.tempo_total),
      formatTime(item.tempo_medio)
    ]);

      autoTable(doc, {
      startY: 85,
      head: [['Mídia', 'Tipo', 'Qtd. Exibições', 'Tempo Total', 'Tempo Médio']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });

      const clientFileName = clienteName.replace(/\s+/g, '-').toLowerCase();
      const fileName = `relatorio-reproducao-${clientFileName}-${dataInicio}-a-${dataFim}.pdf`;

      if (isAppleMobile && previewWindow) {
        const blob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(blob);
        previewWindow.location.href = pdfUrl;
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      } else {
        doc.save(fileName);
      }
    } catch (error) {
      previewWindow?.close();
      console.error('Erro ao gerar PDF:', error);
      setErrorMessage('Não foi possível gerar o PDF neste aparelho. Tente novamente ou utilize outro navegador.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Relatório de Reprodução
          </h2>
          <p className="text-slate-400">Histórico de mídias exibidas e exportação de relatórios.</p>
        </div>
        
        <button
          onClick={exportPDF}
          disabled={aggregatedData.list.length === 0}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Cliente</label>
          <select 
            className="w-full px-3 py-2 bg-[#050508] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
            value={selectedCliente}
            onChange={(e) => {
              setSelectedCliente(e.target.value);
              setSelectedTv(''); // reset TV on client change
            }}
          >
            <option value="">Todos os Clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">TV</label>
          <select 
            className="w-full px-3 py-2 bg-[#050508] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
            value={selectedTv}
            onChange={(e) => setSelectedTv(e.target.value)}
            disabled={!selectedCliente && tvs.length > 0} // Optional rule, let's keep it enabled if they want to filter
          >
            <option value="">Todas as TVs</option>
            {filteredTvs.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Período de Exibição</label>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-[#050508] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 text-slate-300"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <span className="text-slate-500">a</span>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-[#050508] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 text-slate-300"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-end">
          <button 
            onClick={handleFetchData}
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10 disabled:opacity-50 h-[38px]"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <><Search className="w-4 h-4" /> Buscar</>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Summary Cards */}
      {aggregatedData.totalExibicoes > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Tempo Total de Tela</h3>
            <p className="text-3xl font-bold text-white">{formatShortTime(aggregatedData.tempoGeral)}</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Total de Exibições</h3>
            <p className="text-3xl font-bold text-white">{aggregatedData.totalExibicoes}</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Mídia Mais Exibida</h3>
            <p className="text-xl font-bold text-white truncate" title={aggregatedData.midiaMaisExibida}>{aggregatedData.midiaMaisExibida}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 border-b border-white/5">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mídia</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Qtd. Exibições</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tempo Total</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Tempo Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {aggregatedData.list.length > 0 ? (
                aggregatedData.list.map((item, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-200">{item.midia_nome}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                        {item.midia_tipo}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-300">{item.exibicoes}</td>
                    <td className="p-4 text-right text-slate-300">{formatTime(item.tempo_total)}</td>
                    <td className="p-4 text-right text-slate-400">{formatTime(item.tempo_medio)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {loading ? 'Buscando histórico...' : hasSearched ? 'Nenhum histórico encontrado para o período.' : 'Escolha os filtros e toque em Buscar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
