import React, { useState } from 'react';
import { Cliente, Playlist, Midia } from '../../types';
import { ListVideo, Edit2, Trash2, Copy, Plus, ArrowUp, ArrowDown, Image as ImageIcon, Video } from 'lucide-react';

interface ClientPlaylistsProps {
  client: Cliente;
  playlists: Playlist[];
  media: Midia[];
  onUpdatePlaylists: (updateFn: (prev: Playlist[]) => Playlist[]) => void;
  showToast: (msg: string) => void;
}

export default function ClientPlaylists({ client, playlists, media, onUpdatePlaylists, showToast }: ClientPlaylistsProps) {
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);

  const handleCreatePlaylist = () => {
    const newPlaylist: Playlist = {
      id: `p-${Date.now()}`,
      nome: `Nova Playlist ${playlists.length + 1}`,
      midiasIds: [],
    };
    onUpdatePlaylists(prev => [newPlaylist, ...prev]);
    showToast('Nova playlist criada.');
    setEditingPlaylistId(newPlaylist.id);
  };

  const handleDuplicate = (playlist: Playlist) => {
    const newPlaylist: Playlist = {
      ...playlist,
      id: `p-${Date.now()}`,
      nome: `${playlist.nome} (Cópia)`
    };
    onUpdatePlaylists(prev => [newPlaylist, ...prev]);
    showToast('Playlist duplicada.');
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta playlist? TVs que a utilizam poderão parar de exibir conteúdo.')) {
      onUpdatePlaylists(prev => prev.filter(p => p.id !== id));
      if (editingPlaylistId === id) setEditingPlaylistId(null);
      showToast('Playlist excluída.');
    }
  };

  const activePlaylist = playlists.find(p => p.id === editingPlaylistId);

  // Drag and drop logic for reordering within active playlist
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx || !activePlaylist) return;
    
    const newMidiaIds = [...activePlaylist.midiasIds];
    const item = newMidiaIds.splice(draggedIdx, 1)[0];
    newMidiaIds.splice(idx, 0, item);
    
    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { ...p, midiasIds: newMidiaIds } : p));
    setDraggedIdx(null);
  };

  const handleRemoveFromPlaylist = (idx: number) => {
    if (!activePlaylist) return;
    const newMidiaIds = [...activePlaylist.midiasIds];
    newMidiaIds.splice(idx, 1);
    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { ...p, midiasIds: newMidiaIds } : p));
  };

  const handleAddMediaToPlaylist = (mediaId: string) => {
    if (!activePlaylist) return;
    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { ...p, midiasIds: [...p.midiasIds, mediaId] } : p));
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const newMidiaIds = [...activePlaylist.midiasIds];
    if (direction === 'up' && idx > 0) {
      [newMidiaIds[idx - 1], newMidiaIds[idx]] = [newMidiaIds[idx], newMidiaIds[idx - 1]];
    } else if (direction === 'down' && idx < newMidiaIds.length - 1) {
      [newMidiaIds[idx + 1], newMidiaIds[idx]] = [newMidiaIds[idx], newMidiaIds[idx + 1]];
    }
    onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { ...p, midiasIds: newMidiaIds } : p));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Left Column: List of Playlists */}
      <div className={`w-full ${editingPlaylistId ? 'lg:w-1/3' : 'lg:w-full'} space-y-4`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Playlists</h3>
          <button 
            onClick={handleCreatePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Criar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {playlists.map(playlist => (
            <div 
              key={playlist.id} 
              className={`p-4 rounded-xl border transition-all ${
                editingPlaylistId === playlist.id 
                  ? 'bg-blue-500/10 border-blue-500/50' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white truncate pr-2">{playlist.nome}</h4>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingPlaylistId(playlist.id)} className="p-1 text-slate-400 hover:text-blue-400 transition-colors" title="Editar">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDuplicate(playlist)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(playlist.id)} className="p-1 text-slate-400 hover:text-rose-400 transition-colors" title="Excluir">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">{playlist.midiasIds.length} {playlist.midiasIds.length === 1 ? 'mídia' : 'mídias'}</p>
            </div>
          ))}
          {playlists.length === 0 && (
            <div className="text-sm text-slate-500 p-4 border border-dashed border-white/10 rounded-xl text-center">
              Nenhuma playlist criada.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Playlist Editor */}
      {activePlaylist && (
        <div className="w-full lg:w-2/3 bg-[#050508]/60 rounded-xl border border-white/10 p-5">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <input 
              type="text"
              value={activePlaylist.nome}
              onChange={(e) => onUpdatePlaylists(prev => prev.map(p => p.id === activePlaylist.id ? { ...p, nome: e.target.value } : p))}
              className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b focus:border-blue-500/50"
            />
            <button onClick={() => setEditingPlaylistId(null)} className="text-xs text-slate-400 hover:text-white transition-colors">
              Fechar Editor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Current Playlist Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cronograma ({activePlaylist.midiasIds.length} mídias)</h4>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {activePlaylist.midiasIds.map((mediaId, idx) => {
                  const m = media.find(x => x.id === mediaId);
                  if (!m) return null;
                  
                  return (
                    <div 
                      key={`${mediaId}-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      className={`flex items-center gap-3 p-2 bg-white/5 border rounded-lg cursor-move transition-all ${
                        draggedIdx === idx ? 'opacity-50 border-blue-500/50' : 'border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#0d0d12] rounded flex-shrink-0 overflow-hidden relative border border-white/5">
                         {m.tipo === 'image' ? (
                            <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                          ) : (
                            <video src={m.url} className="w-full h-full object-cover" />
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{m.nome}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{m.duracao}s</p>
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => moveItem(idx, 'down')} disabled={idx === activePlaylist.midiasIds.length - 1} className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                      </div>
                      
                      <button onClick={() => handleRemoveFromPlaylist(idx)} className="p-1.5 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 rounded ml-1 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {activePlaylist.midiasIds.length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-8 border border-dashed border-white/10 rounded-lg">
                    Playlist vazia. Adicione mídias ao lado.
                  </div>
                )}
              </div>
            </div>

            {/* Available Media Library to add */}
            <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Biblioteca Disponível</h4>
               <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {media.map(m => (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0d0d12] aspect-video flex flex-col justify-end">
                       <div className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity">
                         {m.tipo === 'image' ? (
                            <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                          ) : (
                            <video src={m.url} className="w-full h-full object-cover" />
                          )}
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                       <div className="relative p-2 flex justify-between items-end">
                         <span className="text-[10px] text-white truncate max-w-[70%]" title={m.nome}>{m.nome}</span>
                         <button 
                           onClick={() => handleAddMediaToPlaylist(m.id)}
                           className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                           title="Adicionar à Playlist"
                         >
                           <Plus className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
