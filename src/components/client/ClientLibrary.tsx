import React, { useState, useRef } from 'react';
import { Client, Media } from '../../types';
import { UploadCloud, File, Image as ImageIcon, Video, Trash2, X, CheckCircle } from 'lucide-react';
import { storageServiceSupabase } from '../../services/supabase/storage';

interface ClientLibraryProps {
  client: Client;
  media: Media[];
  onUpdateMedia: (updateFn: (prev: Media[]) => Media[]) => void;
  showToast: (msg: string) => void;
}

export default function ClientLibrary({ client, media, onUpdateMedia, showToast }: ClientLibraryProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{name: string, progress: number}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).filter(file => {
      const type = file.type;
      return type.includes('image/jpeg') || type.includes('image/png') || type.includes('image/webp') || type.includes('video/mp4');
    });

    if (newFiles.length === 0) {
      showToast('Nenhum arquivo válido. Aceitamos JPG, PNG, WEBP, MP4.');
      return;
    }

    newFiles.forEach(async (file) => {
      const isVideo = file.type.includes('video');
      const progressName = file.name;
      setUploadingFiles(prev => [...prev, { name: progressName, progress: 10 }]);

      try {
        // Simulate progress up to 80% while upload starts
        let p = 10;
        const interval = setInterval(() => {
          if (p < 80) {
            p += 15;
            setUploadingFiles(prev => prev.map(f => f.name === progressName ? { ...f, progress: p } : f));
          }
        }, 150);

        // Actual upload to Supabase storage
        const uploadedUrl = await storageServiceSupabase.uploadMediaFile(file);
        
        clearInterval(interval);
        setUploadingFiles(prev => prev.map(f => f.name === progressName ? { ...f, progress: 100 } : f));

        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.name !== progressName));
          
          const newMedia: Media = {
            id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: isVideo ? 'video' : 'image',
            url: uploadedUrl,
            duration: isVideo ? 15 : 10,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          };
          onUpdateMedia(prev => [newMedia, ...prev]);
          showToast(`${file.name} enviado e cadastrado com sucesso!`);
        }, 500);

      } catch (err) {
        setUploadingFiles(prev => prev.filter(f => f.name !== progressName));
        showToast(`Erro ao enviar ${file.name}`);
        console.error(err);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta mídia? Ela pode estar em uso em alguma playlist.')) {
      onUpdateMedia(prev => prev.filter(m => m.id !== id));
      showToast('Mídia excluída da biblioteca.');
    }
  };

  const imageMedia = media.filter(m => m.type === 'image');
  const videoMedia = media.filter(m => m.type === 'video');

  const renderMediaGrid = (items: Media[], icon: React.ReactNode, title: string) => (
    <div className="space-y-4 mb-8">
      <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
        {icon}
        {title}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all relative">
            <div className="aspect-video bg-[#050508] relative overflow-hidden flex items-center justify-center">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
              )}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-slate-200 truncate" title={item.name}>{item.name}</p>
              <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-mono">
                <span>{item.duration}s</span>
                <span>{item.size}</span>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-4 text-xs text-slate-500">Nenhum arquivo nesta categoria.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Upload Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'
        }`}
      >
        <UploadCloud className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
        <h3 className="text-sm font-bold text-white mb-2">Arraste seus arquivos para cá</h3>
        <p className="text-xs text-slate-400 mb-4">Arquivos suportados: JPG, PNG, WEBP, MP4.</p>
        
        <input 
          type="file" 
          multiple 
          accept="image/jpeg,image/png,image/webp,video/mp4" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Selecionar Arquivos
        </button>
      </div>

      {/* Progress Bars */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3 bg-[#0d0d12]/80 p-4 rounded-xl border border-white/10">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enviando arquivos...</h4>
          {uploadingFiles.map((file, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                <span className="text-cyan-400 font-mono">{Math.round(file.progress)}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300" 
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Lists */}
      <div className="mt-8">
        {renderMediaGrid(imageMedia, <ImageIcon className="w-4 h-4 text-emerald-400" />, 'Imagens')}
        {renderMediaGrid(videoMedia, <Video className="w-4 h-4 text-purple-400" />, 'Vídeos')}
      </div>
    </div>
  );
}
