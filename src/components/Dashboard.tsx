import React from 'react';
import { Cliente, Tv, LogAlerta, Midia } from '../types';
import { 
  Tv as TvIcon, 
  Users, 
  Radio, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { isTvOnline } from '../utils/tvStatus';

interface DashboardProps {
  clientes: Cliente[];
  tvs: Tv[];
  alertas?: LogAlerta[];
  midias?: Midia[];
  onNavigate: (tab: string) => void;
  onSelectCliente: (clienteId: string) => void;
}

export default function Dashboard({ 
  clientes, 
  tvs, 
  onNavigate,
  onSelectCliente 
}: DashboardProps) {
  
  // Calcular estatísticas
  const totalTelas = clientes.reduce((acc, c) => acc + c.quantidadeTelas, 0);
  const tvsOnline = tvs.filter(isTvOnline).length;
  const tvsOffline = tvs.length - tvsOnline;

  return (
    <div className="space-y-8 text-slate-200" id="dashboard-viewport">
      {/* Painel do Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full font-medium">
            Rede Ativa · VisionCentral
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-2 font-sans">
            Painel Geral da Rede
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoramento em tempo real de telas e TVs corporativas.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate('simulator')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <TvIcon className="w-4 h-4" />
            Simulador de TV
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
        {/* Métrica 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Clientes</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">{clientes.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-110 transition-transform border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Métrica 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Telas</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">{totalTelas}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform border border-indigo-500/20">
              <TvIcon className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Métrica 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TVs Online</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">
                {tvsOnline} 
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Métrica 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TVs Offline</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 font-sans">{tvsOffline}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg group-hover:scale-110 transition-transform border border-rose-500/20">
              <Radio className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-[#0d0d12]/60 p-6 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
        <h3 className="text-base font-bold text-white font-sans flex items-center gap-2 mb-6">
          <Users className="w-4 h-4 text-blue-400" />
          Clientes Cadastrados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map(cliente => (
            <div key={cliente.id} className="bg-white/5 border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all flex flex-col justify-between min-h-[140px] group">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{cliente.nome}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    cliente.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    cliente.status === 'Inativo' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {cliente.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <TvIcon className="w-3.5 h-3.5" />
                  {cliente.quantidadeTelas} {cliente.quantidadeTelas === 1 ? 'TV' : 'TVs'} vinculadas
                </p>
              </div>
              
              <button 
                onClick={() => onSelectCliente(cliente.id)}
                className="mt-4 w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 rounded-lg text-xs font-semibold transition-all border border-blue-500/20 flex items-center justify-center gap-1.5"
              >
                Abrir Cliente
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
