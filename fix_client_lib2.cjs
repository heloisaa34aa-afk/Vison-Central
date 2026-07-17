const fs = require('fs');
let code = fs.readFileSync('src/components/client/ClientLibrary.tsx', 'utf8');

const regex = /const handleSaveModal = \(mediaData: Omit<Midia, 'id' \| 'clienteId'>\) => \{[\s\S]+?setShowAddMediaModal\(false\);\n  \};/;
const newLogic = `const handleSaveModal = async (mediaData: Omit<Midia, 'id' | 'clienteId'>) => {
    const newMedia: Midia = {
      ...mediaData,
      id: \`m-\${Date.now()}\`,
      clienteId: client.id
    };
    try {
      const saved = await storageService.saveMidia(newMedia);
      if (saved) {
        onUpdateMedia(prev => [newMedia, ...prev]);
        setShowAddMediaModal(false);
        showToast('Conteúdo cadastrado com sucesso!');
      } else {
        showToast('Erro ao salvar no banco de dados.');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar');
    }
  };`;

code = code.replace(regex, newLogic);
fs.writeFileSync('src/components/client/ClientLibrary.tsx', code);
