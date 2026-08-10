const fs = require('fs');
const path = require('path');

function patchFile(relativePath, regex, replacement) {
  const filePath = path.join(__dirname, 'vision-central-web', ...relativePath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
  console.log('Patched ' + relativePath.join('/'));
}

const fallbackFunction = `
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText($1).catch(err => console.error("Clipboard error", err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = $1;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error("Fallback clipboard error", err);
      }
      document.body.removeChild(textArea);
    }
`;

patchFile(
  ['src', 'components', 'AIScheduler.tsx'], 
  /navigator\.clipboard\.writeText\((.*?)\);/g, 
  fallbackFunction.replace(/\$1/g, 'text')
);

patchFile(
  ['src', 'components', 'client', 'ClientTokens.tsx'], 
  /navigator\.clipboard\.writeText\((.*?)\);/g, 
  fallbackFunction.replace(/\$1/g, 'token')
);
