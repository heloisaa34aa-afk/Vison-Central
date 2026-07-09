import React, { useState, useEffect } from 'react';
import { Client, Device, Playlist, Media } from './types';
import { 
  initialClients, 
  initialDevices, 
  initialPlaylists, 
  initialMedia 
} from './mockData';
import { storageService } from './lib/storage';

// Icons
import { 
  LayoutDashboard, 
  Tv, 
  Radio, 
  RotateCcw, 
  CheckCircle,
  Activity
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Monitoring from './components/Monitoring';
import ClientPage from './components/ClientPage';
import ScreenSimulator from './components/ScreenSimulator';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Outside triggers for simulator
  const [selectedClientIdForSim, setSelectedClientIdForSim] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Persistence States
  const [clients, setClients] = useState<Client[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      const loadedClients = await storageService.getClients(initialClients);
      const loadedDevices = await storageService.getDevices(initialDevices);
      const loadedPlaylists = await storageService.getPlaylists(initialPlaylists);
      const loadedMedia = await storageService.getMedia(initialMedia);

      setClients(loadedClients);
      setDevices(loadedDevices);
      setPlaylists(loadedPlaylists);
      setMedia(loadedMedia);
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save changes
  useEffect(() => {
    if (isLoaded) storageService.saveClients(clients);
  }, [clients, isLoaded]);

  useEffect(() => {
    if (isLoaded) storageService.saveDevices(devices);
  }, [devices, isLoaded]);

  useEffect(() => {
    if (isLoaded) storageService.savePlaylists(playlists);
  }, [playlists, isLoaded]);

  useEffect(() => {
    if (isLoaded) storageService.saveMedia(media);
  }, [media, isLoaded]);

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
      
      setClients(initialClients);
      setDevices(initialDevices);
      setPlaylists(initialPlaylists);
      setMedia(initialMedia);
      
      showToast("Dados redefinidos com sucesso!");
      setActiveTab('dashboard');
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('client');
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
            onClick={() => { setActiveTab('simulator'); setSelectedClientId(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4 shrink-0" />
            Simulador de TV
          </button>

        </aside>

        {/* Dynamic Display area rendering active content */}
        <section className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard 
              clients={clients} 
              devices={devices} 
              alerts={[]} 
              media={media} 
              onNavigate={setActiveTab}
              onSelectClientForSim={(id) => {
                setSelectedClientIdForSim(id);
                setActiveTab('simulator');
              }}
              onSelectClient={handleSelectClient}
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
              onEditDevice={(device) => {
                const updated = devices.map(d => d.id === device.id ? device : d);
                setDevices(updated);
              }}
            />
          )}

          {activeTab === 'client' && selectedClientId && (
            <ClientPage
              clientId={selectedClientId}
              clients={clients}
              devices={devices}
              playlists={playlists}
              media={media}
              onUpdateClient={(updated) => setClients(clients.map(c => c.id === updated.id ? updated : c))}
              onUpdateDevices={setDevices}
              onUpdatePlaylists={setPlaylists}
              onUpdateMedia={setMedia}
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
        </section>

      </main>

    </div>
  );
}
