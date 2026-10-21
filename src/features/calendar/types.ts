import type { Transaction } from '../transactions/types';
import type { TaskReminder } from '../tasks/types';

/**
 * Nota o apunte diario registrado por el usuario
 */
export interface DailyNote {
  date: string; // YYYY-MM-DD
  content: string;
  updatedAt: string; // ISO
}

/**
 * Datos agregados de actividad de un día específico
 */
export interface DayActivity {
  date: string; // YYYY-MM-DD
  incomeMinorUSD: number;
  incomeMinorVES: number;
  expenseMinorUSD: number;
  expenseMinorVES: number;
  // Equivalentes en USD para cálculo de balance neto unificado
  totalIncomeEquivUSD: number;
  totalExpenseEquivUSD: number;
  netBalanceEquivUSD: number;
  transactions: Transaction[];
  tasks: TaskReminder[];
  note?: string;
  // Indicadores de actividad para los puntos del calendario
  hasIncome: boolean;
  hasExpense: boolean;
  hasTasks: boolean;
  hasNote: boolean;
}

/**
 * Información de una celda del mes en la cuadrícula
 */
export interface CalendarCell {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  activity?: DayActivity;
}
