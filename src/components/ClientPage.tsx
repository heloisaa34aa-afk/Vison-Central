import React, { useState } from 'react';
import { Cliente, Tv, Playlist, Midia } from '../types';
import { 
  Tv as TvIcon, 
  FolderHeart, 
  ListVideo, 
  Key, 
  Settings, 
  LayoutDashboard, 
  Building2, 
  MapPin, 
  Sparkles, 
  Clock, 
  CheckCircle,
  FileText,
  Compass
} from 'lucide-react';
import ClientTokens from './client/ClientTokens';
import ClientLibrary from './client/ClientLibrary';
import ClientPlaylists from './client/ClientPlaylists';

interface ClientPageProps {
  clientId: string;
  clients: Cliente[];
  devices: Tv[];
  playlists: Playlist[];
  media: Midia[];
  onUpdateClient: (client: Cliente) => void;
  onUpdateDevices: (devices: Tv[] | ((prev: Tv[]) => Tv[])) => void;
  onUpdatePlaylists: (playlists: Playlist[] | ((prev: Playlist[]) => Playlist[])) => void;
  onUpdateMedia: (media: Midia[] | ((prev: Midia[]) => Midia[])) => void;
  showToast: (msg: string) => void;
}

export default function ClientPage({
  clientId,
  clients,
  devices,
  playlists,
  media,
  onUpdateClient,
  onUpdateDevices,
  onUpdatePlaylists,
  onUpdateMedia,
  showToast
}: ClientPageProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'library' | 'playlists' | 'tokens' | 'settings'>('general');
  
  const client = clients.find(c => c.id === clientId);
  if (!client) return <div className="text-white p-4">Cliente não encontrado.</div>;

  const clientDevices = devices.filter(d => d.clienteId === clientId);
  const clientMedia = media.filter(m => m.clienteId === clientId); 
  const clientPlaylists = playlists.filter(p => p.clienteId === clientId);

  // Calculate stats for "Painel Geral"
  const totalScreens = clientDevices.length;
  const totalPlaylists = clientPlaylists.length;
  const totalMedia = clientMedia.length;
  
  // Find the latest synchronization timestamp
  const getLatestSync = () => {
    if (clientDevices.length === 0) return 'Nunca';
    const syncs = clientDevices
      .map(d => d.ultimaSincronizacao)
      .filter(Boolean);
    if (syncs.length === 0) return 'Nunca';
    
    // Sort descending by ISO or local string
    syncs.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const latest = syncs[0];
    try {
      const date = new Date(latest);
      if (isNaN(date.getTime())) return latest; // fallback to raw string if it's not a valid date
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return latest;
    }
  };

  const isAnyOnline = clientDevices.some(d => d.status === 'Online');
  const generalStatus = isAnyOnline ? 'Online' : 'Offline';

  // Client edit form state
  const [editNome, setEditNome] = useState(client.nome);
  const [editCategoria, setEditCategoria] = useState(client.categoria);
  const [editCidade, setEditCidade] = useState(client.cidade);
  const [editBairro, setEditBairro] = useState(client.bairro);
  const [editStatus, setEditStatus] = useState(client.status);
  const [editOrientacao, setEditOrientacao] = useState(client.orientacao);
  const [editFuso, setEditFuso] = useState(client.fusoHorario);
  const [editTicker, setEditTicker] = useState(client.textoTicker || '');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim() || !editBairro.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const updated: Cliente = {
      ...client,
      nome: editNome.trim(),
      categoria: editCategoria,
      cidade: editCidade,
      bairro: editBairro.trim(),
      status: editStatus,
      orientacao: editOrientacao,
      fusoHorario: editFuso,
      textoTicker: editTicker.trim() || undefined
    };

    onUpdateClient(updated);
    showToast('Configurações do cliente salvas no Supabase!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full font-semibold">
            {client.categoria} · {client.status}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2 font-sans">
            {client.nome}
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <TvIcon className="w-4 h-4 text-blue-500" /> {totalScreens} {totalScreens === 1 ? 'Mural / TV' : 'Murais / TVs'} Pareados
          </p>
        </div>
      </div>

      {/* Modern Compact Sub-navigation */}
      <div className="flex bg-[#0d0d12] border border-white/10 rounded-lg p-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'general', label: 'Painel Geral', icon: LayoutDashboard },
          { id: 'library', label: 'Biblioteca', icon: FolderHeart },
          { id: 'playlists', label: 'Playlists', icon: ListVideo },
          { id: 'tokens', label: 'Sistema de Tokens', icon: Key },
          { id: 'settings', label: 'Configurações', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab View Card Area */}
      <div className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl p-6">
        
        {/* Tab 1: Painel Geral (Metrics & Stats) */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-500" />
                Painel Geral do Cliente
              </h3>
              <p className="text-xs text-slate-400 mt-1">Resumo das atividades e terminais de exibição corporativa de {client.nome}.</p>
            </div>

            {/* Clean, high-contrast grid of metric stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Stat 1: Status Geral */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className={`p-3 rounded-lg border ${
                  generalStatus === 'Online' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Geral</p>
                  <p className="text-lg font-extrabold text-white">{generalStatus}</p>
                </div>
              </div>

              {/* Stat 2: Telas Ativas */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TvIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantidade de Telas</p>
                  <p className="text-lg font-extrabold text-white">{totalScreens}</p>
                </div>
              </div>

              {/* Stat 3: Playlists */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ListVideo className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Playlists Ativas</p>
                  <p className="text-lg font-extrabold text-white">{totalPlaylists}</p>
                </div>
              </div>

              {/* Stat 4: Mídias */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <FolderHeart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mídias em Acervo</p>
                  <p className="text-lg font-extrabold text-white">{totalMedia}</p>
                </div>
              </div>
            </div>

            {/* Synchronization Summary */}
            <div className="bg-[#050508]/60 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Última Sincronização Geral</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Último envio de novos conteúdos aos players da rede.</p>
                </div>
              </div>
              <div className="bg-[#09090e] border border-white/10 px-4 py-2.5 rounded-lg text-sm font-mono font-bold text-cyan-400">
                {getLatestSync()}
              </div>
            </div>

            {/* General Description Card */}
            <div className="border border-white/10 rounded-xl p-5 bg-gradient-to-r from-blue-600/5 to-transparent flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Pronto para Exibição</h4>
                <p className="text-xs text-slate-400">
                  Este terminal corporativo está configurado e operando no fuso horário <strong className="text-slate-300">{client.fusoHorario}</strong> com telas na orientação <strong className="text-slate-300">{client.orientacao}</strong>.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Biblioteca */}
        {activeTab === 'library' && (
          <ClientLibrary
            client={client}
            media={media} // Show global/filtered media correctly
            onUpdateMedia={onUpdateMedia as any}
            showToast={showToast}
          />
        )}

        {/* Tab 3: Playlists */}
        {activeTab === 'playlists' && (
          <ClientPlaylists
            client={client}
            playlists={playlists}
            media={media}
            onUpdatePlaylists={onUpdatePlaylists as any}
            showToast={showToast}
          />
        )}

        {/* Tab 4: Sistema de Tokens */}
        {activeTab === 'tokens' && (
          <ClientTokens
            client={client}
            devices={clientDevices}
            playlists={playlists}
            onUpdateDevices={onUpdateDevices as any}
            showToast={showToast}
          />
        )}

        {/* Tab 5: Configurações do Cliente */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Configurações Cadastrais do Cliente
                </h3>
                <p className="text-xs text-slate-400 mt-1">Altere informações cadastrais e preferências de exibição do cliente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Unidade / Estabelecimento</label>
                <input 
                  type="text" 
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Segmento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segmento / Categoria</label>
                <select
                  value={editCategoria}
                  onChange={(e) => setEditCategoria(e.target.value)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="Academia">Academia / Fitness</option>
                  <option value="Hospital/Saúde">Clínica ou Hospital</option>
                  <option value="Varejo/Shopping">Varejo e Supermercados</option>
                  <option value="Escritório">Escritório Corporativo</option>
                </select>
              </div>

              {/* Cidade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cidade / UF</label>
                <select
                  value={editCidade}
                  onChange={(e) => setEditCidade(e.target.value)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="São Paulo">São Paulo (SP)</option>
                  <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
                  <option value="Belo Horizonte">Belo Horizonte (MG)</option>
                  <option value="Curitiba">Curitiba (PR)</option>
                </select>
              </div>

              {/* Bairro */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bairro</label>
                <input 
                  type="text" 
                  value={editBairro}
                  onChange={(e) => setEditBairro(e.target.value)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Cadastral</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Orientação */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-400" /> Orientação de Tela
                </label>
                <select
                  value={editOrientacao}
                  onChange={(e) => setEditOrientacao(e.target.value as any)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="Horizontal">Horizontal (Paisagem)</option>
                  <option value="Vertical">Vertical (Retrato)</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuso Horário (Timezone)</label>
                <select
                  value={editFuso}
                  onChange={(e) => setEditFuso(e.target.value)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="America/Sao_Paulo">Brasília / São Paulo (GMT-3)</option>
                  <option value="America/Manaus">Manaus / Amazonas (GMT-4)</option>
                  <option value="America/Fortaleza">Fortaleza / Nordeste (GMT-3)</option>
                  <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                </select>
              </div>

              {/* Ticker / Letreiro */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Texto Letreiro / Marquee (Ticker Rodapé)
                </label>
                <input 
                  type="text" 
                  value={editTicker}
                  onChange={(e) => setEditTicker(e.target.value)}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Mensagens que passam rolando no rodapé do player..."
                />
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-sm font-bold shadow-md transition-all uppercase tracking-wider"
              >
                Salvar Configurações
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
