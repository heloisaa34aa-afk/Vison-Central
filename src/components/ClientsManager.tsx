import React, { useState, useEffect } from 'react';
import { Cliente, Tv, Playlist } from '../types';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Tv as TvIcon, 
  Search, 
  X, 
  Layout,
  MessageSquareQuote,
  Settings,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsManagerProps {
  clients: Cliente[];
  devices: Tv[];
  playlists: Playlist[];
  onAddClient: (cliente: Cliente) => void;
  onDeleteClient: (id: string) => void;
  onSelectCliente: (id: string) => void;
}

const defaultCategories = ['Academia', 'Hospital/Saúde', 'Varejo/Shopping', 'Escritório'];
const defaultCities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'];

export default function ClientsManager({
  clients,
  devices,
  playlists,
  onAddClient,
  onDeleteClient,
  onSelectCliente
}: ClientsManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Settings States
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vc_categories');
      return saved ? JSON.parse(saved) : defaultCategories;
    } catch(e) { return defaultCategories; }
  });
  
  const [customCities, setCustomCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vc_cities');
      return saved ? JSON.parse(saved) : defaultCities;
    } catch(e) { return defaultCities; }
  });

  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showManageCities, setShowManageCities] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCityInput, setNewCityInput] = useState('');
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryInput, setEditingCategoryInput] = useState('');
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editingCityInput, setEditingCityInput] = useState('');

  useEffect(() => {
    localStorage.setItem('vc_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('vc_cities', JSON.stringify(customCities));
  }, [customCities]);

  const handleAddCategory = () => {
    if (newCategoryInput.trim() && !customCategories.includes(newCategoryInput.trim())) {
      setCustomCategories([...customCategories, newCategoryInput.trim()]);
      setNewCategoryInput('');
    }
  };

  const handleEditCategory = (oldCat: string) => {
    if (editingCategoryInput.trim() && editingCategoryInput.trim() !== oldCat && !customCategories.includes(editingCategoryInput.trim())) {
      setCustomCategories(customCategories.map(c => c === oldCat ? editingCategoryInput.trim() : c));
    }
    setEditingCategory(null);
  };

  const handleRemoveCategory = (cat: string) => {
    setCustomCategories(customCategories.filter(c => c !== cat));
  };

  const handleAddCity = () => {
    if (newCityInput.trim() && !customCities.includes(newCityInput.trim())) {
      setCustomCities([...customCities, newCityInput.trim()]);
      setNewCityInput('');
    }
  };

  const handleEditCity = (oldCity: string) => {
    if (editingCityInput.trim() && editingCityInput.trim() !== oldCity && !customCities.includes(editingCityInput.trim())) {
      setCustomCities(customCities.map(c => c === oldCity ? editingCityInput.trim() : c));
    }
    setEditingCity(null);
  };

  const handleRemoveCity = (city: string) => {
    setCustomCities(customCities.filter(c => c !== city));
  };
  
  // Novo Cliente Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCategory, setNewClientCategory] = useState(customCategories[0] || 'Academia');
  const [newClientCity, setNewClientCity] = useState(customCities[0] || 'São Paulo');
  const [newClientNeighborhood, setNewClientNeighborhood] = useState('');
  const [newClientScreens, setNewClientScreens] = useState(1);
  const [newClientPlaylist, setNewClientPlaylist] = useState('');
  const [newClientTicker, setNewClientTicker] = useState('Bem-vindo à nossa rede corporativa de notícias.');

  // Filter categories
  const categories = ['Todas', ...customCategories];
  
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || c.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      orientacao: 'horizontal', // Removido da UI, fixo por padrão na criação
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

  return (
    <div className="space-y-6" id="clients-manager-tab">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 bg-[#0d0d12]/60 p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
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
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase">Segmento/Categoria</label>
                    <button type="button" onClick={() => setShowManageCategories(true)} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Editar</button>
                  </div>
                  <select
                    value={newClientCategory}
                    onChange={(e) => setNewClientCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {customCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Cidade / Estado */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase">Cidade / UF</label>
                    <button type="button" onClick={() => setShowManageCities(true)} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Editar</button>
                  </div>
                  <select
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {customCities.map(city => <option key={city} value={city}>{city}</option>)}
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
            const clientDevices = devices.filter(d => d.clienteId === client.id);

            return (
              <div 
                key={client.id}
                className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl overflow-hidden hover:border-blue-500/30 transition-all backdrop-blur-xl"
                id={`client-card-${client.id}`}
              >
                {/* Main Client Info Area */}
                <div className="p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
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
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
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
                          {clientDevices.length} {clientDevices.length === 1 ? 'mural/tela' : 'murais/telas'}
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
                      onClick={() => onSelectCliente(client.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                    >
                      Acessar Painel
                    </button>
                    <button 
                      onClick={() => onDeleteClient(client.id)}
                      className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-white/10"
                      title="Excluir Unidade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ticker marquee preview inside client card */}
                {client.textoTicker && (
                  <div className="bg-[#050508] text-amber-400 px-5 py-2 text-xs flex items-center gap-2 overflow-hidden border-t border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-700 px-1 rounded shrink-0 flex items-center gap-1">
                      <MessageSquareQuote className="w-3 h-3 text-amber-400" /> Letreiro:
                    </span>
                    <span className="truncate italic">"{client.textoTicker}"</span>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {showManageCategories && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="bg-[#0d0d12] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gerenciar Segmentos</h3>
                <button onClick={() => setShowManageCategories(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex gap-2 mb-4">
                <input 
                  value={newCategoryInput} 
                  onChange={e => setNewCategoryInput(e.target.value)} 
                  type="text" 
                  className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="Novo segmento" 
                />
                <button onClick={handleAddCategory} className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-white font-bold text-xs">Adicionar</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customCategories.map(c => (
                  <div key={c} className="flex justify-between items-center bg-[#050508] p-3 rounded-lg border border-white/5">
                    {editingCategory === c ? (
                      <div className="flex w-full gap-2 mr-2">
                        <input value={editingCategoryInput} onChange={e => setEditingCategoryInput(e.target.value)} className="w-full px-2 py-1 bg-[#0d0d12] border border-white/10 rounded text-sm text-white" />
                        <button onClick={() => handleEditCategory(c)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold">Salvar</button>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-300">{c}</span>
                    )}
                    <div className="flex items-center gap-1">
                      {editingCategory !== c && <button onClick={() => { setEditingCategory(c); setEditingCategoryInput(c); }} className="text-blue-400 hover:text-blue-300 p-1"><Edit2 className="w-4 h-4"/></button>}
                      <button onClick={() => handleRemoveCategory(c)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManageCities && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="bg-[#0d0d12] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gerenciar Cidades</h3>
                <button onClick={() => setShowManageCities(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex gap-2 mb-4">
                <input 
                  value={newCityInput} 
                  onChange={e => setNewCityInput(e.target.value)} 
                  type="text" 
                  className="w-full px-3 py-2 bg-[#050508]/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="Nova cidade" 
                />
                <button onClick={handleAddCity} className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-white font-bold text-xs">Adicionar</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customCities.map(c => (
                  <div key={c} className="flex justify-between items-center bg-[#050508] p-3 rounded-lg border border-white/5">
                    {editingCity === c ? (
                      <div className="flex w-full gap-2 mr-2">
                        <input value={editingCityInput} onChange={e => setEditingCityInput(e.target.value)} className="w-full px-2 py-1 bg-[#0d0d12] border border-white/10 rounded text-sm text-white" />
                        <button onClick={() => handleEditCity(c)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold">Salvar</button>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-300">{c}</span>
                    )}
                    <div className="flex items-center gap-1">
                      {editingCity !== c && <button onClick={() => { setEditingCity(c); setEditingCityInput(c); }} className="text-blue-400 hover:text-blue-300 p-1"><Edit2 className="w-4 h-4"/></button>}
                      <button onClick={() => handleRemoveCity(c)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
