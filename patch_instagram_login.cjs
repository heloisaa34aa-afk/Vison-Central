const fs = require('fs');
const file = 'vision-central-web/src/components/InstagramLogin.tsx';
let data = `import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { supabase } from '../lib/supabase';
import { Instagram, CheckCircle, XCircle, Loader2, Link2 } from 'lucide-react';
import { Playlist } from '../types';

export default function InstagramLogin() {
  const [status, setStatus] = useState<'ACTIVE' | 'INVALID' | 'EXPIRED' | 'NONE' | 'LOADING'>('LOADING');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [accountName, setAccountName] = useState('');
  const [lastUsed, setLastUsed] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
    fetchPlaylists();
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

  async function fetchPlaylists() {
    const { data } = await supabase.from('playlists').select('id, nome');
    if (data) setPlaylists(data);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlaylist) {
      alert("Selecione uma playlist para associar a conta.");
      return;
    }
    // Redirect to backend OAuth route
    window.location.href = \`\${API_URL}/api/instagram/auth?playlist_id=\${selectedPlaylist}&account=\${encodeURIComponent(accountName)}\`;
  }

  if (status === 'LOADING') return null;

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Instagram className="w-6 h-6 text-pink-500" />
        <h3 className="text-lg font-bold text-white">Conexão Instagram OAuth</h3>
      </div>
      
      {status === 'ACTIVE' ? (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-bold text-sm">Conta Conectada via OAuth</p>
              {lastUsed && <p className="text-xs text-slate-400 mt-1">Última atualização: {new Date(lastUsed).toLocaleString()}</p>}
            </div>
          </div>
          <button onClick={() => setStatus('NONE')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded transition-colors">
            Vincular Outra Conta
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Nome da Conta / Perfil (Opcional)</label>
            <input 
              type="text" 
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="@seu_perfil"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Associar a Playlist</label>
            <select 
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
            >
              <option value="" disabled>Selecione uma playlist...</option>
              {playlists.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            className="w-full px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:opacity-95 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Link2 className="w-4 h-4" /> Conectar Conta Instagram Business
          </button>
          
          <p className="text-[10px] text-slate-500">
            Você será redirecionado para o fluxo seguro de login do Instagram (OAuth).
            Nenhuma senha será salva. Apenas a permissão de leitura será solicitada.
          </p>
        </form>
      )}
    </div>
  );
}
`;
fs.writeFileSync(file, data);
