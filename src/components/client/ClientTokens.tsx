import React, { useState } from 'react';
import { Client, Device, Playlist } from '../../types';
import { Key, Copy, CheckCircle, Plus, RefreshCw, Unplug } from 'lucide-react';

interface ClientTokensProps {
  client: Client;
  devices: Device[];
  playlists: Playlist[];
  onUpdateDevices: (updateFn: (prev: Device[]) => Device[]) => void;
  showToast: (msg: string) => void;
}

export default function ClientTokens({ client, devices, playlists, onUpdateDevices, showToast }: ClientTokensProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRenewToken = (deviceId: string) => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { ...d, token: newToken } : d));
    showToast('Token renovado com sucesso.');
  };

  const handleDisconnect = (deviceId: string) => {
    if (confirm('Deseja desconectar esta TV? Ela precisará de um novo token para voltar a exibir conteúdo.')) {
      onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'Offline' } : d));
      showToast('TV desconectada.');
    }
  };

  const handleSyncNow = (deviceId: string) => {
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { 
      ...d, 
      lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
    } : d));
    showToast('Comando de sincronização enviado.');
  };

  const handleAddTV = () => {
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      clientId: client.id,
      name: `Nova TV ${devices.length + 1}`,
      status: 'Offline',
      token: newToken,
      lastSync: '',
      uptime: '0h 0m'
    };
    onUpdateDevices(prev => [...prev, newDevice]);
    showToast('Nova TV adicionada. Utilize o token gerado para pareamento.');
  };

  const getPlaylistName = (id?: string) => {
    if (!id) return 'Nenhuma';
    return playlists.find(p => p.id === id)?.name || 'Desconhecida';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Sistema de Tokens</h3>
        <button 
          onClick={handleAddTV}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-sm font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nova TV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <div key={device.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">{device.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Playlist: {getPlaylistName(client.playlistId)}</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            </div>

            <div className="bg-[#050508]/60 border border-white/5 rounded-lg p-3 flex justify-between items-center mb-4">
              <span className="font-mono text-lg font-bold text-cyan-400 tracking-widest">{device.token}</span>
              <button 
                onClick={() => handleCopy(device.token)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
                title="Copiar Token"
              >
                {copiedToken === device.token ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2 justify-between">
              <button 
                onClick={() => handleRenewToken(device.id)}
                className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 text-[10px] font-bold uppercase rounded border border-transparent hover:border-blue-500/30 transition-colors"
              >
                Renovar
              </button>
              <button 
                onClick={() => handleSyncNow(device.id)}
                className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 text-[10px] font-bold uppercase rounded border border-transparent hover:border-purple-500/30 transition-colors"
              >
                Sincronizar
              </button>
              <button 
                onClick={() => handleDisconnect(device.id)}
                className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-[10px] font-bold uppercase rounded border border-transparent hover:border-rose-500/30 transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 text-sm">
            Nenhum token/TV ativo.
          </div>
        )}
      </div>
    </div>
  );
}
