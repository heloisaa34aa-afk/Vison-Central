import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Smartphone, WifiOff, CheckCircle2, History, Loader2, Info } from 'lucide-react';
import { Tv, Cliente } from '../types';
import { isTvOnline } from '../utils/tvStatus';
import { API_URL } from '../config/api';

interface AlertsManagerProps {
  tvs: Tv[];
  clientes: Cliente[];
}

interface AlertEvent {
  id: number;
  message: string;
  created_at: string;
  type?: string;
}

export default function AlertsManager({ tvs, clientes }: AlertsManagerProps) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const offlineTvs = tvs.filter(tv => !isTvOnline(tv));

  useEffect(() => {
    checkSubscriptionStatus();
    fetchEvents();
  }, []);

  async function checkSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    }
  }

  async function fetchEvents() {
    try {
      const res = await fetch(`${API_URL}/api/alerts/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error('Erro ao buscar eventos:', e);
    } finally {
      setLoadingEvents(false);
    }
  }

  const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  async function handleSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações push.');
      return;
    }

    setLoading(true);
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        alert('Permissão negada. Você precisa permitir as notificações no navegador.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const keyRes = await fetch(`${API_URL}/api/alerts/public-key`);
      if (!keyRes.ok) throw new Error('Não foi possível obter a chave pública');
      const { publicKey } = await keyRes.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey)
      });

      const subRes = await fetch(`${API_URL}/api/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (!subRes.ok) throw new Error('Erro ao salvar inscrição');

      setIsSubscribed(true);
      alert('Notificações ativadas neste dispositivo!');
    } catch (e) {
      console.error('Erro ao ativar notificações:', e);
      alert('Ocorreu um erro ao tentar ativar as notificações. Veja o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${API_URL}/api/alerts/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      alert('Notificações desativadas neste dispositivo.');
    } catch (e) {
      console.error('Erro ao desativar notificações:', e);
      alert('Ocorreu um erro ao desativar as notificações.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestNotification() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts/test`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao enviar notificação de teste');
      alert('Notificação de teste enviada!');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar notificação de teste.');
    } finally {
      setLoading(false);
    }
  }

  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nome || 'Desconhecido';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-500" />
          Alertas de Sistema
        </h2>
        <p className="text-slate-400">Gerencie notificações push e visualize eventos recentes das TVs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              Notificações neste Aparelho
            </h3>

            {isIOS && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  <strong className="block mb-1">Para usuários de iPhone/iPad:</strong>
                  Antes de ativar as notificações, você precisa adicionar este painel à sua <b>Tela de Início</b> (compartilhar &gt; Adicionar à Tela de Início) e abrir o app por lá.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSubscribed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                  {isSubscribed ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-white font-medium">{isSubscribed ? 'Notificações Ativadas' : 'Notificações Desativadas'}</p>
                  <p className="text-sm text-slate-400">Receba alertas em tempo real sobre TVs offline.</p>
                </div>
              </div>

              {isSubscribed ? (
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Desativar'}
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Ativar Notificações'}
                </button>
              )}
            </div>

            {isSubscribed && (
              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={handleTestNotification}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Enviar Notificação de Teste
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <WifiOff className="w-5 h-5 text-red-500" />
              TVs Offline ({offlineTvs.length})
            </h3>
            
            {offlineTvs.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {offlineTvs.map(tv => (
                  <div key={tv.id} className="bg-black/30 border border-red-500/20 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-200">{tv.nome}</p>
                      <p className="text-xs text-slate-500">{getClientName(tv.clienteId)}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">Offline</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Todas as TVs estão online.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 flex flex-col max-h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Histórico Recente (Top 100)
            </h3>
            <button 
              onClick={fetchEvents}
              disabled={loadingEvents}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              Atualizar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loadingEvents ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-3">
                {events.map((evt, idx) => (
                  <div key={idx} className="bg-black/30 border border-white/5 p-3 rounded-lg">
                    <p className="text-sm text-slate-200 mb-1">{evt.message}</p>
                    <p className="text-[10px] text-slate-500">{new Date(evt.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">Nenhum evento registrado ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
