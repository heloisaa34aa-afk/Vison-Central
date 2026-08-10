const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vision-central-web', 'src', 'components', 'RelatorioReproducao.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "const [hasSearched, setHasSearched] = useState(false);",
  "const [hasSearched, setHasSearched] = useState(false);\n  const [loadingPdf, setLoadingPdf] = useState(false);"
);

fs.writeFileSync(filePath, content);
console.log('Patched RelatorioReproducao.tsx state');
