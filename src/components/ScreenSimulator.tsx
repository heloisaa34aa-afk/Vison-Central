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
  const [tvOrientacao, setTvOrientacao] = useState<'horizontal' | 'vertical'>('horizontal');
  const [tvModoReproducao, setTvModoReproducao] = useState('Autoplay');
  const [tvProporcao, setTvProporcao] = useState('contain');
  const [tvBrilho, setTvBrilho] = useState(100);
  const [tvContraste, setTvContraste] = useState(100);
  const [tvSaturacao, setTvSaturacao] = useState(100);
  const [tvZoom, setTvZoom] = useState(100);
  const [tvVolume, setTvVolume] = useState(50);
  const [tvTempoTransicao, setTvTempoTransicao] = useState(3);
  const [tvRotacao, setTvRotacao] = useState(0);

  // Novos Recursos: Conteúdo Online e Textos
  const [tvConteudoOnline, setTvConteudoOnline] = useState<{ id: string, nome: string, url: string, active: boolean }[]>([]);
  const [tvTextoSuperior, setTvTextoSuperior] = useState('');
  const [tvTextoSuperiorCor, setTvTextoSuperiorCor] = useState('#ffffff');
  const [tvTextoSuperiorTamanho, setTvTextoSuperiorTamanho] = useState('base');
  const [tvTextoSuperiorAlinhamento, setTvTextoSuperiorAlinhamento] = useState<'left' | 'center' | 'right'>('center');
  const [tvTextoSuperiorVisivel, setTvTextoSuperiorVisivel] = useState(false);

  const [tvTextoInferior, setTvTextoInferior] = useState('');
  const [tvTextoInferiorCor, setTvTextoInferiorCor] = useState('#ffffff');
  const [tvTextoInferiorTamanho, setTvTextoInferiorTamanho] = useState('base');
  const [tvTextoInferiorAlinhamento, setTvTextoInferiorAlinhamento] = useState<'left' | 'center' | 'right'>('center');
  const [tvTextoInferiorVisivel, setTvTextoInferiorVisivel] = useState(false);

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
      setTvOrientacao(activeTv.orientacao || 'horizontal');
      setTvModoReproducao(activeTv.modo_exibicao || 'Autoplay');
      setTvProporcao(activeTv.proporcao || 'contain');
      setTvBrilho(activeTv.brilho !== undefined ? activeTv.brilho : 100);
      setTvContraste(activeTv.contraste !== undefined ? activeTv.contraste : 100);
      setTvSaturacao(activeTv.saturacao !== undefined ? activeTv.saturacao : 100);
      setTvZoom(activeTv.zoom !== undefined ? activeTv.zoom : 100);
      setTvVolume(activeTv.volume !== undefined ? activeTv.volume : 50);
      setTvTempoTransicao(activeTv.tempo_transicao !== undefined ? activeTv.tempo_transicao : 3);
      setTvRotacao(activeTv.rotacao !== undefined ? activeTv.rotacao : 0);
      setTvConteudoOnline(activeTv.conteudos_online || []);
      setTvTextoSuperior(activeTv.texto_superior || '');
      setTvTextoSuperiorCor(activeTv.texto_superior_cor || '#ffffff');
      setTvTextoSuperiorTamanho(activeTv.texto_superior_tamanho || 'base');
      setTvTextoSuperiorAlinhamento(activeTv.texto_superior_alinhamento || 'center');
      setTvTextoSuperiorVisivel(activeTv.texto_superior_visivel || false);
      setTvTextoInferior(activeTv.texto_inferior || '');
      setTvTextoInferiorCor(activeTv.texto_inferior_cor || '#ffffff');
      setTvTextoInferiorTamanho(activeTv.texto_inferior_tamanho || 'base');
      setTvTextoInferiorAlinhamento(activeTv.texto_inferior_alinhamento || 'center');
      setTvTextoInferiorVisivel(activeTv.texto_inferior_visivel || false);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      setTvNome('');
      setTvPlaylistId('');
      setTvOrientacao('horizontal');
      setTvModoReproducao('Autoplay');
      setTvProporcao('contain');
      setTvBrilho(100);
      setTvContraste(100);
      setTvSaturacao(100);
      setTvZoom(100);
      setTvVolume(50);
      setTvTempoTransicao(3);
      setTvRotacao(0);
      setTvConteudoOnline([]);
      setTvTextoSuperior('');
      setTvTextoSuperiorCor('#ffffff');
      setTvTextoSuperiorTamanho('base');
      setTvTextoSuperiorAlinhamento('center');
      setTvTextoSuperiorVisivel(false);
      setTvTextoInferior('');
      setTvTextoInferiorCor('#ffffff');
      setTvTextoInferiorTamanho('base');
      setTvTextoInferiorAlinhamento('center');
      setTvTextoInferiorVisivel(false);
    }
  }, [selectedTvId, activeTv]);

  // 4. Check if there are unsaved pending changes (Sincronização)
  const isDirty = activeTv && (
    tvNome !== activeTv.nome ||
    tvPlaylistId !== (activeTv.playlistId || '') ||
    tvOrientacao !== (activeTv.orientacao || 'horizontal') ||
    tvModoReproducao !== (activeTv.modo_exibicao || 'Autoplay') ||
    tvProporcao !== (activeTv.proporcao || 'contain') ||
    tvBrilho !== (activeTv.brilho !== undefined ? activeTv.brilho : 100) ||
    tvContraste !== (activeTv.contraste !== undefined ? activeTv.contraste : 100) ||
    tvSaturacao !== (activeTv.saturacao !== undefined ? activeTv.saturacao : 100) ||
    tvZoom !== (activeTv.zoom !== undefined ? activeTv.zoom : 100) ||
    tvVolume !== (activeTv.volume !== undefined ? activeTv.volume : 50) ||
    tvTempoTransicao !== (activeTv.tempo_transicao !== undefined ? activeTv.tempo_transicao : 3) ||
    tvRotacao !== (activeTv.rotacao !== undefined ? activeTv.rotacao : 0) ||
    JSON.stringify(tvConteudoOnline) !== JSON.stringify(activeTv.conteudos_online || []) ||
    tvTextoSuperior !== (activeTv.texto_superior || '') ||
    tvTextoSuperiorCor !== (activeTv.texto_superior_cor || '#ffffff') ||
    tvTextoSuperiorTamanho !== (activeTv.texto_superior_tamanho || 'base') ||
    tvTextoSuperiorAlinhamento !== (activeTv.texto_superior_alinhamento || 'center') ||
    tvTextoSuperiorVisivel !== (activeTv.texto_superior_visivel || false) ||
    tvTextoInferior !== (activeTv.texto_inferior || '') ||
    tvTextoInferiorCor !== (activeTv.texto_inferior_cor || '#ffffff') ||
    tvTextoInferiorTamanho !== (activeTv.texto_inferior_tamanho || 'base') ||
    tvTextoInferiorAlinhamento !== (activeTv.texto_inferior_alinhamento || 'center') ||
    tvTextoInferiorVisivel !== (activeTv.texto_inferior_visivel || false)
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

  // 6.5. Update Individual TV Property with immediate DB save
  const handleUpdateTvProperty = async (field: keyof Tv, value: any, setter: Function) => {
    if (!activeTv) return;

    // Persist immediately in Supabase
    const updatedTv = { 
      ...activeTv, 
      [field]: value, 
      ultimaSincronizacao: new Date().toISOString() 
    };

    if (field === 'playlistId') {
      updatedTv.playlistId = value || undefined;
    }

    const success = await storageService.saveTv(updatedTv);
    
    // Aguardar a confirmação do banco; somente então atualizar o estado local
    if (success) {
      setter(value);
      setTvs(prev => prev.map(t => t.id === updatedTv.id ? updatedTv : t));

      import('../services/supabase/player').then(({ playerService }) => {
        playerService.broadcastConfigUpdate(updatedTv.id, updatedTv);
        playerService.broadcastPlaylistUpdate(updatedTv.id);
      });
      showLocalToast('Configuração atualizada com sucesso!');
    } else {
      showLocalToast('Erro ao atualizar a configuração.');
    }
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
      conteudos_online: tvConteudoOnline,
      texto_superior: tvTextoSuperior,
      texto_superior_cor: tvTextoSuperiorCor,
      texto_superior_tamanho: tvTextoSuperiorTamanho,
      texto_superior_alinhamento: tvTextoSuperiorAlinhamento,
      texto_superior_visivel: tvTextoSuperiorVisivel,
      texto_inferior: tvTextoInferior,
      texto_inferior_cor: tvTextoInferiorCor,
      texto_inferior_tamanho: tvTextoInferiorTamanho,
      texto_inferior_alinhamento: tvTextoInferiorAlinhamento,
      texto_inferior_visivel: tvTextoInferiorVisivel,
      ultimaSincronizacao: new Date().toISOString()
    };

    const success = await storageService.saveTv(updatedTv);
    if (success) {
      // Import the services inside the component since we don't have them imported at the top
      import('../services/supabase/player').then(({ playerService }) => {
        playerService.broadcastConfigUpdate(updatedTv.id, updatedTv);
        playerService.broadcastPlaylistUpdate(updatedTv.id);
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
  }, [
    isDirty, activeTv, tvNome, tvPlaylistId, tvOrientacao, tvModoReproducao, 
    tvProporcao, tvBrilho, tvContraste, tvSaturacao, tvZoom, tvVolume, 
    tvTempoTransicao, tvRotacao,
    tvConteudoOnline, tvTextoSuperior, tvTextoSuperiorCor, tvTextoSuperiorTamanho, tvTextoSuperiorAlinhamento, tvTextoSuperiorVisivel,
    tvTextoInferior, tvTextoInferiorCor, tvTextoInferiorTamanho, tvTextoInferiorAlinhamento, tvTextoInferiorVisivel
  ]);

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
                key={`nome-${activeTv.id}`}
                type="text"
                defaultValue={tvNome}
                onBlur={(e) => {
                  if (e.target.value !== tvNome) handleUpdateTvProperty('nome', e.target.value, setTvNome);
                }}
                className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Playlist dropdown selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Playlist Vinculada</label>
              <select
                value={tvPlaylistId}
                onChange={(e) => handleUpdateTvProperty('playlistId', e.target.value, setTvPlaylistId)}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posição da Tela</label>
                <select
                  key={`orientacao-${activeTv.id}`}
                  defaultValue={tvOrientacao}
                  onChange={(e) => {
                    if (e.target.value !== tvOrientacao) handleUpdateTvProperty('orientacao', e.target.value, setTvOrientacao);
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>

              {/* Rotação Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Girar Tela</label>
                <select
                  key={`rotacao-${activeTv.id}`}
                  defaultValue={tvRotacao.toString()}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val !== tvRotacao) handleUpdateTvProperty('rotacao', val, setTvRotacao);
                  }}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Imagem</label>
                <select
                  key={`modo_exibicao-${activeTv.id}`}
                  defaultValue={tvModoReproducao}
                  onChange={(e) => {
                    if (e.target.value !== tvModoReproducao) handleUpdateTvProperty('modo_exibicao', e.target.value, setTvModoReproducao);
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Autoplay">Autoplay Contínuo</option>
                  <option value="Sequential">Sequencial Estrito</option>
                  <option value="Shuffle">Aleatório (Shuffle)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transição Imagens (s)</label>
                <input
                  key={`tempo_transicao-${activeTv.id}`}
                  type="number"
                  min="1"
                  max="60"
                  defaultValue={tvTempoTransicao}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val !== tvTempoTransicao) handleUpdateTvProperty('tempo_transicao', val, setTvTempoTransicao);
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Novas Configurações Visuais */}
            <div className="pt-2 border-t border-white/5 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajustes Visuais & Áudio</h4>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Proporção Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tela</label>
                  <select
                    key={`proporcao-${activeTv.id}`}
                    defaultValue={tvProporcao}
                    onChange={(e) => {
                      if (e.target.value !== tvProporcao) handleUpdateTvProperty('proporcao', e.target.value, setTvProporcao);
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="contain">Original (Contain)</option>
                    <option value="cover">Preencher (Cover)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="4:3">Standard (4:3)</option>
                  </select>
                </div>

                {/* Tempo de transição Input (REMOVED FROM UI) */}
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
                    key={`brilho-${activeTv.id}`}
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={tvBrilho}
                    onMouseUp={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvBrilho) handleUpdateTvProperty('brilho', val, setTvBrilho);
                    }}
                    onTouchEnd={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvBrilho) handleUpdateTvProperty('brilho', val, setTvBrilho);
                    }}
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
                    key={`contraste-${activeTv.id}`}
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={tvContraste}
                    onMouseUp={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvContraste) handleUpdateTvProperty('contraste', val, setTvContraste);
                    }}
                    onTouchEnd={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvContraste) handleUpdateTvProperty('contraste', val, setTvContraste);
                    }}
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
                    key={`saturacao-${activeTv.id}`}
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={tvSaturacao}
                    onMouseUp={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvSaturacao) handleUpdateTvProperty('saturacao', val, setTvSaturacao);
                    }}
                    onTouchEnd={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvSaturacao) handleUpdateTvProperty('saturacao', val, setTvSaturacao);
                    }}
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
                    key={`zoom-${activeTv.id}`}
                    type="range"
                    min="50"
                    max="150"
                    defaultValue={tvZoom}
                    onMouseUp={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvZoom) handleUpdateTvProperty('zoom', val, setTvZoom);
                    }}
                    onTouchEnd={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvZoom) handleUpdateTvProperty('zoom', val, setTvZoom);
                    }}
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
                    key={`volume-${activeTv.id}`}
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={tvVolume}
                    onMouseUp={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvVolume) handleUpdateTvProperty('volume', val, setTvVolume);
                    }}
                    onTouchEnd={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val !== tvVolume) handleUpdateTvProperty('volume', val, setTvVolume);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Conteúdo Online */}
            <div className="bg-[#050508]/50 p-4 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Conteúdo Online
              </h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-online-name"
                    placeholder="Nome do Link"
                    className="w-1/3 px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                  <input
                    type="url"
                    id="new-online-url"
                    placeholder="URL (Site, Reels, YouTube)"
                    className="w-2/3 px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => {
                      const nameInput = document.getElementById('new-online-name') as HTMLInputElement;
                      const urlInput = document.getElementById('new-online-url') as HTMLInputElement;
                      if (nameInput.value && urlInput.value) {
                        const newArr = [...tvConteudoOnline, {
                          id: Date.now().toString(),
                          nome: nameInput.value,
                          url: urlInput.value,
                          active: false
                        }];
                        handleUpdateTvProperty('conteudos_online', newArr, setTvConteudoOnline);
                        nameInput.value = '';
                        urlInput.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-600/30"
                  >
                    Add
                  </button>
                </div>
                {tvConteudoOnline.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {tvConteudoOnline.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between bg-[#0d0d12] p-2 rounded border border-white/5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="activeOnlineContent"
                            checked={item.active}
                            onChange={() => {
                              const newArr = tvConteudoOnline.map(i => ({ ...i, active: i.id === item.id }));
                              handleUpdateTvProperty('conteudos_online', newArr, setTvConteudoOnline);
                            }}
                            className="accent-cyan-400"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{item.nome}</p>
                            <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{item.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                          const newArr = tvConteudoOnline.filter(i => i.id !== item.id);
                          handleUpdateTvProperty('conteudos_online', newArr, setTvConteudoOnline);
                        }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          const newArr = tvConteudoOnline.map(i => ({ ...i, active: false }));
                          handleUpdateTvProperty('conteudos_online', newArr, setTvConteudoOnline);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Desativar Conteúdo Online
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Textos na Tela */}
            <div className="bg-[#050508]/50 p-4 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                <Layout className="w-4 h-4 text-cyan-400" />
                Textos na Tela (Letreiro)
              </h4>
              
              {/* Texto Superior */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Texto Superior</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      key={`visSup-${activeTv.id}`}
                      type="checkbox" 
                      defaultChecked={tvTextoSuperiorVisivel} 
                      onChange={(e) => {
                        handleUpdateTvProperty('texto_superior_visivel', e.target.checked, setTvTextoSuperiorVisivel);
                      }}
                      className="accent-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400">Mostrar</span>
                  </label>
                </div>
                <input
                  key={`textoSup-${activeTv.id}`}
                  type="text"
                  placeholder="Ex: Promoção do Dia!"
                  defaultValue={tvTextoSuperior}
                  onBlur={(e) => {
                    if (e.target.value !== tvTextoSuperior) handleUpdateTvProperty('texto_superior', e.target.value, setTvTextoSuperior);
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-2">
                  <input 
                    key={`corSup-${activeTv.id}`}
                    type="color" 
                    defaultValue={tvTextoSuperiorCor} 
                    onBlur={(e) => {
                      if (e.target.value !== tvTextoSuperiorCor) handleUpdateTvProperty('texto_superior_cor', e.target.value, setTvTextoSuperiorCor);
                    }}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <select
                    key={`tamSup-${activeTv.id}`}
                    defaultValue={tvTextoSuperiorTamanho}
                    onChange={(e) => {
                      if (e.target.value !== tvTextoSuperiorTamanho) handleUpdateTvProperty('texto_superior_tamanho', e.target.value, setTvTextoSuperiorTamanho);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-[#050508]/40 border border-white/10 rounded text-slate-200 focus:outline-none"
                  >
                    <option value="sm">Pequeno</option>
                    <option value="base">Médio</option>
                    <option value="lg">Grande</option>
                    <option value="xl">Extra Grande</option>
                  </select>
                  <select
                    key={`alignSup-${activeTv.id}`}
                    defaultValue={tvTextoSuperiorAlinhamento}
                    onChange={(e) => {
                      if (e.target.value !== tvTextoSuperiorAlinhamento) handleUpdateTvProperty('texto_superior_alinhamento', e.target.value as any, setTvTextoSuperiorAlinhamento);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-[#050508]/40 border border-white/10 rounded text-slate-200 focus:outline-none"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                </div>
              </div>

              {/* Texto Inferior */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Texto Inferior</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      key={`visInf-${activeTv.id}`}
                      type="checkbox" 
                      defaultChecked={tvTextoInferiorVisivel} 
                      onChange={(e) => {
                        handleUpdateTvProperty('texto_inferior_visivel', e.target.checked, setTvTextoInferiorVisivel);
                      }}
                      className="accent-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400">Mostrar</span>
                  </label>
                </div>
                <input
                  key={`textoInf-${activeTv.id}`}
                  type="text"
                  placeholder="Ex: www.seusite.com.br"
                  defaultValue={tvTextoInferior}
                  onBlur={(e) => {
                    if (e.target.value !== tvTextoInferior) handleUpdateTvProperty('texto_inferior', e.target.value, setTvTextoInferior);
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#050508]/40 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-2">
                  <input 
                    key={`corInf-${activeTv.id}`}
                    type="color" 
                    defaultValue={tvTextoInferiorCor} 
                    onBlur={(e) => {
                      if (e.target.value !== tvTextoInferiorCor) handleUpdateTvProperty('texto_inferior_cor', e.target.value, setTvTextoInferiorCor);
                    }}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <select
                    key={`tamInf-${activeTv.id}`}
                    defaultValue={tvTextoInferiorTamanho}
                    onChange={(e) => {
                      if (e.target.value !== tvTextoInferiorTamanho) handleUpdateTvProperty('texto_inferior_tamanho', e.target.value, setTvTextoInferiorTamanho);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-[#050508]/40 border border-white/10 rounded text-slate-200 focus:outline-none"
                  >
                    <option value="sm">Pequeno</option>
                    <option value="base">Médio</option>
                    <option value="lg">Grande</option>
                    <option value="xl">Extra Grande</option>
                  </select>
                  <select
                    key={`alignInf-${activeTv.id}`}
                    defaultValue={tvTextoInferiorAlinhamento}
                    onChange={(e) => {
                      if (e.target.value !== tvTextoInferiorAlinhamento) handleUpdateTvProperty('texto_inferior_alinhamento', e.target.value as any, setTvTextoInferiorAlinhamento);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-[#050508]/40 border border-white/10 rounded text-slate-200 focus:outline-none"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
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
                tvOrientacao === 'vertical' 
                  ? 'w-full max-w-[210px] aspect-[9/16]' 
                  : 'w-full max-w-[540px] aspect-video'
              }`}>
                {/* Bezel frame */}
                <div className="absolute inset-0 bg-neutral-950 rounded-[18px] shadow-2xl border-4 border-neutral-800 flex flex-col overflow-hidden p-2.5">
                  <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden flex flex-col justify-between">
                    
                    {tvTextoSuperiorVisivel && tvTextoSuperior && (
                      <div className="absolute top-4 left-0 right-0 z-50 pointer-events-none" style={{ textAlign: tvTextoSuperiorAlinhamento as any }}>
                        <span style={{ 
                          color: tvTextoSuperiorCor, 
                          fontSize: tvTextoSuperiorTamanho === 'sm' ? '0.75rem' : tvTextoSuperiorTamanho === 'lg' ? '1.25rem' : tvTextoSuperiorTamanho === 'xl' ? '1.5rem' : '1rem',
                          textShadow: '0px 2px 4px rgba(0,0,0,0.8)'
                        }} className="font-bold px-4 py-2 bg-black/40 rounded-lg backdrop-blur-sm mx-4 inline-block">{tvTextoSuperior}</span>
                      </div>
                    )}

                    {tvTextoInferiorVisivel && tvTextoInferior && (
                      <div className="absolute bottom-4 left-0 right-0 z-50 pointer-events-none" style={{ textAlign: tvTextoInferiorAlinhamento as any }}>
                        <span style={{ 
                          color: tvTextoInferiorCor, 
                          fontSize: tvTextoInferiorTamanho === 'sm' ? '0.75rem' : tvTextoInferiorTamanho === 'lg' ? '1.25rem' : tvTextoInferiorTamanho === 'xl' ? '1.5rem' : '1rem',
                          textShadow: '0px 2px 4px rgba(0,0,0,0.8)'
                        }} className="font-bold px-4 py-2 bg-black/40 rounded-lg backdrop-blur-sm mx-4 inline-block">{tvTextoInferior}</span>
                      </div>
                    )}

                    {/* Display Media Container */}
                    <div className="absolute inset-0 z-10 bg-slate-950 flex items-center justify-center">
                      {(() => {
                        const activeOnlineContent = tvConteudoOnline.find(c => c.active);
                        if (activeOnlineContent) {
                          let embedUrl = activeOnlineContent.url;
                          if (embedUrl.includes('instagram.com')) {
                            const match = embedUrl.match(/\/p\/([^\/?#&]+)/) || embedUrl.match(/\/reel\/([^\/?#&]+)/) || embedUrl.match(/\/reels\/([^\/?#&]+)/) || embedUrl.match(/\/stories\/[^\/]+\/([^\/?#&]+)/);
                            if (match && match[1]) {
                              embedUrl = `https://www.instagram.com/p/${match[1]}/embed/captioned`;
                            }
                          } else if (embedUrl.includes('youtube.com/watch')) {
                            const match = embedUrl.match(/v=([^&]+)/);
                            if (match && match[1]) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
                          } else if (embedUrl.includes('youtu.be/')) {
                            const match = embedUrl.match(/youtu\.be\/([^?]+)/);
                            if (match && match[1]) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
                          }

                          return (
                            <div 
                              className="w-full h-full relative" 
                              style={{ 
                                width: (tvRotacao === 90 || tvRotacao === 270) ? '200%' : '100%',
                                height: (tvRotacao === 90 || tvRotacao === 270) ? '200%' : '100%',
                                filter: `brightness(${tvBrilho}%) contrast(${tvContraste}%) saturate(${tvSaturacao}%)`,
                                transform: `rotate(${tvRotacao}deg) scale(${tvZoom / 100})`,
                                transition: 'all 0.3s ease' 
                              }}
                            >
                              <iframe src={embedUrl} className="w-full h-full border-none pointer-events-none bg-white" title={activeOnlineContent.nome} />
                            </div>
                          );
                        }

                        if (mediaList.length === 0) {
                          return (
                            <div className="text-center text-gray-500 p-4 space-y-2">
                              <TvIcon className="w-10 h-10 mx-auto text-gray-700 animate-pulse" />
                              <p className="text-[10px] font-bold text-slate-400">Sem Programação Ativa</p>
                              <p className="text-[8px] text-gray-600">Vincule uma playlist para iniciar a transmissão.</p>
                            </div>
                          );
                        }

                        return currentMedia && (
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
                                  width: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'vertical' ? '56.25%' : '177.77%') : '100%',
                                  height: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'vertical' ? '177.77%' : '56.25%') : '100%',
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
                                  width: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'vertical' ? '56.25%' : '177.77%') : '100%',
                                  height: (tvRotacao === 90 || tvRotacao === 270) ? (tvOrientacao === 'vertical' ? '177.77%' : '56.25%') : '100%',
                                }}
                              />
                            )}
                          </div>
                        );
                      })()}
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
