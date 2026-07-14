const fs = require('fs');
let code = fs.readFileSync('src/components/ScreenSimulator.tsx', 'utf8');

// Replace isDirty definition with const isDirty = false;
code = code.replace(/const isDirty = activeTv && \([\s\S]*?tvTextoInferiorVisivel !== \(activeTv\.texto_inferior_visivel \|\| false\)\n  \);/m, 'const isDirty = false;');

// Remove autoSyncInterval useEffect
code = code.replace(/\/\/ 8\. Auto-synchronization every 60 seconds if changes are pending[\s\S]*?tvTextoInferiorAlinhamento, tvTextoInferiorVisivel\n  \]\);/m, '');

fs.writeFileSync('src/components/ScreenSimulator.tsx', code);
