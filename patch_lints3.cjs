const fs = require('fs');

// Fix MediaRenderer.tsx
let mediaCode = fs.readFileSync('src/components/MediaRenderer.tsx', 'utf8');
mediaCode = mediaCode.replace(
  "} else if (media.tipo === 'youtube' || embedUrl.includes('youtube.com/watch')) {",
  "} else if (embedUrl.includes('youtube.com/watch')) {"
);
mediaCode = mediaCode.replace(
  "} else if (media.tipo === 'youtube' || embedUrl.includes('youtu.be/')) {",
  "} else if (embedUrl.includes('youtu.be/')) {"
);
fs.writeFileSync('src/components/MediaRenderer.tsx', mediaCode);
