const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

const startIndex = code.indexOf('{showAddLink && (');
if (startIndex !== -1) {
  const endIndex = code.indexOf('</form>\n          </div>\n        </div>\n      )}');
  if (endIndex !== -1) {
    code = code.substring(0, startIndex) + code.substring(endIndex + 46);
  }
}

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
