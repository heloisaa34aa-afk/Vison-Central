import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Loader2, MonitorCog, Save, Search, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, type UserProfile } from '../auth/AuthContext';

interface AccountSubscription {
  user_id: string;
  max_screens: number;
  starts_at: string;
  ends_at: string | null;
  status: 'trial' | 'active' | 'suspended' | 'expired';
  notes: string | null;
}

interface OwnedClient { id: string; owner_user_id: string | null }
interface AccountTv { id: string; cliente_id: string }

const toDateInput = (value?: string | null) => value ? value.slice(0, 10) : '';

export default function AdminPanel() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<AccountSubscription[]>([]);
  const [clients, setClients] = useState<OwnedClient[]>([]);
  const [tvs, setTvs] = useState<AccountTv[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    const [profileResult, subscriptionResult, clientResult, tvResult] = await Promise.all([
      supabase.from('user_profiles').select('id,email,full_name,role,status').order('created_at', { ascending: false }),
      supabase.from('account_subscriptions').select('user_id,max_screens,starts_at,ends_at,status,notes'),
      supabase.from('clientes').select('id,owner_user_id'),
      supabase.from('tvs').select('id,cliente_id'),
    ]);
    const firstError = profileResult.error || subscriptionResult.error || clientResult.error || tvResult.error;
    if (firstError) setMessage(`Erro ao carregar contas: ${firstError.message}`);
    setProfiles((profileResult.data || []) as UserProfile[]);
    setSubscriptions((subscriptionResult.data || []) as AccountSubscription[]);
    setClients((clientResult.data || []) as OwnedClient[]);
    setTvs((tvResult.data || []) as AccountTv[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles.filter(profile => !term || profile.email.toLowerCase().includes(term) || profile.full_name.toLowerCase().includes(term));
  }, [profiles, search]);

  const pendingUsers = profiles.filter(profile => profile.status === 'pending').length;
  const activeAccounts = profiles.filter(profile => profile.status === 'active').length;

  function usageFor(userId: string) {
    const clientIds = new Set(clients.filter(client => client.owner_user_id === userId).map(client => client.id));
    return { clients: clientIds.size, screens: tvs.filter(tv => clientIds.has(tv.cliente_id)).length };
  }

  function planFor(profile: UserProfile): AccountSubscription {
    const used = usageFor(profile.id).screens;
    return subscriptions.find(item => item.user_id === profile.id) || {
      user_id: profile.id,
      max_screens: Math.max(1, used),
      starts_at: new Date().toISOString(),
      ends_at: null,
      status: profile.status === 'active' ? 'active' : 'trial',
      notes: null,
    };
  }

  function patchPlan(userId: string, partial: Partial<AccountSubscription>) {
    const profile = profiles.find(item => item.id === userId);
    if (!profile) return;
    setSubscriptions(previous => {
      const existing = previous.find(item => item.user_id === userId);
      const next = { ...planFor(profile), ...partial };
      return existing ? previous.map(item => item.user_id === userId ? next : item) : [...previous, next];
    });
  }

  async function savePlan(profile: UserProfile) {
    const plan = planFor(profile);
    const used = usageFor(profile.id).screens;
    setSavingId(profile.id);
    const { error } = await supabase.from('account_subscriptions').upsert({
      ...plan,
      max_screens: Math.max(used, Number(plan.max_screens) || 1),
      starts_at: plan.starts_at || new Date().toISOString(),
      ends_at: plan.ends_at || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setMessage(error ? `Erro: ${error.message}` : `Plano do login ${profile.email} salvo.`);
    setSavingId(null);
    if (!error) void load();
  }

  async function updateAccess(profile: UserProfile, status: UserProfile['status']) {
    if (profile.id === user?.id && status !== 'active') {
      setMessage('Sua própria conta administradora não pode ser bloqueada por esta tela.');
      return;
    }
    setSavingId(profile.id);
    const { error } = await supabase.from('user_profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', profile.id);
    setMessage(error ? `Erro: ${error.message}` : `Acesso de ${profile.email} atualizado.`);
    setSavingId(null);
    if (!error) void load();
  }

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-400" /></div>;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div><span className="text-[10px] uppercase tracking-[.18em] text-cyan-400 font-bold">Acesso exclusivo</span><h2 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><ShieldCheck className="w-6 h-6 text-blue-500" /> Administração de logins</h2><p className="text-sm text-slate-400 mt-1">Ative contas e defina a vigência e o limite total de telas de cada login.</p></div>
        <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome ou e-mail" className="h-10 pl-9 pr-3 bg-slate-950 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
      </div>

      {message && <button onClick={() => setMessage('')} className="w-full text-left p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">{message}</button>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Logins cadastrados', profiles.length, Users],
          ['Logins ativos', activeAccounts, CheckCircle2],
          ['Telas em todas as contas', tvs.length, MonitorCog],
          ['Acessos pendentes', pendingUsers, UserCheck],
        ].map(([label, value, Icon]: any) => <div key={label} className="p-5 bg-slate-900/50 border border-white/10 rounded-xl"><div className="flex justify-between"><span className="text-xs uppercase font-bold tracking-wider text-slate-500">{label}</span><Icon className="w-5 h-5 text-blue-400" /></div><strong className="text-3xl text-white block mt-3">{value}</strong></div>)}
      </div>

      <section className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/10"><h3 className="font-bold text-white flex items-center gap-2"><CalendarClock className="w-5 h-5 text-cyan-400" /> Contas do painel</h3><p className="text-xs text-slate-500 mt-1">Cada conta administra seus próprios clientes, playlists e TVs.</p></div>
        <div className="divide-y divide-white/5">
          {filteredProfiles.map(profile => {
            const plan = planFor(profile);
            const usage = usageFor(profile.id);
            const isProtectedAdmin = profile.role === 'admin';
            return <div key={profile.id} className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><strong className="text-sm text-white">{profile.full_name || 'Usuário sem nome'}</strong><p className="text-xs text-slate-500">{profile.email}</p><p className="text-[11px] text-cyan-400 mt-1">{usage.clients} cliente(s) · {usage.screens} tela(s) utilizadas</p></div>
                <div className="flex items-center gap-2">
                  {isProtectedAdmin && <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-300">Administrador</span>}
                  <select value={profile.status} disabled={isProtectedAdmin || savingId === profile.id} onChange={event => void updateAccess(profile, event.target.value as UserProfile['status'])} className="h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm"><option value="pending">Pendente</option><option value="active">Ativo</option><option value="suspended">Bloqueado</option></select>
                </div>
              </div>

              {!isProtectedAdmin && <div className="grid sm:grid-cols-2 xl:grid-cols-[.65fr_.85fr_.85fr_1fr_auto] gap-3 items-end">
                <label className="text-[10px] uppercase font-bold text-slate-500">Limite total de telas<input type="number" min={Math.max(1, usage.screens)} value={plan.max_screens} onChange={event => patchPlan(profile.id, { max_screens: Number(event.target.value) })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white" /></label>
                <label className="text-[10px] uppercase font-bold text-slate-500">Início<input type="date" value={toDateInput(plan.starts_at)} onChange={event => patchPlan(profile.id, { starts_at: `${event.target.value}T00:00:00.000Z` })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white" /></label>
                <label className="text-[10px] uppercase font-bold text-slate-500">Validade<input type="date" value={toDateInput(plan.ends_at)} onChange={event => patchPlan(profile.id, { ends_at: event.target.value ? `${event.target.value}T23:59:59.999Z` : null })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white" /></label>
                <label className="text-[10px] uppercase font-bold text-slate-500">Situação do plano<select value={plan.status} onChange={event => patchPlan(profile.id, { status: event.target.value as AccountSubscription['status'] })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white"><option value="trial">Teste</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="expired">Expirado</option></select></label>
                <button onClick={() => void savePlan(profile)} disabled={savingId === profile.id} className="h-10 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-bold flex items-center justify-center gap-2">{savingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar</button>
              </div>}
            </div>;
          })}
          {filteredProfiles.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Nenhum login encontrado.</div>}
        </div>
      </section>
    </div>
  );
}
