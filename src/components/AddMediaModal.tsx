import React, { useState } from 'react';
import { X, Image as ImageIcon, Video, FileText, Globe, Instagram } from 'lucide-react';
import { Midia } from '../types';

interface AddMediaModalProps {
  onClose: () => void;
  onSave: (media: Omit<Midia, 'id' | 'clienteId'>) => void;
}

const MEDIA_TYPES = [
  { id: 'image', label: 'Imagem', icon: ImageIcon },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'website', label: 'Website/URL', icon: Globe },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
];

export default function AddMediaModal({ onClose, onSave }: AddMediaModalProps) {
  const [tipo, setTipo] = useState<Midia['tipo']>('website');
  
  const [nome, setNome] = useState('');
  const [url, setUrl] = useState('');
  const [duracao, setDuracao] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = url.trim();

    onSave({
      nome: nome.trim(),
      url: finalUrl,
      tipo,
      duracao,
      origem: 'url'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0d0d12] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-48 bg-[#050508] border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tipo de Mídia</h3>
            <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto">
            {MEDIA_TYPES.map(t => {
              const Icon = t.icon;
              const isSelected = tipo === t.id;
              
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Form Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#0d0d12] flex flex-col">
          <form id="media-form" onSubmit={handleSubmit} className="space-y-5 flex-1">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nome / Título</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Nome da Mídia"
                className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {tipo === 'instagram' ? 'URL do Perfil ou Post' :
                 tipo === 'pdf' ? 'URL do PDF Público' :
                 tipo === 'image' || tipo === 'video' ? 'URL Pública do Arquivo' :
                 'URL do Website'}
              </label>
              <input 
                type="url" 
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Tempo de Exibição (Segundos)</label>
              <input 
                type="number" 
                min={1}
                required
                value={duracao}
                onChange={e => setDuracao(Number(e.target.value))}
                className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

          </form>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="media-form"
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Salvar Mídia
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
