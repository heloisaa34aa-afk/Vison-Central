const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

// Imports: we need to import X or something for the modal if not already there, also link icons.
// Existing icons might be UploadCloud, Image as ImageIcon, Video, Trash2, Edit2, Check, X... wait, let's see what's imported.
const importMatch = code.match(/import {([^}]+)} from 'lucide-react';/);
if (importMatch) {
  let icons = importMatch[1];
  if (!icons.includes('X')) icons += ', X';
  if (!icons.includes('Link')) icons += ', Link';
  if (!icons.includes('Globe')) icons += ', Globe';
  if (!icons.includes('Instagram')) icons += ', Instagram';
  if (!icons.includes('Youtube')) icons += ', Youtube';
  if (!icons.includes('Map')) icons += ', Map';
  if (!icons.includes('Palette')) icons += ', Palette';
  code = code.replace(importMatch[0], `import {${icons}} from 'lucide-react';`);
}

// State: add new states for Link modal
const stateInsertPos = code.indexOf('const [isDragging, setIsDragging]');
const linkStates = `
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDuration, setLinkDuration] = useState(15);
  const [linkError, setLinkError] = useState('');
`;
code = code.slice(0, stateInsertPos) + linkStates + code.slice(stateInsertPos);

// Automatic type detection logic and form handler
const handleSaveLinkFn = `
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    let finalUrl = linkUrl.trim();
    
    try {
      new URL(finalUrl);
    } catch {
      setLinkError('Por favor, informe uma URL válida. (ex: https://site.com)');
      return;
    }

    let tipo: Midia['tipo'] = 'website';
    const lowerUrl = finalUrl.toLowerCase();
    
    if (lowerUrl.includes('instagram.com')) {
      tipo = 'instagram';
    } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      tipo = 'youtube';
    } else if (lowerUrl.includes('maps.google') || lowerUrl.includes('google.com/maps')) {
      tipo = 'google_maps';
    } else if (lowerUrl.includes('canva.com')) {
      tipo = 'canva';
    }

    const newMedia: Midia = {
      id: \`m-\${Date.now()}\`,
      nome: linkName.trim(),
      url: finalUrl,
      tipo,
      origem: 'url',
      url_externa: finalUrl,
      duracao: Number(linkDuration),
      clienteId: client.id
    };

    try {
      const saved = await storageService.saveMidia(newMedia);
      if (saved) {
        onUpdateMedia(prev => [newMedia, ...prev]);
        setShowAddLink(false);
        setLinkName('');
        setLinkUrl('');
        setLinkDuration(15);
        showToast('Link cadastrado com sucesso!');
      } else {
        setLinkError('Erro ao salvar no banco de dados.');
      }
    } catch (err: any) {
      setLinkError(err.message || 'Erro ao salvar');
    }
  };
`;

const processFilesPos = code.indexOf('const processFiles = async (files: FileList | null) => {');
code = code.slice(0, processFilesPos) + handleSaveLinkFn + code.slice(processFilesPos);

// Add the button "+ Adicionar Link" near the UploadCloud input area
const buttonTarget = `<button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Selecionar Arquivos
        </button>`;

const newButtons = `<div className="flex gap-3 justify-center">
        ${buttonTarget}
        <button 
          onClick={() => setShowAddLink(true)}
          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Link className="w-4 h-4" /> Adicionar Link
        </button>
      </div>`;

code = code.replace(buttonTarget, newButtons);

// Modal UI for Add Link
const uploadProgressSection = `{/* Barras de Progresso */}`;
const addLinkModal = `
      {showAddLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d0d12] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-400" /> Adicionar Conteúdo Online
              </h3>
              <button onClick={() => setShowAddLink(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveLink} className="p-4 space-y-4">
              {linkError && (
                <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs p-3 rounded-lg">
                  {linkError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome / Título</label>
                <input 
                  type="text" 
                  required
                  value={linkName}
                  onChange={e => setLinkName(e.target.value)}
                  placeholder="Ex: Dashboard de Vendas"
                  className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">URL do Conteúdo</label>
                <input 
                  type="url" 
                  required
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tempo de Exibição (Segundos)</label>
                <input 
                  type="number" 
                  min={1}
                  required
                  value={linkDuration}
                  onChange={e => setLinkDuration(Number(e.target.value))}
                  className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowAddLink(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;
code = code.replace(uploadProgressSection, addLinkModal + uploadProgressSection);

// Update render items logic for new types
// We have image, video currently. Let's add websites, etc.
const filterLists = `
  const clientMedia = media.filter(m => m.clienteId === client.id);
  const imageMedia = clientMedia.filter(m => m.tipo === 'image');
  const videoMedia = clientMedia.filter(m => m.tipo === 'video');
  const onlineMedia = clientMedia.filter(m => ['website', 'instagram', 'youtube', 'google_maps', 'canva'].includes(m.tipo));
`;

code = code.replace(
  `const clientMedia = media.filter(m => m.clienteId === client.id);
  const imageMedia = clientMedia.filter(m => m.tipo === 'image');
  const videoMedia = clientMedia.filter(m => m.tipo === 'video');`,
  filterLists
);

// We need to render online content in the grid, but with different icons.
// Let's modify the card renderer to handle online media type.
const getIconForOnlineType = `
  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'instagram': return <Instagram className="w-8 h-8 text-pink-500" />;
      case 'youtube': return <Youtube className="w-8 h-8 text-red-500" />;
      case 'google_maps': return <Map className="w-8 h-8 text-green-500" />;
      case 'canva': return <Palette className="w-8 h-8 text-blue-400" />;
      case 'website':
      default: return <Globe className="w-8 h-8 text-blue-500" />;
    }
  };
`;

const renderMediaGridTarget = `const renderMediaGrid = (items: Midia[], icon: React.ReactNode, title: string) => (`;
code = code.slice(0, code.indexOf(renderMediaGridTarget)) + getIconForOnlineType + code.slice(code.indexOf(renderMediaGridTarget));

const renderContent = `{item.tipo === 'image' ? (
                <img src={item.url} alt={item.nome} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
              )}`;

const newRenderContent = `{item.tipo === 'image' ? (
                <img src={item.url} alt={item.nome} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              ) : item.tipo === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {getIconForType(item.tipo)}
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.tipo}</span>
                </div>
              )}`;
code = code.replace(renderContent, newRenderContent);

// Also update the section rendering below:
const renderSections = `{renderMediaGrid(imageMedia, <ImageIcon className="w-4 h-4 text-emerald-400" />, 'Imagens')}
        {renderMediaGrid(videoMedia, <Video className="w-4 h-4 text-purple-400" />, 'Vídeos')}`;
const newRenderSections = `{renderMediaGrid(imageMedia, <ImageIcon className="w-4 h-4 text-emerald-400" />, 'Imagens')}
        {renderMediaGrid(videoMedia, <Video className="w-4 h-4 text-purple-400" />, 'Vídeos')}
        {renderMediaGrid(onlineMedia, <Globe className="w-4 h-4 text-blue-400" />, 'Conteúdos Online')}`;
code = code.replace(renderSections, newRenderSections);


fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
