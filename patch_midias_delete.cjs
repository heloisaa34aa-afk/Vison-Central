const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vision-central-web/src/services/supabase/midias.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldDeleteMidia = /async deleteMidia\(id: string\): Promise<boolean> \{[\s\S]*?^\s*\};/m;

const newDeleteMidia = `async deleteMidia(id: string): Promise<boolean> {
    try {
      // 1. Obter a mídia primeiro
      const { data: mediaData, error: fetchError } = await supabase
        .from('midias')
        .select('url_storage, origem')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.warn('Erro ao buscar mídia para exclusão:', fetchError);
        return false;
      }

      // 2. Deletar do storage se houver url_storage
      if (mediaData && mediaData.url_storage) {
        const storageDeleted = await storageServiceSupabase.deleteMediaFile(mediaData.url_storage);
        if (!storageDeleted) {
          console.warn('Falha ao excluir arquivo físico da mídia.');
          return false;
        }
      }

      // 3. Deletar os vínculos em playlist_midias
      const { error: playlistError } = await supabase.from('playlist_midias').delete().eq('midia_id', id);
      if (playlistError) {
        console.warn('Erro ao deletar vínculos de playlist_midias:', playlistError);
        return false;
      }

      // 4. Deletar do banco de dados
      const { error: deleteError } = await supabase.from('midias').delete().eq('id', id);
      if (deleteError) {
        console.warn('Erro ao deletar mídia do banco:', deleteError);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Exceção ao deletar mídia:', e);
      return false;
    }
  }
};`;

// Wait, the regex might not match correctly because of the closing brace of the object.
// Let's use a simpler replacement strategy.
