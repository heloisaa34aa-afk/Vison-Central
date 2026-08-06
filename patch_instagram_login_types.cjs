const fs = require('fs');
const file = 'vision-central-web/src/components/InstagramLogin.tsx';
let data = fs.readFileSync(file, 'utf8');

// Fix type assignment for Playlist[]
data = data.replace(
  "if (data) setPlaylists(data);",
  "if (data) setPlaylists(data as any[]);"
);

fs.writeFileSync(file, data);
