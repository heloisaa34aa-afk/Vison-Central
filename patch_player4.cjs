const fs = require('fs');
const file = 'vision-central-web/src/components/Player.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  "tv={activeDevice}",
  "tv={activeDevice as Tv}"
);

fs.writeFileSync(file, data);
