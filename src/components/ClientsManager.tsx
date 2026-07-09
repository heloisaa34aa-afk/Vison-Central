import React, { useState } from 'react';
import { Cliente, Tv, Playlist } from '../types';
import { tokensService } from '../services/supabase/tokens';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Tv as TvIcon, 
  Laptop, 
  Search, 
  Edit3, 
  Check, 
  X, 
  Layout,
  MessageSquareQuote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsManagerProps {
  clients: Cliente[];
  devices: Tv[];
  playlists: Playlist[];
  onAddClient: (cliente: Cliente) => void;
  onUpdateClient: (cliente: Cliente) => void;
  onDeleteClient: (id: string) => void;
  onAddDevice: (tv: Tv) => void;
  onUpdateDevice: (tv: Tv) => void;
  onDeleteDevice: (id: string) => void;
}

export default function ClientsManager({
  clients,
  devices,
  playlists,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice
}: ClientsManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  
  // Novo Cliente Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCategory, setNewClientCategory] = useState('Academia');
  const [newClientCity, setNewClientCity] = useState('São Paulo');
  const [newClientNeighborhood, setNewClientNeighborhood] = useState('');
  const [newClientOrientation, setNewClientOrientation] = useState<'Horizontal' | 'Vertical'>('Horizontal');
  const [newClientScreens, setNewClientScreens] = useState(1);
  const [newClientPlaylist, setNewClientPlaylist] = useState('');
  const [newClientTicker, setNewClientTicker] = useState('Bem-vindo à nossa rede corporativa de notícias.');

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editOrientation, setEditOrientation] = useState<'Horizontal' | 'Vertical'>('Horizontal');
  const [editScreens, setEditScreens] = useState(1);
  const [editPlaylist, setEditPlaylist] = useState('');
  const [editTicker, setEditTicker] = useState('');

  // Device section state
  const [expandedClientId, setEditingClientDevicesId] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');

  // Filter clients
  const categories = ['Todas', ...Array.from(new Set(clients.map(c => c.categoria)))];
  
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || c.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartEdit = (client: Cliente) => {
    setEditingClientId(client.id);
    setEditName(client.nome);
    setEditCategory(client.categoria);
    setEditCity(client.cidade);
    setEditNeighborhood(client.bairro);
    setEditOrientation(client.orientacao);
    setEditScreens(client.quantidadeTelas);
    setEditPlaylist(client.playlistId || '');
    setEditTicker(client.textoTicker || '');
  };

  const handleSaveEdit = (id: string) => {
    const original = clients.find(c => c.id === id);
    if (!original) return;

    onUpdateClient({
      ...original,
      nome: editName,
      categoria: editCategory,
      cidade: editCity,
      bairro: editNeighborhood,
      orientacao: editOrientation,
      quantidadeTelas: Number(editScreens),
      playlistId: editPlaylist || undefined,
      textoTicker: editTicker
    });
    setEditingClientId(null);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientNeighborhood.trim()) return;

    const iconMapping: { [key: string]: 'dumbbell' | 'hospital' | 'shopping' | 'briefcase' | 'store' } = {
      'Academia': 'dumbbell',
      'Hospital/Saúde': 'hospital',
      'Varejo/Shopping': 'shopping',
      'Escritório': 'briefcase'
    };

    const newClient: Cliente = {
      id: `c-${Date.now()}`,
      nome: newClientName,
      categoria: newClientCategory,
      status: 'Ativo',
      quantidadeTelas: Number(newClientScreens),
      cidade: newClientCity,
      bairro: newClientNeighborhood,
      tipoIcone: iconMapping[newClientCategory] || 'store',
      orientacao: newClientOrientation,
      fusoHorario: 'America/Sao_Paulo',
      playlistId: newClientPlaylist || undefined,
      textoTicker: newClientTicker
    };

    onAddClient(newClient);
    
    // Reset Form
    setNewClientName('');
    setNewClientNeighborhood('');
    setNewClientPlaylist('');
    setNewClientScreens(1);
    setNewClientTicker('Bem-vindo à nossa rede corporativa de notícias.');
    setShowAddForm(false);
  };

  const handleCreateDevice = (clientId: string) => {
    if (!newDeviceName.trim()) return;

    // Generate clean unique token via tokensService
    const mockToken = tokensService.generateToken();

    const newDev: Tv = {
      id: `d-${Date.now()}`,
      clienteId: clientId,
      nome: newDeviceName,
      status: 'Online',
      uptime: '0h 1m',
      token: mockToken,
      ultimaSincronizacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    onAddDevice(newDev);
    setNewDeviceName('');
  };

  const toggleDeviceStatus = (dev: Tv) => {
    const statuses: ('Online' | 'Offline' | 'Warning')[] = ['Online', 'Warning', 'Offline'];
    const currentIndex = statuses.indexOf(dev.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    onUpdateDevice({
      ...dev,
      status: nextStatus,
      uptime: nextStatus === 'Offline' ? '0h 0m' : dev.uptime
    });
  };

  return (
    <div className="space-y-6" id="clients-manager-tab">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d0d12]/60 p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar cliente, bairro ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-white placeholder:text-slate-500"
            />
          </div>
          {/* Categories Selector */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-sm font-semibold transition-all shadow-sm w-full sm:w-auto justify-center hover:opacity-95"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          Novo Cliente
        </button>
      </div>

      {/* Add Client Form View */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateClient} className="bg-[#0d0d12]/80 p-6 rounded-xl border border-white/10 shadow-2xl space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Cadastrar Novo Cliente Corporativo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome da Unidade/Estabelecimento</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Academia Bodytech Jardins"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Segmento/Categoria</label>
                  <select
                    value={newClientCategory}
                    onChange={(e) => setNewClientCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Academia">Academia / Fitness</option>
                    <option value="Hospital/Saúde">Clínica ou Hospital</option>
                    <option value="Varejo/Shopping">Varejo e Supermercados</option>
                    <option value="Escritório">Escritório Corporativo</option>
                  </select>
                </div>

                {/* Cidade / Estado */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Cidade / UF</label>
                  <select
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="São Paulo">São Paulo (SP)</option>
                    <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
                    <option value="Belo Horizonte">Belo Horizonte (MG)</option>
                    <option value="Curitiba">Curitiba (PR)</option>
                  </select>
                </div>

                {/* Bairro */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Bairro</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pinheiros ou Ipanema"
                    required
                    value={newClientNeighborhood}
                    onChange={(e) => setNewClientNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Orientação */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Orientação de Tela Padrão</label>
                  <div className="flex gap-2 pt-1 text-slate-300">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-white">
                      <input 
                        type="radio" 
                        name="newOrientation" 
                        checked={newClientOrientation === 'Horizontal'} 
                        onChange={() => setNewClientOrientation('Horizontal')} 
                      />
                      Horizontal (Paisagem)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-white">
                      <input 
                        type="radio" 
                        name="newOrientation" 
                        checked={newClientOrientation === 'Vertical'} 
                        onChange={() => setNewClientOrientation('Vertical')} 
                      />
                      Vertical (Retrato)
                    </label>
                  </div>
                </div>

                {/* Qtd de Telas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Número Inicial de Telas</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={newClientScreens}
                    onChange={(e) => setNewClientScreens(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Playlist Atribuída & Ticker de Notícias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Vincular Playlist de Mídia</label>
                  <select
                    value={newClientPlaylist}
                    onChange={(e) => setNewClientPlaylist(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">Nenhuma (Ficará com tela de espera padrão)</option>
                    {playlists.map(pl => (
                      <option key={pl.id} value={pl.id}>{pl.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Texto Letreiro / Marquee (Ticker Rodapé)</label>
                  <input 
                    type="text" 
                    value={newClientTicker}
                    onChange={(e) => setNewClientTicker(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    placeholder="Digite notícias ou avisos importantes que correm no rodapé..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 rounded-lg transition-colors"
                >
                  Criar Unidade Cliente
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clients Directories Grid */}
      <div className="grid grid-cols-1 gap-4" id="clients-list-container">
        {filteredClients.length === 0 ? (
          <div className="bg-[#0d0d12]/60 text-center py-12 rounded-xl border border-white/10 shadow-xl text-slate-500 backdrop-blur-xl">
            <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Nenhum cliente corporativo encontrado</p>
            <p className="text-xs mt-1 text-slate-500">Tente ajustar seus termos de pesquisa ou crie um novo cliente.</p>
          </div>
        ) : (
          filteredClients.map(client => {
            const isEditing = editingClientId === client.id;
            const clientDevices = devices.filter(d => d.clienteId === client.id);
            const isExpanded = expandedClientId === client.id;

            return (
              <div 
                key={client.id}
                className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl overflow-hidden hover:border-blue-500/30 transition-all backdrop-blur-xl"
                id={`client-card-${client.id}`}
              >
                {/* Main Client Info Area */}
                <div className="p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                  {isEditing ? (
                    /* EDITING MODE FORM */
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Comercial</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-white rounded-md text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Segmento</label>
                        <input 
                          type="text" 
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-white rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Cidade</label>
                        <input 
                          type="text" 
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-white rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Bairro</label>
                        <input 
                          type="text" 
                          value={editNeighborhood}
                          onChange={(e) => setEditNeighborhood(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-white rounded-md text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Orientação de Tela</label>
                        <select
                          value={editOrientation}
                          onChange={(e) => setEditOrientation(e.target.value as 'Horizontal' | 'Vertical')}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-slate-200 rounded-md text-xs"
                        >
                          <option value="Horizontal">Horizontal (16:9)</option>
                          <option value="Vertical">Vertical (9:16)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Playlist Atribuída</label>
                        <select
                          value={editPlaylist}
                          onChange={(e) => setEditPlaylist(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-slate-200 rounded-md text-xs"
                        >
                          <option value="">Nenhuma</option>
                          {playlists.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Notícias Rodapé (Marquee Scrolling)</label>
                        <input 
                          type="text" 
                          value={editTicker}
                          onChange={(e) => setEditTicker(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050508]/60 border border-white/10 text-white rounded-md text-xs"
                        />
                      </div>

                      <div className="md:col-span-4 flex justify-end gap-2 pt-1">
                        <button 
                          onClick={() => setEditingClientId(null)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-xs font-bold border border-white/10 transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(client.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* READ-ONLY INFO VIEW */
                    <>
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 text-slate-300 rounded-xl border border-white/10 shrink-0 mt-0.5">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-white font-sans">{client.nome}</h4>
                            <span className="text-[10px] bg-white/5 text-slate-400 border border-white/10 px-2 py-0.5 rounded-full font-semibold">
                              {client.categoria}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              client.status === 'Ativo' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : client.status === 'Sincronizando'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                                : 'bg-white/5 text-slate-500'
                            }`}>
                              {client.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              {client.bairro}, {client.cidade}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-blue-400">
                              <Layout className="w-3.5 h-3.5" />
                              {client.orientacao}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded text-slate-300 border border-white/5">
                              <TvIcon className="w-3.5 h-3.5 text-slate-500" />
                              {client.quantidadeTelas} {client.quantidadeTelas === 1 ? 'mural' : 'murais/telas'}
                            </span>
                          </div>

                          {client.playlistId ? (
                            <div className="text-xs text-slate-300 flex items-center gap-1 pt-1">
                              <span className="font-semibold text-slate-500">Playlist Ativa:</span>
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                {playlists.find(p => p.id === client.playlistId)?.nome || 'Playlist Customizada'}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic pt-1">Nenhuma playlist vinculada. Tela de repouso ativa.</p>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        <button 
                          onClick={() => handleStartEdit(client)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/10"
                          title="Editar Unidade"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingClientDevicesId(isExpanded ? null : client.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isExpanded 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35' 
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          }`}
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          Terminais ({clientDevices.length})
                        </button>
                        <button 
                          onClick={() => onDeleteClient(client.id)}
                          className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-white/10"
                          title="Excluir Unidade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Ticker marquee preview inside client card */}
                {client.textoTicker && !isEditing && (
                  <div className="bg-[#050508] text-amber-400 px-5 py-2 text-xs flex items-center gap-2 overflow-hidden border-t border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-700 px-1 rounded shrink-0 flex items-center gap-1">
                      <MessageSquareQuote className="w-3 h-3 text-amber-400" /> Letreiro:
                    </span>
                    <span className="truncate italic">"{client.textoTicker}"</span>
                  </div>
                )}

                {/* Expanded Terminals/Devices Control Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="bg-[#050508]/40 border-t border-white/10 p-5 overflow-hidden"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Laptop className="w-3.5 h-3.5 text-slate-500" />
                            Hardware Reprodutor (Players Cadastrados nesta Unidade)
                          </h5>
                          <span className="text-[10px] text-slate-500">
                            Clique na etiqueta de Status para rotacionar o estado do player (Simulação)
                          </span>
                        </div>

                        {/* List of Client Devices */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id={`devices-grid-${client.id}`}>
                          {clientDevices.length === 0 ? (
                            <div className="bg-[#0d0d12]/60 p-6 rounded-lg text-center border border-white/5 text-slate-500 col-span-2">
                              <TvIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                              <p className="text-xs">Nenhum hardware player registrado para esta unidade corporativa.</p>
                            </div>
                          ) : (
                            clientDevices.map(dev => (
                              <div 
                                key={dev.id} 
                                className="bg-[#0d0d12]/40 p-3.5 rounded-lg border border-white/10 flex justify-between items-start gap-4 hover:border-blue-500/30 transition-colors"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-white">{dev.nome}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    <span>Token: <strong className="text-cyan-400 bg-white/5 px-1 rounded">{dev.token}</strong></span>
                                    <span>·</span>
                                    <span>Uptime: {dev.uptime}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-mono">Sincronizado em: {dev.ultimaSincronizacao}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => toggleDeviceStatus(dev)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                      dev.status === 'Online'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                                        : dev.status === 'Warning'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                                    }`}
                                    title="Clique para alternar o status do hardware"
                                  >
                                    ● {dev.status}
                                  </button>
                                  <button 
                                    onClick={() => onDeleteDevice(dev.id)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition-colors"
                                    title="Desparear Dispositivo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Register/Pair New Device */}
                        <div className="bg-[#0d0d12]/40 p-3 rounded-lg border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 w-full sm:w-auto">
                            <span className="p-1 bg-white/5 text-slate-300 rounded border border-white/5">
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                            Novo Player / TV Principal:
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto shrink-0">
                            <input 
                              type="text" 
                              placeholder="Nome do local (Ex: TV Sala de Cardio)"
                              value={newDeviceName}
                              onChange={(e) => setNewDeviceName(e.target.value)}
                              className="px-3 py-1.5 bg-[#050508]/60 border border-white/10 rounded text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-60"
                            />
                            <button
                              type="button"
                              onClick={() => handleCreateDevice(client.id)}
                              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded text-xs font-bold shrink-0 transition-colors"
                            >
                              Parear Player
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
