import React, { useEffect, useState } from 'react';
import { Check, Edit2, Instagram, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { API_URL } from '../config/api';
import { storageService } from '../lib/storage';
import { feedSourcesService } from '../services/supabase/feedSources';
import { FeedSource, Playlist } from '../types';

const DEFAULT_TIME = '08:00';
const DEFAULT_TIMEZONE = 'America/Bahia';

export default function FeedSourcesManager() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [horarioExecucao, setHorarioExecucao] = useState(DEFAULT_TIME);
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { void loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [loadedSources, loadedPlaylists] = await Promise.all([
        feedSourcesService.getAll(),
        storageService.getPlaylists(),
      ]);
      setSources(Array.isArray(loadedSources) ? loadedSources.filter(Boolean) : []);
      setPlaylists(Array.isArray(loadedPlaylists) ? loadedPlaylists.filter(Boolean) : []);
    } catch (error) {
      console.error('Erro ao carregar fontes:', error);
      setErrorMsg('Não foi possível carregar as fontes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function openForm(source?: FeedSource) {
    setErrorMsg('');
    setSuccessMsg('');
    setEditingId(source?.id || null);
    setPerfil(source?.perfil || '');
    setPlaylistId(source?.playlist_id || '');
    setHorarioExecucao((source?.horario_execucao || DEFAULT_TIME).slice(0, 5));
    setAtivo(source?.ativo ?? true);
    setShowForm(true);
  }

  async function saveSource(event: React.FormEvent) {
    event.preventDefault();
    setErrorMsg('');
    const normalizedProfile = perfil.trim().replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(normalizedProfile)) {
      setErrorMsg('Informe somente um @perfil válido, sem link ou espaços.');
      return;
    }
    if (!playlistId) {
      setErrorMsg('Selecione a playlist de destino.');
      return;
    }

    const payload = {
      tipo: 'instagram',
      perfil: normalizedProfile,
      playlist_id: playlistId,
      intervalo_horas: 24,
      horario_execucao: horarioExecucao,
      timezone: DEFAULT_TIMEZONE,
      ativo,
      instagram_connection_id: null,
      proxima_execucao: null,
    };

    setProcessingId(editingId || 'new');
    try {
      const saved = editingId
        ? await feedSourcesService.update(editingId, payload)
        : await feedSourcesService.create(payload);
      if (!saved) throw new Error('O banco não confirmou a gravação da fonte.');

      setShowForm(false);
      setSuccessMsg(editingId
        ? 'Fonte atualizada. O novo horário já está programado.'
        : 'Fonte adicionada. A primeira consulta foi iniciada.');
      if (!editingId) {
        await fetch(`${API_URL}/api/feed/sync/${saved.id}`, { method: 'POST' }).catch(() => null);
      }
      await loadData();
    } catch (error: any) {
      setErrorMsg(error?.message || 'Não foi possível salvar a fonte.');
    } finally {
      setProcessingId(null);
    }
  }

  async function syncNow(id: string) {
    setProcessingId(id);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_URL}/api/feed/sync/${id}`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Falha ao iniciar a consulta.');
      setSuccessMsg('Consulta iniciada. Atualize a lista em alguns instantes para conferir o resultado.');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Erro de rede ao iniciar a consulta.');
    } finally {
      setProcessingId(null);
    }
  }

  async function removeSource(id: string) {
    if (!window.confirm('Remover esta fonte? A última mídia importada continuará na playlist.')) return;
    setProcessingId(id);
    const removed = await feedSourcesService.delete(id);
    setProcessingId(null);
    if (!removed) {
      setErrorMsg('Não foi possível remover a fonte.');
      return;
    }
    setSuccessMsg('Fonte removida.');
    await loadData();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 border border-pink-500/20 rounded-xl p-5">
        <p className="text-sm font-bold text-white">Consulta pública por @perfil</p>
        <p className="text-xs text-slate-400 mt-1">
          Não é necessário informar senha nem conectar a conta do cliente. Perfis privados não podem ser importados.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Instagram className="w-6 h-6 text-pink-500" /> Fontes de Feed
          </h2>
          <p className="text-slate-400 text-sm">A postagem mais recente é verificada uma vez por dia.</p>
        </div>
        <button onClick={() => openForm()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm">
          <Plus className="w-4 h-4" /> Adicionar perfil
        </button>
      </div>

      {successMsg && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm p-4 rounded-xl flex items-center gap-2"><Check className="w-5 h-5" />{successMsg}</div>}
      {errorMsg && !showForm && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-4 rounded-xl">{errorMsg}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d12] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500" />{editingId ? 'Editar perfil' : 'Adicionar perfil'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveSource} className="p-5 space-y-5">
              {errorMsg && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs p-3 rounded-lg">{errorMsg}</div>}
              <label className="block space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Perfil público do Instagram</span>
                <input required value={perfil} onChange={event => setPerfil(event.target.value)} placeholder="@seuperfil" className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-pink-500 focus:outline-none" />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Playlist de destino</span>
                <select required value={playlistId} onChange={event => setPlaylistId(event.target.value)} className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
                  <option value="">Selecione uma playlist...</option>
                  {playlists.map(playlist => <option key={playlist.id} value={playlist.id}>{playlist.nome}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Executar todos os dias às</span>
                <input type="time" required value={horarioExecucao} onChange={event => setHorarioExecucao(event.target.value)} className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <span className="block text-[11px] text-slate-500">Fuso de Brasília/Bahia. Perfis diferentes são processados em fila.</span>
              </label>
              <label className="flex items-center gap-3"><input type="checkbox" checked={ativo} onChange={event => setAtivo(event.target.checked)} /><span className="text-sm font-semibold text-slate-200">Fonte ativa</span></label>
              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-400 bg-white/5 rounded-lg">Cancelar</button>
                <button type="submit" disabled={processingId !== null} className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-slate-800/30 border-b border-white/5"><tr>
              {['Perfil', 'Playlist', 'Horário diário', 'Última execução', 'Resultado', 'Ações'].map(label => <th key={label} className="p-4 text-xs font-bold text-slate-400 uppercase">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando fontes...</td></tr> : sources.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma fonte configurada.</td></tr> : sources.map(source => {
                const playlist = playlists.find(item => item.id === source.playlist_id);
                return <tr key={source.id} className="hover:bg-white/5">
                  <td className="p-4 text-slate-200 font-medium">@{source.perfil}</td>
                  <td className="p-4 text-sm text-slate-300">{playlist?.nome || 'Playlist não encontrada'}</td>
                  <td className="p-4 text-sm text-slate-300">{source.horario_execucao || DEFAULT_TIME}</td>
                  <td className="p-4 text-sm text-slate-400">{source.ultima_execucao ? new Date(source.ultima_execucao).toLocaleString('pt-BR') : 'Nunca'}</td>
                  <td className="p-4"><span className={`text-[10px] font-bold uppercase ${source.status === 'error' ? 'text-rose-400' : source.ativo ? 'text-emerald-400' : 'text-slate-500'}`} title={source.ultimo_erro || ''}>{source.status === 'error' ? source.ultimo_erro || 'Erro' : source.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="p-4"><div className="flex gap-2">
                    <button disabled={processingId === source.id} onClick={() => void syncNow(source.id)} title="Sincronizar agora" className="p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-40"><RefreshCw className={`w-4 h-4 ${processingId === source.id ? 'animate-spin' : ''}`} /></button>
                    <button onClick={() => openForm(source)} title="Editar" className="p-2 text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                    <button disabled={processingId === source.id} onClick={() => void removeSource(source.id)} title="Excluir" className="p-2 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
