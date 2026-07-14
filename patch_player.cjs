const fs = require('fs');
let code = fs.readFileSync('src/components/Player.tsx', 'utf8');

// Insert import at the top
if (!code.includes("import MediaRenderer")) {
  code = code.replace(/import \{ Tv, Midia, Playlist \} from '\.\.\/types';/, "import { Tv, Midia, Playlist } from '../types';\nimport MediaRenderer from './MediaRenderer';");
}

const blockToReplaceStr = `<div \n        className="flex items-center justify-center transition-all duration-500"`;
const startPoint = code.indexOf(blockToReplaceStr);
if (startPoint === -1) {
    console.log("Could not find start block");
} else {
    const endPoint1 = code.indexOf('return null;\n          })()}', startPoint);
    const endPoint2 = code.indexOf('</div>', endPoint1);
    const endPoint3 = code.indexOf('</div>', endPoint2 + 6);
    
    if (endPoint3 !== -1) {
      const newBlock = `<div className="absolute inset-0 overflow-hidden" style={{ containerType: 'size' }}>
        <MediaRenderer 
          tv={activeDevice}
          media={currentMedia}
          onlineContent={activeOnlineContent}
          onMediaError={handleMediaError}
          onVideoEnded={handleVideoEnded}
          isWebPlayer={true}
        />
      </div>`;
      
      code = code.slice(0, startPoint) + newBlock + code.slice(endPoint3 + 6);
      fs.writeFileSync('src/components/Player.tsx', code);
    } else {
      console.log("Could not find end point in Player.tsx");
    }
}
