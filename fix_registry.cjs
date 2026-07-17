const fs = require('fs');
let code = fs.readFileSync('src/components/renderers/RendererRegistry.ts', 'utf8');
if (!code.includes("import React")) {
  code = "import React from 'react';\n" + code;
}
fs.writeFileSync('src/components/renderers/RendererRegistry.ts', code);
