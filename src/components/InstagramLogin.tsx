import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Instagram, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function InstagramLogin() {
  const [status, setStatus] = useState<'ACTIVE' | 'INVALID' | 'EXPIRED' | 'NONE' | 'LOADING'>('LOADING');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [lastUsed, setLastUsed] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data } = await supabase
        .from('instagram_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setStatus(data.status);
        setLastUsed(data.last_used_at);
      } else {
        setStatus('NONE');
      }
    } catch (e) {
      setStatus('NONE');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/instagram/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await checkSession();
      } else {
        setError(data.error || 'Falha ao conectar.');
      }
    } catch (err: any) {
      setError('Erro de rede.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (status === 'LOADING') return null;

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Instagram className="w-6 h-6 text-pink-500" />
        <h3 className="text-lg font-bold text-white">Conexão Instagram</h3>
      </div>

      {status === 'ACTIVE' ? (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-bold text-sm">Sessão Ativa</p>
              {lastUsed && <p className="text-xs text-slate-400 mt-1">Última utilização: {new Date(lastUsed).toLocaleString()}</p>}
            </div>
          </div>
          <button onClick={() => setStatus('NONE')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded transition-colors">
            Reconectar Conta
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4 max-w-sm">
          {error && <div className="text-rose-400 text-xs font-bold bg-rose-500/10 p-2 rounded">{error}</div>}
          {(status === 'INVALID' || status === 'EXPIRED') && (
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold bg-rose-500/10 p-2 rounded mb-2">
              <XCircle className="w-4 h-4" /> Sessão expirada ou inválida. Por favor, conecte novamente.
            </div>
          )}
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:opacity-95 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar Conta'}
          </button>
          <p className="text-[10px] text-slate-500">Uma janela do navegador será aberta para que você faça o login manualmente e resolva qualquer desafio de segurança necessário. O worker utilizará esta sessão para acessar os perfis sem sofrer login wall.</p>
        </form>
      )}
    </div>
  );
}
