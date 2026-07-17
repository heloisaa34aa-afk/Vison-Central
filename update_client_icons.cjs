const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientPlaylists.tsx', 'utf8');

const importMatch = code.match(/import {([^}]+)} from 'lucide-react';/);
if (importMatch) {
  let icons = importMatch[1];
  if (!icons.includes('FileText')) icons += ', FileText, BarChart, PieChart, Rss, CloudSun';
  code = code.replace(importMatch[0], `import {${icons}} from 'lucide-react';`);
}

code = code.replace(/case 'website':[\s\S]+?default:/, 
`case 'pdf': return <FileText className={\`\${sizeClass} text-red-400\`} />;
      case 'powerbi': return <BarChart className={\`\${sizeClass} text-yellow-500\`} />;
      case 'looker': return <PieChart className={\`\${sizeClass} text-blue-500\`} />;
      case 'rss': return <Rss className={\`\${sizeClass} text-orange-500\`} />;
      case 'weather': return <CloudSun className={\`\${sizeClass} text-cyan-400\`} />;
      case 'website':
      default:`);

fs.writeFileSync('src/components/client/ClientPlaylists.tsx', code);
