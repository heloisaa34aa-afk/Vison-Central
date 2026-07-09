import React, { useState, useEffect, useRef } from 'react';
import { Client, Playlist, Media } from '../types';
import { 
  Tv, 
  Smartphone, 
  Play, 
  Pause, 
  ChevronRight, 
  Clock, 
  CloudSun, 
  AlertTriangle, 
  Sparkles, 
  VolumeX, 
  RefreshCw,
  BellRing,
  Send,
  HelpCircle,
  Megaphone,
  Eye,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScreenSimulatorProps {
  clients: Client[];
  playlists: Playlist[];
  media: Media[];
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

  // Instant messaging overlay simulation
  const [customOverlayMessage, setCustomOverlayMessage] = useState('');
  const [activeOverlayMessage, setActiveOverlayMessage] = useState<string | null>(null);
  const [emergencyAlertActive, setEmergencyAlertActive] = useState(false);
  const [emergencyText, setEmergencyAlertText] = useState('ALERTA DE SEGURANÇA: EXERCÍCIO DE EVACUAÇÃO EM ANDAMENTO. POR FAVOR, DIRIJA-SE À SAÍDA MAIS PRÓXIMA.');

  // Live TV Clock simulation
  const [timeStr, setTimeStr] = useState('');

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
    ? (clientPlaylist.mediaIds.map(mid => media.find(m => m.id === mid)).filter(Boolean) as Media[])
    : [];

  const currentMedia: Media | undefined = mediaList[currentMediaIndex];

  // Local Clock simulation loop
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Media Player Loop simulation
  useEffect(() => {
    if (!isPlaying || mediaList.length === 0) {
      setProgress(0);
      return;
    }

    const currentDuration = currentMedia ? currentMedia.duration * 1000 : 10000;
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
  }, [isPlaying, currentMediaIndex, selectedClientId, mediaList.length]);

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

  const handleSendInstantMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customOverlayMessage.trim()) return;

    setActiveOverlayMessage(customOverlayMessage);
    setCustomOverlayMessage('');

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setActiveOverlayMessage(null);
    }, 7000);
  };

  // Weather simulator based on client city
  const getWeatherInfo = (city: string) => {
    switch (city) {
      case 'São Paulo': return { temp: '21°C', icon: 'Chuvoso/Nublado' };
      case 'Rio de Janeiro': return { temp: '28°C', icon: 'Ensolarado' };
      case 'Belo Horizonte': return { temp: '24°C', icon: 'Parcialmente Nublado' };
      case 'Curitiba': return { temp: '15°C', icon: 'Frio/Nublado' };
      default: return { temp: '22°C', icon: 'Agradável' };
    }
  };

  const weather = getWeatherInfo(activeClient?.city || 'São Paulo');

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
                  {c.name} ({c.orientation})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#050508]/40 p-3 rounded-lg text-xs space-y-2 text-slate-300 border border-white/5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Orientação:</span>
              <span className="font-mono text-cyan-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px]">{activeClient?.orientation}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Bairro:</span>
              <span>{activeClient?.neighborhood}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Playlist Vinculada:</span>
              <span className="truncate max-w-[120px] text-blue-400 font-semibold" title={clientPlaylist?.name}>{clientPlaylist?.name || 'Nenhuma'}</span>
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
            </div>
          )}
        </div>

        {/* Live Overlays Controller */}
        <div className="bg-[#0d0d12]/60 p-5 rounded-xl border border-white/10 shadow-xl space-y-4 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-amber-400" />
            Enviar Alerta Instantâneo (Simulação)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Envie mensagens de prioridade máxima direto para a tela do simulador. Útil para avisos rápidos ou urgências!
          </p>

          {/* Instant pop-up message */}
          <form onSubmit={handleSendInstantMessage} className="space-y-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mensagem de Rodapé/Popup</label>
              <input 
                type="text" 
                placeholder="Ex: Dra. Ana, favor ir ao Consultório 2"
                value={customOverlayMessage}
                onChange={(e) => setCustomOverlayMessage(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#050508]/40 border border-white/10 rounded text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Enviar para Tela (7s)
            </button>
          </form>

          {/* Emergency Evacuation Overrider */}
          <div className="border-t border-white/10 pt-3 space-y-2.5">
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Modo de Emergência Crítico</p>
            <button
              onClick={() => setEmergencyAlertActive(!emergencyAlertActive)}
              className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                emergencyAlertActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 animate-pulse'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {emergencyAlertActive ? 'Desativar Modo de Emergência' : 'Forçar Tela de Emergência'}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel / Interactive TV Simulator Screen */}
      <div className="xl:col-span-3 flex flex-col items-center justify-center bg-[#0d0d12]/30 rounded-2xl p-6 min-h-[500px] border border-white/10 shadow-inner relative overflow-hidden">
        
        {/* Background Ambient light reflecting the TV */}
        <div className="absolute inset-0 opacity-10 bg-radial-gradient from-blue-500/20 to-transparent pointer-events-none" />

        {/* Orientation Info Tag */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-[#0d0d12]/80 text-slate-300 px-2 py-1 rounded border border-white/10 backdrop-blur-md flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Visualização Realista ({activeClient?.orientation})
          </span>
        </div>

        {/* Realistic Bezel TV frame */}
        <div className={`transition-all duration-500 relative flex justify-center items-center ${
          activeClient?.orientation === 'Vertical' 
            ? 'w-full max-w-[280px] sm:max-w-[340px] aspect-[9/16]' 
            : 'w-full max-w-[680px] aspect-video'
        }`}>
          {/* Outer Black Plastic Bezel */}
          <div className="absolute inset-0 bg-neutral-950 rounded-[20px] shadow-2xl border-4 border-neutral-800 flex flex-col overflow-hidden p-3.5">
            
            {/* The Actual Screen glass panel */}
            <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden flex flex-col justify-between select-none">
              
              {/* 1. TOP STATUS BAR (Overlay Layer) */}
              <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex justify-between items-center text-white">
                <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700/35">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                  <span className="text-[9px] font-bold tracking-wider font-mono">LIVE TRANSMISSION</span>
                </div>
                
                {/* Weather & Real Time Clock */}
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight">
                  <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded border border-slate-700/35">
                    <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeClient?.city}: {weather.temp}</span>
                  </div>
                  <div className="bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded border border-blue-500/50 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-200" />
                    <span>{timeStr || '11:00:00'}</span>
                  </div>
                </div>
              </div>

              {/* 2. EMERGENCY OVERLAY STAGE */}
              <AnimatePresence>
                {emergencyAlertActive && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-red-700 text-white p-6 flex flex-col justify-center items-center text-center space-y-4"
                  >
                    <div className="p-3 bg-red-900 rounded-full animate-bounce">
                      <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold tracking-wider uppercase font-mono">AVISO DE EMERGÊNCIA</h2>
                    <div className="w-12 h-1 bg-white rounded-full" />
                    <p className="text-xs font-medium font-sans leading-relaxed tracking-wide animate-pulse">
                      {emergencyText}
                    </p>
                    <p className="text-[10px] text-red-200 font-mono">Código Técnico de Override: VC-EMERG-911</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 3. TEMPORARY CUSTOM NOTIFICATION OVERLAY */}
              <AnimatePresence>
                {activeOverlayMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-16 inset-x-4 z-40 bg-blue-900/95 text-white p-3 rounded-lg border border-blue-500 shadow-lg backdrop-blur-md flex items-start gap-2.5"
                  >
                    <div className="p-1 bg-blue-700 rounded text-amber-300">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300 font-mono">Mensagem Prioritária</p>
                      <p className="text-xs font-bold mt-0.5 leading-snug">{activeOverlayMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4. MAIN MEDIA SCREEN DISPLAY CONTENT */}
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
                      {currentMedia.type === 'video' ? (
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
                          alt={currentMedia.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Media Name Tag corner overlay */}
                      <div className="absolute bottom-16 left-3 bg-black/60 text-white/90 px-2 py-0.5 rounded text-[8px] font-semibold tracking-wider font-mono">
                        Reproduzindo: {currentMedia.name}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* 5. DYNAMIC FOOTER NEWS TICKER MARQUEE (News Bar) */}
              <div className="absolute bottom-0 inset-x-0 z-30 bg-slate-950 text-amber-400 py-1.5 border-t border-slate-800/80 flex items-center overflow-hidden h-9">
                <div className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 ml-2 mr-3 tracking-wider rounded select-none animate-pulse shrink-0">
                  URGENTE
                </div>
                {/* Marquee Ticker */}
                <div className="relative w-full overflow-hidden whitespace-nowrap">
                  <div className="inline-block animate-marquee whitespace-nowrap text-xs font-medium font-sans">
                    {clients.find(c => c.id === clients[0]?.id)?.tickerText || "VisionCentral Corporate Signage Network - Sua marca em movimento nas telas certas!"}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {clients.find(c => c.id === 'c-2')?.tickerText || "Acompanhe nossa programação."}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar de Simulação e Controle do Dispositivo */}
        <div className="w-full mt-6">
          <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl space-y-4 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Painel de Override
            </h3>
            
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Modifique as propriedades da simulação em tempo real para fins de demonstração.
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mudar Orientação Virtual</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      // We can mutate local orientation or trigger warning
                    }}
                    className={`py-1.5 text-xs rounded font-semibold transition-all border ${
                      activeClient?.orientation === 'Horizontal'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-transparent text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Widescreen (Horizontal)
                  </button>
                  <button 
                    onClick={() => {
                      // Preview vertical orientation
                    }}
                    className={`py-1.5 text-xs rounded font-semibold transition-all border ${
                      activeClient?.orientation === 'Vertical'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-transparent text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Totem (Vertical)
                  </button>
                </div>
              </div>

              {/* Quick instructions */}
              <div className="p-3 bg-blue-500/5 rounded-lg text-[11px] text-slate-300 space-y-1.5 border border-blue-500/10">
                <p className="font-bold text-cyan-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Como funciona o simulador?
                </p>
                <p>Navegue entre os clientes na barra lateral esquerda. O simulador reconfigura automaticamente o tamanho da tela e o conteúdo baseado no cadastro do cliente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
