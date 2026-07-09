import React, { useState, useEffect } from 'react';
import { Cliente, Tv, Playlist, Midia } from './types';
import { storageService } from './lib/storage';

// Icons
import { 
  LayoutDashboard, 
  Tv as TvIcon, 
  Radio, 
  CheckCircle,
  Activity,
  Building2
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Monitoring from './components/Monitoring';
import TVsManager from './components/TVsManager';
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

  // Initialize data
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
            quantidadeTelas: clientDevices.length || 1
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
    loadData();
  }, []);

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
      if (!prev || prev.nome !== nd.nome || prev.status !== nd.status || prev.token !== nd.token || prev.ultimaSincronizacao !== nd.ultimaSincronizacao) {
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
    for (const np of nextPlaylists) {
      const prev = playlists.find(p => p.id === np.id);
      if (!prev || prev.nome !== np.nome || JSON.stringify(prev.midiasIds) !== JSON.stringify(np.midiasIds)) {
        await storageService.savePlaylist(np);
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
    for (const nm of nextMedia) {
      const prev = media.find(m => m.id === nm.id);
      if (!prev) {
        await storageService.saveMidia(nm);
      }
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
            onClick={() => { setActiveTab('monitoring'); setSelectedClientIdForSim(null); setSelectedClientId(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'monitoring'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            Monitoramento
          </button>

          <button
            onClick={() => { setActiveTab('tvs'); setSelectedClientIdForSim(null); setSelectedClientId(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'tvs'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            id="tab-tvs"
          >
            <TvIcon className="w-4 h-4 shrink-0" />
            TVs
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
            Simulador de TV
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
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={async (id) => {
                    const success = await storageService.deleteCliente(id);
                    if (success) {
                      setClients(prev => prev.filter(c => c.id !== id));
                      showToast('Cliente removido com sucesso!');
                    } else {
                      showToast('Erro ao remover cliente.');
                    }
                  }}
                  onAddDevice={async (newDevice) => {
                    const success = await storageService.saveTv(newDevice);
                    if (success) {
                      setDevices(prev => {
                        const nextDevices = [...prev, newDevice];
                        // Dynamically update corresponding client's screens count
                        setClients(prevClients => prevClients.map(c => {
                          if (c.id === newDevice.clienteId) {
                            return { ...c, quantidadeTelas: nextDevices.filter(d => d.clienteId === c.id).length || 1 };
                          }
                          return c;
                        }));
                        return nextDevices;
                      });
                      showToast('Dispositivo pareado com sucesso!');
                    } else {
                      showToast('Erro ao parear dispositivo.');
                    }
                  }}
                  onUpdateDevice={async (updatedDevice) => {
                    const success = await storageService.saveTv(updatedDevice);
                    if (success) {
                      setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
                      showToast('Dispositivo atualizado!');
                    } else {
                      showToast('Erro ao atualizar dispositivo.');
                    }
                  }}
                  onDeleteDevice={async (id) => {
                    const success = await storageService.deleteTv(id);
                    if (success) {
                      setDevices(prev => {
                        const nextDevices = prev.filter(d => d.id !== id);
                        // Dynamically update corresponding client's screens count
                        setClients(prevClients => prevClients.map(c => {
                          return { ...c, quantidadeTelas: nextDevices.filter(d => d.clienteId === c.id).length || 1 };
                        }));
                        return nextDevices;
                      });
                      showToast('Dispositivo despareado!');
                    } else {
                      showToast('Erro ao desparear dispositivo.');
                    }
                  }}
                />
              )}

              {activeTab === 'monitoring' && (
                <Monitoring 
                  clients={clients} 
                  devices={devices} 
                  playlists={playlists}
                  onOpenSimulator={(id) => {
                    setSelectedClientIdForSim(id);
                    setActiveTab('simulator');
                  }}
                  onUpdateDevices={handleUpdateDevices}
                  showToast={showToast}
                />
              )}

              {activeTab === 'tvs' && (
                <TVsManager 
                  clients={clients} 
                  devices={devices} 
                  playlists={playlists}
                  onUpdateDevices={handleUpdateDevices}
                  onOpenSimulator={(id) => {
                    setSelectedClientIdForSim(id);
                    setActiveTab('simulator');
                  }}
                  showToast={showToast}
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
