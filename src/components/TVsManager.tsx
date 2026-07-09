import React, { useState } from 'react';
import { Tv, Cliente, Playlist } from '../types';
import { tvsService } from '../services/supabase/tvs';
import { tokensService } from '../services/supabase/tokens';
import { 
  Tv as TvIcon, 
  Plus, 
  Search, 
  Copy, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Play, 
  Key, 
  X,
  Radio
} from 'lucide-react';

interface TVsManagerProps {
  clients: Cliente[];
  devices: Tv[];
  playlists: Playlist[];
  onUpdateDevices: (tvs: Tv[]) => void;
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
  const [editingDevice, setEditingDevice] = useState<Tv | null>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formPlaylistId, setFormPlaylistId] = useState('');

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Filtrar e pesquisar TVs
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.nome.toLowerCase().includes(search.toLowerCase()) || d.token.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.nome || 'Cliente Removido';
  };

  const getPlaylistName = (dev: Tv) => {
    if (dev.playlistId) {
      return playlists.find(p => p.id === dev.playlistId)?.nome || 'Nenhuma Playlist';
    }
    // Fallback para playlist do cliente
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

  // Abrir modal para nova TV
  const handleOpenCreateModal = () => {
    setEditingDevice(null);
    setFormName('');
    setFormClientId(clients[0]?.id || '');
    setFormPlaylistId('');
    setIsModalOpen(true);
  };

  // Abrir modal para editar TV existente
  const handleOpenEditModal = (device: Tv) => {
    setEditingDevice(device);
    setFormName(device.nome);
    setFormClientId(device.clienteId);
    setFormPlaylistId(device.playlistId || '');
    setIsModalOpen(true);
  };

  // Gerar token único no formato VC-XXXX-XX
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

  // Salvar (Criar ou Editar)
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
        // Fluxo de Edição
        const updated: Tv = {
          ...editingDevice,
          nome: formName,
          clienteId: formClientId,
          playlistId: formPlaylistId || undefined,
          ultimaSincronizacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        const success = await tvsService.saveTv(updated);
        if (success) {
          onUpdateDevices(devices.map(d => d.id === editingDevice.id ? updated : d));
          showToast('TV atualizada com sucesso!');
        } else {
          showToast('Erro ao atualizar TV no Supabase.');
        }
      } else {
        // Fluxo de Criação
        const generatedToken = await generateUniqueToken();
        const newTv: Tv = {
          id: 'd-' + Math.random().toString(36).substring(2, 9),
          clienteId: formClientId,
          nome: formName,
          status: 'Offline',
          uptime: '0h 0m',
          token: generatedToken,
          ultimaSincronizacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          playlistId: formPlaylistId || undefined
        };

        const success = await tvsService.saveTv(newTv);
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

  // Excluir TV
  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir esta TV?')) {
      try {
        const success = await tvsService.deleteTv(id);
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

  // Gerar novo token para TV existente
  const handleGenerateNewToken = async (device: Tv) => {
    if (window.confirm('Tem certeza que deseja gerar um novo token para esta TV? O player atual precisará ser reconectado.')) {
      try {
        const newToken = await generateUniqueToken();
        const updated: Tv = {
          ...device,
          token: newToken,
          ultimaSincronizacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        const success = await tvsService.saveTv(updated);
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
            <TvIcon className="w-6 h-6 text-blue-400" />
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
                <th className="px-4 py-3">Tempo Ativo</th>
                <th className="px-4 py-3">Última Sinc.</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Nenhuma TV cadastrada ou encontrada para "{search}".
                  </td>
                </tr>
              ) : (
                filteredDevices.map(dev => (
                  <tr key={dev.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-bold text-white">{dev.nome}</td>
                    <td className="px-4 py-4 text-slate-300 font-medium">{getClientName(dev.clienteId)}</td>
                    <td className="px-4 py-4 font-mono font-bold text-cyan-400 flex items-center gap-2">
                      <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs select-all">
                        {dev.token}
                      </span>
                      <button 
                        onClick={() => handleCopyToken(dev.token)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
                        title="Copiar Código"
                      >
                        {copiedToken === dev.token ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-full font-medium">
                        {getPlaylistName(dev)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        dev.status === 'Online' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : dev.status === 'Warning'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          dev.status === 'Online' ? 'bg-emerald-400' : dev.status === 'Warning' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        {dev.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 font-mono text-xs">{dev.uptime}</td>
                    <td className="px-4 py-4 text-slate-400 font-mono text-xs">{dev.ultimaSincronizacao || 'Nunca'}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleGenerateNewToken(dev)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                          title="Gerar Novo Token"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(dev)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                          title="Editar TV"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onOpenSimulator(dev.clienteId)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                          title="Iniciar Simulador"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(dev.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                          title="Excluir TV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0d0d12] rounded-2xl border border-white/10 shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 font-sans flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-400" />
              {editingDevice ? 'Editar Configurações da TV' : 'Cadastrar Nova TV / Mural'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Nome de Identificação da TV</label>
                <input
                  type="text"
                  placeholder="Ex: Recepção Entrada Principal"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050508] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Cliente Vinculado</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050508] border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Playlist Exclusiva (Opcional)</label>
                <select
                  value={formPlaylistId}
                  onChange={(e) => setFormPlaylistId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050508] border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Usar Playlist Padrão da Unidade Cliente</option>
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Se nenhuma playlist exclusiva for selecionada, o terminal reproduzirá a playlist ativa do cliente.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5 mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
                >
                  {editingDevice ? 'Salvar TV' : 'Ativar & Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
