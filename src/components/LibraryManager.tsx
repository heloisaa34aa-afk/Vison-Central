import React, { useState } from 'react';
import { Midia, Playlist } from '../types';
import { 
  FileVideo, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  Check, 
  FolderPlus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LibraryManagerProps {
  media: Midia[];
  playlists: Playlist[];
  onAddMedia: (m: Midia) => void;
  onDeleteMedia: (id: string) => void;
  onAddPlaylist: (p: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
}

export default function LibraryManager({
  media,
  playlists,
  onAddMedia,
  onDeleteMedia,
  onAddPlaylist,
  onDeletePlaylist
}: LibraryManagerProps) {
  
  // Tab states for inside the library
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'playlists'>('media');
  
  // Media states
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [mediaName, setMediaName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaDuration, setMediaDuration] = useState(10);
  const [mediaSearch, setMediaSearch] = useState('');

  // Playlist states
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Filtering media list
  const filteredMedia = media.filter(m => 
    m.nome.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaName.trim() || !mediaUrl.trim()) return;

    let finalUrl = mediaUrl;
    if (mediaType === 'video' && !mediaUrl.endsWith('.mp4')) {
      if (!mediaUrl.includes('assets.') && !mediaUrl.includes('pexels') && !mediaUrl.includes('mixkit')) {
        finalUrl = 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4';
      }
    }

    const newMedia: Midia = {
      id: `m-${Date.now()}`,
      nome: mediaName,
      url: finalUrl,
      tipo: mediaType,
      duracao: Number(mediaDuration)
    };

    onAddMedia(newMedia);
    
    // reset form
    setMediaName('');
    setMediaUrl('');
    setMediaDuration(10);
    setShowAddMedia(false);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `p-${Date.now()}`,
      nome: playlistName,
      midiasIds: selectedMediaIds
    };

    onAddPlaylist(newPlaylist);
    setPlaylistName('');
    setSelectedMediaIds([]);
    setShowAddPlaylist(false);
  };

  const toggleMediaInPlaylistSelection = (id: string) => {
    if (selectedMediaIds.includes(id)) {
      setSelectedMediaIds(selectedMediaIds.filter(mid => mid !== id));
    } else {
      setSelectedMediaIds([...selectedMediaIds, id]);
    }
  };

  return (
    <div className="space-y-6" id="library-manager-tab">
      
      {/* Sub tabs navigation */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveSubTab('media')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'media'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Mídias ({media.length})
        </button>
        <button
          onClick={() => setActiveSubTab('playlists')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'playlists'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Playlists ({playlists.length})
        </button>
      </div>

      {activeSubTab === 'media' ? (
        <div className="space-y-6" id="subtab-media-content">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Pesquisar mídia..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="w-full bg-[#0d0d12]/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowAddMedia(!showAddMedia)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" /> Cadastrar Mídia
            </button>
          </div>

          {/* Add Media Modal */}
          <AnimatePresence>
            {showAddMedia && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0d0d12]/80 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cadastrar Nova Mídia</h3>
                  <button onClick={() => setShowAddMedia(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateMedia} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Mídia</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Vídeo Institucional Julho"
                        value={mediaName}
                        onChange={(e) => setMediaName(e.target.value)}
                        className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                      <select 
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as any)}
                        className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="image" className="bg-[#0d0d12]">Imagem (.png, .jpg, webp)</option>
                        <option value="video" className="bg-[#0d0d12]">Vídeo (.mp4)</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">URL do arquivo</label>
                      <input 
                        type="url" 
                        required
                        placeholder="https://exemplo.com/mídia.jpg"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Duração (Segundos)</label>
                      <input 
                        type="number" 
                        min={1}
                        max={3600}
                        required
                        value={mediaDuration}
                        onChange={(e) => setMediaDuration(Number(e.target.value))}
                        className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setShowAddMedia(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 rounded-lg transition-colors shadow-lg"
                    >
                      Salvar Mídia
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Grid Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" id="media-items-grid">
            {filteredMedia.map(m => (
              <div 
                key={m.id}
                className="bg-[#0d0d12]/60 rounded-xl border border-white/10 overflow-hidden hover:border-blue-500/40 transition-all flex flex-col justify-between group shadow-lg backdrop-blur-xl"
              >
                {/* Visual Preview */}
                <div className="aspect-video bg-[#050508] relative overflow-hidden flex items-center justify-center">
                  {m.tipo === 'image' ? (
                    <img 
                      src={m.url} 
                      alt={m.nome} 
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <video 
                      src={m.url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      muted 
                    />
                  )}
                  {m.tipo === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                        <FileVideo className="w-4 h-4 text-white animate-pulse" />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded font-mono text-[9px] text-slate-300 border border-white/10">
                    {m.duracao}s
                  </span>
                </div>

                {/* Details info */}
                <div className="p-3 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate" title={m.nome}>{m.nome}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate uppercase">{m.tipo}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-2">
                    <button 
                      onClick={() => onDeleteMedia(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
                      title="Excluir Mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredMedia.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                Nenhuma mídia cadastrada na biblioteca.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6" id="subtab-playlists-content">
          {/* Controls Bar */}
          <div className="flex justify-between items-center gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suas Playlists</h3>
            <button
              onClick={() => setShowAddPlaylist(!showAddPlaylist)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shrink-0"
            >
              <FolderPlus className="w-4 h-4" /> Nova Playlist
            </button>
          </div>

          {/* Add Playlist Form */}
          <AnimatePresence>
            {showAddPlaylist && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0d0d12]/80 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Criar Nova Playlist</h3>
                  <button onClick={() => setShowAddPlaylist(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Playlist</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Playlist Promocional Sábado"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Media Picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Selecione as Mídias da Sequência</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                      {media.map(m => {
                        const isSelected = selectedMediaIds.includes(m.id);
                        return (
                          <div 
                            key={m.id}
                            onClick={() => toggleMediaInPlaylistSelection(m.id)}
                            className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-all relative ${
                              isSelected 
                                ? 'bg-blue-500/10 border-blue-500/50' 
                                : 'bg-[#050508]/40 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="w-8 h-8 bg-[#0d0d12] rounded overflow-hidden shrink-0 flex items-center justify-center">
                              {m.tipo === 'image' ? (
                                <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                              ) : (
                                <FileVideo className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <span className="text-[10px] font-semibold truncate text-slate-300 flex-1">{m.nome}</span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {media.length === 0 && (
                        <p className="text-xs text-slate-500 col-span-full py-4 text-center">Nenhuma mídia cadastrada na biblioteca ainda.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedMediaIds([]);
                        setPlaylistName('');
                        setShowAddPlaylist(false);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 rounded-lg transition-colors shadow-lg"
                    >
                      Salvar Playlist ({selectedMediaIds.length} mídias)
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List of Playlists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="playlists-list-grid">
            {playlists.map(pl => {
              // Get actual media list in correct order
              const playlistMedia = pl.midiasIds
                .map(mid => media.find(m => m.id === mid))
                .filter(Boolean) as Midia[];

              const totalDuration = playlistMedia.reduce((acc, m) => acc + m.duracao, 0);

              return (
                <div 
                  key={pl.id}
                  className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl p-5 space-y-4 hover:border-blue-500/30 transition-all flex flex-col justify-between backdrop-blur-xl"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">{pl.nome}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                          <span>{playlistMedia.length} mídias</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> Loop total: {totalDuration}s</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onDeletePlaylist(pl.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Excluir Playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Playlist Media Lineup Visual Flow */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sequência de Exibição:</p>
                      <div className="space-y-1.5 border-l-2 border-white/10 pl-3">
                        {playlistMedia.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Nenhuma mídia inserida nesta playlist.</p>
                        ) : (
                          playlistMedia.map((m, idx) => (
                            <div key={`${m.id}-${idx}`} className="flex items-center justify-between text-xs text-slate-300 gap-4">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-[10px] font-bold text-blue-400 w-3 font-mono">{idx + 1}.</span>
                                {m.tipo === 'video' ? <FileVideo className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                <span className="truncate max-w-[150px]" title={m.nome}>{m.nome}</span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500 shrink-0">{m.duracao}s</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {playlists.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                Nenhuma playlist criada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
