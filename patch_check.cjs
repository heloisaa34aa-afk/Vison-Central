const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryManager.tsx', 'utf8');

code = code.replace(/import {([^}]+)} from 'lucide-react';/, (match, icons) => {
  if (!icons.includes('Check')) icons += ', Check';
  return `import {${icons}} from 'lucide-react';`;
});

fs.writeFileSync('src/components/LibraryManager.tsx', code);
