const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

if (!code.includes('FileText')) {
  code = code.replace(/import {([^}]+)} from 'lucide-react';/, (match, icons) => {
    return `import {${icons}, FileText} from 'lucide-react';`;
  });
  fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
}
