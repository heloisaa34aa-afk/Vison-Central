const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vision-central-web', 'src', 'components', 'RelatorioReproducao.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove static imports
content = content.replace("import jsPDF from 'jspdf';\n", "");
content = content.replace("import autoTable from 'jspdf-autotable';\n", "");

// Replace exportPDF function
const oldExportPdf = /const exportPDF = \(\) => \{[\s\S]*?doc\.save\(fileName\);\n  \};/;
const newExportPdf = `const exportPDF = async () => {
    if (aggregatedData.list.length === 0 || loadingPdf) return;
    setLoadingPdf(true);
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const clienteName = clientes.find(c => c.id === selectedCliente)?.nome || 'Todos';
      
      doc.setFontSize(16);
      doc.text('Relatorio de Reproducao', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(\`Cliente: \${clienteName}\`, 14, 30);
      if (selectedTv) {
        const tvName = tvs.find(t => t.id === selectedTv)?.nome || 'N/A';
        doc.text(\`TV: \${tvName}\`, 14, 36);
      }
      doc.text(\`Periodo: \${dataInicio} ate \${dataFim}\`, 14, selectedTv ? 42 : 36);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Resumo', 14, 56);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(\`Tempo Total de Tela: \${formatShortTime(aggregatedData.tempoGeral)}\`, 14, 64);
      doc.text(\`Total de Exibicoes: \${aggregatedData.totalExibicoes}\`, 14, 70);
      doc.text(\`Midia Mais Exibida: \${aggregatedData.midiaMaisExibida}\`, 14, 76);

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

      const clientFileName = clienteName.replace(/\\s+/g, '-').toLowerCase();
      const fileName = \`relatorio-reproducao-\${clientFileName}-\${dataInicio}-a-\${dataFim}.pdf\`;

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (isSafari || isIOS) {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) {
           alert('O Safari bloqueou a abertura do PDF. Permita popups para este site.');
        }
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setErrorMessage('Falha ao gerar o PDF. Tente novamente.');
    } finally {
      setLoadingPdf(false);
    }
  };`;

content = content.replace(oldExportPdf, newExportPdf);

// add loadingPdf state
if (!content.includes('const [loadingPdf, setLoadingPdf]')) {
  content = content.replace(
    /const \[errorMessage, setErrorMessage\] = useState<string \| null>\(null\);/,
    "const [errorMessage, setErrorMessage] = useState<string | null>(null);\n  const [loadingPdf, setLoadingPdf] = useState(false);"
  );
}

// update button
content = content.replace(
  /<Download className="w-4 h-4" \/> Exportar PDF/g,
  `{loadingPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Download className="w-4 h-4" />} {loadingPdf ? 'Gerando PDF...' : 'Exportar PDF'}`
);

fs.writeFileSync(filePath, content);
console.log('Patched RelatorioReproducao.tsx');
