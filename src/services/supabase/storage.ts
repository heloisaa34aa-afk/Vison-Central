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
  }
};
