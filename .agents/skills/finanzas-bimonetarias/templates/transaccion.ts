export type Currency = 'USD' | 'VES';
export type TransactionType = 'income' | 'expense' | 'exchange';

export interface MoneyValue {
  /** Monto en unidades menores (céntimos: 100 = 1.00) */
  amountMinor: number;
  currency: Currency;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  accountId: string;
  amountMinor: number;
  currency: Currency;
  rateUsed: number;
  categoryId?: string;
  sourceId?: string;
  merchant?: string;
  occurredAt: string;
  location?: string;
  receiptPath?: string;
  note?: string;
}

export interface TaskReminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  reminderAt?: string;
  priority: 'high' | 'medium' | 'normal';
  categoryId?: string;
  isCompleted: boolean;
  completedAt?: string;
  isFinancial: boolean;
  estimatedAmountMinor?: number;
  estimatedCurrency?: Currency;
}
