const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "tipo: 'image' | 'video' | 'website' | 'instagram' | 'youtube' | 'google_maps' | 'canva';",
  "tipo: 'image' | 'video' | 'website' | 'instagram' | 'youtube' | 'google_maps' | 'canva' | 'pdf' | 'powerbi' | 'looker' | 'rss' | 'weather';\n  metadata?: any;"
);

fs.writeFileSync('src/types.ts', code);
