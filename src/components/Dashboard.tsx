import React from 'react';
import { Client, Device, AlertLog, Media } from '../types';
import { 
  Tv, 
  Users, 
  Radio, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  clients: Client[];
  devices: Device[];
  alerts: AlertLog[];
  media: Media[];
  onNavigate: (tab: string) => void;
  onSelectClientForSim: (clientId: string) => void;
}

export default function Dashboard({ 
  clients, 
  devices, 
  alerts, 
  media, 
  onNavigate,
  onSelectClientForSim 
}: DashboardProps) {
  
  // Calculate statistics
  const activeClients = clients.filter(c => c.status === 'Ativo').length;
  const synchronizingClients = clients.filter(c => c.status === 'Sincronizando').length;
  const totalScreens = clients.reduce((acc, c) => acc + c.screensCount, 0);
  
  const onlineDevices = devices.filter(d => d.status === 'Online').length;
  const warningDevices = devices.filter(d => d.status === 'Warning').length;
  const offlineDevices = devices.filter(d => d.status === 'Offline').length;

  // Distribution by City
  const cityDistribution = clients.reduce((acc: { [key: string]: number }, client) => {
    acc[client.city] = (acc[client.city] || 0) + client.screensCount;
    return acc;
  }, {});

  // Category Distribution
  const categoryDistribution = clients.reduce((acc: { [key: string]: number }, client) => {
    acc[client.category] = (acc[client.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 text-slate-200" id="dashboard-viewport">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full font-medium">
            Rede Ativa · VisionCentral
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-2 font-sans">
            Painel Geral da Rede
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoramento em tempo real de telas, dispositivos e conteúdos corporativos.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate('simulator')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Tv className="w-4 h-4" />
            Simulador de TV
          </button>
          <button 
            onClick={() => onNavigate('ai-helper')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Sliders className="w-4 h-4" />
            Assistente IA Gemini
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
        {/* Metrica 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
          id="stat-clients"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clientes Ativos</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">{activeClients} <span className="text-xs font-normal text-slate-500">/ {clients.length}</span></h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-110 transition-transform border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 border-t border-white/5 pt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>{synchronizingClients} em sincronização</span>
          </div>
        </motion.div>

        {/* Metrica 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
          id="stat-screens"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telas Integradas</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">{totalScreens}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform border border-indigo-500/20">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 border-t border-white/5 pt-3">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Méd. {(totalScreens / (clients.length || 1)).toFixed(1)} telas</span>
            <span>por cliente</span>
          </div>
        </motion.div>

        {/* Metrica 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
          id="stat-devices"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Players Conectados</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">
                {onlineDevices} 
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded ml-2 font-mono">ONLINE</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{warningDevices} Alerta</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{offlineDevices} Offline</span>
            </div>
          </div>
        </motion.div>

        {/* Metrica 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
          id="stat-media"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Biblioteca de Mídia</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">{media.length} <span className="text-xs font-normal text-slate-500">arquivos</span></h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg group-hover:scale-110 transition-transform border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 border-t border-white/5 pt-3">
            <span>{media.filter(m => m.type === 'video').length} Vídeos</span>
            <span>·</span>
            <span>{media.filter(m => m.type === 'image').length} Imagens</span>
          </div>
        </motion.div>
      </div>

      {/* Seção Interativa Central: Distribuição e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribuição de Telas e Categorias */}
        <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl lg:col-span-2 space-y-6 backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Distribuição e Densidade de Sinalização
            </h3>
            <span className="text-xs font-mono text-slate-500">Total: {totalScreens} Telas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Distribuição por Cidade */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Telas por Região Metropolitana
              </h4>
              <div className="space-y-3.5">
                {Object.entries(cityDistribution).map(([city, count]) => {
                  const percentage = Math.round((count / (totalScreens || 1)) * 100);
                  return (
                    <div key={city} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{city}</span>
                        <span className="text-slate-400 font-mono">{count} telas ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribuição por Segmento */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Segmentos de Negócio
              </h4>
              <div className="space-y-3.5">
                {Object.entries(categoryDistribution).map(([cat, clientCount]) => {
                  const percentage = Math.round((clientCount / (clients.length || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{cat}</span>
                        <span className="text-slate-400 font-mono">{clientCount} {clientCount === 1 ? 'cliente' : 'clientes'}</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts to Screens */}
          <div className="bg-white/5 rounded-lg p-4 mt-2 border border-white/5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Telas Ativas Prontas para Simulação:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {clients.slice(0, 4).map(client => (
                <div 
                  key={client.id}
                  onClick={() => onSelectClientForSim(client.id)}
                  className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-blue-500/10 border border-white/5 rounded-lg text-xs cursor-pointer transition-all hover:border-blue-500/30 group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${client.status === 'Ativo' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="font-medium text-slate-300 group-hover:text-white">{client.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 group-hover:text-blue-400 font-mono text-[10px]">
                    <span>{client.orientation}</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feed de Alertas Recentes */}
        <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl flex flex-col justify-between backdrop-blur-xl" id="alerts-feed-panel">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                Alertas da Rede
              </h3>
              <span className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full font-mono font-medium">
                {alerts.filter(a => a.type === 'error').length} Críticos
              </span>
            </div>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs">Nenhum alerta ativo na rede</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      alert.type === 'error' 
                        ? 'bg-rose-950/20 border-rose-500/20 text-rose-200' 
                        : alert.type === 'warning'
                        ? 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                        : 'bg-blue-950/20 border-blue-500/20 text-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-2">
                        {alert.type === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-white">{alert.clientName}</p>
                          <p className="text-slate-400 mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 flex justify-between items-center font-mono">
                      <span>Ref: {alert.clientId}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-4">
            <button 
              onClick={() => onNavigate('clients')}
              className="w-full text-center py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-white/10"
            >
              Gerenciar Dispositivos
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Network Guidelines and Best Practices Information Card */}
      <div className="bg-gradient-to-r from-[#0d0d12]/80 to-blue-950/40 rounded-xl p-6 text-white relative overflow-hidden border border-white/10 backdrop-blur-xl">
        <div className="absolute right-0 bottom-0 opacity-5 translate-x-12 translate-y-12">
          <Tv className="w-80 h-80" />
        </div>
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">Instrução Técnica</span>
          <h3 className="text-lg font-bold text-white">Como funciona a Sinalização Corporate do VisionCentral?</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nossa arquitetura conecta-se a TVs inteligentes Android e totens digitais. Cada dispositivo pareia instantaneamente usando um <strong>código token único</strong> de 6 caracteres. A TV sincroniza os arquivos de mídia em cache local para reproduzir de forma fluida mesmo que a internet caia temporariamente, enquanto o <strong>Ticker Marquee</strong> de rodapé e alertas instantâneos recebem atualizações contínuas via websocket.
          </p>
          <div className="flex gap-4 pt-2">
            <div className="text-xs">
              <span className="block text-cyan-400 font-mono font-bold">100%</span>
              <span className="text-slate-400 text-[10px]">Cachê de Mídia Offline</span>
            </div>
            <div className="text-xs">
              <span className="block text-cyan-400 font-mono font-bold">&lt; 2s</span>
              <span className="text-slate-400 text-[10px]">Latência de Alertas</span>
            </div>
            <div className="text-xs">
              <span className="block text-cyan-400 font-mono font-bold">UltraHD</span>
              <span className="text-slate-400 text-[10px]">Resolução de Imagem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
