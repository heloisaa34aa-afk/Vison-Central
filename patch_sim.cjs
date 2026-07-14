const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenSimulator.tsx', 'utf8');

// Insert import at the top
if (!code.includes("import MediaRenderer")) {
  code = code.replace(/import \{ isTvOnline \} from '\.\.\/utils\/tvStatus';/, "import { isTvOnline } from '../utils/tvStatus';\nimport MediaRenderer from './MediaRenderer';");
}

const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Display Media Container */}'));
const endIdx = lines.findIndex(l => l.includes('{/* Simulation Playback controls */}'));

if (startIdx !== -1 && endIdx !== -1) {
  // We want to replace from startIdx to endIdx - 1 (to keep the `</div>` tags matching? Wait.
  // The original has:
  // 1092                    </div>
  // 1093                  </div>
  // 1094                </div>
  // 1095              </div>
  // 1096
  // 1097              {/* Simulation Playback controls */}
  
  // Wait, let's see which divs to keep.
  // Display Media Container starts a `<div className="absolute inset-0 z-10 bg-slate-950 flex items-center justify-center">`
  // That div ends at 1092.
  // 1093 closes `<div className="relative w-full h-full...`
  // 1094 closes `<div className="absolute inset-0 bg-neutral-950...`
  // 1095 closes `<div ref={containerRef} className="transition-all duration-500 relative flex justify-center items-center...`
  
  // So we only want to replace the `<!-- Display Media Container -->` block, which ends at 1092!
}
