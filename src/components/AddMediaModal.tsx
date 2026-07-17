import React, { useState } from 'react';
import { X, Image as ImageIcon, Video, FileText, Globe, Instagram, Youtube, Map, Palette, BarChart, PieChart, Rss, CloudSun, Link as LinkIcon, Upload } from 'lucide-react';
import { Midia } from '../types';

interface AddMediaModalProps {
  onClose: () => void;
  onSave: (media: Omit<Midia, 'id' | 'clienteId'>) => void;
}

const MEDIA_TYPES = [
  { id: 'image', label: 'Imagem', icon: ImageIcon },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'google_maps', label: 'Google Maps', icon: Map },
  { id: 'canva', label: 'Canva', icon: Palette },
  { id: 'powerbi', label: 'Power BI', icon: BarChart },
  { id: 'looker', label: 'Looker Studio', icon: PieChart },
  { id: 'rss', label: 'RSS', icon: Rss },
  { id: 'weather', label: 'Clima', icon: CloudSun },
  { id: 'website', label: 'Outros Links Públicos', icon: LinkIcon },
];

export default function AddMediaModal({ onClose, onSave }: AddMediaModalProps) {
  const [tipo, setTipo] = useState<Midia['tipo']>('website');
  
  // Generic fields
  const [nome, setNome] = useState('');
  const [url, setUrl] = useState('');
  const [duracao, setDuracao] = useState(10);
  
  // Specific fields
  const [youtubePlayType, setYoutubePlayType] = useState('video');
  const [mapZoom, setMapZoom] = useState('14');
  const [rssMaxNews, setRssMaxNews] = useState(5);
  const [weatherCity, setWeatherCity] = useState('São Paulo');
  const [weatherSource, setWeatherSource] = useState('hgbrasil');
  const [weatherUpdate, setWeatherUpdate] = useState('15');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalUrl = url.trim();
    let metadata: any = {};

    if (tipo === 'youtube') {
      metadata = { playType: youtubePlayType, url: finalUrl };
      finalUrl = JSON.stringify(metadata);
    } else if (tipo === 'google_maps') {
      metadata = { zoom: mapZoom, url: finalUrl };
      finalUrl = JSON.stringify(metadata);
    } else if (tipo === 'rss') {
      metadata = { maxNews: rssMaxNews, feed: finalUrl };
      finalUrl = JSON.stringify(metadata);
    } else if (tipo === 'weather') {
      metadata = { city: weatherCity, source: weatherSource, updateRate: weatherUpdate };
      finalUrl = JSON.stringify(metadata);
    } else if (tipo === 'website' || tipo === 'instagram' || tipo === 'canva' || tipo === 'powerbi' || tipo === 'looker' || tipo === 'pdf') {
      metadata = { url: finalUrl };
      finalUrl = JSON.stringify(metadata);
    }

    onSave({
      nome,
      url: finalUrl,
      tipo,
      duracao: Number(duracao),
      origem: 'url',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d0d12] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            Adicionar Mídia
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar with Types */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#050508]/50 p-2 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2">Selecione o Tipo</div>
            <div className="space-y-1">
              {MEDIA_TYPES.map(t => {
                const Icon = t.icon;
                const isSelected = tipo === t.id && (t.label !== 'Outros Links Públicos' || tipo === 'website'); // Simplified logic
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setTipo(t.id as any);
                      // Reset generic fields that might not apply
                    }}
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
          <div className="flex-1 p-6 overflow-y-auto bg-[#0d0d12]">
            <form id="media-form" onSubmit={handleSubmit} className="space-y-5">
              
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

              {/* Dynamic Fields */}
              {tipo === 'weather' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cidade</label>
                    <input 
                      type="text" 
                      required
                      value={weatherCity}
                      onChange={e => setWeatherCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fonte</label>
                      <select 
                        value={weatherSource}
                        onChange={e => setWeatherSource(e.target.value)}
                        className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="hgbrasil">HG Brasil</option>
                        <option value="openweathermap">OpenWeather</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Atualização</label>
                      <select 
                        value={weatherUpdate}
                        onChange={e => setWeatherUpdate(e.target.value)}
                        className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="15">A cada 15 min</option>
                        <option value="30">A cada 30 min</option>
                        <option value="60">A cada 1 hora</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {tipo === 'rss' ? 'URL do Feed RSS' : 
                     tipo === 'instagram' ? 'URL do Perfil ou Post' : 
                     tipo === 'youtube' ? 'URL do YouTube' :
                     tipo === 'canva' ? 'Link Publicado' :
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
              )}

              {tipo === 'youtube' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Reproduzir</label>
                  <select 
                    value={youtubePlayType}
                    onChange={e => setYoutubePlayType(e.target.value)}
                    className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="video">Vídeo</option>
                    <option value="playlist">Playlist</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              )}

              {tipo === 'google_maps' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Zoom (opcional)</label>
                  <input 
                    type="number" 
                    value={mapZoom}
                    onChange={e => setMapZoom(e.target.value)}
                    placeholder="14"
                    min="1"
                    max="20"
                    className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {tipo === 'rss' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Quantidade Máxima de Notícias</label>
                  <input 
                    type="number" 
                    value={rssMaxNews}
                    onChange={e => setRssMaxNews(Number(e.target.value))}
                    min="1"
                    max="20"
                    className="w-full bg-[#050508]/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {tipo !== 'weather' && (
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
              )}

            </form>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-white/10 bg-[#050508]/80">
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
  );
}
