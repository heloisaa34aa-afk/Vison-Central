import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Playlist, Midia } from '../types';
import { 
  Tv, 
  Play, 
  Pause, 
  Maximize
} from 'lucide-react';

interface ScreenSimulatorProps {
  clients: Cliente[];
  playlists: Playlist[];
  media: Midia[];
  selectedClientIdFromOutside: string | null;
}

export default function ScreenSimulator({
  clients,
  playlists,
  media,
  selectedClientIdFromOutside
}: ScreenSimulatorProps) {
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Selected client
  const activeClient = clients.find(c => c.id === selectedClientId) || clients[0];

  // Resolve outside state change
  useEffect(() => {
    if (selectedClientIdFromOutside) {
      setSelectedClientId(selectedClientIdFromOutside);
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [selectedClientIdFromOutside, clients]);

  // Load playlist and current media list
  const clientPlaylist = playlists.find(p => p.id === activeClient?.playlistId);
  const mediaList = clientPlaylist 
    ? (clientPlaylist.midiasIds.map(mid => media.find(m => m.id === mid)).filter(Boolean) as Midia[])
    : [];

  const currentMedia: Midia | undefined = mediaList[currentMediaIndex];

  // Media Player Loop simulation
  useEffect(() => {
    if (!isPlaying || mediaList.length === 0) {
      setProgress(0);
      return;
    }

    const currentDuration = currentMedia ? currentMedia.duracao * 1000 : 10000;
    const intervalTime = 100; // update progress every 100ms
    let elapsed = 0;

    const playerTimer = setInterval(() => {
      elapsed += intervalTime;
      const percentage = Math.min((elapsed / currentDuration) * 100, 100);
      setProgress(percentage);

      if (elapsed >= currentDuration) {
        // Go to next media
        setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
        setProgress(0);
        elapsed = 0;
      }
    }, intervalTime);

    return () => clearInterval(playerTimer);
  }, [isPlaying, currentMediaIndex, selectedClientId, mediaList.length, currentMedia]);

  // Reset indices when client changes
  useEffect(() => {
    setCurrentMediaIndex(0);
    setProgress(0);
  }, [selectedClientId]);

  const handleNextMedia = () => {
    if (mediaList.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
      setProgress(0);
    }
  };

  const handlePrevMedia = () => {
    if (mediaList.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
      setProgress(0);
    }
  };

  const enterFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => console.log('Fullscreen blocked:', err));
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="simulator-viewport">
      
      {/* Left panel / Simulation Controls */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-[#0d0d12]/60 p-5 rounded-xl border border-white/10 shadow-xl space-y-4 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-cyan-400" />
            Selecionar Tela Ativa
          </h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Selecione o Cliente</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0d0d12]">
                  {c.nome} ({c.orientacao})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#050508]/40 p-3 rounded-lg text-xs space-y-2 text-slate-300 border border-white/5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Orientação:</span>
              <span className="font-mono text-cyan-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px]">{activeClient?.orientacao}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Playlist:</span>
              <span className="truncate max-w-[120px] text-blue-400 font-semibold" title={clientPlaylist?.nome}>{clientPlaylist?.nome || 'Nenhuma'}</span>
            </div>
          </div>

          {/* Quick controls for media preview */}
          {mediaList.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Controle do Player</p>
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={handlePrevMedia}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded text-xs transition-colors border border-white/5"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 rounded-full transition-colors border border-blue-500/10"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button 
                  onClick={handleNextMedia}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded text-xs transition-colors border border-white/5"
                >
                  Próxima
                </button>
              </div>
              
              {/* Simple progress bar */}
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>

              <button 
                onClick={enterFullscreen}
                className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-medium transition-colors"
              >
                <Maximize className="w-3.5 h-3.5" /> Entrar em Tela Cheia
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right panel / Interactive TV Simulator Screen */}
      <div className="xl:col-span-3 flex flex-col items-center justify-center bg-[#0d0d12]/30 rounded-2xl p-6 min-h-[500px] border border-white/10 shadow-inner relative overflow-hidden">
        
        {/* Background Ambient light reflecting the TV */}
        <div className="absolute inset-0 opacity-10 bg-radial-gradient from-blue-500/20 to-transparent pointer-events-none" />

        {/* Realistic Bezel TV frame */}
        <div ref={containerRef} className={`transition-all duration-500 relative flex justify-center items-center ${
          activeClient?.orientacao === 'Vertical' 
            ? 'w-full max-w-[280px] sm:max-w-[340px] aspect-[9/16]' 
            : 'w-full max-w-[680px] aspect-video'
        }`}>
          {/* Outer Black Plastic Bezel */}
          <div className="absolute inset-0 bg-neutral-950 rounded-[20px] shadow-2xl border-4 border-neutral-800 flex flex-col overflow-hidden p-3.5">
            
            {/* The Actual Screen glass panel */}
            <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden flex flex-col justify-between select-none">

              {/* MAIN MEDIA SCREEN DISPLAY CONTENT */}
              <div className="absolute inset-0 z-10 bg-slate-950 flex items-center justify-center">
                {mediaList.length === 0 ? (
                  <div className="text-center text-gray-500 p-4 space-y-2">
                    <Tv className="w-12 h-12 mx-auto text-gray-700" />
                    <p className="text-xs font-bold">Sem Programação Vinculada</p>
                    <p className="text-[10px] text-gray-600">Por favor, vincule uma playlist para este cliente para iniciar a transmissão corporativa.</p>
                  </div>
                ) : (
                  currentMedia && (
                    <div className="w-full h-full relative">
                      {currentMedia.tipo === 'video' ? (
                        <video 
                          key={currentMedia.id}
                          src={currentMedia.url} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          key={currentMedia.id}
                          src={currentMedia.url} 
                          alt={currentMedia.nome} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
