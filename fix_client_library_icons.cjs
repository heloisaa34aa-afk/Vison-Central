const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

code = code.replace(/    switch \(tipo\) \{[\s\S]+?  \};/, `    switch (tipo) {
      case 'instagram': return <Instagram className="w-8 h-8 text-pink-500" />;
      case 'pdf': return <FileText className="w-8 h-8 text-rose-500" />;
      case 'website':
      default: return <Globe className="w-8 h-8 text-blue-500" />;
    }
  };`);

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
