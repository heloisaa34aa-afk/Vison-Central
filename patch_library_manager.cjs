const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryManager.tsx', 'utf8');

// Imports
const importMatch = code.match(/import {([^}]+)} from 'lucide-react';/);
if (importMatch && !code.includes('AddMediaModal')) {
  code = code.replace(importMatch[0], `${importMatch[0]}\nimport AddMediaModal from './AddMediaModal';`);
}

// The handleCreateMedia has e.preventDefault() and reads from state.
// Let's replace the whole modal block with AddMediaModal.

// find handleCreateMedia
const handleCreateMediaRegex = /const handleCreateMedia = \(e: React\.FormEvent\) => \{[\s\S]+?setShowAddMedia\(false\);\n  \};/;
code = code.replace(handleCreateMediaRegex, `const handleSaveModal = (mediaData: Omit<Midia, 'id' | 'clienteId'>) => {
    const newMedia = {
      ...mediaData,
      id: \`m-\${Date.now()}\`,
    };
    onAddMedia(newMedia as Midia);
    setShowAddMedia(false);
  };`);

// Remove unused state
code = code.replace(/const \[mediaName, setMediaName\] = useState\(''\);\n/, '');
code = code.replace(/const \[mediaUrl, setMediaUrl\] = useState\(''\);\n/, '');
code = code.replace(/const \[mediaType, setMediaType\] = useState<Midia\['tipo'\]>\('image'\);\n/, '');
code = code.replace(/const \[mediaDuration, setMediaDuration\] = useState\(10\);\n/, '');

// Replace the modal JSX block
const modalJsxRegex = /{showAddMedia && \([\s\S]+?\}\)}/;
code = code.replace(modalJsxRegex, `{showAddMedia && (
              <AddMediaModal 
                onClose={() => setShowAddMedia(false)}
                onSave={handleSaveModal}
              />
            )}`);

fs.writeFileSync('src/components/LibraryManager.tsx', code);
