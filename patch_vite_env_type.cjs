const fs = require('fs');
const file = 'vision-central-web/src/vite-env.d.ts';
let data = `/// <reference types="vite/client" />
`;
fs.writeFileSync(file, data);
