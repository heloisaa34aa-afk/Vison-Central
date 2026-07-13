import React, { useState, useEffect, useRef } from 'react';
import { Tv, Playlist, Midia } from '../types';
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Keep player media looping
  useEffect(() => {
    if (step === 'playing' && playlistMedia.length > 0) {
      const currentMedia = playlistMedia[currentIndex];
      
      let timer: NodeJS.Timeout;
      
      if (currentMedia && currentMedia.tipo === 'image') {
        timer = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % playlistMedia.length);
        }, currentMedia.duracao * 1000);
      }

      return () => clearTimeout(timer);
    }
  }, [step, currentIndex, playlistMedia]);

  // Handle Realtime synchronization & Status monitoring (Online / Offline)
  useEffect(() => {
    if (step === 'playing' && activeDevice) {
      const deviceId = activeDevice.id;
      const deviceToken = activeDevice.token;

      // 1. Subscribe to updates on Supabase Realtime
      const unsubscribe = playerService.subscribeToUpdates(deviceToken, async () => {
        try {
          // Buscar configurações atualizadas do dispositivo pelo ID
          const data = await playerService.getPlayerConfigById(deviceId);
          
          // Caso o token do dispositivo tenha mudado no banco
          if (tokensService.normalizeToken(data.tv.token) !== tokensService.normalizeToken(deviceToken)) {
            setError('O token deste dispositivo foi alterado ou renovado. Conecte-se novamente.');
            setStep('input');
            setActiveDevice(null);
            return;
          }

          // Atualizar o estado do dispositivo ativo
          setActiveDevice(data.tv);

          if (data.midias && data.midias.length > 0) {
            // Atualizar mídias dinamicamente
            setPlaylistMedia(prev => {
              const prevUrls = prev.map(m => m.url).join(',');
              const newUrls = data.midias.map(m => m.url).join(',');
              if (prevUrls !== newUrls) {
                return data.midias;
              }
              return prev;
            });
          } else {
            setPlaylistMedia([]);
            setError('Nenhuma mídia disponível na playlist associada.');
            setStep('input');
          }
        } catch (e: any) {
          console.error('Realtime update failed:', e);
          if (e.message && (e.message.includes('não encontrado') || e.message.includes('Token inválido'))) {
            setError('Este dispositivo foi removido do painel.');
            setStep('input');
            setActiveDevice(null);
          }
        }
      });
  
      // Ensure the device is marked Online immediately when the effect is mounted
      playerService.updateTvStatus(deviceId, 'Online').catch(err => {
        console.error('Error marking online on start:', err);
      });

      // 2. Periodic heartbeat to keep status Online and fresh (20 seconds)
      const heartbeatInterval = setInterval(async () => {
        try {
          await playerService.updateTvStatus(deviceId, 'Online');
        } catch (err) {
          console.error('Heartbeat update failed:', err);
        }
      }, 20000);

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
    setCurrentIndex((prev) => (prev + 1) % playlistMedia.length);
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

  const handleMediaError = () => {
    console.warn('Erro de carregamento na mídia:', currentMedia?.nome || currentIndex);
    // Avoid rapid infinite loops by setting a 2 second timeout before skipping to the next index
    setTimeout(() => {
      if (playlistMedia.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % playlistMedia.length);
      }
    }, 2000);
  };

  if (!currentMedia) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-sm font-medium animate-pulse">Carregando mídias da playlist...</p>
      </div>
    );
  }

  const isVertical = activeDevice?.orientacao === 'Vertical';

  return (
    <div ref={containerRef} className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center cursor-none">
      <div className={`transition-all duration-500 w-full h-full flex items-center justify-center ${isVertical ? 'max-w-[100vh] aspect-[9/16]' : ''}`}>
        {currentMedia.tipo === 'image' ? (
          <img 
            src={currentMedia.url} 
            alt="Current Media" 
            onError={handleMediaError}
            className="w-full h-full object-contain bg-black animate-fade-in"
            referrerPolicy="no-referrer"
          />
        ) : (
          <video 
            ref={videoRef}
            src={currentMedia.url} 
            autoPlay 
            muted 
            onEnded={handleVideoEnded}
            onError={handleMediaError}
            className="w-full h-full object-contain bg-black animate-fade-in"
          />
        )}
      </div>
    </div>
  );
}
