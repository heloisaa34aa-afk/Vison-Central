const fs = require('fs');
let code = fs.readFileSync('src/components/AddMediaModal.tsx', 'utf8');

// Remove specific states
code = code.replace(/  const \[youtubePlayType[\s\S]+?setWeatherUpdate\('15'\);/, '');

fs.writeFileSync('src/components/AddMediaModal.tsx', code);
