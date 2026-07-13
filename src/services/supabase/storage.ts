import { supabase } from '../../lib/supabase';

export const storageServiceSupabase = {
  async ensureBucketExists(): Promise<void> {
    // No-op since we use local uploads/ folder served statically by Express
  },

  async uploadMediaFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro de rede ou permissão insuficiente (${response.status}) ao fazer upload.`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('Não foi possível obter a URL pública do arquivo enviado.');
      }

      return data.url;
    } catch (e: any) {
      console.error('Erro no upload para o servidor:', e);
      throw e;
    }
  },

  async deleteMediaFile(fileUrl: string): Promise<boolean> {
    try {
      if (fileUrl.startsWith('/uploads/')) {
        const response = await fetch('/api/delete-file', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: fileUrl }),
        });
        if (response.ok) {
          const data = await response.json();
          return !!data.success;
        }
      } else {
        // Se for uma URL do Supabase Storage real, tenta deletar por lá também
        const parts = fileUrl.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          const pathAndBucket = parts[1];
          const bucketParts = pathAndBucket.split('/');
          const bucket = bucketParts[0];
          const path = bucketParts.slice(1).join('/');
          const { error } = await supabase.storage.from(bucket).remove([path]);
          if (error) {
            console.warn('Erro ao deletar do Supabase Storage:', error);
          } else {
            return true;
          }
        }
      }
      return false;
    } catch (e) {
      console.error('Erro ao deletar arquivo:', e);
      return false;
    }
  }
};
