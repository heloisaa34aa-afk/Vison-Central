const fs = require('fs');
const file = 'vision-central-web/src/types.ts';
let data = fs.readFileSync(file, 'utf8');
data = data.replace('autoplay?: boolean;', 'autoplay?: boolean;\n  config_revision?: number;');
fs.writeFileSync(file, data);
