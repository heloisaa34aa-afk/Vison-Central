const fs = require('fs');

let code = `import React, { useState } from 'react';
import { Midia, Playlist } from '../types';
import { Search, Plus, Trash2, Globe, FileVideo, Image as ImageIcon, FileText, BarChart, PieChart, Rss, CloudSun, Palette, Map, Youtube, Instagram, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddMediaModal from './AddMediaModal';

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
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'playlists'>('media');
  
  // Media states
  const [mediaSearch, setMediaSearch] = useState('');
  const [showAddMedia, setShowAddMedia] = useState(false);
  
  // Playlist states
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  
  const filteredMedia = media.filter(m => m.nome.toLowerCase().includes(mediaSearch.toLowerCase()));

  const getIconForType = (tipo: string, sizeClass = "w-4 h-4") => {
    switch (tipo) {
      case 'instagram': return <Instagram className={\`\${sizeClass} text-pink-500\`} />;
      case 'youtube': return <Youtube className={\`\${sizeClass} text-red-500\`} />;
      case 'google_maps': return <Map className={\`\${sizeClass} text-green-500\`} />;
      case 'canva': return <Palette className={\`\${sizeClass} text-blue-400\`} />;
      case 'image': return <ImageIcon className={\`\${sizeClass} text-emerald-500 shrink-0\`} />;
      case 'video': return <FileVideo className={\`\${sizeClass} text-blue-500 shrink-0\`} />;
      case 'pdf': return <FileText className={\`\${sizeClass} text-red-400\`} />;
      case 'powerbi': return <BarChart className={\`\${sizeClass} text-yellow-500\`} />;
      case 'looker': return <PieChart className={\`\${sizeClass} text-blue-500\`} />;
      case 'rss': return <Rss className={\`\${sizeClass} text-orange-500\`} />;
      case 'weather': return <CloudSun className={\`\${sizeClass} text-cyan-400\`} />;
      case 'website':
      default: return <Globe className={\`\${sizeClass} text-blue-500\`} />;
    }
  };

  const handleSaveModal = (mediaData: Omit<Midia, 'id' | 'clienteId'>) => {
    const newMedia = {
      ...mediaData,
      id: \`m-\${Date.now()}\`,
    };
    onAddMedia(newMedia as Midia);
    setShowAddMedia(false);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    
    const newPlaylist: Playlist = {
      id: \`p-\${Date.now()}\`,
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
          className={\`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all \${
            activeSubTab === 'media'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }\`}
        >
          Mídias ({media.length})
        </button>
        <button
          onClick={() => setActiveSubTab('playlists')}
          className={\`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all \${
            activeSubTab === 'playlists'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }\`}
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
              <AddMediaModal 
                onClose={() => setShowAddMedia(false)}
                onSave={handleSaveModal}
              />
            )}
          </AnimatePresence>

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" id="media-grid">
            {filteredMedia.map(item => (
              <div 
                key={item.id} 
                className="bg-[#0d0d12]/60 rounded-xl border border-white/10 p-3 flex flex-col gap-3 group relative overflow-hidden transition-all hover:border-white/30 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    {getIconForType(item.tipo, "w-4 h-4")}
                    <h4 className="text-xs font-bold text-white truncate" title={item.nome}>{item.nome}</h4>
                  </div>
                  
                  <button
                    onClick={() => onDeleteMedia(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                    title="Excluir Mídia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded uppercase">{item.tipo}</span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.duracao}s
                  </span>
                </div>
              </div>
            ))}
            {filteredMedia.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                Nenhuma mídia encontrada na biblioteca.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6" id="subtab-playlists-content">
           <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suas Playlists</h3>
            <button
              onClick={() => setShowAddPlaylist(!showAddPlaylist)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Criar Playlist
            </button>
          </div>

          <AnimatePresence>
            {showAddPlaylist && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0d0d12]/80 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl max-w-xl mx-auto"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Criar Nova Playlist</h3>
                  <button onClick={() => setShowAddPlaylist(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreatePlaylist} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Playlist</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Receção Manhã"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Selecione as mídias (Ordem de seleção importa)</label>
                    
                    <div className="max-h-60 overflow-y-auto space-y-1 bg-[#050508]/30 p-2 rounded-lg border border-white/5">
                      {media.map(m => {
                        const isSelected = selectedMediaIds.includes(m.id);
                        const selectionIndex = selectedMediaIds.indexOf(m.id);
                        return (
                          <div 
                            key={m.id}
                            onClick={() => toggleMediaInPlaylistSelection(m.id)}
                            className={\`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors \${
                              isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'
                            }\`}
                          >
                            <div className={\`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border \${
                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-transparent'
                            }\`}>
                              <Check className="w-3 h-3" />
                            </div>
                            
                            {getIconForType(m.tipo)}
                            
                            <span className="flex-1 text-xs text-slate-200 truncate">{m.nome}</span>
                            
                            {isSelected && (
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                                #{selectionIndex + 1}
                              </span>
                            )}
                          </div>
                        )
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
                            <div key={\`\${m.id}-\${idx}\`} className="flex items-center justify-between text-xs text-slate-300 gap-4">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-[10px] font-bold text-blue-400 w-3 font-mono">{idx + 1}.</span>
                                {getIconForType(m.tipo)}
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
`;

fs.writeFileSync('src/components/LibraryManager.tsx', code);
