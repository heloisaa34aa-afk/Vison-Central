const fs = require('fs');

// Fix ClientPlaylists.tsx
let clientCode = fs.readFileSync('src/components/client/ClientPlaylists.tsx', 'utf8');
const importMatch = clientCode.match(/import {([^}]+)} from 'lucide-react';/);
if (importMatch) {
  let icons = importMatch[1];
  if (!icons.includes('FileVideo')) {
    icons += ', FileVideo';
  }
  clientCode = clientCode.replace(importMatch[0], "import {" + icons + "} from 'lucide-react';");
  fs.writeFileSync('src/components/client/ClientPlaylists.tsx', clientCode);
}
