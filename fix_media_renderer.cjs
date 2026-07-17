const fs = require('fs');
let code = fs.readFileSync('src/components/MediaRenderer.tsx', 'utf8');

code = code.replace(/import WebsiteRenderer from '\.\/renderers\/WebsiteRenderer';/, "import OnlineRenderer from './renderers/OnlineRenderer';");
code = code.replace(/<WebsiteRenderer /g, "<OnlineRenderer ");
code = code.replace(/WebsiteRenderer/g, "OnlineRenderer");

fs.writeFileSync('src/components/MediaRenderer.tsx', code);
