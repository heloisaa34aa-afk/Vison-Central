import React, { useState } from 'react';
import { Tv, Cliente, Playlist } from '../types';
import { tvsService } from '../services/supabase/tvs';
import { 
  Radio, 
  Search, 
  Tv as TvIcon, 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  Edit, 
  Play,
  X
} from 'lucide-react';

interface MonitoringProps {
  clients: Cliente[];
  devices: Tv[];
  playlists: Playlist[];
  onOpenSimulator: (clientId: string) => void;
  onUpdateDevices: (devices: Tv[]) => void;
  showToast: (msg: string) => void;
}

export default function Monitoring({ 
  clients, 
  devices, 
  playlists, 
  onOpenSimulator, 
  onUpdateDevices,
  showToast 
}: MonitoringProps) {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Tv | null>(null);
  const [editName, setEditName] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editPlaylistId, setEditPlaylistId] = useState('');

  // Filtrar e pesquisar
  const filteredDevices = devices.filter(d => {
    const matchesFilter = filter === 'all' ? true : filter === 'online' ? d.status === 'Online' : d.status === 'Offline';
    const matchesSearch = d.nome.toLowerCase().includes(search.toLowerCase()) || d.token.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.nome || 'Cliente Removido';
  };

  const getPlaylistName = (dev: Tv) => {
    if (dev.playlistId) {
      return playlists.find(p => p.id === dev.playlistId)?.nome || 'Nenhuma Playlist';
    }
    const client = clients.find(c => c.id === dev.clienteId);
    if (!client || !client.playlistId) return 'Nenhuma Playlist';
    return playlists.find(p => p.id === client.playlistId)?.nome || 'Nenhuma Playlist';
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showToast('Token copiado para a área de transferência!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Sincronizar Agora
  const handleSyncNow = async (device: Tv) => {
    try {
      const updated: Tv = {
        ...device,
        ultimaSincronizacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      const success = await tvsService.saveTv(updated);
      if (success) {
        onUpdateDevices(devices.map(d => d.id === device.id ? updated : d));
        showToast(`Comando de sincronização enviado para ${device.nome}!`);
      } else {
        showToast('Erro ao sincronizar no Supabase.');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro inesperado ao sincronizar.');
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (device: Tv) => {
    setEditingDevice(device);
    setEditName(device.nome);
    setEditClientId(device.clienteId);
    setEditPlaylistId(device.playlistId || '');
    setIsEditModalOpen(true);
  };

  // Handle Edit Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    if (!editName.trim()) {
      showToast('O nome é obrigatório.');
      return;
    }

    try {
      const updated: Tv = {
        ...editingDevice,
        nome: editName,
        clienteId: editClientId,
        playlistId: editPlaylistId || undefined,
        ultimaSincronizacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      const success = await tvsService.saveTv(updated);
      if (success) {
        onUpdateDevices(devices.map(d => d.id === editingDevice.id ? updated : d));
        showToast('TV atualizada com sucesso!');
        setIsEditModalOpen(false);
      } else {
        showToast('Erro ao salvar atualizações no Supabase.');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro inesperado ao editar TV.');
    }
  };

  return (
    <div className="space-y-6" id="monitoring-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
            <Radio className="w-6 h-6 text-blue-400 font-bold" />
            Monitoramento de TVs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Status em tempo real de todos os players da rede.
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
        
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome da TV ou token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
            />
          </div>
          
          {/* Status filters */}
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${filter === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              Online
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${filter === 'offline' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
            >
              Offline
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status Online</th>
                <th className="px-4 py-3">Tempo Ativo</th>
                <th className="px-4 py-3">Playlist</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDevices.map(device => (
                <tr key={device.id} className="hover:bg-white/5 transition-colors">
                  {/* Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        <TvIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{device.nome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {device.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {getClientName(device.clienteId)}
                  </td>

                  {/* Status Online */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                      {device.status}
                    </span>
                  </td>

                  {/* Última conexão */}
                  <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                    {device.status === 'Online' ? device.uptime || '24h 0m' : 'Inativo'}
                  </td>

                  {/* Playlist */}
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {getPlaylistName(device)}
                  </td>

                  {/* Token */}
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => handleCopyToken(device.token)}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono font-bold text-slate-300 transition-colors border border-white/5"
                    >
                      {device.token}
                      {copiedToken === device.token ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
                    </button>
                  </td>

                  {/* Action Buttons: Sincronizar, Editar, Copiar Token, Abrir Simulador */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Sincronizar */}
                      <button 
                        onClick={() => handleSyncNow(device)}
                        title="Sincronizar"
                        className="p-2 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors border border-white/5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Editar */}
                      <button 
                        onClick={() => handleOpenEdit(device)}
                        title="Editar"
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Copiar Token */}
                      <button 
                        onClick={() => handleCopyToken(device.token)}
                        title="Copiar Token"
                        className="p-2 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors border border-white/5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Abrir Simulador */}
                      <button 
                        onClick={() => onOpenSimulator(device.clienteId)}
                        title="Abrir Simulador"
                        className="p-2 bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-lg transition-colors border border-white/5"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm font-medium">
                    Nenhuma TV encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <TvIcon className="w-5 h-5 text-blue-400" />
              Editar TV
            </h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome da TV
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cliente
                </label>
                <select
                  value={editClientId}
                  onChange={(e) => setEditClientId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {clients.map(client => (
                    <option key={client.id} value={client.id} className="bg-[#0a0a0f]">
                      {client.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Playlist Inicial <span className="text-slate-500">(Opcional)</span>
                </label>
                <select
                  value={editPlaylistId}
                  onChange={(e) => setEditPlaylistId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Herdar do Cliente</option>
                  {playlists.map(pl => (
                    <option key={pl.id} value={pl.id} className="bg-[#0a0a0f]">
                      {pl.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg text-xs font-bold transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
