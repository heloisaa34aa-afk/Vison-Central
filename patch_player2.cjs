const fs = require('fs');
const file = 'vision-central-web/src/components/Player.tsx';
let data = fs.readFileSync(file, 'utf8');

// Fix type assignment for Tv | null (again because the previous replace might have missed it if it was slightly different)
data = data.replace(
  "tv={tvData}",
  "tv={tvData as Tv}"
);

fs.writeFileSync(file, data);
