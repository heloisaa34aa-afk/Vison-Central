import { useEffect, useState } from 'react';
import { API_URL } from '../config/api';
import { Instagram, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface InstagramStatus {
  connected: boolean;
  connectionId?: string;
  username?: string;
  expiresAt?: string | null;
}

interface InstagramLoginProps {
  onConnectionChange?: (status: InstagramStatus) => void;
}

export default function InstagramLogin({ onConnectionChange }: InstagramLoginProps) {
  const [status, setStatus] = useState<InstagramStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  async function checkStatus() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/instagram/status`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao verificar o Instagram.');
      setStatus(data);
      onConnectionChange?.(data);
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel consultar a conexao.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('instagram') === 'error') setError(params.get('message') || 'Falha ao conectar o Instagram.');
    checkStatus();
    if (params.has('instagram')) {
      params.delete('instagram');
      params.delete('username');
      params.delete('message');
      const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  async function connect() {
    setConnecting(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/instagram/connect`);
      const data = await response.json();
      if (!response.ok || !data.authorizationUrl) throw new Error(data.error || 'Falha ao iniciar a conexao.');
      window.location.assign(data.authorizationUrl);
    } catch (err: any) {
      setError(err.message || 'Erro de rede.');
      setConnecting(false);
    }
  }

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Instagram className="w-6 h-6 text-pink-500" />
        <h3 className="text-lg font-bold text-white">Conexao Instagram</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Verificando conexao...</div>
      ) : status.connected ? (
        <div className="flex items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-bold text-sm">@{status.username} conectado</p>
              <p className="text-xs text-slate-400 mt-1">A postagem mais recente sera atualizada automaticamente.</p>
            </div>
          </div>
          <button onClick={connect} disabled={connecting} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded">
            Reconectar
          </button>
        </div>
      ) : (
        <div className="max-w-lg space-y-3">
          <button onClick={connect} disabled={connecting} className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50">
            {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
            Conectar conta profissional
          </button>
          <p className="text-xs text-slate-400">Use uma conta Instagram Business ou Creator. A senha nunca passa pelo Vision Central.</p>
        </div>
      )}

      {error && <div className="mt-4 flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded"><XCircle className="w-4 h-4" />{error}</div>}
    </div>
  );
}
