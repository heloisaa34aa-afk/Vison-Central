import { Tv } from '../../types';

const STORAGE_KEY = 'visioncentral_tv_configs';

export const tvConfigsService = {
  getAllConfigs(): Record<string, Partial<Tv>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Erro ao ler configurações locais:', e);
    }
    return {};
  },

  getConfig(tvId: string): Partial<Tv> {
    return this.getAllConfigs()[tvId] || {};
  },

  saveConfig(tvId: string, config: Partial<Tv>) {
    try {
      const all = this.getAllConfigs();
      all[tvId] = { ...all[tvId], ...config };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Erro ao salvar configurações locais:', e);
    }
  },

  mergeTvWithConfig(tv: Tv): Tv {
    const config = this.getConfig(tv.id);
    return { ...tv, ...config };
  }
};
