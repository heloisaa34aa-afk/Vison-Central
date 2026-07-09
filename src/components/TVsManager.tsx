import React, { useState } from 'react';
import { Device, Client, Playlist } from '../types';
import { tvsService } from '../services/supabase/tvs';
import { tokensService } from '../services/supabase/tokens';
import { checkSupabaseConnection } from '../lib/supabase';
import { 
  Tv, 
  Plus, 
  Search, 
  Copy, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Play, 
  Key, 
  X,
  Radio,
  FileVideo
} from 'lucide-react';

interface TVsManagerProps {
  clients: Client[];
  devices: Device[];
  playlists: Playlist[];
  onUpdateDevices: (devices: Device[]) => void;
  onOpenSimulator: (clientId: string) => void;
  showToast: (msg: string) => void;
}

export default function TVsManager({ 
  clients, 
  devices, 
  playlists, 
  onUpdateDevices, 
  onOpenSimulator,
  showToast 
}: TVsManagerProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formPlaylistId, setFormPlaylistId] = useState('');

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Filter & Search TVs
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.token.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Removido';
  };

  const getPlaylistName = (dev: Device) => {
    if (dev.playlistId) {
      return playlists.find(p => p.id === dev.playlistId)?.name || 'Nenhuma Playlist';
    }
    // Fallback to client's playlist
    const client = clients.find(c => c.id === dev.clientId);
    if (!client || !client.playlistId) return 'Nenhuma Playlist';
    return playlists.find(p => p.id === client.playlistId)?.name || 'Nenhuma Playlist';
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showToast('Token copiado para a área de transferência!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Open modal for creating new TV
  const handleOpenCreateModal = () => {
    setEditingDevice(null);
    setFormName('');
    setFormClientId(clients[0]?.id || '');
    setFormPlaylistId('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing TV
  const handleOpenEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormName(device.name);
    setFormClientId(device.clientId);
    setFormPlaylistId(device.playlistId || '');
    setIsModalOpen(true);
  };

  // Generate an absolutely unique token in the format VC-XXXX-XX
  const generateUniqueToken = async (): Promise<string> => {
    let attempts = 0;
    while (attempts < 100) {
      const candidate = tokensService.generateToken();
      const normCandidate = tokensService.normalizeToken(candidate);
      const isDuplicate = devices.some(d => tokensService.normalizeToken(d.token) === normCandidate);
      if (!isDuplicate) {
        return candidate;
      }
      attempts++;
    }
    return tokensService.generateToken();
  };

  // Save (Create or Edit) Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('O nome da TV é obrigatório.');
      return;
    }
    if (!formClientId) {
      showToast('Por favor, selecione um cliente.');
      return;
    }

    try {
      if (editingDevice) {
        // Edit flow
        const updated: Device = {
          ...editingDevice,
          name: formName,
          clientId: formClientId,
          playlistId: formPlaylistId || undefined,
          lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        const success = await tvsService.saveDevice(updated);
        if (success) {
          onUpdateDevices(devices.map(d => d.id === editingDevice.id ? updated : d));
          showToast('TV atualizada com sucesso!');
        } else {
          showToast('Erro ao atualizar TV no Supabase.');
        }
      } else {
        // Create flow
        const generatedToken = await generateUniqueToken();
        const newTv: Device = {
          id: 'd-' + Math.random().toString(36).substring(2, 9),
          clientId: formClientId,
          name: formName,
          status: 'Offline',
          uptime: '0h 0m',
          token: generatedToken,
          lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          playlistId: formPlaylistId || undefined
        };

        const success = await tvsService.saveDevice(newTv);
        if (success) {
          onUpdateDevices([...devices, newTv]);
          showToast('Nova TV cadastrada com sucesso!');
        } else {
          showToast('Erro ao salvar TV no Supabase.');
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erro inesperado ao salvar TV.');
    }
  };

  // Delete TV Handler
  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir esta TV?')) {
      try {
        const success = await tvsService.deleteDevice(id);
        if (success) {
          onUpdateDevices(devices.filter(d => d.id !== id));
          showToast('TV excluída com sucesso!');
        } else {
          showToast('Erro ao excluir TV do Supabase.');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro inesperado ao excluir TV.');
      }
    }
  };

  // Generate new token for existing TV
  const handleGenerateNewToken = async (device: Device) => {
    if (window.confirm('Tem certeza que deseja gerar um novo token para esta TV? O player atual precisará ser reconectado.')) {
      try {
        const newToken = await generateUniqueToken();
        const updated: Device = {
          ...device,
          token: newToken,
          lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        const success = await tvsService.saveDevice(updated);
        if (success) {
          onUpdateDevices(devices.map(d => d.id === device.id ? updated : d));
          showToast('Novo token gerado e salvo!');
        } else {
          showToast('Erro ao salvar novo token no Supabase.');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro inesperado ao gerar novo token.');
      }
    }
  };

  return (
    <div className="space-y-6" id="tvs-manager-root">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
            <Tv className="w-6 h-6 text-blue-400" />
            Gerenciamento de TVs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre, edite e acompanhe os códigos de ativação dos players.
          </p>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all transform hover:-translate-y-0.5"
          id="btn-nova-tv"
        >
          <Plus className="w-4 h-4" />
          Nova TV
        </button>
      </div>

      {/* Main Table Card container */}
      <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
        {/* Search controls */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da TV ou token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
          />
        </div>

        {/* TV Grid/Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Playlist</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Última Conexão</th>
                <th className="px-4 py-3">Última Sinc.</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDevices.map(device => (
                <tr key={device.id} className="hover:bg-white/5 transition-colors">
                  {/* Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        <Tv className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-white">{device.name}</span>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {getClientName(device.clientId)}
                  </td>

                  {/* Token */}
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => handleCopyToken(device.token)}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono font-bold text-slate-300 transition-colors border border-white/5"
                    >
                      {device.token}
                      {copiedToken === device.token ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                      )}
                    </button>
                  </td>

                  {/* Playlist */}
                  <td className="px-4 py-4 text-sm text-slate-300 max-w-[150px] truncate">
                    {getPlaylistName(device)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      device.status === 'Online' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {device.status}
                    </span>
                  </td>

                  {/* Uptime (Última Conexão) */}
                  <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                    {device.status === 'Online' ? device.uptime || '24h 0m' : 'Inativo'}
                  </td>

                  {/* Last Sync */}
                  <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                    {device.lastSync || 'Nunca'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Edit */}
                      <button 
                        onClick={() => handleOpenEditModal(device)}
                        title="Editar"
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* New Token */}
                      <button 
                        onClick={() => handleGenerateNewToken(device)}
                        title="Gerar Novo Token"
                        className="p-2 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors border border-white/5"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      {/* Open Simulator */}
                      <button 
                        onClick={() => onOpenSimulator(device.clientId)}
                        title="Abrir Simulador"
                        className="p-2 bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-lg transition-colors border border-white/5"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button 
                        onClick={() => handleDelete(device.id)}
                        title="Excluir"
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors border border-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm font-medium">
                    Nenhuma TV encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Tv className="w-5 h-5 text-blue-400" />
              {editingDevice ? 'Editar TV' : 'Nova TV'}
            </h2>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome da TV
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="EX: TV Recepção"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cliente
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {clients.map(client => (
                    <option key={client.id} value={client.id} className="bg-[#0a0a0f]">
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Playlist Inicial <span className="text-slate-500">(Opcional)</span>
                </label>
                <select
                  value={formPlaylistId}
                  onChange={(e) => setFormPlaylistId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="" className="bg-[#0a0a0f]">Herdar do Cliente</option>
                  {playlists.map(pl => (
                    <option key={pl.id} value={pl.id} className="bg-[#0a0a0f]">
                      {pl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Token visual notice (only for Create) */}
              {!editingDevice && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-start gap-2.5">
                  <Key className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    O token exclusivo de ativação será gerado automaticamente no formato padrão <strong className="text-white">VC-XXXX-XX</strong> e gravado com segurança.
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
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
