import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarClock, CheckCircle2, Loader2, MonitorCog, Save, Search, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Cliente, Tv } from '../types';
import type { UserProfile } from '../auth/AuthContext';

interface Subscription {
  cliente_id: string;
  max_screens: number;
  starts_at: string;
  ends_at: string | null;
  status: 'trial' | 'active' | 'suspended' | 'expired';
  notes: string | null;
}

interface Props {
  clientes: Cliente[];
  tvs: Tv[];
  onOpenClient: (id: string) => void;
}

const toDateInput = (value?: string | null) => value ? value.slice(0, 10) : '';

export default function AdminPanel({ clientes, tvs, onOpenClient }: Props) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    const [profileResult, subscriptionResult] = await Promise.all([
      supabase.from('user_profiles').select('id,email,full_name,role,status,cliente_id').order('created_at', { ascending: false }),
      supabase.from('client_subscriptions').select('cliente_id,max_screens,starts_at,ends_at,status,notes'),
    ]);
    if (profileResult.error) setMessage(profileResult.error.message);
    if (subscriptionResult.error) setMessage(subscriptionResult.error.message);
    setProfiles((profileResult.data || []) as UserProfile[]);
    setSubscriptions((subscriptionResult.data || []) as Subscription[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filteredClients = useMemo(() => clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())), [clientes, search]);
  const pendingUsers = profiles.filter(p => p.status === 'pending').length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial').length;

  function patchSubscription(clientId: string, partial: Partial<Subscription>) {
    setSubscriptions(prev => {
      const existing = prev.find(s => s.cliente_id === clientId);
      const base: Subscription = existing || { cliente_id: clientId, max_screens: Math.max(1, tvs.filter(tv => tv.clienteId === clientId).length), starts_at: new Date().toISOString(), ends_at: null, status: 'trial', notes: null };
      return existing ? prev.map(s => s.cliente_id === clientId ? { ...s, ...partial } : s) : [...prev, { ...base, ...partial }];
    });
  }

  async function saveSubscription(clientId: string, fallback?: Subscription) {
    const item = subscriptions.find(s => s.cliente_id === clientId) || fallback;
    if (!item) return;
    setSavingId(clientId);
    const { error } = await supabase.from('client_subscriptions').upsert({
      ...item,
      max_screens: Math.max(item.max_screens, tvs.filter(tv => tv.clienteId === clientId).length),
      starts_at: item.starts_at || new Date().toISOString(),
      ends_at: item.ends_at || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cliente_id' });
    setMessage(error ? `Erro: ${error.message}` : 'Configuração do cliente salva.');
    setSavingId(null);
    if (!error) void load();
  }

  async function updateProfile(id: string, partial: Partial<UserProfile>) {
    setSavingId(id);
    const { error } = await supabase.from('user_profiles').update({ ...partial, updated_at: new Date().toISOString() }).eq('id', id);
    setMessage(error ? `Erro: ${error.message}` : 'Acesso do usuário atualizado.');
    setSavingId(null);
    if (!error) void load();
  }

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-400" /></div>;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div><span className="text-[10px] uppercase tracking-[.18em] text-cyan-400 font-bold">Acesso exclusivo</span><h2 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><ShieldCheck className="w-6 h-6 text-blue-500" /> Administração da plataforma</h2><p className="text-sm text-slate-400 mt-1">Controle acessos, limites de telas e vigência dos clientes.</p></div>
        <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente" className="h-10 pl-9 pr-3 bg-slate-950 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500" /></div>
      </div>

      {message && <button onClick={() => setMessage('')} className="w-full text-left p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">{message}</button>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Clientes', clientes.length, Building2], ['Telas cadastradas', tvs.length, MonitorCog], ['Planos ativos', activeSubscriptions, CheckCircle2], ['Acessos pendentes', pendingUsers, UserCheck]].map(([label, value, Icon]: any) => <div key={label} className="p-5 bg-slate-900/50 border border-white/10 rounded-xl"><div className="flex justify-between"><span className="text-xs uppercase font-bold tracking-wider text-slate-500">{label}</span><Icon className="w-5 h-5 text-blue-400" /></div><strong className="text-3xl text-white block mt-3">{value}</strong></div>)}
      </div>

      <section className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/10"><h3 className="font-bold text-white flex items-center gap-2"><CalendarClock className="w-5 h-5 text-cyan-400" /> Planos e limites por cliente</h3></div>
        <div className="divide-y divide-white/5">
          {filteredClients.map(client => {
            const current = subscriptions.find(s => s.cliente_id === client.id) || { cliente_id: client.id, max_screens: Math.max(1, tvs.filter(tv => tv.clienteId === client.id).length), starts_at: new Date().toISOString(), ends_at: null, status: 'trial' as const, notes: null };
            const used = tvs.filter(tv => tv.clienteId === client.id).length;
            return <div key={client.id} className="p-5 grid lg:grid-cols-[1.2fr_.65fr_.8fr_.8fr_1fr_auto] gap-4 items-end">
              <div><button onClick={() => onOpenClient(client.id)} className="font-bold text-white hover:text-cyan-400 text-left">{client.nome}</button><p className="text-xs text-slate-500 mt-1">{used} de {current.max_screens} telas utilizadas</p><div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden"><i className="block h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${Math.min(100, used / Math.max(1, current.max_screens) * 100)}%` }} /></div></div>
              <label className="text-[10px] uppercase font-bold text-slate-500">Limite de telas<input type="number" min={used || 1} value={current.max_screens} onChange={e => patchSubscription(client.id, { max_screens: Number(e.target.value) })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white" /></label>
              <label className="text-[10px] uppercase font-bold text-slate-500">Início<input type="date" value={toDateInput(current.starts_at)} onChange={e => patchSubscription(client.id, { starts_at: `${e.target.value}T00:00:00.000Z` })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white" /></label>
              <label className="text-[10px] uppercase font-bold text-slate-500">Validade<input type="date" value={toDateInput(current.ends_at)} onChange={e => patchSubscription(client.id, { ends_at: e.target.value ? `${e.target.value}T23:59:59.999Z` : null })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white" /></label>
              <label className="text-[10px] uppercase font-bold text-slate-500">Situação<select value={current.status} onChange={e => patchSubscription(client.id, { status: e.target.value as Subscription['status'] })} className="block w-full mt-1 h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm text-white"><option value="trial">Teste</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="expired">Expirado</option></select></label>
              <button onClick={() => saveSubscription(client.id, current)} disabled={savingId === client.id} className="h-10 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2">{savingId === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar</button>
            </div>;
          })}
        </div>
      </section>

      <section className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/10"><h3 className="font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> Usuários e permissões</h3></div>
        <div className="divide-y divide-white/5">
          {profiles.map(profile => <div key={profile.id} className="p-4 grid md:grid-cols-[1.2fr_.75fr_1fr_auto] gap-3 items-center">
            <div><strong className="text-sm text-white">{profile.full_name || 'Usuário sem nome'}</strong><p className="text-xs text-slate-500">{profile.email}</p></div>
            <select value={profile.status} onChange={e => updateProfile(profile.id, { status: e.target.value as UserProfile['status'] })} className="h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm"><option value="pending">Pendente</option><option value="active">Ativo</option><option value="suspended">Suspenso</option></select>
            {profile.role === 'admin' ? <span className="text-xs text-blue-300 font-bold">Administrador</span> : <select value={profile.cliente_id || ''} onChange={e => updateProfile(profile.id, { cliente_id: e.target.value || null, status: e.target.value ? 'active' : 'pending' })} className="h-10 px-3 bg-slate-950 border border-white/10 rounded-lg text-sm"><option value="">Sem cliente vinculado</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>}
            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${profile.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>{profile.status}</span>
          </div>)}
        </div>
      </section>
    </div>
  );
}
