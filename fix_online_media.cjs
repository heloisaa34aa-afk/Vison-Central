const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

code = code.replace(
  /const onlineMedia = clientMedia\.filter\(m => \['website', 'instagram', 'youtube', 'google_maps', 'canva'\]\.includes\(m\.tipo\)\);/,
  "const onlineMedia = clientMedia.filter(m => !['image', 'video'].includes(m.tipo));"
);

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
