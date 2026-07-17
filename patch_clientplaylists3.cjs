const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientPlaylists.tsx', 'utf8');

const target = `{m.tipo === 'image' ? (
                              <img src={m.url} alt={m.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <video src={m.url} className="w-full h-full object-cover" />
                            )}`;

const newTarget = `{m.tipo === 'image' ? (
                              <img src={m.url} alt={m.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : m.tipo === 'video' ? (
                              <video src={m.url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black/40">
                                {getIconForType(m.tipo, "w-6 h-6")}
                              </div>
                            )}`;

code = code.replace(target, newTarget);
fs.writeFileSync('src/components/client/ClientPlaylists.tsx', code);
