const fs = require('fs');

let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

// Imports
const importMatch = code.match(/import {([^}]+)} from 'lucide-react';/);
if (importMatch) {
  let icons = importMatch[1];
  if (!icons.includes('Plus')) icons += ', Plus';
  code = code.replace(importMatch[0], `import {${icons}} from 'lucide-react';\nimport AddMediaModal from '../AddMediaModal';`);
}

// Replace handleSaveLink state and logic
code = code.replace(/const \[showAddLink, setShowAddLink\] = useState\(false\);/, 'const [showAddMediaModal, setShowAddMediaModal] = useState(false);');

const addLinkLogicRegex = /const handleSaveLink[\s\S]+?};/;
code = code.replace(addLinkLogicRegex, `const handleSaveModal = (mediaData: Omit<Midia, 'id' | 'clienteId'>) => {
    const newMedia = {
      ...mediaData,
      id: \`m-\${Date.now()}\`,
    };
    onAddMedia(newMedia as Midia);
    setShowAddMediaModal(false);
  };`);

// Replace the JSX for the add link modal
const jsxModalRegex = /{showAddLink && \([\s\S]+?\}\)}/;
code = code.replace(jsxModalRegex, `{showAddMediaModal && (
        <AddMediaModal 
          onClose={() => setShowAddMediaModal(false)}
          onSave={handleSaveModal}
        />
      )}`);

// Replace the button that triggers it
code = code.replace(/<button[\s]+onClick={\(\) => setShowAddLink\(true\)}[\s\S]+?Adicionar Link[\s]+<\/button>/, `<button
          onClick={() => setShowAddMediaModal(true)}
          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar Mídia / Online
        </button>`);

// Fix occurrences of showAddLink variables
code = code.replace(/linkError/g, 'modalError');
code = code.replace(/linkName/g, 'modalName');
code = code.replace(/linkUrl/g, 'modalUrl');
code = code.replace(/linkDuration/g, 'modalDuration');

fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
