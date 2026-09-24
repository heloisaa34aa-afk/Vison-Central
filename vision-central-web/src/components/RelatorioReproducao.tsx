import { useState, useEffect, useMemo } from 'react';
import { storageService } from '../lib/storage';
import { historicoService, HistoricoResumo } from '../services/supabase/historico';
import { Cliente, Tv } from '../types';
import { Download, FileText, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const EMPTY_REPORT: HistoricoResumo = {
  list: [], totalExibicoes: 0, tempoGeral: 0, midiaMaisExibida: 'Nenhuma'
};

const YSARTAN_LOGO_URL = `${import.meta.env.BASE_URL}ysartan-logo.png`;

async function loadImageDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Logo da Ysartan não encontrada.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Falha ao carregar a logo.'));
    reader.readAsDataURL(blob);
  });
}

function formatReportDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatMediaType(value: string) {
  const labels: Record<string, string> = {
    image: 'Imagem', video: 'Vídeo', website: 'Site', instagram: 'Instagram',
    youtube: 'YouTube', google_maps: 'Google Maps', canva: 'Canva'
  };
  return labels[value] || value;
}

export default function RelatorioReproducao() {
  const { profile } = useAuth();
  const ownerUserId = profile?.id || null;
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
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => { void loadBaseData(); }, [ownerUserId]);

  async function loadBaseData() {
    const [clientsData, tvsData] = await Promise.all([
      storageService.getClientes(),
      storageService.getTvs()
    ]);
    const safeClients = Array.isArray(clientsData) ? clientsData.filter(Boolean) : [];
    const safeTvs = Array.isArray(tvsData) ? tvsData.filter(Boolean) : [];
    const ownedClients = ownerUserId ? safeClients.filter(client => client.ownerUserId === ownerUserId) : [];
    const ownedIds = new Set(ownedClients.map(client => client.id));
    setClientes(ownedClients);
    setTvs(safeTvs.filter(tv => ownedIds.has(tv.clienteId)));
    if (selectedCliente && !ownedIds.has(selectedCliente)) setSelectedCliente('');
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
    if (aggregatedData.list.length === 0 || loadingPdf) return;
    setLoadingPdf(true);
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const clienteName = clientes.find(c => c.id === selectedCliente)?.nome || 'Todos';
      const tvName = selectedTv ? tvs.find(t => t.id === selectedTv)?.nome || 'Não encontrada' : 'Todas as TVs';
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const generatedAt = new Date().toLocaleString('pt-BR');
      let logoDataUrl: string | null = null;
      try {
        logoDataUrl = await loadImageDataUrl(YSARTAN_LOGO_URL);
      } catch (logoError) {
        console.warn('Relatório gerado sem a imagem da logo:', logoError);
      }

      doc.setProperties({
        title: `Relatório de Reprodução - ${clienteName}`,
        subject: `Exibições de ${formatReportDate(dataInicio)} a ${formatReportDate(dataFim)}`,
        author: 'Ysartan Mídia Digital',
        creator: 'Vision Central'
      });

      // Cabeçalho institucional
      doc.setFillColor(5, 12, 27);
      doc.roundedRect(margin, 8, contentWidth, 34, 3, 3, 'F');
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 12, 57, 26, 2, 2, 'F');
      if (logoDataUrl) {
        // Mantém a proporção original da arte (4380 x 2075) para não deformar a marca.
        const logoWidth = 50;
        const logoHeight = logoWidth / (4380 / 2075);
        const logoX = 15 + (57 - logoWidth) / 2;
        const logoY = 12 + (26 - logoHeight) / 2;
        doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight, undefined, 'FAST');
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(10, 190, 205);
        doc.text('YSARTAN', 43.5, 28, { align: 'center' });
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('Relatório de Reprodução', 82, 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(157, 174, 197);
      doc.text('Comprovante detalhado das mídias exibidas nas telas', 82, 29);
      doc.setTextColor(22, 218, 226);
      doc.text(`Gerado em ${generatedAt}`, pageWidth - 17, 34, { align: 'right' });

      // Identificação do relatório
      doc.setFillColor(245, 248, 252);
      doc.roundedRect(margin, 47, contentWidth, 23, 2, 2, 'F');
      const infoColumns = [17, 105, 190];
      const infoValues = [
        ['CLIENTE', clienteName],
        ['TV / TELA', tvName],
        ['PERÍODO DE EXIBIÇÃO', `${formatReportDate(dataInicio)} a ${formatReportDate(dataFim)}`]
      ];
      infoValues.forEach(([label, value], index) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(91, 108, 132);
        doc.text(label, infoColumns[index], 55);
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(doc.splitTextToSize(value, index === 2 ? 85 : 77), infoColumns[index], 63);
      });

      // Indicadores principais
      const cardY = 76;
      const gap = 5;
      const cardWidth = (contentWidth - gap * 2) / 3;
      const cards = [
        ['TEMPO TOTAL DE TELA', formatShortTime(aggregatedData.tempoGeral)],
        ['TOTAL DE EXIBIÇÕES', aggregatedData.totalExibicoes.toLocaleString('pt-BR')],
        ['MÍDIA MAIS EXIBIDA', aggregatedData.midiaMaisExibida]
      ];
      cards.forEach(([label, value], index) => {
        const x = margin + index * (cardWidth + gap);
        doc.setFillColor(index === 2 ? 236 : 240, index === 2 ? 253 : 249, index === 2 ? 254 : 255);
        doc.setDrawColor(208, 222, 235);
        doc.roundedRect(x, cardY, cardWidth, 25, 2, 2, 'FD');
        doc.setFillColor(18, 210, 221);
        doc.rect(x, cardY, 2.2, 25, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(86, 105, 129);
        doc.text(label, x + 7, cardY + 7);
        doc.setFontSize(index === 2 ? 9.2 : 15);
        doc.setTextColor(9, 20, 38);
        const valueLines = doc.splitTextToSize(value, cardWidth - 12).slice(0, 2);
        doc.text(valueLines, x + 7, cardY + 16);
      });

      const tableData = aggregatedData.list.map(item => [
        item.midia_nome,
        formatMediaType(item.midia_tipo),
        item.exibicoes.toLocaleString('pt-BR'),
        formatTime(item.tempo_total),
        formatTime(item.tempo_medio)
      ]);

      autoTable(doc, {
        startY: 108,
        head: [['Mídia', 'Tipo', 'Qtd. Exibições', 'Tempo Total', 'Tempo Médio']],
        body: tableData,
        theme: 'grid',
        margin: { left: margin, right: margin, bottom: 14 },
        styles: {
          font: 'helvetica', fontSize: 8.5, cellPadding: 2.4,
          overflow: 'linebreak', valign: 'middle',
          lineColor: [219, 228, 238], lineWidth: 0.2,
          textColor: [38, 51, 68]
        },
        headStyles: {
          fillColor: [8, 25, 47], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 8.2, halign: 'left', minCellHeight: 10
        },
        alternateRowStyles: { fillColor: [247, 250, 252] },
        columnStyles: {
          0: { cellWidth: 139 },
          1: { cellWidth: 30 },
          2: { cellWidth: 32, halign: 'center' },
          3: { cellWidth: 36, halign: 'center' },
          4: { cellWidth: 36, halign: 'center' }
        },
        rowPageBreak: 'avoid',
        didDrawPage: data => {
          doc.setDrawColor(21, 207, 219);
          doc.setLineWidth(0.5);
          doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text('Ysartan Mídia Digital | Relatório gerado pela plataforma Vision Central', margin, pageHeight - 5.5);
          doc.text(`Página ${data.pageNumber}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
        }
      });

      const clientFileName = clienteName.replace(/\s+/g, '-').toLowerCase();
      const fileName = `relatorio-reproducao-${clientFileName}-${dataInicio}-a-${dataFim}.pdf`;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const blob = doc.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // No iPhone/iPad o compartilhamento de arquivo oferece "Salvar em Arquivos"
      // sem abrir uma aba temporária. Nos demais navegadores, força o download.
      if (isIOS && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: 'Relatório de Reprodução' });
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Erro ao gerar PDF:', err);
      setErrorMessage('Falha ao gerar o PDF. Tente novamente.');
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
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
          className="w-full md:w-auto min-h-[42px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Download className="w-4 h-4" />} {loadingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(300px,1.65fr)_minmax(140px,0.8fr)] gap-5">
        
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">De</span>
              <input
                type="date"
                className="block w-full min-w-0 px-3 py-2 bg-[#050508] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 text-slate-300"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Até</span>
              <input
                type="date"
                className="block w-full min-w-0 px-3 py-2 bg-[#050508] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 text-slate-300"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-end pt-1 lg:pt-0">
          <button 
            onClick={handleFetchData}
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10 disabled:opacity-50 min-h-[42px]"
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
