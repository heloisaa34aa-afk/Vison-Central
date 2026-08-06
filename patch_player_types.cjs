const fs = require('fs');
const file = 'vision-central-web/src/components/Player.tsx';
let data = fs.readFileSync(file, 'utf8');

// Fix type assignment for Tv | null
data = data.replace(
  "tv={tvData}",
  "tv={tvData as Tv}"
);

fs.writeFileSync(file, data);
