import React, { useState, useRef } from 'react';
import { Cliente, Midia } from '../../types';
import { UploadCloud, File, Image as ImageIcon, Video, Trash2, Edit2, Check , X, Link, Globe, Instagram, Youtube, Map, Palette} from 'lucide-react';
import { storageServiceSupabase } from '../../services/supabase/storage';
import { storageService } from '../../lib/storage';

interface ClientLibraryProps {
  client: Cliente;
  media: Midia[];
  onUpdateMedia: (updateFn: (prev: Midia[]) => Midia[]) => void;
  showToast: (msg: string) => void;
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (video.src.startsWith('blob:')) {
        window.URL.revokeObjectURL(video.src);
      }
      resolve(Math.round(video.duration) || 15);
    };
    video.onerror = () => {
      resolve(15);
    };
    video.src = URL.createObjectURL(file);
  });
};

export default function ClientLibrary({ client, media, onUpdateMedia, showToast }: ClientLibraryProps) {
  
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDuration, setLinkDuration] = useState(15);
  const [linkError, setLinkError] = useState('');
const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{name: string, progress: number}[]>([]);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editMediaName, setEditMediaName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  
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
      id: `m-${Date.now()}`,
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
const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => {
      const type = file.type;
      return type.includes('image/jpeg') || type.includes('image/png') || type.includes('image/webp') || type.includes('video/mp4');
    });

    if (validFiles.length === 0) {
      showToast('Nenhum arquivo válido selecionado (JPG, PNG, WEBP, MP4).');
      return;
    }

    const createdMedias: Midia[] = [];

    for (const file of validFiles) {
      const isVideo = file.type.includes('video');
      const progressName = file.name;
      setUploadingFiles(prev => [...prev, { name: progressName, progress: 10 }]);

      try {
        let p = 10;
        const interval = setInterval(() => {
          if (p < 80) {
            p += 15;
            setUploadingFiles(prev => prev.map(f => f.name === progressName ? { ...f, progress: p } : f));
          }
        }, 120);

        // Upload to storage
        const uploadedUrl = await storageServiceSupabase.uploadMediaFile(file);
        
        clearInterval(interval);
        setUploadingFiles(prev => prev.map(f => f.name === progressName ? { ...f, progress: 100 } : f));

        let duration = isVideo ? 15 : 10;
        if (isVideo) {
          try {
            duration = await getVideoDuration(file);
          } catch (e) {
            console.warn('Não foi possível obter a duração real do vídeo:', e);
          }
        }

        const newMedia: Midia = {
          id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nome: file.name,
          tipo: isVideo ? 'video' : 'image',
          url: uploadedUrl,
          duracao: duration,
          tamanho: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          clienteId: client.id
        };

        // Salva imediatamente no Supabase Database para evitar orfandade
        const saved = await storageService.saveMidia(newMedia);
        if (!saved) {
          throw new Error('Falha ao salvar metadados da mídia no banco de dados.');
        }

        createdMedias.push(newMedia);
        showToast(`Arquivo "${file.name}" carregado com sucesso!`);
      } catch (err: any) {
        showToast(`Erro ao enviar "${file.name}": ${err.message || 'Falha no processo'}`);
        console.error(err);
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.name !== progressName));
      }
    }

    if (createdMedias.length > 0) {
      onUpdateMedia(prev => [...createdMedias, ...prev]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta mídia? Ela será removida da biblioteca e de todas as playlists.')) {
      onUpdateMedia(prev => prev.filter(m => m.id !== id));
      showToast('Mídia excluída com sucesso.');
    }
  };

  const handleStartRename = (item: Midia) => {
    setEditingMediaId(item.id);
    setEditMediaName(item.nome);
  };

  const handleSaveRename = (item: Midia) => {
    if (!editMediaName.trim()) return;
    onUpdateMedia(prev => prev.map(m => m.id === item.id ? { ...m, nome: editMediaName.trim() } : m));
    setEditingMediaId(null);
    showToast('Mídia renomeada com sucesso.');
  };

  // Filtrar mídias para exibir apenas as pertencentes a este cliente
  
  const clientMedia = media.filter(m => m.clienteId === client.id);
  const imageMedia = clientMedia.filter(m => m.tipo === 'image');
  const videoMedia = clientMedia.filter(m => m.tipo === 'video');
  const onlineMedia = clientMedia.filter(m => ['website', 'instagram', 'youtube', 'google_maps', 'canva'].includes(m.tipo));


  
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
const renderMediaGrid = (items: Midia[], icon: React.ReactNode, title: string) => (
    <div className="space-y-4 mb-8" id={`media-section-${title.toLowerCase()}`}>
      <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
        {icon}
        {title} ({items.length})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all relative flex flex-col justify-between">
            <div className="aspect-video bg-[#050508] relative overflow-hidden flex items-center justify-center">
              {item.tipo === 'image' ? (
                <img src={item.url} alt={item.nome} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              ) : item.tipo === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {getIconForType(item.tipo)}
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.tipo}</span>
                </div>
              )}
              {item.tipo === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                title="Excluir Mídia"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {editingMediaId === item.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editMediaName}
                    onChange={(e) => setEditMediaName(e.target.value)}
                    className="bg-black text-white text-xs border border-white/10 rounded px-1.5 py-1 w-full focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSaveRename(item)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded shrink-0"
                    title="Salvar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-1 group/name">
                  <p className="text-xs font-semibold text-slate-200 truncate flex-1" title={item.nome}>{item.nome}</p>
                  <button
                    onClick={() => handleStartRename(item)}
                    className="opacity-0 group-hover/name:opacity-100 p-0.5 text-slate-500 hover:text-white transition-all shrink-0"
                    title="Renomear Mídia"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>{item.duracao}s</span>
                <span>{item.tamanho}</span>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-500 border border-dashed border-white/5 rounded-xl bg-white/2">
            Nenhum arquivo nesta categoria.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Area de Drag and Drop */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'
        }`}
      >
        <UploadCloud className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
        <h3 className="text-sm font-bold text-white mb-2">Arraste seus arquivos para cá</h3>
        <p className="text-xs text-slate-400 mb-4">Suporta envios múltiplos de imagens (JPG, PNG, WEBP) e vídeos (MP4).</p>
        
        <input 
          type="file" 
          multiple 
          accept="image/jpeg,image/png,image/webp,video/mp4" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <div className="flex gap-3 justify-center">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Selecionar Arquivos
        </button>
        <button 
          onClick={() => setShowAddLink(true)}
          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Link className="w-4 h-4" /> Adicionar Link
        </button>
      </div>
      </div>

      
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
{/* Barras de Progresso */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3 bg-[#0d0d12]/80 p-4 rounded-xl border border-white/10">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enviando arquivos para o Supabase Storage...</h4>
          {uploadingFiles.map((file, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                <span className="text-cyan-400 font-mono">{Math.round(file.progress)}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300" 
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listas de Mídias */}
      <div className="mt-8">
        {renderMediaGrid(imageMedia, <ImageIcon className="w-4 h-4 text-emerald-400" />, 'Imagens')}
        {renderMediaGrid(videoMedia, <Video className="w-4 h-4 text-purple-400" />, 'Vídeos')}
        {renderMediaGrid(onlineMedia, <Globe className="w-4 h-4 text-blue-400" />, 'Conteúdos Online')}
      </div>
    </div>
  );
}
