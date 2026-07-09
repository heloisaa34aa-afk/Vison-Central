import React, { useState, useEffect, useRef } from 'react';
import { Device, Playlist, Media } from '../types';
import { initialDevices, initialPlaylists, initialMedia } from '../mockData';
import { storageService } from '../lib/storage';

// Real fetch from Supabase config via storageService
const mockFetchConfig = async (token: string) => {
  // Let's add a small artificial delay of 1s to preserve the nice loading transitions
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const devices = await storageService.getDevices(initialDevices);
  const device = devices.find(d => d.token === token);
  
  if (!device) {
    throw new Error('Token inválido');
  }

  // Update status to online on Supabase
  const updatedDevices = devices.map(d => d.id === device.id ? { ...d, status: 'Online' as const } : d);
  await storageService.saveDevices(updatedDevices);

  const clients = await storageService.getClients([]);
  const client = clients.find((c: any) => c.id === device.clientId);

  if (!client || !client.playlistId) {
    return { device, playlist: null, media: [] };
  }

  const playlists = await storageService.getPlaylists(initialPlaylists);
  const playlist = playlists.find(p => p.id === client.playlistId);

  if (!playlist) {
    return { device, playlist: null, media: [] };
  }

  const allMedia = await storageService.getMedia(initialMedia);
  const playlistMedia = playlist.mediaIds.map(id => allMedia.find(m => m.id === id)).filter(Boolean) as Media[];

  return { device, playlist, media: playlistMedia };
};

export default function Player() {
  const [step, setStep] = useState<'input' | 'validating' | 'downloading' | 'playing'>('input');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [playlistMedia, setPlaylistMedia] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.length !== 6) {
      setError('O token deve ter 6 caracteres.');
      return;
    }
    
    setError(null);
    setStep('validating');

    try {
      const data = await mockFetchConfig(tokenInput.toUpperCase());
      
      if (!data.playlist || data.media.length === 0) {
        setError('Nenhuma playlist associada ou playlist vazia.');
        setStep('input');
        return;
      }

      setPlaylistMedia(data.media);
      setStep('downloading');
      
      // Simulate downloading media
      setTimeout(() => {
        setStep('playing');
        enterFullscreen();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
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

  useEffect(() => {
    if (step === 'playing' && playlistMedia.length > 0) {
      const currentMedia = playlistMedia[currentIndex];
      
      let timer: NodeJS.Timeout;
      
      if (currentMedia.type === 'image') {
        timer = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % playlistMedia.length);
        }, currentMedia.duration * 1000);
      }

      return () => clearTimeout(timer);
    }
  }, [step, currentIndex, playlistMedia]);

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
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="EX: A1B2C3"
                  className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-blue-500/50 uppercase"
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

  return (
    <div ref={containerRef} className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center cursor-none">
      {currentMedia.type === 'image' ? (
        <img 
          src={currentMedia.url} 
          alt="Current Media" 
          className="w-full h-full object-contain bg-black animate-fade-in"
        />
      ) : (
        <video 
          ref={videoRef}
          src={currentMedia.url} 
          autoPlay 
          muted 
          onEnded={handleVideoEnded}
          className="w-full h-full object-contain bg-black animate-fade-in"
        />
      )}
    </div>
  );
}
