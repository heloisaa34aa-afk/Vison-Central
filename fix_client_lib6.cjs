const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

code = code.replace(/      \}\)\{/, '');
code = code.replace(/      \}\)\n\{/, '');
code = code.replace(/      \}\)\r\n\{\/\* Barras de Progresso \*\//, '');
code = code.replace('      )}\n{/* Barras de Progresso */}', '{/* Barras de Progresso */}');

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
