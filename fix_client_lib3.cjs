const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

// The `showAddLink` stuff is probably an old Add Link modal in ClientLibrary.tsx that I didn't fully remove/replace correctly.
// Let's just find and replace the whole thing.
code = code.replace(/\{showAddLink && \([\s\S]+?\}\)}/g, '');

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
