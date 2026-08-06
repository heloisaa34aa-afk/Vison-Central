const fs = require('fs');
const file = 'vision-central-web/src/components/Player.tsx';
let data = fs.readFileSync(file, 'utf8');

// Fix type assignment for Tv | null using a non-null assertion or type cast at the specific line 430
data = data.replace(
  "tv={tvData}",
  "tv={tvData!}"
);

fs.writeFileSync(file, data);
