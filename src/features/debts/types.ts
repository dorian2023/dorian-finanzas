import type { Currency } from '../../shared/lib/money';

export interface DebtPayment {
  id: string;
  debtId: string;
  amountMinor: number;
  paidAt: string; // YYYY-MM-DD
  note?: string;
}

export interface Debt {
  id: string;
  creditor: string; // Nombre del prestamista / persona / entidad
  description?: string; // Motivo o concepto
  originalAmountMinor: number; // Monto inicial total
  currency: Currency;
  startDate: string; // Fecha en que se adquirió la deuda
  dueDate?: string; // Fecha límite acordada (opcional)
  payments: DebtPayment[]; // Historial de abonos
  isPaidOff: boolean;
  notes?: string;
}
