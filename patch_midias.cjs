const fs = require('fs');
let code = fs.readFileSync('src/services/supabase/midias.ts', 'utf8');

code = code.replace(
  `    url: db.url_storage || '',`,
  `    url: db.origem === 'url' ? (db.url_externa || '') : (db.url_storage || ''),
    origem: db.origem || 'storage',
    url_storage: db.url_storage || null,
    url_externa: db.url_externa || null,`
);

code = code.replace(
  `    url_storage: midia.url,`,
  `    origem: midia.origem || 'storage',
    url_storage: midia.origem === 'url' ? null : (midia.url_storage || midia.url),
    url_externa: midia.origem === 'url' ? (midia.url_externa || midia.url) : null,`
);

fs.writeFileSync('src/services/supabase/midias.ts', code);
