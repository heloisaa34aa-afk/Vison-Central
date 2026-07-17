const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientPlaylists.tsx', 'utf8');

const mTipoReplace1 = `{m.tipo === 'image' ? (
                            <img src={m.url} alt={m.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <video src={m.url} className="w-full h-full object-cover" />
                          )}`;

const newMTipoReplace1 = `{m.tipo === 'image' ? (
                            <img src={m.url} alt={m.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : m.tipo === 'video' ? (
                            <video src={m.url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/40">
                              {getIconForType(m.tipo, "w-4 h-4")}
                            </div>
                          )}`;

code = code.replace(mTipoReplace1, newMTipoReplace1);
code = code.replace(mTipoReplace1, newMTipoReplace1); // In case it appears multiple times

fs.writeFileSync('src/components/client/ClientPlaylists.tsx', code);
