import { supabase } from '../../lib/supabase';
import { API_URL } from '../../config/api';

export const storageServiceSupabase = {
  async ensureBucketExists(): Promise<void> {
    try {
      // Tenta criar o bucket 'midias' se ele não existir
      await supabase.storage.createBucket('midias', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
      });
    } catch (e) {
      // Ignora silenciosamente erros de criação caso o bucket já exista ou não tenha permissão de admin
      console.warn('Aviso ao garantir existência do bucket:', e);
    }
  },

  async uploadMediaFile(file: File, clientId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);

      const response = await fetch(`${API_URL}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Erro ${response.status}: falha no upload para o servidor`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (err) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Não foi possível obter a URL da mídia do backend.');
      }

      return data.url;
    } catch (e: any) {
      console.error('Erro no upload de mídia (via backend R2):', e);
      throw e;
    }
  },

  async deleteMediaFile(fileUrl: string): Promise<boolean> {
    try {
      if (fileUrl.includes('/storage/v1/object/public/')) {
        const parts = fileUrl.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          const pathAndBucket = parts[1];
          const bucketParts = pathAndBucket.split('/');
          const bucket = bucketParts[0];
          const path = bucketParts.slice(1).join('/');
          
          const { error } = await supabase.storage.from(bucket).remove([path]);
          if (error) {
            console.warn('Erro ao deletar do Supabase Storage:', error);
            return false;
          }
          return true;
        }
      } else {
        const response = await fetch(`${API_URL}/api/media`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: fileUrl })
        });
        
        if (!response.ok) {
           let errorMsg = `Erro ${response.status}`;
           try {
             const errData = await response.json();
             if (errData.error) errorMsg = errData.error;
           } catch (e) {}
           console.warn('Erro ao deletar do Cloudflare R2 via backend:', response.status, errorMsg);
           return false;
        }

        try {
          const data = await response.json();
          if (data.deleted === true) {
            return true;
          } else {
            console.warn('Backend não confirmou a exclusão (deleted !== true).', data);
            return false;
          }
        } catch (e) {
          console.warn('Erro ao ler a resposta JSON do backend após exclusão.');
          return false;
        }
      }
      return false;
    } catch (e) {
      console.error('Erro ao deletar arquivo:', e);
      return false;
    }
  }
};
