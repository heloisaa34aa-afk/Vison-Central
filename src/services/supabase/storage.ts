import { supabase } from '../../lib/supabase';

export const storageServiceSupabase = {
  async ensureBucketExists(): Promise<void> {
    try {
      await supabase.storage.createBucket('midias', { public: true });
    } catch (e) {
      // Suppress error as bucket might already exist or permission is restricted
    }
  },

  async uploadMediaFile(file: File): Promise<string> {
    try {
      await this.ensureBucketExists();
      
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('midias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Erro ao fazer upload no bucket real (usando fallback de URL de objeto):', error);
        // Fallback to URL.createObjectURL or standard path so the app doesn't break
        return URL.createObjectURL(file);
      }

      const { data: publicUrlData } = supabase.storage
        .from('midias')
        .getPublicUrl(filePath);

      return publicUrlData?.publicUrl || URL.createObjectURL(file);
    } catch (e) {
      console.warn('Erro geral de upload, usando Object URL:', e);
      return URL.createObjectURL(file);
    }
  }
};
