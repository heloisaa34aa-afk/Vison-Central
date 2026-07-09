import React from 'react';
import { Client, Device, Playlist } from '../../types';
import { Tv, Key, RefreshCw, Trash2, Edit } from 'lucide-react';

interface ClientTVsProps {
  client: Client;
  devices: Device[];
  playlists: Playlist[];
  onUpdateDevices: (updateFn: (prev: Device[]) => Device[]) => void;
  showToast: (msg: string) => void;
}

export default function ClientTVs({ client, devices, playlists, onUpdateDevices, showToast }: ClientTVsProps) {
  
  const handleGenerateNewToken = (deviceId: string) => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { ...d, token: newToken } : d));
    showToast('Novo token gerado!');
  };

  const handleSyncNow = (deviceId: string) => {
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { 
      ...d, 
      lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
    } : d));
    showToast('Comando de sincronização enviado.');
  };

  const handleDelete = (deviceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta TV?')) {
      onUpdateDevices(prev => prev.filter(d => d.id !== deviceId));
      showToast('TV excluída.');
    }
  };

  const getPlaylistName = (id?: string) => {
    if (!id) return 'Nenhuma';
    return playlists.find(p => p.id === id)?.name || 'Desconhecida';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">TVs Vinculadas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Playlist</th>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Última Sinc.</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {devices.map(device => (
              <tr key={device.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 text-sm font-semibold text-white">{device.name}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{getPlaylistName(client.playlistId)}</td>
                <td className="px-4 py-4 font-mono text-xs text-slate-400">{device.token}</td>
                <td className="px-4 py-4 text-xs text-slate-500">{device.lastSync || 'Nunca'}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleGenerateNewToken(device.id)} className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded transition-colors" title="Gerar Novo Token">
                      <Key className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleSyncNow(device.id)} className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded transition-colors" title="Sincronizar Agora">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(device.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors" title="Excluir TV">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Nenhuma TV vinculada a este cliente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
