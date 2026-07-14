const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenSimulator.tsx', 'utf8');

// Insert import at the top
if (!code.includes("import MediaRenderer")) {
  code = code.replace(/import \{ isTvOnline \} from '\.\.\/utils\/tvStatus';/, "import { isTvOnline } from '../utils/tvStatus';\nimport MediaRenderer from './MediaRenderer';");
}

const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Display Media Container */}'));
// find the div closure for Display Media Container, which is just before the next `</div>` sequence.
// Actually, I can just slice lines until I find line 1092 which is `                    </div>`
const block = `                    {/* Display Media Container */}
                    <div className="absolute inset-0 z-10 bg-slate-950 overflow-hidden" style={{ containerType: 'size' }}>
                      {(() => {
                        const activeOnlineContent = tvConteudoOnline.find(c => c.active);
                        if (!activeOnlineContent && mediaList.length === 0) {
                          return (
                            <div className="flex h-full items-center justify-center">
                              <div className="text-center text-gray-500 p-4 space-y-2">
                                <MediaRenderer tv={{}} /> {/* dummy to avoid unused import if needed, actually we just render icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tv w-10 h-10 mx-auto text-gray-700 animate-pulse"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
                                <p className="text-[10px] font-bold text-slate-400">Sem Programação Ativa</p>
                                <p className="text-[8px] text-gray-600">Vincule uma playlist para iniciar a transmissão.</p>
                              </div>
                            </div>
                          );
                        }

                        // We create a temporary Tv object with the current form states
                        // This allows the preview to reflect unsaved changes in real time
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
                    </div>`;

if (startIdx !== -1) {
  // Let's replace the lines
  // We know startIdx is 995 (0-indexed). We know the end is 1091 (0-indexed).
  // So we replace lines from startIdx to 1091.
  
  // Actually let's just find `})()` and the `</div>` after it
  let endIdx = startIdx;
  while(endIdx < lines.length && !lines[endIdx].includes('                  </div>')) {
    endIdx++;
  }
  // endIdx is now pointing to 1093. Wait, line 1092 is `                    </div>`
  
  lines.splice(startIdx, endIdx - startIdx, block);
  
  fs.writeFileSync('src/components/ScreenSimulator.tsx', lines.join('\n'));
} else {
  console.log("Could not find startIdx");
}
