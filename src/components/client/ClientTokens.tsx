import React, { useState } from 'react';
import { Cliente, Tv, Playlist } from '../../types';
import { 
  Copy, 
  Check, 
  Plus, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Trash2, 
  Edit2, 
  CheckSquare, 
  Tv as TvIcon,
  PlaySquare
} from 'lucide-react';
import { tokensService } from '../../services/supabase/tokens';
import { isTvOnline } from '../../utils/tvStatus';

interface ClientTokensProps {
  client: Cliente;
  devices: Tv[];
  playlists: Playlist[];
  onUpdateDevices: (updateFn: (prev: Tv[]) => Tv[]) => void;
  showToast: (msg: string) => void;
}

export default function ClientTokens({ 
  client, 
  devices, 
  playlists, 
  onUpdateDevices, 
  showToast 
}: ClientTokensProps) {
  
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [editingTvId, setEditingTvId] = useState<string | null>(null);
  const [editTvName, setEditTvName] = useState('');

  // 1. Copy Token to clipboard
  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    showToast('Token copiado!');
  };

  // 2. Generate new unique token (Renew Token) and immediately invalidate the old player
  const handleRenewToken = (deviceId: string) => {
    if (confirm('Deseja gerar um novo Token para esta tela? O player conectado com o token anterior será desconectado imediatamente.')) {
      const newToken = tokensService.generateToken();
      onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { 
        ...d, 
        token: newToken,
        status: 'Offline', // reset status to force new pairing
        uptime: '0h 0m'
      } : d));
      showToast('Novo token gerado. Player anterior desconectado.');
    }
  };

  // 3. Disconnect player
  const handleDisconnect = (deviceId: string) => {
    if (confirm('Deseja desconectar este player? Ele será colocado em repouso Offline.')) {
      onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { 
        ...d, 
        status: 'Offline',
        uptime: '0h 0m'
      } : d));
      showToast('Player desconectado.');
    }
  };

  // 4. Force synchronization
  const handleSyncNow = (deviceId: string) => {
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { 
      ...d, 
      ultimaSincronizacao: new Date().toISOString() 
    } : d));
    showToast('Comando de sincronização enviado.');
  };

  // 5. Delete TV completely
  const handleDeleteTV = (deviceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta TV permanentemente? Todos os logs e pareamentos associados serão deletados.')) {
      onUpdateDevices(prev => prev.filter(d => d.id !== deviceId));
      showToast('TV excluída com sucesso.');
    }
  };

  // 6. Add a new TV
  const handleAddTV = () => {
    const newToken = tokensService.generateToken();
    const newDevice: Tv = {
      id: `dev-${Date.now()}`,
      clienteId: client.id,
      nome: `Mural Digital ${devices.length + 1}`,
      status: 'Offline',
      token: newToken,
      ultimaSincronizacao: new Date().toISOString(),
      uptime: '0h 0m',
      ultimaConexao: new Date().toISOString()
    };
    onUpdateDevices(prev => [...prev, newDevice]);
    showToast('Nova TV adicionada. Use o token para pareamento!');
  };

  // 7. Update TV Name
  const handleStartEditName = (tv: Tv) => {
    setEditingTvId(tv.id);
    setEditTvName(tv.nome);
  };

  const handleSaveTvName = (deviceId: string) => {
    if (!editTvName.trim()) return;
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { ...d, nome: editTvName.trim() } : d));
    setEditingTvId(null);
    showToast('Nome da TV atualizado.');
  };

  // 8. Update TV specific Playlist selection
  const handlePlaylistChange = (deviceId: string, playlistId: string) => {
    onUpdateDevices(prev => prev.map(d => d.id === deviceId ? { 
      ...d, 
      playlistId: playlistId || undefined 
    } : d));
    showToast('Playlist da TV atualizada.');
  };

  const getPlaylistName = (id?: string) => {
    if (!id) return 'Herdar do Cliente';
    return playlists.find(p => p.id === id)?.nome || 'Herdar do Cliente';
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TvIcon className="w-5 h-5 text-blue-500" />
            Sistema de Tokens de Acesso
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gere, gerencie e sincronize os terminais de transmissão de mídia para este cliente.
          </p>
        </div>
        <button 
          onClick={handleAddTV}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-sm font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova TV / Terminal
        </button>
      </div>

      {/* Grid of paired TVs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div 
            key={device.id} 
            className="bg-[#050508]/60 border border-white/10 rounded-xl p-5 hover:border-blue-500/20 transition-all flex flex-col justify-between"
          >
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                {editingTvId === device.id ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input 
                      type="text"
                      value={editTvName}
                      onChange={(e) => setEditTvName(e.target.value)}
                      className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-full"
                    />
                    <button 
                      onClick={() => handleSaveTvName(device.id)}
                      className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shrink-0"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h4 className="text-sm font-bold text-white tracking-tight truncate">{device.nome}</h4>
                    <button 
                      onClick={() => handleStartEditName(device)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-all"
                      title="Editar Nome"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {/* Status indicator */}
                {(() => {
                  const isOnline = isTvOnline(device);
                  return (
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                        : 'bg-white/5 text-slate-500 border border-white/5'
                    }`}>
                      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  );
                })()}
              </div>

              {/* Playlist binding selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <PlaySquare className="w-3 h-3 text-cyan-400" /> Playlist Atribuída
                </label>
                <select
                  value={device.playlistId || ''}
                  onChange={(e) => handlePlaylistChange(device.id, e.target.value)}
                  className="w-full bg-[#09090e] border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Herdar do Cliente ({getPlaylistName(client.playlistId)})</option>
                  {playlists.filter(p => p.clienteId === client.id).map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Token code panel */}
              <div className="bg-[#050508]/80 border border-white/5 rounded-lg p-3 flex justify-between items-center my-3 shadow-inner">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Token de Transmissão</span>
                  <span className="font-mono text-xl font-extrabold text-cyan-400 tracking-widest">{device.token}</span>
                </div>
                <button 
                  onClick={() => handleCopy(device.token)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/10"
                  title="Copiar Token"
                >
                  {copiedToken === device.token ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action controls buttons - Standardized & uniform size/layout */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleRenewToken(device.id)}
                  className="px-2 py-1.5 bg-white/5 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 text-[10px] font-extrabold uppercase rounded-lg border border-white/10 hover:border-blue-500/30 transition-all flex items-center justify-center gap-1"
                  title="Novo Token"
                >
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  Novo Token
                </button>
                <button 
                  onClick={() => handleSyncNow(device.id)}
                  className="px-2 py-1.5 bg-white/5 hover:bg-cyan-600/20 text-slate-300 hover:text-cyan-400 text-[10px] font-extrabold uppercase rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-1"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3 h-3 shrink-0 animate-spin-slow" />
                  Sincronizar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleDisconnect(device.id)}
                  className="px-2 py-1.5 bg-white/5 hover:bg-amber-600/20 text-slate-300 hover:text-amber-400 text-[10px] font-extrabold uppercase rounded-lg border border-white/10 hover:border-amber-500/30 transition-all flex items-center justify-center gap-1"
                  title="Desconectar"
                >
                  <WifiOff className="w-3 h-3 shrink-0" />
                  Desconectar
                </button>
                <button 
                  onClick={() => handleDeleteTV(device.id)}
                  className="px-2 py-1.5 bg-white/5 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 text-[10px] font-extrabold uppercase rounded-lg border border-white/10 hover:border-rose-500/30 transition-all flex items-center justify-center gap-1"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  Excluir
                </button>
              </div>
            </div>

          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl bg-white/5">
            <TvIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Nenhum terminal pareado</p>
            <p className="text-xs text-slate-500 mt-1">Clique no botão acima para adicionar uma nova TV e gerar seu token de pareamento.</p>
          </div>
        )}
      </div>

    </div>
  );
}
