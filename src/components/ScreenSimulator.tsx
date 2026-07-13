import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Playlist, Midia, Tv } from '../types';
import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { isTvOnline } from '../utils/tvStatus';
import { 
  Tv as TvIcon, 
  Play, 
  Pause, 
  Maximize,
  RefreshCw,
  CheckCircle,
  Clock,
  Settings,
  AlertCircle,
  Monitor,
  Layout,
  ListOrdered,
  Sparkles,
  Smartphone,
  Video,
  Image as ImageIcon
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
  
  // Selection states
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [tvs, setTvs] = useState<Tv[]>([]);
  const [selectedTvId, setSelectedTvId] = useState<string>('');
  
  // Form/Editable states
  const [tvNome, setTvNome] = useState('');
  const [tvPlaylistId, setTvPlaylistId] = useState('');
  const [tvOrientacao, setTvOrientacao] = useState<'Horizontal' | 'Vertical'>('Horizontal');
  const [tvModoReproducao, setTvModoReproducao] = useState('Autoplay');
  const [tvProporcao, setTvProporcao] = useState('contain');
  const [tvBrilho, setTvBrilho] = useState(100);
  const [tvContraste, setTvContraste] = useState(100);
  const [tvSaturacao, setTvSaturacao] = useState(100);
  const [tvZoom, setTvZoom] = useState(100);
  const [tvVolume, setTvVolume] = useState(50);
  const [tvTempoTransicao, setTvTempoTransicao] = useState(3);
  const [tvRotacao, setTvRotacao] = useState(0);

  // Playback/Simulation states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Resolve outside client selection trigger or default to first client
  useEffect(() => {
    if (selectedClientIdFromOutside) {
      setSelectedClientId(selectedClientIdFromOutside);
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [selectedClientIdFromOutside, clients]);

  // 2. Fetch TVs when client changes and subscribe to real-time updates
  const fetchTvsForClient = async () => {
    if (!selectedClientId) return;
    try {
      const allTvs = await storageService.getTvs();
      const filtered = allTvs.filter(t => t.clienteId === selectedClientId);
      setTvs(filtered);
      
      // Auto-select first TV of the client if none or invalid is selected
      if (filtered.length > 0) {
        const found = filtered.find(t => t.id === selectedTvId);
        if (!found) {
          setSelectedTvId(filtered[0].id);
        }
      } else {
        setSelectedTvId('');
      }
    } catch (e) {
      console.error('Error fetching TVs:', e);
    }
  };

  useEffect(() => {
    fetchTvsForClient();

    // Subscribe to TV changes on Supabase Realtime
    if (supabase) {
      const channel = supabase
        .channel('tvs-simulator-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tvs' }, (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            import('../services/supabase/tvs').then(({ mapDbToTv }) => {
              const updatedTv = mapDbToTv(payload.new);
              if (updatedTv.clienteId === selectedClientId) {
                setTvs(prev => prev.map(tv => tv.id === updatedTv.id ? updatedTv : tv));
              }
            });
          } else {
             fetchTvsForClient();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedClientId]);

  // 3. Load active TV data and fill form fields
  const activeTv = tvs.find(t => t.id === selectedTvId);

  useEffect(() => {
    if (activeTv) {
      setTvNome(activeTv.nome);
      setTvPlaylistId(activeTv.playlistId || '');
      setTvOrientacao(activeTv.orientacao || 'Horizontal');
      setTvModoReproducao(activeTv.modo_exibicao || 'Autoplay');
      setTvProporcao(activeTv.proporcao || 'contain');
      setTvBrilho(activeTv.brilho !== undefined ? activeTv.brilho : 100);
      setTvContraste(activeTv.contraste !== undefined ? activeTv.contraste : 100);
      setTvSaturacao(activeTv.saturacao !== undefined ? activeTv.saturacao : 100);
      setTvZoom(activeTv.zoom !== undefined ? activeTv.zoom : 100);
      setTvVolume(activeTv.volume !== undefined ? activeTv.volume : 50);
      setTvTempoTransicao(activeTv.tempo_transicao !== undefined ? activeTv.tempo_transicao : 3);
      setTvRotacao(activeTv.rotacao !== undefined ? activeTv.rotacao : 0);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      setTvNome('');
      setTvPlaylistId('');
      setTvOrientacao('Horizontal');
      setTvModoReproducao('Autoplay');
      setTvProporcao('contain');
      setTvBrilho(100);
      setTvContraste(100);
      setTvSaturacao(100);
      setTvZoom(100);
      setTvVolume(50);
      setTvTempoTransicao(3);
      setTvRotacao(0);
    }
  }, [selectedTvId, activeTv]);

  // 4. Check if there are unsaved pending changes (Sincronização)
  const isDirty = activeTv && (
    tvNome !== activeTv.nome ||
    tvPlaylistId !== (activeTv.playlistId || '') ||
    tvOrientacao !== (activeTv.orientacao || 'Horizontal') ||
    tvModoReproducao !== (activeTv.modo_exibicao || 'Autoplay') ||
    tvProporcao !== (activeTv.proporcao || 'contain') ||
    tvBrilho !== (activeTv.brilho !== undefined ? activeTv.brilho : 100) ||
    tvContraste !== (activeTv.contraste !== undefined ? activeTv.contraste : 100) ||
    tvSaturacao !== (activeTv.saturacao !== undefined ? activeTv.saturacao : 100) ||
    tvZoom !== (activeTv.zoom !== undefined ? activeTv.zoom : 100) ||
    tvVolume !== (activeTv.volume !== undefined ? activeTv.volume : 50) ||
    tvTempoTransicao !== (activeTv.tempo_transicao !== undefined ? activeTv.tempo_transicao : 3) ||
    tvRotacao !== (activeTv.rotacao !== undefined ? activeTv.rotacao : 0)
  );

  // 5. Load playlist and current media list for active TV
  const activePlaylistId = tvPlaylistId || (clients.find(c => c.id === selectedClientId)?.playlistId) || '';
  const tvPlaylist = playlists.find(p => p.id === activePlaylistId);
  const mediaList = tvPlaylist 
    ? (tvPlaylist.midiasIds.map((midId, idx) => {
        const item = media.find(m => m.id === midId);
        if (!item) return null;
        let dur = item.duracao;
        if (tvPlaylist.midiasDurations && tvPlaylist.midiasDurations[idx] !== undefined) {
          dur = tvPlaylist.midiasDurations[idx];
        }
        return { ...item, duracao: dur };
      }).filter(Boolean) as Midia[])
    : [];

  const currentMedia: Midia | undefined = mediaList[currentMediaIndex];
  const nextMedia: Midia | undefined = mediaList.length > 1 ? mediaList[(currentMediaIndex + 1) % mediaList.length] : undefined;

  // Calculate remaining time for current media item
  const totalDuration = currentMedia 
    ? (currentMedia.tipo === 'image' && tvTempoTransicao ? tvTempoTransicao : currentMedia.duracao)
    : 10;
  const timeRemaining = Math.max(0, Math.round(totalDuration * (1 - progress / 100)));

  // 6. Media Player Loop simulation
  useEffect(() => {
    if (!isPlaying || mediaList.length === 0) {
      setProgress(0);
      return;
    }

    const currentDuration = currentMedia 
      ? (currentMedia.tipo === 'image' && tvTempoTransicao ? tvTempoTransicao * 1000 : currentMedia.duracao * 1000)
      : 10000;
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
  }, [isPlaying, currentMediaIndex, selectedTvId, mediaList.length, currentMedia, tvTempoTransicao]);

  // Helper to trigger toast
  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 7. Sincronizar Agora (Manual Sync)
  const handleSincronizar = async () => {
    if (!activeTv) return;
    
    const updatedTv: Tv = {
      ...activeTv,
      nome: tvNome,
      playlistId: tvPlaylistId || undefined,
      orientacao: tvOrientacao,
      modo_exibicao: tvModoReproducao,
      proporcao: tvProporcao,
      brilho: tvBrilho,
      contraste: tvContraste,
      saturacao: tvSaturacao,
      zoom: tvZoom,
      volume: tvVolume,
      tempo_transicao: tvTempoTransicao,
      rotacao: tvRotacao,
      ultimaSincronizacao: new Date().toISOString()
    };

    const success = await storageService.saveTv(updatedTv);
    if (success) {
      // Import the services inside the component since we don't have them imported at the top
      import('../services/local/tvConfigs').then(({ tvConfigsService }) => {
        tvConfigsService.saveConfig(updatedTv.id, updatedTv);
      });
      import('../services/supabase/player').then(({ playerService }) => {
        playerService.broadcastConfigUpdate(updatedTv.id, updatedTv);
      });
      
      // Update local state immediately
      setTvs(prev => prev.map(t => t.id === updatedTv.id ? updatedTv : t));
      showLocalToast('Configurações sincronizadas com sucesso!');
    } else {
      showLocalToast('Erro ao sincronizar as configurações.');
    }
  };

  // 8. Auto-synchronization every 60 seconds if changes are pending
  useEffect(() => {
    const autoSyncInterval = setInterval(() => {
      if (isDirty && activeTv) {
        console.log('Iniciando sincronização automática de segurança (60s)...');
        handleSincronizar();
      }
    }, 60000);

    return () => clearInterval(autoSyncInterval);
  }, [isDirty, activeTv, tvNome, tvPlaylistId, tvOrientacao, tvModoReproducao, tvProporcao, tvBrilho, tvContraste, tvSaturacao, tvZoom, tvVolume, tvTempoTransicao, tvRotacao]);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="configuracao-tv-root">
      
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-emerald-200 px-5 py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2.5 border border-emerald-500/30 text-sm animate-fade-in font-semibold backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT COLUMN: Setup & Settings (4 cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Device Selection Card */}
        <div className="bg-[#0d0d12]/60 p-6 rounded-2xl border border-white/10 shadow-xl space-y-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Configuração de TV</h2>
          </div>

          {/* Client Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Selecione o Cliente / Unidade</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSelectedTvId('');
              }}
              className="w-full px-4 py-3 bg-[#050508]/60 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="" disabled className="text-slate-500">Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0d0d12]">
                  {c.nome} ({c.cidade} - {c.bairro})
                </option>
              ))}
            </select>
          </div>

          {/* TV Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Selecione a TV Conectada</label>
            <select
              value={selectedTvId}
              onChange={(e) => setSelectedTvId(e.target.value)}
              disabled={!selectedClientId || tvs.length === 0}
              className="w-full px-4 py-3 bg-[#050508]/60 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tvs.length === 0 ? (
                <option value="">Nenhuma TV cadastrada neste cliente</option>
              ) : (
                <>
                  <option value="" disabled className="text-slate-500">Selecione uma TV...</option>
                  {tvs.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0d0d12]">
                      {t.nome} [Token: {t.token}]
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* If no TV is selected, show beautiful warning placeholder */}
          {!selectedTvId && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <div className="text-xs space-y-1">
                <p className="font-bold">TV não selecionada</p>
                <p className="text-slate-400 leading-relaxed">Selecione primeiro uma unidade e depois uma TV específica para abrir o painel de monitoramento e configuração.</p>
              </div>
            </div>
          )}
        </div>

        {/* Edit TV Panel (only when TV selected) */}
        {activeTv && (
          <div className="bg-[#0d0d12]/60 p-6 rounded-2xl border border-white/10 shadow-xl space-y-5 backdrop-blur-xl animate-fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Parâmetros do Dispositivo</h3>
              </div>

              {/* Status Sincronização indicator */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {isDirty ? 'Pendente' : 'Sincronizado'}
                </span>
              </div>
            </div>

            {/* TV Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome do Dispositivo</label>
              <input
                type="text"
                value={tvNome}
                onChange={(e) => setTvNome(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Playlist dropdown selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Playlist Vinculada</label>
              <select
                value={tvPlaylistId}
                onChange={(e) => setTvPlaylistId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Default da Unidade / Nenhuma</option>
                {playlists.filter(p => p.clienteId === selectedClientId).map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0d0d12]">{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Orientation Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orientação</label>
                <select
                  value={tvOrientacao}
                  onChange={(e) => setTvOrientacao(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Horizontal">Horizontal</option>
                  <option value="Vertical">Vertical</option>
                </select>
              </div>

              {/* Rotação Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rotação da Tela</label>
                <select
                  value={tvRotacao}
                  onChange={(e) => setTvRotacao(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="0">0° (Paisagem)</option>
                  <option value="90">90° (Retrato dir.)</option>
                  <option value="180">180° (Invertida)</option>
                  <option value="270">270° (Retrato esq.)</option>
                </select>
              </div>
            </div>

            {/* Play Mode input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modo de Reprodução</label>
              <select
                value={tvModoReproducao}
                onChange={(e) => setTvModoReproducao(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="Autoplay">Autoplay Contínuo</option>
                <option value="Sequential">Sequencial Estrito</option>
                <option value="Shuffle">Aleatório (Shuffle)</option>
              </select>
            </div>

            {/* Novas Configurações Visuais */}
            <div className="pt-2 border-t border-white/5 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajustes Visuais & Áudio</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Proporção Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proporção</label>
                  <select
                    value={tvProporcao}
                    onChange={(e) => setTvProporcao(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="contain">Original (Contain)</option>
                    <option value="cover">Preencher (Cover)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="4:3">Standard (4:3)</option>
                  </select>
                </div>

                {/* Tempo de transição Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transição (seg)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={tvTempoTransicao}
                    onChange={(e) => setTvTempoTransicao(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* sliders for Brilho, Contraste, Zoom, Volume */}
              <div className="grid grid-cols-2 gap-4">
                {/* Brilho */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brilho</label>
                    <span className="text-[10px] text-slate-300 font-mono">{tvBrilho}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tvBrilho}
                    onChange={(e) => setTvBrilho(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Contraste */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contraste</label>
                    <span className="text-[10px] text-slate-300 font-mono">{tvContraste}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tvContraste}
                    onChange={(e) => setTvContraste(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Saturação */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saturação</label>
                    <span className="text-[10px] text-slate-300 font-mono">{tvSaturacao}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tvSaturacao}
                    onChange={(e) => setTvSaturacao(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Zoom */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zoom</label>
                    <span className="text-[10px] text-slate-300 font-mono">{tvZoom}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={tvZoom}
                    onChange={(e) => setTvZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume</label>
                    <span className="text-[10px] text-slate-300 font-mono">{tvVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tvVolume}
                    onChange={(e) => setTvVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Sync now button! */}
            <button
              onClick={handleSincronizar}
              disabled={!isDirty}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                isDirty 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer'
                  : 'bg-[#12121a] text-slate-500 border-white/5 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDirty ? 'animate-spin' : ''}`} />
              Sincronizar Agora
            </button>
            
            {isDirty && (
              <p className="text-[10px] text-amber-400/80 text-center animate-pulse">
                Sincronização automática de segurança em até 60 segundos
              </p>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Realtime Live Monitor & Simulated Display (8 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {activeTv ? (
          <>
            {/* Realtime Stats / Dashboard values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
              <div className="bg-[#0d0d12]/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Status da Rede</span>
                {(() => {
                  const isOnline = isTvOnline(activeTv);
                  return (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      <span className="text-xs font-bold text-white">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-[#0d0d12]/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Token Pareamento</span>
                <span className="text-xs font-mono font-bold text-blue-400 mt-2">{activeTv.token}</span>
              </div>

              <div className="bg-[#0d0d12]/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Última Conexão</span>
                <span className="text-xs font-bold text-white mt-2 truncate" title={activeTv.ultimaConexao}>
                  {activeTv.ultimaConexao ? new Date(activeTv.ultimaConexao).toLocaleTimeString('pt-BR') : 'Nenhuma'}
                </span>
              </div>

              <div className="bg-[#0d0d12]/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Última Sincronia</span>
                <span className="text-xs font-bold text-slate-300 mt-2 truncate" title={activeTv.ultimaSincronizacao}>
                  {activeTv.ultimaSincronizacao ? new Date(activeTv.ultimaSincronizacao).toLocaleTimeString('pt-BR') : 'Nunca'}
                </span>
              </div>
            </div>

            {/* Playback Preview Stage */}
            <div className="bg-[#0d0d12]/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#050508]/80 text-cyan-400 border border-blue-500/20 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider z-20">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Preview em Tempo Real
              </div>

              {/* TV Bezel Frame */}
              <div ref={containerRef} className={`transition-all duration-500 relative flex justify-center items-center ${
                tvOrientacao === 'Vertical' 
                  ? 'w-full max-w-[210px] aspect-[9/16]' 
                  : 'w-full max-w-[540px] aspect-video'
              }`}>
                {/* Bezel frame */}
                <div className="absolute inset-0 bg-neutral-950 rounded-[18px] shadow-2xl border-4 border-neutral-800 flex flex-col overflow-hidden p-2.5">
                  <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden flex flex-col justify-between">
                    
                    {/* Display Media Container */}
                    <div className="absolute inset-0 z-10 bg-slate-950 flex items-center justify-center">
                      {mediaList.length === 0 ? (
                        <div className="text-center text-gray-500 p-4 space-y-2">
                          <TvIcon className="w-10 h-10 mx-auto text-gray-700 animate-pulse" />
                          <p className="text-[10px] font-bold text-slate-400">Sem Programação Ativa</p>
                          <p className="text-[8px] text-gray-600">Vincule uma playlist para iniciar a transmissão.</p>
                        </div>
                      ) : (
                        currentMedia && (
                          <div 
                            className="flex items-center justify-center relative" 
                            style={{
                              width: (tvRotacao === 90 || tvRotacao === 270) ? '200%' : '100%',
                              height: (tvRotacao === 90 || tvRotacao === 270) ? '200%' : '100%',
                              filter: `brightness(${tvBrilho}%) contrast(${tvContraste}%) saturate(${tvSaturacao}%)`,
                              transform: `rotate(${tvRotacao}deg) scale(${tvZoom / 100})`,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {currentMedia.tipo === 'video' ? (
                              <video 
                                key={currentMedia.id}
                                src={currentMedia.url} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className={`w-full h-full ${
                                  tvProporcao === 'cover' ? 'object-cover' : 
                                  tvProporcao === 'contain' ? 'object-contain' : 
                                  tvProporcao === '16:9' ? 'object-contain aspect-video' : 
                                  tvProporcao === '4:3' ? 'object-contain aspect-[4/3]' : 'object-cover'
                                }`}
                                style={{
                                  width: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'Vertical' ? '56.25%' : '177.77%') : '100%',
                                  height: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'Vertical' ? '177.77%' : '56.25%') : '100%',
                                }}
                              />
                            ) : (
                              <img 
                                key={currentMedia.id}
                                src={currentMedia.url} 
                                alt={currentMedia.nome} 
                                referrerPolicy="no-referrer"
                                className={`w-full h-full ${
                                  tvProporcao === 'cover' ? 'object-cover' : 
                                  tvProporcao === 'contain' ? 'object-contain' : 
                                  tvProporcao === '16:9' ? 'object-contain aspect-video' : 
                                  tvProporcao === '4:3' ? 'object-contain aspect-[4/3]' : 'object-cover'
                                }`}
                                style={{
                                  width: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'Vertical' ? '56.25%' : '177.77%') : '100%',
                                  height: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'Vertical' ? '177.77%' : '56.25%') : '100%',
                                }}
                              />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Playback controls */}
              {mediaList.length > 0 && (
                <div className="w-full max-w-md mt-6 space-y-3 relative z-10 bg-[#050508]/50 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mídia {currentMediaIndex + 1} de {mediaList.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handlePrevMedia}
                        className="p-1 hover:bg-white/10 text-slate-300 hover:text-white rounded transition-colors"
                        title="Anterior"
                      >
                        Anterior
                      </button>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 rounded-full transition-colors border border-blue-500/10"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <button 
                        onClick={handleNextMedia}
                        className="p-1 hover:bg-white/10 text-slate-300 hover:text-white rounded transition-colors"
                        title="Próxima"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>

                  {/* Progress slide bar */}
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-100" style={{ width: `${progress}%` }} />
                  </div>

                  <button 
                    onClick={enterFullscreen}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    <Maximize className="w-3 h-3" /> Entrar em Tela Cheia
                  </button>
                </div>
              )}
            </div>

            {/* Monitoring Stats: Playlist Order, Current Media, Next Media, Time Remaining */}
            {mediaList.length > 0 && (
              <div className="bg-[#0d0d12]/60 p-6 rounded-2xl border border-white/10 shadow-xl space-y-5 backdrop-blur-xl animate-fade-in">
                <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Painel de Monitoramento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#050508]/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500">Mídia Ativa</span>
                    <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      {currentMedia?.tipo === 'video' ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                      {currentMedia?.nome}
                    </p>
                  </div>

                  <div className="bg-[#050508]/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500">Próxima Mídia</span>
                    <p className="text-xs font-semibold text-slate-400 truncate flex items-center gap-1.5">
                      {nextMedia ? (
                        <>
                          {nextMedia.tipo === 'video' ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                          {nextMedia.nome}
                        </>
                      ) : (
                        'Nenhuma'
                      )}
                    </p>
                  </div>

                  <div className="bg-[#050508]/40 p-3.5 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500">Tempo Restante (Mídia)</span>
                    <p className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {timeRemaining}s
                    </p>
                  </div>
                </div>

                {/* Playlist list rendering */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordem de Exibição</span>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      Playlist: {tvPlaylist?.nome || 'Nenhuma'}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                    {mediaList.map((m, idx) => (
                      <div 
                        key={`${m.id}-${idx}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                          idx === currentMediaIndex 
                            ? 'bg-blue-500/10 border-blue-500/30 text-white font-bold' 
                            : 'bg-[#050508]/30 border-white/5 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                          {m.tipo === 'video' ? <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          <span className="truncate">{m.nome}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">{m.duracao}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Large beautiful idle screen monitor placeholder */
          <div className="bg-[#0d0d12]/20 border border-white/5 rounded-2xl h-full flex flex-col items-center justify-center text-center p-12 space-y-4 min-h-[450px]">
            <Monitor className="w-16 h-16 text-slate-700 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Monitoramento Desativado</h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              O monitor em tempo real, as mídias da playlist e o status de conexão da tela só serão exibidos quando você selecionar uma TV ativa vinculada à unidade.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
