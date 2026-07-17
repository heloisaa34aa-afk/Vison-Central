const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

code = code.replace(/    try {\n      const saved = await storageService.saveMidia\(newMedia\);[\s\S]+?  \};\n/, '');

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
