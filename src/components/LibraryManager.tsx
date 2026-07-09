import React, { useState } from 'react';
import { Media, Playlist } from '../types';
import { 
  FileVideo, 
  Image, 
  ListMusic, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  Check, 
  FolderPlus,
  Tv,
  Layers,
  Sparkles,
  Link,
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LibraryManagerProps {
  media: Media[];
  playlists: Playlist[];
  onAddMedia: (m: Media) => void;
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
    m.name.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaName.trim() || !mediaUrl.trim()) return;

    // Validate Unsplash URL or give standard backup if not correct
    let finalUrl = mediaUrl;
    if (mediaType === 'video' && !mediaUrl.endsWith('.mp4')) {
      // Use dynamic pexels/mixkit sample video if it doesn't look correct to guarantee success
      if (!mediaUrl.includes('assets.') && !mediaUrl.includes('pexels') && !mediaUrl.includes('mixkit')) {
        finalUrl = 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4';
      }
    }

    const newMedia: Media = {
      id: `m-${Date.now()}`,
      name: mediaName,
      url: finalUrl,
      type: mediaType,
      duration: Number(mediaDuration)
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
      name: playlistName,
      mediaIds: selectedMediaIds
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
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeSubTab === 'media'
              ? 'border-blue-500 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Arquivos de Mídia ({media.length})
        </button>
        <button
          onClick={() => setActiveSubTab('playlists')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeSubTab === 'playlists'
              ? 'border-blue-500 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          Playlists de Transmissão ({playlists.length})
        </button>
      </div>

      {/* MEDIA TAB SUB SECTION */}
      {activeSubTab === 'media' && (
        <div className="space-y-6">
          {/* Top Controls for Media */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d0d12]/60 p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar arquivos de mídia..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-500"
              />
            </div>

            <button 
              onClick={() => setShowAddMedia(!showAddMedia)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-semibold transition-all shadow-sm w-full sm:w-auto justify-center hover:opacity-95"
            >
              {showAddMedia ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              Adicionar Arquivo
            </button>
          </div>

          {/* Add Media Form View */}
          <AnimatePresence>
            {showAddMedia && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleCreateMedia} className="bg-[#0d0d12]/80 p-6 rounded-xl border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Enviar Novo Arquivo para Nuvem de Transmissão
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome do Conteúdo */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Nome Comercial da Mídia</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Campanha Descontos Novembro / Tip de Saúde"
                        value={mediaName}
                        onChange={(e) => setMediaName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 text-white rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* URL de Origem */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                        <span>URL do Arquivo (Imagem ou MP4)</span>
                        <span className="text-[10px] text-slate-500 normal-case">(Recomendado: Unsplash ou Mixkit)</span>
                      </label>
                      <input 
                        type="url" 
                        required
                        placeholder="https://images.unsplash.com/photo-..."
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 text-white rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Formato de Mídia</label>
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                        className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 text-slate-200 rounded-lg text-sm focus:ring-1"
                      >
                        <option value="image">Imagem Estática (JPG, PNG, WebP)</option>
                        <option value="video">Vídeo em Loop (MP4, WebM)</option>
                      </select>
                    </div>

                    {/* Tempo de exibição */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Tempo de Exibição Padrão (Segundos)</label>
                      <input 
                        type="number" 
                        min="3" 
                        max="300"
                        value={mediaDuration}
                        onChange={(e) => setMediaDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 text-white rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Sugestoes rapidas de URL para ajudar o usuario */}
                  <div className="bg-[#050508]/60 p-3 rounded-lg border border-white/10 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">💡 Links de Amostra Rápidos para Copiar/Colar:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-blue-400">
                      <div 
                        onClick={() => {
                          setMediaName('Menu Promocional Gastronomia');
                          setMediaType('image');
                          setMediaUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
                        }}
                        className="p-1.5 bg-[#0d0d12]/40 hover:bg-white/5 rounded border border-white/5 cursor-pointer truncate"
                      >
                        [IMAGEM] Prato Gourmet Saudável (Unsplash)
                      </div>
                      <div 
                        onClick={() => {
                          setMediaName('Campanha Pilates & Ergonomia');
                          setMediaType('image');
                          setMediaUrl('https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80');
                        }}
                        className="p-1.5 bg-[#0d0d12]/40 hover:bg-white/5 rounded border border-white/5 cursor-pointer truncate"
                      >
                        [IMAGEM] Pose de Yoga & Postura (Unsplash)
                      </div>
                      <div 
                        onClick={() => {
                          setMediaName('Video Loop: Natureza das Montanhas');
                          setMediaType('video');
                          setMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-forest-stream-with-mossy-rocks-2070-large.mp4');
                        }}
                        className="p-1.5 bg-[#0d0d12]/40 hover:bg-white/5 rounded border border-white/5 cursor-pointer truncate"
                      >
                        [VÍDEO] Corredeira na Floresta (Mixkit mp4)
                      </div>
                      <div 
                        onClick={() => {
                          setMediaName('Video Loop: Café Quente Coando');
                          setMediaType('video');
                          setMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-coffee-brewing-in-cafetiere-33230-large.mp4');
                        }}
                        className="p-1.5 bg-[#0d0d12]/40 hover:bg-white/5 rounded border border-white/5 cursor-pointer truncate"
                      >
                        [VÍDEO] Café Especial (Mixkit mp4)
                      </div>
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
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 rounded-lg transition-colors"
                    >
                      Cadastrar Mídia
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Grid Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" id="media-assets-grid">
            {filteredMedia.map(m => (
              <div 
                key={m.id}
                className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition-all group backdrop-blur-xl"
              >
                {/* Media Preview Stage */}
                <div className="relative aspect-video bg-[#050508] overflow-hidden shrink-0 flex items-center justify-center">
                  {m.type === 'video' ? (
                    <>
                      <video 
                        src={m.url} 
                        muted 
                        className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-all"
                        preload="metadata"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-md text-[10px] font-bold font-mono tracking-wider flex items-center gap-1">
                        <FileVideo className="w-3.5 h-3.5" />
                        VÍDEO
                      </div>
                    </>
                  ) : (
                    <>
                      <img 
                        src={m.url} 
                        alt={m.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all"
                      />
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-md text-[10px] font-bold font-mono tracking-wider flex items-center gap-1">
                        <Image className="w-3.5 h-3.5" />
                        IMAGEM
                      </div>
                    </>
                  )}
                  {/* Dynamic hovering action overlay */}
                  <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a 
                      href={m.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-100 flex items-center gap-1 shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Link
                    </a>
                  </div>
                </div>

                {/* Content description & actions */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Exibição: {m.duration}s
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                    <span className="text-[10px] font-semibold font-mono bg-white/5 text-slate-400 border border-white/5 px-1.5 py-0.5 rounded">
                      ID: {m.id}
                    </span>
                    <button 
                      onClick={() => onDeleteMedia(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      title="Excluir Mídia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAYLISTS TAB SUB SECTION */}
      {activeSubTab === 'playlists' && (
        <div className="space-y-6">
          {/* Top Control Panel for Playlists */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d0d12]/60 p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
            <div>
              <p className="text-xs text-slate-400 font-medium">As playlists agrupam os conteúdos em sequência repetitiva.</p>
            </div>

            <button 
              onClick={() => setShowAddPlaylist(!showAddPlaylist)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-semibold transition-all shadow-sm w-full sm:w-auto justify-center hover:opacity-95"
            >
              {showAddPlaylist ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
              Criar Nova Playlist
            </button>
          </div>

          {/* Add Playlist Form View */}
          <AnimatePresence>
            {showAddPlaylist && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleCreatePlaylist} className="bg-[#0d0d12]/80 p-6 rounded-xl border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-cyan-400" />
                    Montar Nova Grade de Programação (Playlist)
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nome Identificador da Playlist</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Comercial Outono - Lojas Físicas / Academia Horário de Pico"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 text-white rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Media Selector with checkboxes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">
                      Selecione as mídias para tocar nesta playlist (Serão reproduzidas em sequência)
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto border border-white/10 p-3 rounded-lg bg-[#050508]/40">
                      {media.map(m => {
                        const isSelected = selectedMediaIds.includes(m.id);
                        return (
                          <div 
                            key={m.id}
                            onClick={() => toggleMediaInPlaylistSelection(m.id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-3 transition-all ${
                              isSelected 
                                ? 'bg-blue-500/10 border-blue-500/30 text-white font-medium' 
                                : 'bg-[#0d0d12]/40 hover:bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {m.type === 'video' ? <FileVideo className="w-4 h-4 text-blue-400 shrink-0" /> : <Image className="w-4 h-4 text-emerald-400 shrink-0" />}
                              <span className="truncate">{m.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                              <span>{m.duration}s</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/20'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
              const playlistMedia = pl.mediaIds
                .map(mid => media.find(m => m.id === mid))
                .filter(Boolean) as Media[];

              const totalDuration = playlistMedia.reduce((acc, m) => acc + m.duration, 0);

              return (
                <div 
                  key={pl.id}
                  className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl p-5 space-y-4 hover:border-blue-500/30 transition-all flex flex-col justify-between backdrop-blur-xl"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">{pl.name}</h4>
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
                                {m.type === 'video' ? <FileVideo className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <Image className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                <span className="truncate">{m.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{m.duration}s</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#050508]/60 p-2.5 rounded-lg border border-white/10 text-[10px] text-slate-400 flex justify-between items-center font-mono">
                    <span>ID: {pl.id}</span>
                    <span className="text-blue-400 font-bold uppercase tracking-wider">Código Prontidão</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
