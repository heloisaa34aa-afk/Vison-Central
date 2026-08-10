const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vision-central-web', 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix onNavigate
content = content.replace(
  /onNavigate=\{setActiveTab\}/g,
  `onNavigate={(tab) => setActiveTab(tab as any)}`
);

// Fix ClientPage props
content = content.replace(
  /onUpdateClient=\{handleUpdateClient\}[\s\S]*?onUpdateMedia=\{handleUpdateMedia\}/,
  `onUpdateClient={(client) => setClients(prev => prev.map(c => c.id === client.id ? client : c))}
                  onUpdateDevices={setDevices}
                  onUpdatePlaylists={setPlaylists}
                  onUpdateMedia={setMedia}`
);

fs.writeFileSync(filePath, content);
console.log('Patched App.tsx');
