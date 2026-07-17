const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, group) => {
  if (!group.includes('FileText')) {
    return `import {${group}, FileText} from 'lucide-react';`;
  }
  return match;
});

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
