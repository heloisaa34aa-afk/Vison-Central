const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vision-central-web', 'src', 'components', 'ScreenSimulator.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Top and Bottom text block
content = content.replace(/\{tvTextoSuperiorVisivel && tvTextoSuperior && \([\s\S]*?\)\}\n\n\s*\{tvTextoInferiorVisivel && tvTextoInferior && \([\s\S]*?\)\}/, '');

// 2. Remove activeOnlineContent resolution and check
content = content.replace(/const activeOnlineContent = tvConteudoOnline\.find[\s\S]*?if \(!activeOnlineContent && mediaList\.length === 0\) \{/, 'if (mediaList.length === 0) {');

// 3. Remove onlineContent from MediaRenderer
content = content.replace(/onlineContent=\{activeOnlineContent\}\s*/, '');

fs.writeFileSync(filePath, content);
console.log("Patched ScreenSimulator.tsx");
