import { supabase } from '../../lib/supabase';

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

  async uploadMediaFile(file: File): Promise<string> {
    try {
      await this.ensureBucketExists();

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = fileName;

      const { error } = await supabase.storage
        .from('midias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('midias')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Não foi possível obter a URL pública do arquivo enviado.');
      }

      return publicUrlData.publicUrl;
    } catch (e: any) {
      console.error('Erro no upload para o Supabase Storage:', e);
      throw e;
    }
  },

  async deleteMediaFile(fileUrl: string): Promise<boolean> {
    try {
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
      return false;
    } catch (e) {
      console.error('Erro ao deletar arquivo:', e);
      return false;
    }
  }
};
