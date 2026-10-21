import type { Currency } from '../../shared/lib/money';

export type TransactionType = 'income' | 'expense' | 'exchange';

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  icon: string;
  isCustom?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  currency: Currency;
  employer: 'Policía' | 'Muebles Bellagio' | 'Otro';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: string;
  amountMinor: number;
  currency: Currency;
  rateUsed: number; // Tasa manual del día en el momento del gasto
  categoryId?: string;
  sourceId?: string;
  merchant?: string;
  occurredAt: string; // ISO String
  location?: string;
  receiptUrl?: string;
  note?: string;
  // Campos específicos para 'exchange' (cambio de divisa USD <-> Bs)
  toAccountId?: string;
  toAmountMinor?: number;
  toCurrency?: Currency;
}

export interface DailyExchangeRate {
  date: string; // YYYY-MM-DD
  rate: number; // Ej. 45.80
  updatedAt: string;
}
