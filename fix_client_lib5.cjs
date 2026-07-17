const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

code = code.replace(/      \}\)\{/, '');

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
