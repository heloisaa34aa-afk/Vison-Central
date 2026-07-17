const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientPlaylists.tsx', 'utf8');

// Ensure icons are imported
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

// Add getIconForType
const iconFunc = `
  const getIconForType = (tipo: string, sizeClass = "w-4 h-4") => {
    switch (tipo) {
      case 'instagram': return <Instagram className={\`\${sizeClass} text-pink-500\`} />;
      case 'youtube': return <Youtube className={\`\${sizeClass} text-red-500\`} />;
      case 'google_maps': return <Map className={\`\${sizeClass} text-green-500\`} />;
      case 'canva': return <Palette className={\`\${sizeClass} text-blue-400\`} />;
      case 'image': return <ImageIcon className={\`\${sizeClass} text-emerald-500 shrink-0\`} />;
      case 'video': return <FileVideo className={\`\${sizeClass} text-blue-500 shrink-0\`} />;
      case 'website':
      default: return <Globe className={\`\${sizeClass} text-blue-500\`} />;
    }
  };
`;

const handleCreatePlaylistPos = code.indexOf('const handleCreatePlaylist');
code = code.slice(0, handleCreatePlaylistPos) + iconFunc + code.slice(handleCreatePlaylistPos);

// In media selector list
// const isImage = m.tipo === 'image';
// {isImage ? (
//   <ImageIcon className="w-4 h-4 text-emerald-500" />
// ) : (
//   <FileVideo className="w-4 h-4 text-blue-500" />
// )}
code = code.replace(
  `{isImage ? (
                                <ImageIcon className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <FileVideo className="w-4 h-4 text-blue-500" />
                              )}`,
  `{getIconForType(m.tipo)}`
);

// We need to also patch the visual preview block
// <div className="w-8 h-8 bg-[#0d0d12] rounded overflow-hidden shrink-0 flex items-center justify-center">
// {m.tipo === 'image' ? (
//   <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
// ) : (
//   <FileVideo className="w-4 h-4 text-slate-500" />
// )}
// </div>
code = code.replace(
  `{m.tipo === 'image' ? (
                                <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                              ) : (
                                <FileVideo className="w-4 h-4 text-slate-500" />
                              )}`,
  `{m.tipo === 'image' ? (
                                <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                              ) : m.tipo === 'video' ? (
                                <FileVideo className="w-4 h-4 text-slate-500" />
                              ) : (
                                getIconForType(m.tipo, "w-4 h-4")
                              )}`
);

// One more place: the display of items inside the playlist
// {m.tipo === 'image' ? (
//   <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
// ) : (
//   <div className="w-full h-full flex items-center justify-center bg-[#050508]">
//     <FileVideo className="w-4 h-4 text-slate-500" />
//   </div>
// )}
code = code.replace(
  `{m.tipo === 'image' ? (
                                  <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-[#050508]">
                                    <FileVideo className="w-4 h-4 text-slate-500" />
                                  </div>
                                )}`,
  `{m.tipo === 'image' ? (
                                  <img src={m.url} alt={m.nome} className="w-full h-full object-cover" />
                                ) : m.tipo === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-[#050508]">
                                    <FileVideo className="w-4 h-4 text-slate-500" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#050508]">
                                    {getIconForType(m.tipo, "w-4 h-4")}
                                  </div>
                                )}`
);

fs.writeFileSync('src/components/client/ClientPlaylists.tsx', code);
