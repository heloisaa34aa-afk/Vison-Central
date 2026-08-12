import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  TvIcon, 
  LayoutDashboard, 
  Building2, 
  FileText,
  Rss,
  Bell
} from 'lucide-react';
import { Cliente, Tv, Playlist, Midia } from './types';
import { storageService } from './lib/storage';
import { supabase } from './lib/supabase';
import { mapDbToTv } from './services/supabase/tvs';
import { mapDbToCliente } from './services/supabase/clientes';

// Lazy loading components
const Dashboard = lazy(() => import('./components/Dashboard.tsx'));
const ClientsManager = lazy(() => import('./components/ClientsManager.tsx'));
const ClientPage = lazy(() => import('./components/ClientPage.tsx'));
const ScreenSimulator = lazy(() => import('./components/ScreenSimulator.tsx'));
const RelatorioReproducao = lazy(() => import('./components/RelatorioReproducao.tsx'));
const FeedSourcesManager = lazy(() => import('./components/FeedSourcesManager.tsx'));
const AlertsManager = lazy(() => import('./components/AlertsManager.tsx'));

const Loader = () => (
  <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4 w-full h-full">
    <span className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-white/10 animate-spin" />
    <p className="text-sm font-medium">Carregando...</p>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'client' | 'simulator' | 'relatorios' | 'feed_sources' | 'alertas'>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientIdForSim, setSelectedClientIdForSim] = useState<string | null>(null);

  const [clients, setClients] = useState<Cliente[]>([]);
  const [devices, setDevices] = useState<Tv[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [media, setMedia] = useState<Midia[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const withTimeout = <T,>(promise: Promise<T>, ms: number = 15000): Promise<T> => {
          let timer: NodeJS.Timeout;
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => {
              timer = setTimeout(() => reject(new Error('Timeout na consulta')), ms);
            })
          ]).finally(() => clearTimeout(timer));
        };

        const results = await Promise.allSettled([
          withTimeout(storageService.getClientes()),
          withTimeout(storageService.getTvs()),
          withTimeout(storageService.getPlaylists()),
          withTimeout(storageService.getMidias())
        ]);

        if (isMounted) {
          setClients(results[0].status === 'fulfilled' ? results[0].value || [] : []);
          setDevices(results[1].status === 'fulfilled' ? results[1].value || [] : []);
          setPlaylists(results[2].status === 'fulfilled' ? results[2].value || [] : []);
          setMedia(results[3].status === 'fulfilled' ? results[3].value || [] : []);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        if (isMounted) setIsLoaded(true); // Release UI even on error
      }
    };

    fetchInitialData();

    // Single global realtime connection
    const channel = supabase.channel('global-app-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tvs' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'UPDATE') {
            const updatedTv = mapDbToTv(payload.new);
            setDevices(prev => prev.map(tv => tv.id === updatedTv.id ? updatedTv : tv));
          } else if (payload.eventType === 'INSERT') {
            const newTv = mapDbToTv(payload.new);
            setDevices(prev => prev.some(tv => tv.id === newTv.id)
              ? prev.map(tv => tv.id === newTv.id ? newTv : tv)
              : [...prev, newTv]);
          } else if (payload.eventType === 'DELETE') {
            const oldTv = payload.old as Tv;
            setDevices(prev => prev.filter(tv => tv.id !== oldTv.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'UPDATE') {
            const updatedClient = mapDbToCliente(payload.new);
            setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
          } else if (payload.eventType === 'INSERT') {
            const newClient = mapDbToCliente(payload.new);
            setClients(prev => prev.some(client => client.id === newClient.id)
              ? prev.map(client => client.id === newClient.id ? newClient : client)
              : [...prev, newClient]);
          } else if (payload.eventType === 'DELETE') {
            const oldClient = payload.old as Cliente;
            setClients(prev => prev.filter(c => c.id !== oldClient.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectClient = (id: string, view: 'edit' | 'simulator' = 'edit') => {
    if (view === 'edit') {
      setSelectedClientId(id);
      setActiveTab('client');
    } else {
      setSelectedClientIdForSim(id);
      setActiveTab('simulator');
    }
  };

  const handleUpdateClient = (id: string, partial: Partial<Cliente>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...partial } : c));
  };
  const handleUpdateDevices = (id: string, partial: Partial<Tv>) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...partial } : d));
  };
  const handleUpdatePlaylists = (id: string, partial: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(p => p.id === id ? { ...p, ...partial } : p));
  };
  const handleUpdateMedia = (id: string, partial: Partial<Midia>) => {
    setMedia(prev => prev.map(m => m.id === id ? { ...m, ...partial } : m));
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col relative overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg backdrop-blur text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at top, black, transparent 70%)'
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TvIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Vision Central</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gestão de TV Corporativa e Mural Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono font-medium">Conectado</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Responsive Side Menu / Left Tab controllers */}
        <aside className="md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 md:border-r border-white/5 pr-0 md:pr-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
            { id: 'clients', icon: Building2, label: 'Clientes' },
            { id: 'simulator', icon: TvIcon, label: 'Configuração de TV' },
            { id: 'relatorios', icon: FileText, label: 'Relatórios' },
            { id: 'feed_sources', icon: Rss, label: 'Fontes de Feed' },
            { id: 'alertas', icon: Bell, label: 'Alertas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { 
                setActiveTab(tab.id as any); 
                setSelectedClientIdForSim(null); 
                setSelectedClientId(null); 
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Dynamic Display area rendering active content */}
        <section className="flex-1 min-w-0">
          {!isLoaded ? (
            <Loader />
          ) : (
            <Suspense fallback={<Loader />}>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  clientes={clients} 
                  tvs={devices} 
                  onNavigate={(tab) => setActiveTab(tab as any)}
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
                      setClients(prev => prev.some(client => client.id === newClient.id)
                        ? prev.map(client => client.id === newClient.id ? newClient : client)
                        : [...prev, newClient]);
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
                  onUpdateClient={(client) => setClients(prev => prev.map(c => c.id === client.id ? client : c))}
                  onUpdateDevices={setDevices}
                  onUpdatePlaylists={setPlaylists}
                  onUpdateMedia={setMedia}
                  showToast={showToast}
                />
              )}
              {activeTab === 'simulator' && (
                <ScreenSimulator 
                  clients={clients}
                  devices={devices}
                  playlists={playlists} 
                  media={media}
                  selectedClientIdFromOutside={selectedClientIdForSim}
                />
              )}
              {activeTab === 'relatorios' && (
                <RelatorioReproducao />
              )}
              {activeTab === 'feed_sources' && (
                <FeedSourcesManager />
              )}
              {activeTab === 'alertas' && (
                <AlertsManager tvs={devices} clientes={clients} />
              )}
            </Suspense>
          )}
        </section>
      </main>
    </div>
  );
}
