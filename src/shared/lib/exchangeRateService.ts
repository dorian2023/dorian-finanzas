export type RateSource = 'bcv' | 'binance';

export interface RateConfig {
  bcv: number;
  binance: number;
  activeSource: RateSource;
  autoUpdate: boolean;
  lastUpdated: string;
}

const STORAGE_KEY_RATES = 'dorian_rates_config_v2';

export const DEFAULT_RATES: RateConfig = {
  bcv: 881.88,
  binance: 1006.20,
  activeSource: 'binance',
  autoUpdate: true,
  lastUpdated: new Date().toISOString(),
};

export const ExchangeRateService = {
  getConfig(): RateConfig {
    const raw = localStorage.getItem(STORAGE_KEY_RATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(DEFAULT_RATES));
      return DEFAULT_RATES;
    }
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RATES, ...parsed };
    } catch {
      return DEFAULT_RATES;
    }
  },

  saveConfig(config: RateConfig): void {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(config));
  },

  getActiveRate(): number {
    const config = this.getConfig();
    return config.activeSource === 'bcv' ? config.bcv : config.binance;
  },

  setActiveSource(source: RateSource): RateConfig {
    const config = this.getConfig();
    config.activeSource = source;
    this.saveConfig(config);
    return config;
  },

  setManualRate(source: RateSource, value: number): RateConfig {
    const config = this.getConfig();
    if (source === 'bcv') {
      config.bcv = value;
    } else {
      config.binance = value;
    }
    config.lastUpdated = new Date().toISOString();
    this.saveConfig(config);
    return config;
  },

  /**
   * Consulta las tasas en vivo desde la API pública de Venezuela (ve.dolarapi.com)
   * Extrae BCV Oficial y Paralelo (Binance P2P / mercado digital)
   */
  async fetchLiveRates(): Promise<{ success: boolean; config: RateConfig; error?: string }> {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Respuesta inválida de la API');
      }

      const oficialItem = data.find((d: any) => d.fuente === 'oficial' || d.nombre?.toLowerCase().includes('dólar'));
      const paraleloItem = data.find((d: any) => d.fuente === 'paralelo' || d.nombre?.toLowerCase().includes('paralelo'));

      const config = this.getConfig();

      if (oficialItem?.promedio && typeof oficialItem.promedio === 'number') {
        config.bcv = parseFloat(oficialItem.promedio.toFixed(2));
      }
      if (paraleloItem?.promedio && typeof paraleloItem.promedio === 'number') {
        config.binance = parseFloat(paraleloItem.promedio.toFixed(2));
      }

      config.lastUpdated = new Date().toISOString();
      this.saveConfig(config);

      return { success: true, config };
    } catch (err: any) {
      console.warn('No se pudo conectar a la API de tasas en vivo:', err);
      return { success: false, config: this.getConfig(), error: err.message || 'Error de conexión' };
    }
  },
};
