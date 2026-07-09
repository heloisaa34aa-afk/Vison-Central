import React, { useState } from 'react';
import { Device, Client, Playlist } from '../types';
import { Radio, Search, Tv, RefreshCw, Copy, CheckCircle, Edit, Play } from 'lucide-react';

interface MonitoringProps {
  clients: Client[];
  devices: Device[];
  playlists: Playlist[];
  onOpenSimulator: (clientId: string) => void;
  onEditDevice: (device: Device) => void;
}

export default function Monitoring({ clients, devices, playlists, onOpenSimulator, onEditDevice }: MonitoringProps) {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const filteredDevices = devices.filter(d => {
    const matchesFilter = filter === 'all' ? true : filter === 'online' ? d.status === 'Online' : d.status === 'Offline';
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.token.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Removido';
  };

  const getPlaylistName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.playlistId) return 'Nenhuma Playlist';
    return playlists.find(p => p.id === client.playlistId)?.name || 'Nenhuma Playlist';
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSyncNow = (deviceId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (dev) {
      onEditDevice({
        ...dev,
        lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
            <Radio className="w-6 h-6 text-blue-400" />
            Monitoramento de TVs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Status em tempo real de todos os players da rede.
          </p>
        </div>
      </div>

      <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome da TV ou token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'all' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              Online
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'offline' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
            >
              Offline
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">TV</th>
                <th className="px-4 py-3">Cliente / Playlist</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Última Sinc.</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDevices.map(device => (
                <tr key={device.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{device.name}</div>
                        <div className="text-xs text-slate-500">Player ID: {device.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-300">{getClientName(device.clientId)}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">{getPlaylistName(device.clientId)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => handleCopyToken(device.token)}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono font-medium text-slate-300 transition-colors border border-white/5 hover:border-white/20"
                    >
                      {device.token}
                      {copiedToken === device.token ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                    {device.lastSync || 'Nunca'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleSyncNow(device.id)}
                        title="Sincronizar Agora"
                        className="p-2 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onOpenSimulator(device.clientId)}
                        title="Abrir Simulador"
                        className="p-2 bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-lg transition-colors border border-transparent hover:border-purple-500/30"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                    Nenhuma TV encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
