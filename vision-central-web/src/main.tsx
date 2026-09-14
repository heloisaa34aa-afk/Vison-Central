import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import Player from './components/Player.tsx';
import './index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { AuthProvider, useAuth } from './auth/AuthContext.tsx';
import AuthPage from './components/AuthPage.tsx';
import { Loader2, ShieldAlert } from 'lucide-react';

function PanelRoute() {
  const { loading, session, profile, signOut } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#050508] grid place-items-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!session) return <AuthPage />;
  const planExpired = profile?.role !== 'admin' && Boolean(profile?.plan_ends_at && new Date(profile.plan_ends_at).getTime() < Date.now());
  const planBlocked = profile?.role !== 'admin' && (planExpired || profile?.plan_status === 'expired' || profile?.plan_status === 'suspended');
  if (!profile || profile.status !== 'active' || planBlocked) {
    const blocked = Boolean(profile && (profile.status === 'suspended' || planBlocked));
    return <main className="min-h-screen bg-[#050508] text-white grid place-items-center p-5"><div className="max-w-lg w-full bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center"><ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" /><h1 className="text-2xl font-black mt-5">{blocked ? 'Acesso indisponível' : 'Acesso aguardando liberação'}</h1><p className="text-slate-400 mt-3">{blocked ? 'Esta conta está bloqueada ou fora do período contratado. Entre em contato com o administrador.' : 'Seu cadastro foi concluído. Um administrador precisa ativar seu login antes do primeiro acesso.'}</p><button onClick={signOut} className="mt-6 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold">Sair</button></div></main>;
  }
  return <App />;
}

// Safe error listeners for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global window error:', event.message, event.filename, event.lineno, event.colno, event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Global unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/player" element={<Player />} />
          <Route path="/*" element={<AuthProvider><PanelRoute /></AuthProvider>} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
