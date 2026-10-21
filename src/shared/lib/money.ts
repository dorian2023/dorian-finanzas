/**
 * Dorian Finanzas - Reglas de dominio monetario (skill: finanzas-bimonetarias)
 * - Manejo en céntimos enteros (Minor Units): $ 1.00 = 100
 * - Inmutabilidad de la tasa de cambio histórica
 * - Formato venezolano 'es-VE'
 */

export type Currency = 'USD' | 'VES';

/**
 * Convierte un monto decimal ingresado por el usuario (ej. 12.50) a céntimos enteros (1250)
 */
export function toMinor(amount: number | string): number {
  const numeric = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
  if (isNaN(numeric)) return 0;
  return Math.round(numeric * 100);
}

/**
 * Convierte céntimos enteros (1250) a decimal flotante sólo para renderizado (12.50)
 */
export function toMajor(minor: number): number {
  return minor / 100;
}

/**
 * Formatea un monto en céntimos al estándar local venezolano
 * Ej: formatMoney(125050, 'VES') -> "Bs. 1.250,50"
 * Ej: formatMoney(2500, 'USD') -> "$ 25.00"
 */
export function formatMoney(minor: number, currency: Currency): string {
  const major = toMajor(minor);
  
  if (currency === 'VES') {
    const formatted = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
    return `Bs. ${formatted}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
  return `$ ${formatted}`;
}

/**
 * Calcula el equivalente entre monedas con una tasa de cambio dada
 * @param minor Monto en céntimos de la moneda origen
 * @param fromCurrency Moneda de origen
 * @param rate Tasa VES por cada USD (ej. 45.50)
 */
export function convertCurrency(
  minor: number,
  fromCurrency: Currency,
  rate: number
): { equivalentMinor: number; targetCurrency: Currency } {
  if (rate <= 0) {
    return {
      equivalentMinor: minor,
      targetCurrency: fromCurrency === 'USD' ? 'VES' : 'USD',
    };
  }

  if (fromCurrency === 'USD') {
    // USD -> VES: se multiplica por la tasa
    const equivalent = Math.round(minor * rate);
    return { equivalentMinor: equivalent, targetCurrency: 'VES' };
  } else {
    // VES -> USD: se divide entre la tasa
    const equivalent = Math.round(minor / rate);
    return { equivalentMinor: equivalent, targetCurrency: 'USD' };
  }
}
