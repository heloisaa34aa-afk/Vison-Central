import { useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Tv, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro recebido. Confirme seu e-mail e aguarde a liberação do administrador.' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Enviamos as instruções de recuperação para o seu e-mail.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Não foi possível concluir. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden lg:flex relative overflow-hidden p-16 flex-col justify-between border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,153,255,.22),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,.15),transparent_38%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 grid place-items-center shadow-lg shadow-blue-500/30"><Tv className="w-6 h-6" /></div>
          <div><strong className="text-xl">Vision Central</strong><p className="text-[10px] uppercase tracking-[.18em] text-slate-500">Gestão de TV corporativa</p></div>
        </div>
        <div className="relative max-w-2xl">
          <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">Sua rede em um só lugar</span>
          <h1 className="text-5xl xl:text-6xl font-black tracking-tight mt-5 leading-[1.06]">Conteúdo certo.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-300">Tela certa.</span><br />Hora certa.</h1>
          <p className="text-lg text-slate-400 mt-7 max-w-xl">Acesse campanhas, playlists, relatórios e a disponibilidade de todas as suas TVs.</p>
        </div>
        <p className="relative text-xs text-slate-600">© 2026 Vision Central</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 grid place-items-center"><Tv className="w-5 h-5" /></div><strong>Vision Central</strong></div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">Área segura</p>
          <h2 className="text-3xl font-black mt-3">{mode === 'login' ? 'Bem-vindo de volta' : mode === 'signup' ? 'Crie sua conta' : 'Recuperar acesso'}</h2>
          <p className="text-sm text-slate-400 mt-2">{mode === 'login' ? 'Entre para gerenciar sua operação.' : mode === 'signup' ? 'Seu acesso será liberado após aprovação.' : 'Informe o e-mail usado no cadastro.'}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'signup' && <label className="block text-sm text-slate-300">Nome completo<div className="relative mt-2"><UserRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input required value={name} onChange={e => setName(e.target.value)} className="w-full h-12 pl-10 pr-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-blue-500" placeholder="Seu nome" /></div></label>}
            <label className="block text-sm text-slate-300">E-mail<div className="relative mt-2"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 pl-10 pr-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-blue-500" placeholder="voce@empresa.com.br" /></div></label>
            {mode !== 'reset' && <label className="block text-sm text-slate-300">Senha<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 pl-10 pr-11 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-blue-500" placeholder="Mínimo de 8 caracteres" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3 text-slate-500 hover:text-white">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></label>}
            {message && <div className={`p-3 rounded-xl text-sm border ${message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>{message.text}</div>}
            <button disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold flex items-center justify-center gap-2 disabled:opacity-60">{loading && <Loader2 className="w-4 h-4 animate-spin" />}{mode === 'login' ? 'Entrar no painel' : mode === 'signup' ? 'Criar cadastro' : 'Enviar recuperação'}</button>
          </form>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {mode !== 'login' && <button onClick={() => { setMode('login'); setMessage(null); }} className="text-cyan-400 hover:text-cyan-300">Já tenho acesso</button>}
            {mode !== 'signup' && <button onClick={() => { setMode('signup'); setMessage(null); }} className="text-cyan-400 hover:text-cyan-300">Criar uma conta</button>}
            {mode === 'login' && <button onClick={() => { setMode('reset'); setMessage(null); }} className="ml-auto text-slate-500 hover:text-white">Esqueci a senha</button>}
          </div>
        </div>
      </section>
    </main>
  );
}
