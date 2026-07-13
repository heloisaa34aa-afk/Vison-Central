import React, { useState } from 'react';
import { Cliente, Playlist, Midia } from '../../types';
import { 
  ListVideo, 
  Edit2, 
  Trash2, 
  Copy, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Video, 
  Check, 
  Square, 
  CheckSquare, 
  Clock 
} from 'lucide-react';

interface ClientPlaylistsProps {
  client: Cliente;
  playlists: Playlist[];
  media: Midia[];
  onUpdatePlaylists: (updateFn: (prev: Playlist[]) => Playlist[]) => void;
  showToast: (msg: string) => void;
}

export default function ClientPlaylists({ client, playlists, media, onUpdatePlaylists, showToast }: ClientPlaylistsProps) {
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [isEditingName, setIsEditingName] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');

  const clientMedia = media.filter(m => m.clienteId === client.id);
  const clientPlaylists = playlists.filter(p => p.clienteId === client.id);

  const handleCreatePlaylist = () => {
    const newPlaylist: Playlist = {
      id: `p-${Date.now()}`,
      nome: `Nova Playlist ${clientPlaylists.length + 1}`,
      midiasIds: [],
      midiasDurations: [],
      clienteId: client.id
    };
    onUpdatePlaylists(prev => [newPlaylist, ...prev]);
    showToast('Nova playlist criada com sucesso!');
    setEditingPlaylistId(newPlaylist.id);
  };

  const handleDuplicate = (playlist: Playlist) => {
    const newPlaylist: Playlist = {
      ...playlist,
      id: `p-${Date.now()}`,
      nome: `${playlist.nome} (Cópia)`,
      midiasIds: [...playlist.midiasIds],
      midiasDurations: playlist.midiasDurations ? [...playlist.midiasDurations] : []
    };
    onUpdatePlaylists(prev => [newPlaylist, ...prev]);
    showToast('Playlist duplicada com sucesso!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Aviso: Tem certeza que deseja excluir esta playlist? As TVs que utilizam essa playlist voltarão a herdar a padrão.')) {
      onUpdatePlaylists(prev => prev.filter(p => p.id !== id));
      if (editingPlaylistId === id) setEditingPlaylistId(null);
      showToast('Playlist excluída com sucesso.');
    }
  };

  const handleRenamePlaylist = (playlistId: string) => {
    if (!editNameText.trim()) return;
    onUpdatePlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, nome: editNameText.trim() } : p));
    setIsEditingName(null);
    showToast('Nome da playlist atualizado.');
  };

  const activePlaylist = clientPlaylists.find(p => p.id === editingPlaylistId);

  // Drag and drop ordering within the active playlist
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx || !activePlaylist) return;
    
    const nextIds = [...activePlaylist.midiasIds];
    const nextDurs = activePlaylist.midiasDurations ? [...activePlaylist.midiasDurations] : [];
    
    // Fill array if undefined
    while (nextDurs.length < nextIds.length) {
      const mId = nextIds[nextDurs.length];
      const m = clientMedia.find(x => x.id === mId);
      nextDurs.push(m?.duracao || 10);
    }

    const [draggedId] = nextIds.splice(draggedIdx, 1);
    const [draggedDur] = nextDurs.splice(draggedIdx, 1);

    nextIds.splice(idx, 0, draggedId);
    nextDurs.splice(idx, 0, draggedDur);
    
    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { 
      ...p, 
      midiasIds: nextIds, 
      midiasDurations: nextDurs 
    } : p));
    setDraggedIdx(null);
  };

  const handleRemoveFromPlaylist = (idx: number) => {
    if (!activePlaylist) return;
    const nextIds = [...activePlaylist.midiasIds];
    const nextDurs = activePlaylist.midiasDurations ? [...activePlaylist.midiasDurations] : [];

    nextIds.splice(idx, 1);
    if (nextDurs.length > idx) {
      nextDurs.splice(idx, 1);
    }

    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { 
      ...p, 
      midiasIds: nextIds, 
      midiasDurations: nextDurs 
    } : p));
  };

  const handleAddSingleMedia = (mediaId: string) => {
    if (!activePlaylist) return;
    const m = clientMedia.find(x => x.id === mediaId);
    const mDur = m?.duracao || 10;

    const nextIds = [...activePlaylist.midiasIds, mediaId];
    const nextDurs = activePlaylist.midiasDurations ? [...activePlaylist.midiasDurations] : [];
    while (nextDurs.length < activePlaylist.midiasIds.length) {
      const prevId = activePlaylist.midiasIds[nextDurs.length];
      const prevMedia = clientMedia.find(x => x.id === prevId);
      nextDurs.push(prevMedia?.duracao || 10);
    }
    nextDurs.push(mDur);

    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { 
      ...p, 
      midiasIds: nextIds, 
      midiasDurations: nextDurs 
    } : p));
    showToast('Mídia adicionada!');
  };

  // Multiple media selection and bulk adding
  const toggleAvailableSelect = (mediaId: string) => {
    setSelectedAvailableIds(prev => 
      prev.includes(mediaId) ? prev.filter(id => id !== mediaId) : [...prev, mediaId]
    );
  };

  const handleAddSelectedMedia = () => {
    if (!activePlaylist || selectedAvailableIds.length === 0) return;
    
    const nextIds = [...activePlaylist.midiasIds];
    const nextDurs = activePlaylist.midiasDurations ? [...activePlaylist.midiasDurations] : [];

    // Ensure durations are aligned
    while (nextDurs.length < activePlaylist.midiasIds.length) {
      const prevId = activePlaylist.midiasIds[nextDurs.length];
      const prevMedia = clientMedia.find(x => x.id === prevId);
      nextDurs.push(prevMedia?.duracao || 10);
    }

    selectedAvailableIds.forEach(id => {
      nextIds.push(id);
      const m = clientMedia.find(x => x.id === id);
      nextDurs.push(m?.duracao || 10);
    });

    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { 
      ...p, 
      midiasIds: nextIds, 
      midiasDurations: nextDurs 
    } : p));

    showToast(`${selectedAvailableIds.length} mídias adicionadas com sucesso!`);
    setSelectedAvailableIds([]);
  };

  const handleUpdateDuration = (idx: number, seconds: number) => {
    if (!activePlaylist || seconds <= 0 || isNaN(seconds)) return;
    
    const nextIds = [...activePlaylist.midiasIds];
    const nextDurs = activePlaylist.midiasDurations ? [...activePlaylist.midiasDurations] : [];

    while (nextDurs.length < nextIds.length) {
      const mId = nextIds[nextDurs.length];
      const m = clientMedia.find(x => x.id === mId);
      nextDurs.push(m?.duracao || 10);
    }

    nextDurs[idx] = seconds;

    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { 
      ...p, 
      midiasDurations: nextDurs 
    } : p));
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const nextIds = [...activePlaylist.midiasIds];
    const nextDurs = activePlaylist.midiasDurations ? [...activePlaylist.midiasDurations] : [];

    while (nextDurs.length < nextIds.length) {
      const mId = nextIds[nextDurs.length];
      const m = clientMedia.find(x => x.id === mId);
      nextDurs.push(m?.duracao || 10);
    }

    if (direction === 'up' && idx > 0) {
      [nextIds[idx - 1], nextIds[idx]] = [nextIds[idx], nextIds[idx - 1]];
      [nextDurs[idx - 1], nextDurs[idx]] = [nextDurs[idx], nextDurs[idx - 1]];
    } else if (direction === 'down' && idx < nextIds.length - 1) {
      [nextIds[idx + 1], nextIds[idx]] = [nextIds[idx], nextIds[idx + 1]];
      [nextDurs[idx + 1], nextDurs[idx]] = [nextDurs[idx], nextDurs[idx + 1]];
    }

    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { 
      ...p, 
      midiasIds: nextIds, 
      midiasDurations: nextDurs 
    } : p));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Coluna Esquerda: Listagem de Playlists */}
      <div className={`w-full ${editingPlaylistId ? 'lg:w-[35%] xl:w-[30%]' : 'lg:w-full'} space-y-4`}>
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ListVideo className="w-5 h-5 text-blue-500" />
              Suas Playlists
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Gerencie os roteiros de mídias corporativas.</p>
          </div>
          <button 
            onClick={handleCreatePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Playlist
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {clientPlaylists.map(playlist => (
            <div 
              key={playlist.id} 
              className={`p-4 rounded-xl border transition-all ${
                editingPlaylistId === playlist.id 
                  ? 'bg-blue-500/10 border-blue-500/50' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                {isEditingName === playlist.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editNameText}
                      onChange={(e) => setEditNameText(e.target.value)}
                      className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-full"
                    />
                    <button
                      onClick={() => handleRenamePlaylist(playlist.id)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded shrink-0"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <h4 className="text-sm font-bold text-white truncate pr-2">{playlist.nome}</h4>
                )}

                {isEditingName !== playlist.id && (
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => {
                        setIsEditingName(playlist.id);
                        setEditNameText(playlist.nome);
                      }} 
                      className="p-1 text-slate-400 hover:text-blue-400 transition-colors" 
                      title="Renomear"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(playlist)} 
                      className="p-1 text-slate-400 hover:text-white transition-colors" 
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(playlist.id)} 
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors" 
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-mono">
                  {playlist.midiasIds.length} {playlist.midiasIds.length === 1 ? 'mídia' : 'mídias'}
                </span>
                <button
                  onClick={() => setEditingPlaylistId(playlist.id)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  Editar Roteiro &rarr;
                </button>
              </div>
            </div>
          ))}
          {clientPlaylists.length === 0 && (
            <div className="text-sm text-slate-500 p-8 border border-dashed border-white/10 rounded-xl text-center">
              Nenhuma playlist cadastrada para este cliente.
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Editor de Linha do Tempo e Biblioteca de Adição */}
      {activePlaylist && (
        <div className="w-full lg:w-[65%] xl:w-[70%] bg-[#050508]/60 rounded-xl border border-white/10 p-5 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Editor do Roteiro</span>
              <h3 className="text-lg font-bold text-white">{activePlaylist.nome}</h3>
            </div>
            <button 
              onClick={() => setEditingPlaylistId(null)} 
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
            >
              Fechar Editor
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Linha do Tempo do Roteiro */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Linha do Tempo ({activePlaylist.midiasIds.length} mídias)
              </h4>
              
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                {activePlaylist.midiasIds.map((mediaId, idx) => {
                  const m = clientMedia.find(x => x.id === mediaId);
                  if (!m) return null;
                  
                  const isImage = m.tipo === 'image';
                  const currentDur = (activePlaylist.midiasDurations && activePlaylist.midiasDurations[idx] !== undefined)
                    ? activePlaylist.midiasDurations[idx]
                    : m.duracao;

                  return (
                    <div 
                      key={`${mediaId}-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      className={`flex items-center gap-3 p-2 bg-[#0d0d12]/60 border rounded-xl cursor-move transition-all ${
                        draggedIdx === idx ? 'opacity-50 border-blue-500/50' : 'border-white/10 hover:bg-[#0d0d12]'
                      }`}
                    >
                      <div className="w-12 h-12 bg-black rounded-lg flex-shrink-0 overflow-hidden relative border border-white/10">
                         {m.tipo === 'image' ? (
                            <img src={m.url} alt={m.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <video src={m.url} className="w-full h-full object-cover" />
                          )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate" title={m.nome}>{m.nome}</p>
                        
                        {/* Custom Duration Configurator */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-mono">Duração:</span>
                          {isImage ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number"
                                min={1}
                                max={3600}
                                value={currentDur}
                                onChange={(e) => handleUpdateDuration(idx, parseInt(e.target.value) || 10)}
                                className="w-12 bg-black border border-white/10 rounded text-[10px] text-center py-0.5 text-cyan-400 font-bold focus:outline-none focus:border-blue-500"
                              />
                              <span className="text-[10px] text-slate-500">s</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {m.duracao}s (Lock Vídeo)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <button 
                          onClick={() => moveItem(idx, 'up')} 
                          disabled={idx === 0} 
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                          title="Mover para Cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => moveItem(idx, 'down')} 
                          disabled={idx === activePlaylist.midiasIds.length - 1} 
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                          title="Mover para Baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveFromPlaylist(idx)} 
                        className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg ml-1 transition-colors shrink-0"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {activePlaylist.midiasIds.length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/2">
                    Roteiro vazio. Selecione mídias ao lado para estruturar.
                  </div>
                )}
              </div>
            </div>

            {/* Biblioteca de Mídias para Adicionar */}
            <div className="space-y-3">
               <div className="flex justify-between items-center border-b border-white/5 pb-2">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                   <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                   Acervo Disponível ({clientMedia.length})
                 </h4>
                 
                 {selectedAvailableIds.length > 0 && (
                   <button
                     onClick={handleAddSelectedMedia}
                     className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded text-[10px] font-extrabold uppercase tracking-wide transition-all"
                   >
                     Adicionar Selecionadas ({selectedAvailableIds.length})
                   </button>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {clientMedia.map(m => {
                    const isSelected = selectedAvailableIds.includes(m.id);
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => toggleAvailableSelect(m.id)}
                        className={`relative group rounded-xl overflow-hidden border transition-all cursor-pointer aspect-video flex flex-col justify-end ${
                          isSelected ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                         <div className="absolute inset-0 opacity-70 group-hover:opacity-85 transition-opacity">
                           {m.tipo === 'image' ? (
                              <img src={m.url} alt={m.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <video src={m.url} className="w-full h-full object-cover" />
                            )}
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                         
                         {/* Selection checkbox overlay */}
                         <div className="absolute top-2 left-2 z-10">
                           {isSelected ? (
                             <CheckSquare className="w-4 h-4 text-cyan-400 fill-black/60" />
                           ) : (
                             <Square className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-all fill-black/60" />
                           )}
                         </div>

                         <div className="relative p-2.5 flex justify-between items-end gap-1.5">
                           <span className="text-[10px] text-white font-medium truncate flex-1" title={m.nome}>{m.nome}</span>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleAddSingleMedia(m.id);
                             }}
                             className="p-1.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                             title="Adicionar à Playlist"
                           >
                             <Plus className="w-3.5 h-3.5" />
                           </button>
                         </div>
                      </div>
                    );
                  })}
                  {clientMedia.length === 0 && (
                    <div className="col-span-full py-16 text-center text-xs text-slate-500 border border-dashed border-white/5 rounded-xl bg-white/2">
                      Sua biblioteca de mídias está vazia. Faça uploads na aba de Biblioteca.
                    </div>
                  )}
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
