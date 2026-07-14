const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenSimulator.tsx', 'utf8');

const startTag = '{/* Display Media Container */}';
const endTag = '{/* Simulation Playback controls */}';

const startIdx = code.indexOf(startTag);
const endIdx = code.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{/* Display Media Container */}
                    <div className="absolute inset-0 z-10 bg-slate-950 overflow-hidden" style={{ containerType: 'size' }}>
                      {(() => {
                        const activeOnlineContent = tvConteudoOnline.find(c => c.active);
                        if (!activeOnlineContent && mediaList.length === 0) {
                          return (
                            <div className="flex h-full items-center justify-center">
                              <div className="text-center text-gray-500 p-4 space-y-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tv w-10 h-10 mx-auto text-gray-700 animate-pulse"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
                                <p className="text-[10px] font-bold text-slate-400">Sem Programação Ativa</p>
                                <p className="text-[8px] text-gray-600">Vincule uma playlist para iniciar a transmissão.</p>
                              </div>
                            </div>
                          );
                        }

                        const previewTv = {
                          ...activeTv,
                          orientacao: tvOrientacao,
                          proporcao: tvProporcao,
                          brilho: tvBrilho,
                          contraste: tvContraste,
                          saturacao: tvSaturacao,
                          zoom: tvZoom,
                          volume: tvVolume,
                          rotacao: tvRotacao,
                        };

                        return (
                          <MediaRenderer 
                            tv={previewTv} 
                            media={currentMedia} 
                            onlineContent={activeOnlineContent} 
                            isWebPlayer={false}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              `;
              
    code = code.slice(0, startIdx) + replacement + code.slice(endIdx);
    fs.writeFileSync('src/components/ScreenSimulator.tsx', code);
    console.log("Fixed cleanly");
}
