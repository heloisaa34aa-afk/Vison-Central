import React, { useState, useEffect } from 'react';
import { Client, Device, Playlist, Media, AlertLog } from './types';
import { 
  initialClients, 
  initialDevices, 
  initialPlaylists, 
  initialMedia, 
  initialAlerts 
} from './mockData';

// Icons
import { 
  LayoutDashboard, 
  Building2, 
  FolderHeart, 
  Tv, 
  Sparkles, 
  Radio, 
  RotateCcw, 
  CheckCircle,
  HelpCircle,
  Bell
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import ClientsManager from './components/ClientsManager';
import LibraryManager from './components/LibraryManager';
import ScreenSimulator from './components/ScreenSimulator';
import AIScheduler from './components/AIScheduler';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Outside triggers for simulator
  const [selectedClientIdForSim, setSelectedClientIdForSim] = useState<string | null>(null);

  // Persistence States
  const [clients, setClients] = useState<Client[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    const localClients = localStorage.getItem('vc_clients');
    const localDevices = localStorage.getItem('vc_devices');
    const localPlaylists = localStorage.getItem('vc_playlists');
    const localMedia = localStorage.getItem('vc_media');
    const localAlerts = localStorage.getItem('vc_alerts');

    if (localClients) setClients(JSON.parse(localClients));
    else setClients(initialClients);

    if (localDevices) setDevices(JSON.parse(localDevices));
    else setDevices(initialDevices);

    if (localPlaylists) setPlaylists(JSON.parse(localPlaylists));
    else setPlaylists(initialPlaylists);

    if (localMedia) setMedia(JSON.parse(localMedia));
    else setMedia(initialMedia);

    if (localAlerts) setAlerts(JSON.parse(localAlerts));
    else setAlerts(initialAlerts);
  }, []);

  // Save changes
  useEffect(() => {
    if (clients.length > 0) localStorage.setItem('vc_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    if (devices.length > 0) localStorage.setItem('vc_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    if (playlists.length > 0) localStorage.setItem('vc_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (media.length > 0) localStorage.setItem('vc_media', JSON.stringify(media));
  }, [media]);

  useEffect(() => {
    if (alerts.length > 0) localStorage.setItem('vc_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Toast notification helper
  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Reset helper
  const handleResetData = () => {
    if (window.confirm("Deseja realmente redefinir todos os dados para os originais de demonstração?")) {
      localStorage.removeItem('vc_clients');
      localStorage.removeItem('vc_devices');
      localStorage.removeItem('vc_playlists');
      localStorage.removeItem('vc_media');
      localStorage.removeItem('vc_alerts');
      
      setClients(initialClients);
      setDevices(initialDevices);
      setPlaylists(initialPlaylists);
      setMedia(initialMedia);
      setAlerts(initialAlerts);
      
      showToast("Dados redefinidos com sucesso!");
      setActiveTab('dashboard');
    }
  };

  // ----------------------------------------------------
  // CLIENT CRUDS
  // ----------------------------------------------------
  const handleAddClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    showToast(`Cliente "${newClient.name}" cadastrado!`);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    showToast(`Cadastro de "${updatedClient.name}" atualizado.`);
  };

  const handleDeleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    if (window.confirm(`Excluir o cliente "${target?.name || ''}"? Isso desassociará todas as TVs.`)) {
      setClients(prev => prev.filter(c => c.id !== id));
      setDevices(prev => prev.filter(d => d.clientId !== id));
      showToast("Cliente removido do cadastro.");
    }
  };

  const handleUpdateClientTicker = (clientId: string, text: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, tickerText: text } : c));
    showToast("Letreiro marquee atualizado na tela virtual!");
  };

  // ----------------------------------------------------
  // DEVICE CRUDS
  // ----------------------------------------------------
  const handleAddDevice = (newDevice: Device) => {
    setDevices(prev => [...prev, newDevice]);
    
    // Add info log
    const client = clients.find(c => c.id === newDevice.clientId);
    const newAlert: AlertLog = {
      id: `a-${Date.now()}`,
      clientId: newDevice.clientId,
      clientName: client?.name || 'Novo Cliente',
      message: `Novo reprodutor de sinalização "${newDevice.name}" pareado com sucesso. Código Token: ${newDevice.token}`,
      type: 'info',
      timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setAlerts(prev => [newAlert, ...prev]);

    showToast(`Player "${newDevice.name}" pareado com sucesso!`);
  };

  const handleUpdateDevice = (updatedDevice: Device) => {
    setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
    
    // If device status changes, register alert log to make interface dynamic
    const original = devices.find(d => d.id === updatedDevice.id);
    if (original && original.status !== updatedDevice.status) {
      const client = clients.find(c => c.id === updatedDevice.clientId);
      const newAlert: AlertLog = {
        id: `a-${Date.now()}`,
        clientId: updatedDevice.clientId,
        clientName: client?.name || 'Central',
        message: `Player "${updatedDevice.name}" mudou de status para: ${updatedDevice.status}.`,
        type: updatedDevice.status === 'Offline' ? 'error' : updatedDevice.status === 'Warning' ? 'warning' : 'info',
        timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setAlerts(prev => [newAlert, ...prev]);
    }
    
    showToast(`Status do Player "${updatedDevice.name}" alterado.`);
  };

  const handleDeleteDevice = (id: string) => {
    const target = devices.find(d => d.id === id);
    if (window.confirm(`Deseja desparear o dispositivo "${target?.name}"? Ele parará de transmitir imediatamente.`)) {
      setDevices(prev => prev.filter(d => d.id !== id));
      showToast("Player despareado com sucesso.");
    }
  };

  // ----------------------------------------------------
  // MEDIA & PLAYLIST CRUDS
  // ----------------------------------------------------
  const handleAddMedia = (newMedia: Media) => {
    setMedia(prev => [newMedia, ...prev]);
    showToast(`Arquivo "${newMedia.name}" adicionado.`);
  };

  const handleDeleteMedia = (id: string) => {
    onDeleteMedia(id);
  };

  const onDeleteMedia = (id: string) => {
    // Check if media is in any playlist
    const inUse = playlists.some(p => p.mediaIds.includes(id));
    if (isSelectedInPlaylist(id)) {
      if (!confirm("Esta mídia faz parte de uma playlist ativa! Deseja realmente excluí-la de todas as playlists?")) {
        return;
      }
      // Remove from playlists
      setPlaylists(prev => prev.map(p => ({
        ...p,
        mediaIds: p.mediaIds.filter(mid => mid !== id)
      })));
    }
    setMedia(prev => prev.filter(m => m.id !== id));
    showToast("Arquivo removido da biblioteca.");
  };

  function isSelectedInPlaylist(id: string) {
    return playlists.some(p => p.mediaIds.includes(id));
  }

  const handleAddPlaylist = (newPlaylist: Playlist) => {
    setPlaylists(prev => [newPlaylist, ...prev]);
    showToast(`Playlist "${newPlaylist.name}" criada com sucesso.`);
  };

  const handleDeletePlaylist = (id: string) => {
    const target = playlists.find(p => p.id === id);
    
    // Check if client uses it
    const activeClientsUsing = clients.filter(c => c.playlistId === id);
    if (activeClientsUsing.length > 0) {
      alert(`Erro: Esta playlist está sendo exibida ativamente por: ${activeClientsUsing.map(c => c.name).join(', ')}. Remova o vínculo do cliente antes de excluí-la!`);
      return;
    }

    if (window.confirm(`Excluir a playlist "${target?.name}"?`)) {
      setPlaylists(prev => prev.filter(p => p.id !== id));
      showToast("Playlist removida.");
    }
  };

  const handleSelectClientForSim = (clientId: string) => {
    setSelectedClientIdForSim(clientId);
    setActiveTab('simulator');
  };

  // ----------------------------------------------------
  // SIMULATION INTERVAL TICK
  // ----------------------------------------------------
  // Periodically updates randomly to demonstrate active sync and real-time operations!
  useEffect(() => {
    const syncTimer = setInterval(() => {
      if (devices.length === 0) return;
      
      // Randomly update lastSync of a random online device
      const onlineDevs = devices.filter(d => d.status === 'Online');
      if (onlineDevs.length === 0) return;
      
      const randomDev = onlineDevs[Math.floor(Math.random() * onlineDevs.length)];
      setDevices(prev => prev.map(d => d.id === randomDev.id ? {
        ...d,
        lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      } : d));
    }, 25000);

    return () => clearInterval(syncTimer);
  }, [devices]);

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
                Vision<span className="text-blue-400">Central</span> <span className="text-[10px] font-mono tracking-widest text-cyan-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Pro v2</span>
              </span>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gestão de TV Corporativa e Mural Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleResetData}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              title="Restaurar dados iniciais para testes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono font-medium hidden sm:inline">Servidor: Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Responsive Side Menu / Left Tab controllers */}
        <aside className="md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 md:border-r border-white/5 pr-0 md:pr-4">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedClientIdForSim(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Painel de Controle
          </button>

          <button
            onClick={() => { setActiveTab('clients'); setSelectedClientIdForSim(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'clients'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Clientes e Players
          </button>

          <button
            onClick={() => { setActiveTab('library'); setSelectedClientIdForSim(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FolderHeart className="w-4 h-4 shrink-0" />
            Biblioteca & Playlists
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            Simulador de TV
          </button>

          <button
            onClick={() => { setActiveTab('ai-helper'); setSelectedClientIdForSim(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'ai-helper'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            Copilot de Letreiros IA
          </button>

          {/* Quick instructions inside side panel for larger devices */}
          <div className="hidden md:block mt-8 bg-white/5 p-4 rounded-xl border border-white/10 text-[11px] text-slate-400 space-y-2 backdrop-blur-sm">
            <p className="font-bold text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              Como testar a plataforma?
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Cadastre uma mídia na <strong>Biblioteca</strong></li>
              <li>Monte uma <strong>Playlist</strong> com as mídias</li>
              <li>Vincule a playlist a um <strong>Cliente</strong></li>
              <li>Abra o <strong>Simulador de TV</strong> para assistir!</li>
            </ol>
          </div>
        </aside>

        {/* Dynamic Display area rendering active content */}
        <section className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard 
              clients={clients} 
              devices={devices} 
              alerts={alerts} 
              media={media} 
              onNavigate={setActiveTab}
              onSelectClientForSim={handleSelectClientForSim}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsManager 
              clients={clients} 
              devices={devices} 
              playlists={playlists}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onAddDevice={handleAddDevice}
              onUpdateDevice={handleUpdateDevice}
              onDeleteDevice={handleDeleteDevice}
            />
          )}

          {activeTab === 'library' && (
            <LibraryManager 
              media={media} 
              playlists={playlists} 
              onAddMedia={handleAddMedia}
              onDeleteMedia={handleDeleteMedia}
              onAddPlaylist={handleAddPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
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

          {activeTab === 'ai-helper' && (
            <AIScheduler 
              clients={clients} 
              onUpdateClientTicker={handleUpdateClientTicker}
            />
          )}
        </section>

      </main>

      {/* Corporate Foot note */}
      <footer className="bg-transparent border-t border-white/5 py-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono">
          <p>© 2026 VisionCentral Corporate TV. Todos os direitos reservados.</p>
          <p className="mt-1">Desenvolvido com arquitetura de Sinalização em Nuvem de ultra-baixa latência e performance imersiva.</p>
        </div>
      </footer>

    </div>
  );
}
