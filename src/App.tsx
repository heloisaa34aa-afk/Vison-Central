import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Tv, Playlist, Midia } from './types';
import { storageService } from './lib/storage';
import { supabase } from './lib/supabase';
import { isTvOnline } from './utils/tvStatus';

import { mapDbToTv } from './services/supabase/tvs';

// Icons
import { 
  LayoutDashboard, 
  Tv as TvIcon, 
  Radio, 
  CheckCircle,
  Building2
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import ClientsManager from './components/ClientsManager';
import ClientPage from './components/ClientPage';
import ScreenSimulator from './components/ScreenSimulator';
import Player from './components/Player';

export default function App() {
  const isPlayerPage = window.location.pathname === '/player' || window.location.hash === '#/player';

  if (isPlayerPage) {
    return <Player />;
  }

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Outside triggers for simulator
  const [selectedClientIdForSim, setSelectedClientIdForSim] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Persistence States
  const [clients, setClients] = useState<Cliente[]>([]);
  const [devices, setDevices] = useState<Tv[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<Midia[]>([]);
  
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep a reference to the latest devices to avoid resetting the offline detector interval
  const devicesRef = useRef<Tv[]>(devices);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  // Initialize data and subscribe to global real-time updates
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedClients = await storageService.getClientes();
        const loadedDevices = await storageService.getTvs();
        const loadedPlaylists = await storageService.getPlaylists();
        const loadedMedia = await storageService.getMidias();

        // Calculate screen count dynamically based on the actual paired devices
        const clientsWithScreensCount = loadedClients.map(client => {
          const clientDevices = loadedDevices.filter(d => d.clienteId === client.id);
          return {
            ...client,
            quantidadeTelas: clientDevices.length
          };
        });

        setClients(clientsWithScreensCount);
        setDevices(loadedDevices);
        setPlaylists(loadedPlaylists);
        setMedia(loadedMedia);
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    // Initial load
    loadData();

    // Subscribe to real-time events on all relevant tables to keep the global state synchronized
    const channel = supabase
      .channel('visioncentral-global-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tvs' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedTv = mapDbToTv(payload.new);
          setDevices(prev => prev.map(tv => tv.id === updatedTv.id ? updatedTv : tv));
        } else if (payload.eventType === 'INSERT' && payload.new) {
          const newTv = mapDbToTv(payload.new);
          setDevices(prev => [...prev, newTv]);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setDevices(prev => prev.filter(tv => tv.id !== payload.old.id));
        } else {
          loadData();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'midias' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist_midias' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Automatic Offline Detector (Local State Only)
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      const currentDevices = devicesRef.current;
      if (currentDevices.length === 0) return;

      const now = new Date();
      let hasUpdates = false;
      const nextDevices = currentDevices.map((d) => {
        if (d.status === 'Online' && d.ultimaConexao) {
          const lastConn = new Date(d.ultimaConexao);
          const diffSeconds = (now.getTime() - lastConn.getTime()) / 1000;
          if (diffSeconds > 30) {
            hasUpdates = true;
            return { ...d, status: 'Offline' as const };
          }
        }
        return d;
      });

      if (hasUpdates) {
        setDevices(nextDevices);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Toast notification helper
  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('client');
  };

  const handleUpdateClient = async (updated: Cliente) => {
    const success = await storageService.saveCliente(updated);
    if (success) {
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      showToast('Cliente atualizado com sucesso!');
    } else {
      showToast('Erro ao atualizar cliente no Supabase.');
    }
  };

  const handleUpdateDevices = async (update: Tv[] | ((prev: Tv[]) => Tv[])) => {
    const nextDevices = typeof update === 'function' ? update(devices) : update;
    setDevices(nextDevices);

    // Dynamically update corresponding client's screens count
    setClients(prevClients => prevClients.map(c => {
      return { ...c, quantidadeTelas: nextDevices.filter(d => d.clienteId === c.id).length || 1 };
    }));

    // 1. Deletions
    const deleted = devices.filter(d => !nextDevices.some(nd => nd.id === d.id));
    for (const d of deleted) {
      await storageService.deleteTv(d.id);
    }

    // 2. Additions or Updates
    for (const nd of nextDevices) {
      const prev = devices.find(d => d.id === nd.id);
      if (
        !prev || 
        prev.nome !== nd.nome || 
        prev.status !== nd.status || 
        prev.token !== nd.token || 
        prev.ultimaSincronizacao !== nd.ultimaSincronizacao ||
        prev.playlistId !== nd.playlistId ||
        prev.orientacao !== nd.orientacao ||
        prev.modo_exibicao !== nd.modo_exibicao ||
        prev.proporcao !== nd.proporcao ||
        prev.brilho !== nd.brilho ||
        prev.contraste !== nd.contraste ||
        prev.saturacao !== nd.saturacao ||
        prev.zoom !== nd.zoom ||
        prev.volume !== nd.volume ||
        prev.tempo_transicao !== nd.tempo_transicao ||
        prev.ultimaConexao !== nd.ultimaConexao
      ) {
        await storageService.saveTv(nd);
      }
    }
  };

  const handleUpdatePlaylists = async (update: Playlist[] | ((prev: Playlist[]) => Playlist[])) => {
    const nextPlaylists = typeof update === 'function' ? update(playlists) : update;
    setPlaylists(nextPlaylists);

    // 1. Deletions
    const deleted = playlists.filter(p => !nextPlaylists.some(np => np.id === p.id));
    for (const p of deleted) {
      await storageService.deletePlaylist(p.id);
    }

    // 2. Additions or Updates
    let hasPlaylistUpdates = false;
    for (const np of nextPlaylists) {
      const prev = playlists.find(p => p.id === np.id);
      if (
        !prev || 
        prev.nome !== np.nome || 
        JSON.stringify(prev.midiasIds) !== JSON.stringify(np.midiasIds) ||
        JSON.stringify(prev.midiasDurations) !== JSON.stringify(np.midiasDurations)
      ) {
        await storageService.savePlaylist(np);
        hasPlaylistUpdates = true;
        // Broadcast playlist update to all TVs using this playlist
        import('./services/supabase/player').then(({ playerService }) => {
          devices.filter(d => d.playlistId === np.id).forEach(d => {
            playerService.broadcastPlaylistUpdate(d.id);
          });
        });
      }
    }
  };

  const handleUpdateMedia = async (update: Midia[] | ((prev: Midia[]) => Midia[])) => {
    const nextMedia = typeof update === 'function' ? update(media) : update;
    setMedia(nextMedia);

    // 1. Deletions
    const deleted = media.filter(m => !nextMedia.some(nm => nm.id === m.id));
    for (const m of deleted) {
      await storageService.deleteMidia(m.id);
    }

    // 2. Additions or Updates
    let hasMediaUpdates = false;
    for (const nm of nextMedia) {
      const prev = media.find(m => m.id === nm.id);
      if (!prev || prev.nome !== nm.nome || prev.duracao !== nm.duracao || prev.url !== nm.url) {
        await storageService.saveMidia(nm);
        hasMediaUpdates = true;
      }
    }
    
    // Broadcast playlist updates to all TVs
    // Media changes could affect playing media if it was updated or deleted
    if (hasMediaUpdates || deleted.length > 0) {
      import('./services/supabase/player').then(({ playerService }) => {
        devices.filter(d => d.playlistId).forEach(d => {
          playerService.broadcastPlaylistUpdate(d.id);
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 flex flex-col font-sans antialiased relative overflow-hidden" id="main-layout-root">
      
      {/* Background Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Dynamic Toast popup notifier */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d0d12]/90 text-white px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2.5 border border-blue-500/30 text-sm animate-fade-in font-medium backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Top Premium Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#09090e]/80 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 uppercase">
                Vision<span className="text-blue-400">Central</span>
              </span>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gestão de TV Corporativa e Mural Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono font-medium">Supabase: Conectado</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Responsive Side Menu / Left Tab controllers */}
        <aside className="md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 md:border-r border-white/5 pr-0 md:pr-4">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedClientIdForSim(null); setSelectedClientId(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Painel Geral
          </button>

          <button
            onClick={() => { setActiveTab('clients'); setSelectedClientIdForSim(null); setSelectedClientId(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'clients'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Clientes
          </button>

          <button
            onClick={() => { setActiveTab('simulator'); setSelectedClientId(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <TvIcon className="w-4 h-4 shrink-0" />
            Configuração de TV
          </button>

        </aside>

        {/* Dynamic Display area rendering active content */}
        <section className="flex-1 min-w-0">
          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
              <span className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-white/10 animate-spin" />
              <p className="text-sm font-medium">Carregando painel de gerenciamento...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  clientes={clients} 
                  tvs={devices} 
                  onNavigate={setActiveTab}
                  onSelectCliente={handleSelectClient}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsManager 
                  clients={clients}
                  devices={devices}
                  playlists={playlists}
                  onAddClient={async (newClient) => {
                    const success = await storageService.saveCliente(newClient);
                    if (success) {
                      setClients(prev => [...prev, newClient]);
                      showToast('Cliente criado com sucesso!');
                    } else {
                      showToast('Erro ao criar cliente.');
                    }
                  }}
                  onDeleteClient={async (id) => {
                    if (confirm('Atenção: excluir este cliente irá deletar permanentemente todas as suas TVs, playlists e mídias vinculadas. Deseja prosseguir?')) {
                      const success = await storageService.deleteCliente(id);
                      if (success) {
                        setClients(prev => prev.filter(c => c.id !== id));
                        setDevices(prev => prev.filter(d => d.clienteId !== id));
                        setPlaylists(prev => prev.filter(p => p.clienteId !== id));
                        setMedia(prev => prev.filter(m => m.clienteId !== id));
                        showToast('Cliente e todos os dados vinculados foram removidos do Supabase!');
                      } else {
                        showToast('Erro ao remover cliente.');
                      }
                    }
                  }}
                  onSelectCliente={handleSelectClient}
                />
              )}

              {activeTab === 'client' && selectedClientId && (
                <ClientPage
                  clientId={selectedClientId}
                  clients={clients}
                  devices={devices}
                  playlists={playlists}
                  media={media}
                  onUpdateClient={handleUpdateClient}
                  onUpdateDevices={handleUpdateDevices}
                  onUpdatePlaylists={handleUpdatePlaylists}
                  onUpdateMedia={handleUpdateMedia}
                  showToast={showToast}
                />
              )}

              {activeTab === 'simulator' && (
                <ScreenSimulator 
                  clients={clients} 
                  playlists={playlists} 
                  media={media}
                  selectedClientIdFromOutside={selectedClientIdForSim}
                />
              )}
            </>
          )}
        </section>

      </main>

    </div>
  );
}
