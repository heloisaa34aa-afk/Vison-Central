import React, { useState, useEffect, useRef } from 'react';
import { Tv, Playlist, Midia } from '../types';
import MediaRenderer from './MediaRenderer';
import { playerService } from '../services/supabase/player';
import { tokensService } from '../services/supabase/tokens';

export default function Player() {
  const [step, setStep] = useState<'input' | 'validating' | 'downloading' | 'playing'>('input');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playlistMedia, setPlaylistMedia] = useState<Midia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeDevice, setActiveDevice] = useState<Tv | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const playlistIdRef = useRef<string | undefined>(undefined);
  playlistIdRef.current = activeDevice?.playlistId;
  const activeDeviceRef = useRef<Tv | null>(null);
  activeDeviceRef.current = activeDevice;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokensService.normalizeToken(tokenInput);
    if (cleanToken.length < 6 || cleanToken.length > 10) {
      setError('Token inválido. O token deve possuir o formato padrão VC-XXXX-XX.');
      return;
    }
    
    setError(null);
    setStep('validating');

    try {
      // Load real player configuration from Supabase
      const data = await playerService.getPlayerConfig(cleanToken);
      
      if (!data.playlist || data.midias.length === 0) {
        setError('Nenhuma playlist associada ou playlist vazia.');
        setStep('input');
        return;
      }

      // Mark status as Online immediately
      await playerService.updateTvStatus(data.tv.id, 'Online');

      setActiveDevice(data.tv);
      setPlaylistMedia(data.midias);
      setStep('downloading');
      
      // Simulate downloading media duration
      setTimeout(() => {
        setStep('playing');
        enterFullscreen();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Token inválido ou erro de conexão.');
      setStep('input');
    }
  };

  const enterFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => console.log('Fullscreen blocked:', err));
      }
    }
  };

  // Top level helper to calculate the next media index based on playback mode (Shuffle, Sequential, Autoplay)
  const getNextIndex = (current: number, length: number, mode: string): number => {
    if (length <= 1) return 0;
    if (mode === 'Shuffle') {
      let nextIdx = current;
      while (nextIdx === current) {
        nextIdx = Math.floor(Math.random() * length);
      }
      return nextIdx;
    }
    return (current + 1) % length;
  };

  // Top level helper to compare and detect configuration changes
  const areTvsDifferent = (prev: Tv | null, next: Tv | null): boolean => {
    if (!prev && !next) return false;
    if (!prev || !next) return true;
    return (
      prev.clienteId !== next.clienteId ||
      prev.nome !== next.nome ||
      prev.status !== next.status ||
      prev.uptime !== next.uptime ||
      prev.token !== next.token ||
      prev.playlistId !== next.playlistId ||
      prev.orientacao !== next.orientacao ||
      prev.modo_exibicao !== next.modo_exibicao ||
      prev.proporcao !== next.proporcao ||
      prev.brilho !== next.brilho ||
      prev.contraste !== next.contraste ||
      prev.saturacao !== next.saturacao ||
      prev.zoom !== next.zoom ||
      prev.volume !== next.volume ||
      prev.tempo_transicao !== next.tempo_transicao ||
      prev.rotacao !== next.rotacao ||
      prev.resolucao !== next.resolucao ||
      JSON.stringify(prev.conteudos_online) !== JSON.stringify(next.conteudos_online) ||
      prev.texto_superior !== next.texto_superior ||
      prev.texto_superior_cor !== next.texto_superior_cor ||
      prev.texto_superior_tamanho !== next.texto_superior_tamanho ||
      prev.texto_superior_alinhamento !== next.texto_superior_alinhamento ||
      prev.texto_superior_visivel !== next.texto_superior_visivel ||
      prev.texto_inferior !== next.texto_inferior ||
      prev.texto_inferior_cor !== next.texto_inferior_cor ||
      prev.texto_inferior_tamanho !== next.texto_inferior_tamanho ||
      prev.texto_inferior_alinhamento !== next.texto_inferior_alinhamento ||
      prev.texto_inferior_visivel !== next.texto_inferior_visivel
    );
  };

  // Keep player media looping
  useEffect(() => {
    if (step === 'playing' && playlistMedia.length > 0) {
      const currentMedia = playlistMedia[currentIndex];
      
      let timer: NodeJS.Timeout;
      
      if (currentMedia && currentMedia.tipo !== 'video') {
        const duration = (activeDevice?.tempo_transicao !== undefined ? activeDevice.tempo_transicao : currentMedia.duracao) * 1000;
        timer = setTimeout(() => {
          const mode = activeDevice?.modo_exibicao || 'Autoplay';
          setCurrentIndex((prev) => getNextIndex(prev, playlistMedia.length, mode));
        }, duration);
      }

      return () => clearTimeout(timer);
    }
  }, [step, currentIndex, playlistMedia, activeDevice?.tempo_transicao, activeDevice?.modo_exibicao]);

  // Handle Realtime synchronization & Status monitoring (Online / Offline)
  useEffect(() => {
    if (step === 'playing' && activeDevice) {
      const deviceId = activeDevice.id;
      const deviceToken = activeDevice.token;

      // Single entry-point helper to compare and sync TV Settings (DeviceConfig)
      const syncTvSettings = (newTv: Tv) => {
        setActiveDevice(prev => {
          if (!prev) return newTv;

          // Logs exigidos para auditoria de sincronização
          console.log("====== [CONFIG RECEBIDA] ======", newTv);
          
          console.log("[CONFIG TVS] Atributos da tabela 'tvs':", {
            id: newTv.id,
            nome: newTv.nome,
            token: newTv.token,
            playlist_id: newTv.playlistId,
            orientacao: newTv.orientacao,
            proporcao: newTv.proporcao,
            modo_exibicao: newTv.modo_exibicao,
            brilho: newTv.brilho,
            contraste: newTv.contraste,
            saturacao: newTv.saturacao,
            zoom: newTv.zoom,
            volume: newTv.volume,
            tempo_transicao: newTv.tempo_transicao,
            rotacao: newTv.rotacao,
          });

          console.log("[CONFIG CONFIGURACOES] Atributos unificados de 'configuracoes' (armazenados em 'tvs'):", {
            resolucao: newTv.resolucao,
            autoplay: newTv.autoplay,
          });

          console.log("[CONFIG FINAL] Objeto final unificado de configuração:", newTv);

          // Verificar e listar campos alterados
          const fieldsToCompare: (keyof Tv)[] = [
            'nome', 'playlistId', 'orientacao', 'modo_exibicao', 'proporcao',
            'brilho', 'contraste', 'saturacao', 'zoom', 'volume',
            'tempo_transicao', 'rotacao', 'resolucao', 'autoplay'
          ];

          fieldsToCompare.forEach(field => {
            const prevVal = prev[field];
            const newVal = newTv[field];
            if (prevVal !== newVal && newVal !== undefined) {
              console.log(`[CAMPO ALTERADO] Campo "${String(field)}" | VALOR ANTIGO = ${prevVal} | VALOR NOVO = ${newVal}`);
            }
          });
          console.log("=========================================");

          if (areTvsDifferent(prev, newTv)) {
            console.log("[PLAYER] Configurações da TV atualizadas.");
            return newTv;
          }
          return prev;
        });
      };

      // Single entry-point helper to compare and sync Playlist
      const syncPlaylist = (newMidias: Midia[]) => {
        setPlaylistMedia(prev => {
          const changed = JSON.stringify(prev) !== JSON.stringify(newMidias);
          if (changed) {
            console.log("[PLAYER] Playlist de mídias atualizada.");
            setCurrentIndex(curr => curr >= newMidias.length ? 0 : curr);
            return newMidias;
          }
          return prev;
        });
      };

      // Comprehensive full state sync helper, called once per cycle or event
      const syncFullPlayerState = async () => {
        try {
          const data = await playerService.getPlayerConfigById(deviceId);
          
          if (tokensService.normalizeToken(data.tv.token) !== tokensService.normalizeToken(deviceToken)) {
            setError('O token deste dispositivo foi alterado ou renovado. Conecte-se novamente.');
            setStep('input');
            setActiveDevice(null);
            return;
          }

          syncTvSettings(data.tv);
          syncPlaylist(data.midias);
        } catch (err: any) {
          console.error('Falha na sincronização completa do Player:', err);
          if (err.message && (err.message.includes('não encontrado') || err.message.includes('Token inválido'))) {
            setError('Este dispositivo foi removido do painel.');
            setStep('input');
            setActiveDevice(null);
          }
        }
      };

      // 1. Subscribe to updates on Supabase Realtime
      const unsubscribe = playerService.subscribeToUpdates(
        deviceId,
        () => playlistIdRef.current,
        {
          onTvUpdate: async (newTvData?: any) => {
            try {
              if (newTvData) {
                if (newTvData.token && tokensService.normalizeToken(newTvData.token) !== tokensService.normalizeToken(deviceToken)) {
                  setError('O token deste dispositivo foi alterado ou renovado. Conecte-se novamente.');
                  setStep('input');
                  setActiveDevice(null);
                  return;
                }
                
                const { mapDbToTv } = await import('../services/supabase/tvs');
                const tvMapped = mapDbToTv(newTvData);
                
                // Avoid redundant sync if this was just a heartbeat update
                if (areTvsDifferent(activeDeviceRef.current, tvMapped)) {
                  syncTvSettings(tvMapped);
                }
              } else {
                await syncFullPlayerState();
              }
            } catch (e: any) {
              console.error('Falha no Realtime update (TV):', e);
            }
          },
          onConfigUpdate: (config: Partial<Tv>) => {
            setActiveDevice(prev => {
              if (!prev) return null;
              const merged = { ...prev, ...config };
              if (areTvsDifferent(prev, merged)) {
                console.log("[PLAYER] Configurações via Broadcast recebidas.");
                return merged;
              }
              return prev;
            });
          },
          onPlaylistUpdate: async () => {
            await syncFullPlayerState();
          }
        }
      );

      // Ensure the device is marked Online immediately when the effect is mounted
      playerService.updateTvStatus(deviceId, 'Online').catch(err => {
        console.error('Erro ao marcar online na inicialização:', err);
      });

      // Periodic check-in / heartbeat every 10 seconds (ONLY updates Online status, avoids heavy duplicate fetch)
      const heartbeatInterval = setInterval(async () => {
        try {
          await playerService.sendHeartbeat(deviceId);
        } catch (err: any) {
          console.error('Falha no heartbeat periódico:', err);
        }
      }, 10000);

      // 3. Set status to offline on window unload/close
      const handleUnload = () => {
        playerService.updateTvStatus(deviceId, 'Offline');
      };
      
      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('unload', handleUnload);

      return () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        handleUnload();
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('unload', handleUnload);
      };
    }
  }, [step, activeDevice?.id, activeDevice?.token]);

  const handleVideoEnded = () => {
    const mode = activeDevice?.modo_exibicao || 'Autoplay';
    setCurrentIndex((prev) => getNextIndex(prev, playlistMedia.length, mode));
  };

  if (step === 'input' || step === 'validating' || step === 'downloading') {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-white font-sans selection:bg-blue-500/30">
        <div className="max-w-md w-full p-8 bg-[#0d0d12]/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">VisionCentral <span className="text-cyan-400">Player</span></h1>
            <p className="text-slate-400 text-sm">Pareamento de Tela Digital</p>
          </div>

          {step === 'input' && (
            <form onSubmit={handleStart} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Token de Acesso</label>
                <input 
                  type="text" 
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  maxLength={10}
                  placeholder="EX: VC-3042"
                  className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-wider text-white focus:outline-none focus:border-blue-500/50 uppercase"
                />
              </div>

              {error && <p className="text-rose-400 text-sm text-center font-medium bg-rose-500/10 py-2 rounded-lg">{error}</p>}

              <button 
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-sm font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                Conectar Tela
              </button>
            </form>
          )}

          {step === 'validating' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-300 font-medium animate-pulse">Validando credenciais...</p>
            </div>
          )}

          {step === 'downloading' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-300 font-medium animate-pulse">Baixando mídia para cache local...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentMedia = playlistMedia[currentIndex];
  const activeOnlineContent = activeDevice?.conteudos_online?.find(c => c.active);

  const handleMediaError = () => {
    console.warn('Erro de carregamento na mídia:', currentMedia?.nome || currentIndex);
    // Avoid rapid infinite loops by setting a 2 second timeout before skipping to the next index
    setTimeout(() => {
      if (playlistMedia.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % playlistMedia.length);
      }
    }, 2000);
  };

  if (!currentMedia && !activeOnlineContent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-sm font-medium animate-pulse">Carregando mídias da playlist...</p>
      </div>
    );
  }

  const isVertical = activeDevice?.orientacao === 'vertical';

  const proporcao = activeDevice?.proporcao || 'contain';
  const brilho = activeDevice?.brilho !== undefined ? activeDevice.brilho : 100;
  const contraste = activeDevice?.contraste !== undefined ? activeDevice.contraste : 100;
  const saturacao = activeDevice?.saturacao !== undefined ? activeDevice.saturacao : 100;
  const zoom = activeDevice?.zoom !== undefined ? activeDevice.zoom : 100;
  const volume = activeDevice?.volume !== undefined ? activeDevice.volume : 50;
  const rotacao = activeDevice?.rotacao !== undefined ? activeDevice.rotacao : 0;
  
  const isRotated90 = rotacao === 90 || rotacao === 270;
  const verticalMaxWidth = isRotated90 ? 'max-w-[100vw]' : 'max-w-[100vh]';

  return (
    <div ref={containerRef} className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center cursor-none relative">
      
      {activeDevice?.texto_superior_visivel && activeDevice?.texto_superior && (
        <div className="absolute top-8 left-0 right-0 z-50 pointer-events-none" style={{ textAlign: activeDevice.texto_superior_alinhamento as any }}>
          <span style={{ 
            color: activeDevice.texto_superior_cor, 
            fontSize: activeDevice.texto_superior_tamanho === 'sm' ? '2vh' : activeDevice.texto_superior_tamanho === 'lg' ? '6vh' : activeDevice.texto_superior_tamanho === 'xl' ? '8vh' : '4vh',
            textShadow: '0px 4px 8px rgba(0,0,0,0.8)'
          }} className="font-bold px-8 py-4 bg-black/40 rounded-xl backdrop-blur-md mx-8 inline-block">{activeDevice.texto_superior}</span>
        </div>
      )}

      {activeDevice?.texto_inferior_visivel && activeDevice?.texto_inferior && (
        <div className="absolute bottom-8 left-0 right-0 z-50 pointer-events-none" style={{ textAlign: activeDevice.texto_inferior_alinhamento as any }}>
          <span style={{ 
            color: activeDevice.texto_inferior_cor, 
            fontSize: activeDevice.texto_inferior_tamanho === 'sm' ? '2vh' : activeDevice.texto_inferior_tamanho === 'lg' ? '6vh' : activeDevice.texto_inferior_tamanho === 'xl' ? '8vh' : '4vh',
            textShadow: '0px 4px 8px rgba(0,0,0,0.8)'
          }} className="font-bold px-8 py-4 bg-black/40 rounded-xl backdrop-blur-md mx-8 inline-block">{activeDevice.texto_inferior}</span>
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden" style={{ containerType: 'size' }}>
        <MediaRenderer 
          tv={activeDevice}
          media={currentMedia}
          onlineContent={activeOnlineContent}
          onMediaError={handleMediaError}
          onVideoEnded={handleVideoEnded}
          isWebPlayer={true}
        />
      </div>
    </div>
  );
}
