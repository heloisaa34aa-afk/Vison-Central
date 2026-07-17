const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryManager.tsx', 'utf8');

// Imports Globe, Instagram, Youtube, Map, Palette if not present
const importMatch = code.match(/import {([^}]+)} from 'lucide-react';/);
if (importMatch) {
  let icons = importMatch[1];
  if (!icons.includes('Globe')) icons += ', Globe';
  if (!icons.includes('Instagram')) icons += ', Instagram';
  if (!icons.includes('Youtube')) icons += ', Youtube';
  if (!icons.includes('Map')) icons += ', Map';
  if (!icons.includes('Palette')) icons += ', Palette';
  code = code.replace(importMatch[0], `import {${icons}} from 'lucide-react';`);
}

// getIconForType function
const iconFunc = `
  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-red-500" />;
      case 'google_maps': return <Map className="w-5 h-5 text-green-500" />;
      case 'canva': return <Palette className="w-5 h-5 text-blue-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'video': return <FileVideo className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'website':
      default: return <Globe className="w-5 h-5 text-blue-500" />;
    }
  };
`;

const handleCreateMediaPos = code.indexOf('const handleCreateMedia');
code = code.slice(0, handleCreateMediaPos) + iconFunc + code.slice(handleCreateMediaPos);

// In the media grid Cards
const mediaGridBlock = `                  {m.tipo === 'image' ? (
                    <img 
                      src={m.url} 
                      alt={m.nome} 
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <video 
                      src={m.url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      muted 
                    />
                  )}`;

const newMediaGridBlock = `                  {m.tipo === 'image' ? (
                    <img 
                      src={m.url} 
                      alt={m.nome} 
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                  ) : m.tipo === 'video' ? (
                    <video 
                      src={m.url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      muted 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050508] gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {getIconForType(m.tipo)}
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{m.tipo}</span>
                    </div>
                  )}`;

code = code.replace(mediaGridBlock, newMediaGridBlock);

// In Playlist Maker Modal
const playlistMakerBlock = `                              {m.tipo === 'image' ? (
                                <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                              ) : (
                                <FileVideo className="w-4 h-4 text-slate-500" />
                              )}`;

const newPlaylistMakerBlock = `                              {m.tipo === 'image' ? (
                                <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                  {getIconForType(m.tipo)}
                                </div>
                              )}`;
code = code.replace(playlistMakerBlock, newPlaylistMakerBlock);

// Also in the Sequence list
const sequenceBlock = `{m.tipo === 'video' ? <FileVideo className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}`;
const newSequenceBlock = `{getIconForType(m.tipo)}`;
code = code.replace(sequenceBlock, newSequenceBlock);

// One more place: m.tipo === 'video' && ( icon overlay )
const videoOverlayBlock = `{m.tipo === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                        <FileVideo className="w-4 h-4 text-white animate-pulse" />
                      </div>
                    </div>
                  )}`;
// Just leave video overlay as is, no problem.

fs.writeFileSync('src/components/LibraryManager.tsx', code);
