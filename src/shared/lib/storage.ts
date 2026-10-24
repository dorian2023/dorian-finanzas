import type { Account, Category, DailyExchangeRate, IncomeSource, Transaction } from '../../features/transactions/types';
import type { TaskReminder } from '../../features/tasks/types';
import type { Debt, DebtPayment } from '../../features/debts/types';

const STORAGE_KEYS = {
  ACCOUNTS: 'dorian_accounts_v2',
  CATEGORIES: 'dorian_categories_v1',
  SOURCES: 'dorian_sources_v1',
  TRANSACTIONS: 'dorian_transactions_v1',
  TASKS: 'dorian_tasks_v1',
  DEBTS: 'dorian_debts_v1',
  RATES: 'dorian_rates_v1',
  TODAY_RATE: 'dorian_today_rate_v1',
};

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-usd-cash', name: 'Efectivo USD', currency: 'USD', icon: 'dollar-sign' },
  { id: 'acc-ves-cash', name: 'Efectivo Bs', currency: 'VES', icon: 'banknote' },
  { id: 'acc-bdv', name: 'Banco de Venezuela', currency: 'VES', icon: 'building-2' },
  { id: 'acc-binance', name: 'Binance', currency: 'USD', icon: 'wallet-cards' },
  { id: 'acc-zinli', name: 'Zinli', currency: 'USD', icon: 'credit-card' },
  { id: 'acc-sobre', name: 'Sobre', currency: 'USD', icon: 'archive', isSavings: true },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-moto', name: 'Moto (Repuestos/Taller)', icon: 'bike', color: '#f59e0b' },
  { id: 'cat-gasolina', name: 'Gasolina', icon: 'fuel', color: '#ef4444' },
  { id: 'cat-comida', name: 'Comida & Mercado', icon: 'utensils', color: '#10b981' },
  { id: 'cat-ocio', name: 'Ocio & Salidas', icon: 'beer', color: '#8b5cf6' },
  { id: 'cat-transporte', name: 'Transporte', icon: 'bus', color: '#3b82f6' },
  { id: 'cat-hogar', name: 'Hogar & Familia', icon: 'home', color: '#06b6d4' },
  { id: 'cat-salud', name: 'Salud & Farmacia', icon: 'heart-pulse', color: '#ec4899' },
  { id: 'cat-servicios', name: 'Servicios (Luz, Teléfono)', icon: 'zap', color: '#eab308' },
  { id: 'cat-otros', name: 'Otros Gastos', icon: 'more-horizontal', color: '#64748b' },
];

export const INITIAL_SOURCES: IncomeSource[] = [
  { id: 'src-policia', name: 'Policía', currency: 'VES', employer: 'Policía' },
  { id: 'src-bellagio', name: 'Muebles Bellagio', currency: 'USD', employer: 'Muebles Bellagio' },
  { id: 'src-otro', name: 'Trabajo Extra / Otro', currency: 'USD', employer: 'Otro' },
];

export const INITIAL_TASKS: TaskReminder[] = [
  {
    id: 'task-1',
    title: 'Anotar gastos del día y guardar recibos',
    description: 'Hacer el recuento de lo gastado en efectivo y pago móvil.',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '21:00',
    priority: 'high',
    isCompleted: false,
    isFinancial: false,
  },
  {
    id: 'task-2',
    title: 'Cotizar pastillas de freno de la moto',
    description: 'Preguntar precio en el taller o tienda de repuestos.',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    isCompleted: false,
    isFinancial: true,
    estimatedAmountMinor: 1500, // $15.00
    estimatedCurrency: 'USD',
    categoryId: 'cat-moto',
  },
];

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const StorageService = {
  getAccounts(): Account[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
      // Migrar transacciones previas asociadas a cuentas removidas
      try {
        const txRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (txRaw) {
          const txs: Transaction[] = JSON.parse(txRaw);
          let modified = false;
          const updatedTxs = txs.map((tx) => {
            const updated = { ...tx };
            if (tx.accountId === 'acc-pagomovil' || tx.accountId === 'acc-biopago') {
              updated.accountId = 'acc-bdv';
              modified = true;
            } else if (tx.accountId === 'acc-otros') {
              updated.accountId = tx.currency === 'USD' ? 'acc-usd-cash' : 'acc-bdv';
              modified = true;
            }
            if (tx.toAccountId === 'acc-pagomovil' || tx.toAccountId === 'acc-biopago') {
              updated.toAccountId = 'acc-bdv';
              modified = true;
            } else if (tx.toAccountId === 'acc-otros') {
              updated.toAccountId = 'acc-bdv';
              modified = true;
            }
            return updated;
          });
          if (modified) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTxs));
          }
        }
      } catch (err) {
        console.error('Error migrando transacciones previas:', err);
      }
      return INITIAL_ACCOUNTS;
    }
    const accounts: Account[] = JSON.parse(raw);
    if (!accounts.some((a) => a.id === 'acc-sobre' || a.name.toLowerCase() === 'sobre')) {
      accounts.push({ id: 'acc-sobre', name: 'Sobre', currency: 'USD', icon: 'archive', isSavings: true });
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
    return accounts;
  },

  getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw);
  },

  getSources(): IncomeSource[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SOURCES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(INITIAL_SOURCES));
      return INITIAL_SOURCES;
    }
    return JSON.parse(raw);
  },

  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  },

  saveTransaction(tx: Omit<Transaction, 'id' | 'occurredAt'> & { id?: string; occurredAt?: string }): Transaction {
    const transactions = this.getTransactions();
    const id = tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const occurredAt = tx.occurredAt || new Date().toISOString();

    const newTx: Transaction = {
      ...tx,
      id,
      occurredAt,
    };

    const existingIndex = tx.id ? transactions.findIndex((t) => t.id === tx.id) : -1;
    if (existingIndex >= 0) {
      transactions[existingIndex] = newTx;
    } else {
      transactions.unshift(newTx);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (err) {
      console.warn('Almacenamiento local lleno, guardando transacción ligera sin imagen pesada:', err);
      // Fallback para no bloquear al usuario si localStorage está lleno
      try {
        const lightweight = transactions.map((t) => ({ ...t, receiptUrl: undefined }));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(lightweight));
      } catch (innerErr) {
        console.error('Error crítico en localStorage:', innerErr);
      }
    }
    return newTx;
  },

  deleteTransaction(id: string): void {
    const transactions = this.getTransactions().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getTasks(): TaskReminder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(raw);
  },

  saveTask(task: Omit<TaskReminder, 'id'> & { id?: string }): TaskReminder {
    const tasks = this.getTasks();
    const newTask: TaskReminder = {
      ...task,
      id: task.id || `task-${Date.now()}`,
    };
    const index = tasks.findIndex(t => t.id === newTask.id);
    if (index >= 0) {
      tasks[index] = newTask;
    } else {
      tasks.unshift(newTask);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  },

  toggleTaskCompleted(id: string): TaskReminder | undefined {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.isCompleted = !task.isCompleted;
      task.completedAt = task.isCompleted ? new Date().toISOString() : undefined;
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return task;
    }
    return undefined;
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getTodayRate(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.TODAY_RATE);
    return saved ? parseFloat(saved) : 46.50; // Tasa referencial inicial modificable
  },

  saveTodayRate(rate: number): void {
    localStorage.setItem(STORAGE_KEYS.TODAY_RATE, rate.toString());
    const history = this.getRateHistory();
    const today = getTodayDateStr();
    const existingIndex = history.findIndex(h => h.date === today);
    const item: DailyExchangeRate = { date: today, rate, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) {
      history[existingIndex] = item;
    } else {
      history.unshift(item);
    }
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(history));
  },

  getRateHistory(): DailyExchangeRate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RATES);
    return raw ? JSON.parse(raw) : [{ date: getTodayDateStr(), rate: 46.50, updatedAt: new Date().toISOString() }];
  },

  getDebts(): Debt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    return raw ? JSON.parse(raw) : [];
  },

  saveDebt(debt: Omit<Debt, 'id' | 'payments' | 'isPaidOff'> & { id?: string; payments?: DebtPayment[]; isPaidOff?: boolean }): Debt {
    const debts = this.getDebts();
    const newDebt: Debt = {
      ...debt,
      id: debt.id || `debt-${Date.now()}`,
      payments: debt.payments || [],
      isPaidOff: debt.isPaidOff || false,
    };
    const index = debts.findIndex(d => d.id === newDebt.id);
    if (index >= 0) {
      debts[index] = newDebt;
    } else {
      debts.unshift(newDebt);
    }
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    return newDebt;
  },

  deleteDebt(id: string): void {
    const debts = this.getDebts().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  },

  addDebtPayment(debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId'>): Debt | undefined {
    const debts = this.getDebts();
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      const newPayment: DebtPayment = {
        ...payment,
        id: `pay-${Date.now()}`,
        debtId,
      };
      debt.payments.unshift(newPayment);
      const totalPaid = debt.payments.reduce((acc, p) => acc + p.amountMinor, 0);
      if (totalPaid >= debt.originalAmountMinor) {
        debt.isPaidOff = true;
      }
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
      return debt;
    }
    return undefined;
  },

  deleteDebtPayment(debtId: string, paymentId: string): Debt | undefined {
    const debts = this.getDebts();
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      debt.payments = debt.payments.filter(p => p.id !== paymentId);
      const totalPaid = debt.payments.reduce((acc, p) => acc + p.amountMinor, 0);
      debt.isPaidOff = totalPaid >= debt.originalAmountMinor;
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
      return debt;
    }
    return undefined;
  }
};
