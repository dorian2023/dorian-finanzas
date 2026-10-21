import type { Currency } from '../../shared/lib/money';

export type TaskPriority = 'high' | 'medium' | 'normal';

export interface TaskReminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  reminderAt?: string; // ISO
  priority: TaskPriority;
  isCompleted: boolean;
  completedAt?: string;
  // Conexión financiera
  isFinancial: boolean;
  estimatedAmountMinor?: number;
  estimatedCurrency?: Currency;
  categoryId?: string;
}
