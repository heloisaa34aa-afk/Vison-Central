const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientPlaylists.tsx', 'utf8');

code = code.replace(/    switch \(tipo\) \{[\s\S]+?  \};/, `    switch (tipo) {
      case 'instagram': return <Instagram className={\`\${sizeClass} text-pink-500\`} />;
      case 'image': return <ImageIcon className={\`\${sizeClass} text-emerald-500 shrink-0\`} />;
      case 'video': return <FileVideo className={\`\${sizeClass} text-blue-500 shrink-0\`} />;
      case 'pdf': return <FileText className={\`\${sizeClass} text-red-400\`} />;
      case 'website':
      default: return <Globe className={\`\${sizeClass} text-blue-500\`} />;
    }
  };`);

fs.writeFileSync('src/components/client/ClientPlaylists.tsx', code);
