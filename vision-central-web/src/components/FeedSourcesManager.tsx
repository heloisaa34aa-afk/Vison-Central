import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { feedSourcesService } from '../services/supabase/feedSources';
import { FeedSource, Playlist } from '../types';
import { storageService } from '../lib/storage';
import { Instagram, Plus, Trash2, Edit2, X, Check, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import InstagramLogin from './InstagramLogin';

export default function FeedSourcesManager() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [instagramConnectionId, setInstagramConnectionId] = useState<string | null>(null);
  const [instagramUsername, setInstagramUsername] = useState<string>('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [perfil, setPerfil] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [intervalo, setIntervalo] = useState<number>(24);
  const [ativo, setAtivo] = useState(true);

  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [fetchedSources, fetchedPlaylists] = await Promise.all([
      feedSourcesService.getAll(),
      storageService.getPlaylists()
    ]);
    setSources(fetchedSources);
    setPlaylists(fetchedPlaylists);
    setLoading(false);
  }

  const resetForm = () => {
    setPerfil(instagramUsername);
    setPlaylistId('');
    setIntervalo(24);
    setAtivo(true);
    setEditingId(null);
    setErrorMsg('');
  };

  const handleOpenForm = (source?: FeedSource) => {
    resetForm();
    if (source) {
      setEditingId(source.id);
      setPerfil(source.perfil);
      setPlaylistId(source.playlist_id);
      setIntervalo(source.intervalo_horas);
      setAtivo(source.ativo);
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!perfil.trim()) {
      setErrorMsg('Perfil é obrigatório.');
      return;
    }
    if (!playlistId) {
      setErrorMsg('Playlist é obrigatória.');
      return;
    }

    if (!instagramConnectionId) {
      setErrorMsg('Conecte uma conta profissional do Instagram antes de criar a fonte.');
      return;
    }

    // Format profile
    let formattedPerfil = perfil.trim().toLowerCase();
    if (formattedPerfil.startsWith('@')) {
      formattedPerfil = formattedPerfil.substring(1);
    }
    
    // Check if it became empty
    if (!formattedPerfil) {
      setErrorMsg('Perfil inválido.');
      return;
    }

    const payload = {
      tipo: 'instagram',
      perfil: formattedPerfil,
      playlist_id: playlistId,
      intervalo_horas: intervalo,
      ativo,
      instagram_connection_id: instagramConnectionId
    };

    if (editingId) {
      const updated = await feedSourcesService.update(editingId, payload);
      if (updated) {
        setSuccessMsg('Fonte do Instagram atualizada com sucesso.');
        setShowForm(false);
        loadData();
      } else {
        setErrorMsg('Erro ao atualizar fonte.');
      }
    } else {
      const created = await feedSourcesService.create(payload);
      if (created) {
        await fetch(`${API_URL}/api/feed/sync/${created.id}`, { method: 'POST' }).catch(() => null);
        setSuccessMsg('Fonte adicionada. A primeira atualização foi iniciada.');
        setShowForm(false);
        loadData();
      } else {
        setErrorMsg('Erro ao salvar fonte.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente remover esta fonte de feed?\nEssa ação não remove as mídias já importadas.')) {
      const success = await feedSourcesService.delete(id);
      if (success) {
        setSuccessMsg('Fonte removida com sucesso.');
        loadData();
      } else {
        setErrorMsg('Erro ao remover fonte.');
      }
    }
  };

  const handleSync = async (id: string) => {
    try {
      setSuccessMsg('Sincronização iniciada...');
      const res = await fetch(`${API_URL}/api/feed/sync/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Sincronização iniciada. O status será atualizado em instantes.');
        loadData();
      } else {
        setErrorMsg(data.error || 'Erro na sincronização.');
      }
    } catch (e) {
      setErrorMsg('Erro de rede ao iniciar sincronização.');
    }
  };

  const formatInterval = (hours: number) => {
    switch (hours) {
      case 1: return 'A cada 1 hora';
      case 6: return 'A cada 6 horas';
      case 24: return 'Diário';
      case 168: return 'Semanal';
      default: return `${hours} horas`;
    }
  };

  return (
    <div className="space-y-6">
      <InstagramLogin onConnectionChange={(status) => {
        setInstagramConnectionId(status.connectionId || null);
        if (status.username) setInstagramUsername(status.username);
      }} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Instagram className="w-6 h-6 text-pink-500" />
            Fontes de Feed (Instagram)
          </h2>
          <p className="text-slate-400 text-sm">Gerencie os perfis que o sistema deve importar automaticamente.</p>
        </div>
        
        <button
          onClick={() => handleOpenForm()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm"
        >
          <Plus className="w-4 h-4" /> Adicionar Instagram Feed
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm p-4 rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {errorMsg && !showForm && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-4 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0d0d12] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-500" /> 
                  {editingId ? 'Editar Instagram Feed' : 'Adicionar Instagram Feed'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-5">
                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs p-3 rounded-lg">
                    {errorMsg}
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Perfil do Instagram</label>
                  <input 
                    type="text" 
                    required
                    value={perfil}
                    onChange={(e) => setPerfil(e.target.value)}
                    placeholder={instagramUsername ? `@${instagramUsername}` : '@seuperfil'}
                    className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Playlist de Destino</label>
                  <select 
                    required
                    value={playlistId}
                    onChange={(e) => setPlaylistId(e.target.value)}
                    className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                  >
                    <option value="" disabled>Selecione uma playlist...</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Frequência de Atualização</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'A cada 1 hora', value: 1 },
                      { label: 'A cada 6 horas', value: 6 },
                      { label: 'Diário (24h)', value: 24 },
                      { label: 'Semanal (168h)', value: 168 },
                    ].map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${intervalo === opt.value ? 'bg-pink-500/10 border-pink-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                        <input 
                          type="radio" 
                          name="intervalo" 
                          value={opt.value} 
                          checked={intervalo === opt.value}
                          onChange={() => setIntervalo(opt.value)}
                          className="text-pink-500 bg-black/50 border-white/20 focus:ring-pink-500"
                        />
                        <span className="text-xs font-semibold text-slate-200">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="ativoCheckbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 text-pink-500 bg-black/50 border-white/20 rounded focus:ring-pink-500"
                  />
                  <label htmlFor="ativoCheckbox" className="text-sm font-semibold text-slate-200 cursor-pointer">
                    Ativo
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:opacity-95 rounded-lg transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-slate-800/50">
          <h3 className="text-sm font-bold text-white">Fontes de Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/20 border-b border-white/5">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Perfil</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Playlist</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Intervalo</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Última Execução</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
                    </div>
                    Carregando fontes...
                  </td>
                </tr>
              ) : sources.length > 0 ? (
                sources.map((source) => {
                  const playlist = playlists.find(p => p.id === source.playlist_id);
                  return (
                    <tr key={source.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-500 opacity-70" />
                          <span className="font-medium text-slate-200">@{source.perfil}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-300">
                          {playlist ? playlist.nome : <span className="text-rose-400 text-xs">Playlist não encontrada</span>}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {formatInterval(source.intervalo_horas)}
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {source.ultima_execucao ? new Date(source.ultima_execucao).toLocaleString() : 'Nunca'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          source.ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {source.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleSync(source.id)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Sincronizar Agora"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenForm(source)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(source.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhuma fonte de feed configurada.
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
