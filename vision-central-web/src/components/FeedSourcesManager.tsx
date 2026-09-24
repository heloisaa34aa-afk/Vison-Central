import React, { useEffect, useState } from 'react';
import { Check, Edit2, Instagram, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { API_URL } from '../config/api';
import { storageService } from '../lib/storage';
import { feedSourcesService } from '../services/supabase/feedSources';
import { Cliente, FeedSource, Playlist, Tv } from '../types';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_TIME = '08:00';
const DEFAULT_TIMEZONE = 'America/Bahia';

export default function FeedSourcesManager() {
  const { profile } = useAuth();
  const ownerUserId = profile?.id || null;
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [tvs, setTvs] = useState<Tv[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState('');
  const [tvId, setTvId] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [horarioExecucao, setHorarioExecucao] = useState(DEFAULT_TIME);
  const [ativo, setAtivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { void loadData(); }, [ownerUserId]);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [loadedSources, loadedPlaylists, loadedClients, loadedTvs] = await Promise.all([
        feedSourcesService.getAll(),
        storageService.getPlaylists(),
        storageService.getClientes(),
        storageService.getTvs(),
      ]);
      const safePlaylists = Array.isArray(loadedPlaylists) ? loadedPlaylists.filter(Boolean) : [];
      const visibleClients = (loadedClients || []).filter(item => item.ownerUserId === ownerUserId);
      const ownedClientIds = new Set(visibleClients.map(item => item.id));
      const visiblePlaylists = safePlaylists.filter(item => Boolean(item.clienteId) && ownedClientIds.has(item.clienteId!));
      const visibleTvs = (loadedTvs || []).filter(item => ownedClientIds.has(item.clienteId));
      const allowedPlaylistIds = new Set(visiblePlaylists.map(item => item.id));
      setSources(Array.isArray(loadedSources) ? loadedSources.filter(item => item && allowedPlaylistIds.has(item.playlist_id)) : []);
      setPlaylists(visiblePlaylists);
      setClients(visibleClients);
      setTvs(visibleTvs);
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
    const directlyAssignedTvs = source
      ? tvs.filter(tv => tv.playlistId === source.playlist_id)
      : [];
    setTvId(directlyAssignedTvs.length === 1 ? directlyAssignedTvs[0].id : '');
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
      setErrorMsg('Selecione a TV de destino. Essa TV precisa ter uma playlist própria.');
      return;
    }
    const selectedTv = tvs.find(tv => tv.id === tvId);
    if (!selectedTv) {
      setErrorMsg('Selecione a TV que deve receber as publicações.');
      return;
    }
    if (!selectedTv.playlistId) {
      setErrorMsg(`A TV "${selectedTv.nome}" não possui uma playlist própria. Vincule uma playlist a ela em Configuração de TV antes de salvar.`);
      return;
    }
    const conflictingTvs = tvs.filter(tv => {
      if (tv.id === selectedTv.id) return false;
      const client = clients.find(item => item.id === tv.clienteId);
      const effectivePlaylistId = tv.playlistId || client?.playlistId;
      return effectivePlaylistId === selectedTv.playlistId;
    });
    if (conflictingTvs.length > 0) {
      const names = conflictingTvs.map(tv => tv.nome).join(', ');
      setErrorMsg(`A playlist desta TV também é usada por: ${names}. Para enviar somente a uma TV, vincule uma playlist exclusiva a "${selectedTv.nome}".`);
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
      const currentSource = editingId ? sources.find(source => source.id === editingId) : null;
      const isMovingToAnotherTv = Boolean(currentSource && currentSource.playlist_id !== playlistId);
      const isReactivating = Boolean(currentSource && !currentSource.ativo && ativo);
      let saved: FeedSource | null;

      if (editingId && isMovingToAnotherTv) {
        const removed = await feedSourcesService.delete(editingId);
        if (!removed) throw new Error('Não foi possível retirar a mídia da TV anterior. Nenhuma alteração foi concluída.');
        saved = await feedSourcesService.create(payload);
      } else {
        saved = editingId
          ? await feedSourcesService.update(editingId, payload)
          : await feedSourcesService.create(payload);
      }
      if (!saved) throw new Error('O banco não confirmou a gravação da fonte.');

      if (!ativo) {
        const response = await fetch(`${API_URL}/api/feed/${encodeURIComponent(saved.id)}/deactivate`, { method: 'POST' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'A fonte foi desativada, mas não foi possível retirar a mídia do player.');
      } else if (!editingId || isMovingToAnotherTv || isReactivating) {
        const response = await fetch(`${API_URL}/api/feed/sync/${saved.id}`, { method: 'POST' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'A fonte foi salva, mas não foi possível iniciar a coleta.');
      }

      setShowForm(false);
      setSuccessMsg(!ativo
        ? 'Fonte desativada. A mídia foi retirada da playlist e desaparecerá do player na próxima sincronização.'
        : isMovingToAnotherTv
          ? 'Fonte movida para a TV escolhida. A mídia anterior foi retirada e uma nova consulta foi iniciada.'
          : isReactivating
            ? 'Fonte reativada. Uma nova consulta foi iniciada.'
        : editingId
          ? 'Fonte atualizada. O novo horário já está programado.'
          : 'Fonte adicionada. A primeira consulta foi iniciada.');
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
      setSuccessMsg(data.message || 'Consulta adicionada à fila. Um coletor disponível fará o processamento.');
      await loadData();
    } catch (error: any) {
      setErrorMsg(error?.message || 'Erro de rede ao iniciar a consulta.');
    } finally {
      setProcessingId(null);
    }
  }

  async function removeSource(id: string) {
    if (!window.confirm('Remover esta fonte? A mídia importada será retirada da playlist e excluída do armazenamento.')) return;
    setProcessingId(id);
    const removed = await feedSourcesService.delete(id);
    setProcessingId(null);
    if (!removed) {
      setErrorMsg('Não foi possível remover a fonte.');
      return;
    }
    setSuccessMsg('Fonte, tarefa e mídia removidas da playlist.');
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
                <span className="text-[10px] font-bold text-slate-400 uppercase">TV de destino</span>
                <select
                  required
                  value={tvId}
                  onChange={event => {
                    const nextTvId = event.target.value;
                    const selectedTv = tvs.find(tv => tv.id === nextTvId);
                    setTvId(nextTvId);
                    setPlaylistId(selectedTv?.playlistId || '');
                  }}
                  className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Selecione uma TV...</option>
                  {tvs.map(tv => {
                    const client = clients.find(item => item.id === tv.clienteId);
                    const playlist = playlists.find(item => item.id === tv.playlistId);
                    return <option key={tv.id} value={tv.id}>{client?.nome || 'Cliente'} — {tv.nome}{playlist ? ` — ${playlist.nome}` : ' — sem playlist própria'}</option>;
                  })}
                </select>
                {tvId && !playlistId && <span className="block text-[11px] text-amber-400">Esta TV ainda não tem playlist própria. Configure-a antes de adicionar o perfil.</span>}
                {tvId && playlistId && <span className="block text-[11px] text-slate-500">A publicação será adicionada somente à playlist exclusiva desta TV.</span>}
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
              {['Perfil', 'TV de destino', 'Horário diário', 'Última execução', 'Resultado', 'Ações'].map(label => <th key={label} className="p-4 text-xs font-bold text-slate-400 uppercase">{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando fontes...</td></tr> : sources.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma fonte configurada.</td></tr> : sources.map(source => {
                const playlist = playlists.find(item => item.id === source.playlist_id);
                const directTvs = tvs.filter(tv => tv.playlistId === source.playlist_id);
                const inheritedTvs = tvs.filter(tv => {
                  if (tv.playlistId) return false;
                  const client = clients.find(item => item.id === tv.clienteId);
                  return client?.playlistId === source.playlist_id;
                });
                const targetTvs = [...directTvs, ...inheritedTvs];
                return <tr key={source.id} className="hover:bg-white/5">
                  <td className="p-4 text-slate-200 font-medium">@{source.perfil}</td>
                  <td className="p-4 text-sm text-slate-300">
                    {targetTvs.length === 1 ? targetTvs[0].nome : targetTvs.length > 1 ? `${targetTvs.length} TVs usam esta playlist` : 'Nenhuma TV vinculada'}
                    <span className="block text-[11px] text-slate-500 mt-1">{playlist?.nome || 'Playlist não encontrada'}</span>
                    {targetTvs.length > 1 && <span className="block text-[10px] font-bold text-amber-400 mt-1">Compartilhada — edite para corrigir</span>}
                  </td>
                  <td className="p-4 text-sm text-slate-300">{source.horario_execucao || DEFAULT_TIME}</td>
                  <td className="p-4 text-sm text-slate-400">{source.ultima_execucao ? new Date(source.ultima_execucao).toLocaleString('pt-BR') : 'Nunca'}</td>
                  <td className="p-4"><span className={`text-[10px] font-bold uppercase ${source.status === 'error' ? 'text-rose-400' : source.status === 'processing' ? 'text-cyan-400' : source.status === 'queued' ? 'text-amber-400' : source.ativo ? 'text-emerald-400' : 'text-slate-500'}`} title={source.ultimo_erro || ''}>{source.status === 'error' ? source.ultimo_erro || 'Erro' : source.status === 'processing' ? 'Coletando' : source.status === 'queued' ? 'Aguardando coletor' : source.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="p-4"><div className="flex gap-2">
                    <button disabled={processingId === source.id || !source.ativo} onClick={() => void syncNow(source.id)} title={source.ativo ? 'Sincronizar agora' : 'Ative a fonte para sincronizar'} className="p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-40"><RefreshCw className={`w-4 h-4 ${processingId === source.id ? 'animate-spin' : ''}`} /></button>
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
