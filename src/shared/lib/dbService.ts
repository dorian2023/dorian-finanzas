import { supabase } from './supabaseClient';
import { StorageService, getTodayDateStr } from './storage';
import type { Account, Category, IncomeSource, Transaction } from '../../features/transactions/types';
import type { TaskReminder } from '../../features/tasks/types';
import type { Debt, DebtPayment } from '../../features/debts/types';

export const DatabaseService = {
  // =====================
  // CUENTAS
  // =====================
  async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const accounts: Account[] = data.map((row) => ({
          id: row.id,
          name: row.name,
          currency: row.currency,
          icon: row.icon,
        }));
        localStorage.setItem('dorian_accounts_v2', JSON.stringify(accounts));
        return accounts;
      }
    } catch (err) {
      console.warn('Error conectando a Supabase para cuentas, usando almacenamiento local:', err);
    }
    return StorageService.getAccounts();
  },

  // =====================
  // CATEGORÍAS
  // =====================
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        const categories: Category[] = data.map((row) => ({
          id: row.id,
          name: row.name,
          icon: row.icon,
          color: row.color,
        }));
        localStorage.setItem('dorian_categories_v1', JSON.stringify(categories));
        return categories;
      }
    } catch (err) {
      console.warn('Error conectando a Supabase para categorías, usando local:', err);
    }
    return StorageService.getCategories();
  },

  // =====================
  // FUENTES DE INGRESO
  // =====================
  async getSources(): Promise<IncomeSource[]> {
    try {
      const { data, error } = await supabase.from('income_sources').select('*');
      if (!error && data && data.length > 0) {
        const sources: IncomeSource[] = data.map((row) => ({
          id: row.id,
          name: row.name,
          currency: row.currency,
          employer: row.employer,
        }));
        localStorage.setItem('dorian_sources_v1', JSON.stringify(sources));
        return sources;
      }
    } catch (err) {
      console.warn('Error conectando a Supabase para fuentes de ingreso, usando local:', err);
    }
    return StorageService.getSources();
  },

  // =====================
  // TRANSACCIONES
  // =====================
  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('occurred_at', { ascending: false });

      if (!error && data) {
        const transactions: Transaction[] = data.map((row) => ({
          id: row.id,
          type: row.type,
          accountId: row.account_id,
          amountMinor: Number(row.amount_minor),
          currency: row.currency,
          rateUsed: Number(row.rate_used),
          categoryId: row.category_id || undefined,
          sourceId: row.source_id || undefined,
          merchant: row.merchant || undefined,
          note: row.note || undefined,
          receiptUrl: row.receipt_url || undefined,
          toAccountId: row.to_account_id || undefined,
          occurredAt: row.occurred_at,
        }));
        try {
          localStorage.setItem('dorian_transactions_v1', JSON.stringify(transactions));
        } catch {
          const lightweight = transactions.map((t) => ({ ...t, receiptUrl: undefined }));
          try {
            localStorage.setItem('dorian_transactions_v1', JSON.stringify(lightweight));
          } catch {
            // Ignorar si falla storage local
          }
        }
        return transactions;
      }
    } catch (err) {
      console.warn('Error conectando a Supabase para transacciones, usando local:', err);
    }
    return StorageService.getTransactions();
  },

  async saveTransaction(
    tx: Omit<Transaction, 'id' | 'occurredAt'> & { id?: string; occurredAt?: string }
  ): Promise<Transaction> {
    const id = tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const occurredAt = tx.occurredAt || new Date().toISOString();

    const newTx: Transaction = {
      ...tx,
      id,
      occurredAt,
    };

    // Actualizar local inmediato
    StorageService.saveTransaction(newTx);

    // Persistir en Supabase
    try {
      const payload = {
        id: newTx.id,
        type: newTx.type,
        account_id: newTx.accountId || 'acc-usd-cash',
        amount_minor: newTx.amountMinor,
        currency: newTx.currency,
        rate_used: newTx.rateUsed,
        category_id: (newTx.type === 'expense' && newTx.categoryId?.trim()) ? newTx.categoryId : null,
        source_id: (newTx.type === 'income' && newTx.sourceId?.trim()) ? newTx.sourceId : null,
        merchant: newTx.merchant?.trim() || null,
        note: newTx.note?.trim() || null,
        receipt_url: newTx.receiptUrl?.trim() || null,
        to_account_id: (newTx.type === 'exchange' && newTx.toAccountId?.trim()) ? newTx.toAccountId : null,
        occurred_at: newTx.occurredAt,
      };

      const { error: sbError } = await supabase.from('transactions').upsert(payload);
      if (sbError) {
        console.error('Error guardando transacción en Supabase:', sbError);
      }
    } catch (err) {
      console.error('Error guardando transacción en Supabase:', err);
    }

    return newTx;
  },

  async deleteTransaction(id: string): Promise<void> {
    StorageService.deleteTransaction(id);
    try {
      await supabase.from('transactions').delete().eq('id', id);
    } catch (err) {
      console.error('Error eliminando transacción de Supabase:', err);
    }
  },

  // =====================
  // TAREAS Y RECORDATORIOS
  // =====================
  async getTasks(): Promise<TaskReminder[]> {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const tasks: TaskReminder[] = data
          .filter((row) => !row.id.startsWith('sys-'))
          .map((row) => ({
            id: row.id,
          title: row.title,
          description: row.description || undefined,
          dueDate: row.due_date,
          dueTime: row.due_time || undefined,
          priority: row.priority,
          isCompleted: row.is_completed,
          completedAt: row.completed_at || undefined,
          isFinancial: row.is_financial,
          estimatedAmountMinor: row.estimated_amount_minor ? Number(row.estimated_amount_minor) : undefined,
          estimatedCurrency: row.estimated_currency || undefined,
          categoryId: row.category_id || undefined,
        }));
        localStorage.setItem('dorian_tasks_v1', JSON.stringify(tasks));
        return tasks;
      }
    } catch (err) {
      console.warn('Error cargando tareas de Supabase:', err);
    }
    return StorageService.getTasks();
  },

  async saveTask(task: Omit<TaskReminder, 'id'> & { id?: string }): Promise<TaskReminder> {
    const saved = StorageService.saveTask(task);
    try {
      await supabase.from('tasks').upsert({
        id: saved.id,
        title: saved.title,
        description: saved.description || null,
        due_date: saved.dueDate,
        due_time: saved.dueTime || null,
        priority: saved.priority,
        is_completed: saved.isCompleted,
        completed_at: saved.completedAt || null,
        is_financial: saved.isFinancial,
        estimated_amount_minor: saved.estimatedAmountMinor || null,
        estimated_currency: saved.estimatedCurrency || null,
        category_id: saved.categoryId || null,
      });
    } catch (err) {
      console.error('Error guardando tarea en Supabase:', err);
    }
    return saved;
  },

  async toggleTaskCompleted(id: string): Promise<TaskReminder | undefined> {
    const updated = StorageService.toggleTaskCompleted(id);
    if (updated) {
      try {
        await supabase
          .from('tasks')
          .update({
            is_completed: updated.isCompleted,
            completed_at: updated.completedAt || null,
          })
          .eq('id', id);
      } catch (err) {
        console.error('Error actualizando estado de tarea en Supabase:', err);
      }
    }
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    StorageService.deleteTask(id);
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.error('Error borrando tarea de Supabase:', err);
    }
  },

  // =====================
  // DEUDAS Y COMPROMISOS
  // =====================
  async getDebts(): Promise<Debt[]> {
    try {
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*, debt_payments(*)')
        .order('created_at', { ascending: false });

      if (!debtsError && debtsData) {
        const debts: Debt[] = debtsData.map((row) => ({
          id: row.id,
          creditor: row.creditor,
          description: row.description || undefined,
          originalAmountMinor: Number(row.original_amount_minor),
          currency: row.currency,
          startDate: row.start_date || getTodayDateStr(),
          dueDate: row.due_date || undefined,
          notes: row.notes || undefined,
          isPaidOff: row.is_paid_off,
          payments: (row.debt_payments || []).map((p: any) => ({
            id: p.id,
            debtId: p.debt_id,
            amountMinor: Number(p.amount_minor),
            paidAt: p.paid_at,
            note: p.note || undefined,
          })),
        }));
        localStorage.setItem('dorian_debts_v1', JSON.stringify(debts));
        return debts;
      }
    } catch (err) {
      console.warn('Error cargando deudas de Supabase:', err);
    }
    return StorageService.getDebts();
  },

  async saveDebt(
    debt: Omit<Debt, 'id' | 'payments' | 'isPaidOff'> & { id?: string; payments?: DebtPayment[]; isPaidOff?: boolean }
  ): Promise<Debt> {
    const saved = StorageService.saveDebt(debt);
    try {
      await supabase.from('debts').upsert({
        id: saved.id,
        creditor: saved.creditor,
        description: saved.description || null,
        original_amount_minor: saved.originalAmountMinor,
        currency: saved.currency,
        start_date: saved.startDate || null,
        due_date: saved.dueDate || null,
        notes: saved.notes || null,
        is_paid_off: saved.isPaidOff,
      });
    } catch (err) {
      console.error('Error guardando deuda en Supabase:', err);
    }
    return saved;
  },

  async deleteDebt(id: string): Promise<void> {
    StorageService.deleteDebt(id);
    try {
      await supabase.from('debts').delete().eq('id', id);
    } catch (err) {
      console.error('Error eliminando deuda en Supabase:', err);
    }
  },

  async addDebtPayment(debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId'>): Promise<Debt | undefined> {
    const updated = StorageService.addDebtPayment(debtId, payment);
    const newPayment = updated?.payments[0];
    if (newPayment) {
      try {
        await supabase.from('debt_payments').insert({
          id: newPayment.id,
          debt_id: debtId,
          amount_minor: newPayment.amountMinor,
          paid_at: newPayment.paidAt,
          note: newPayment.note || null,
        });
        if (updated?.isPaidOff) {
          await supabase.from('debts').update({ is_paid_off: true }).eq('id', debtId);
        }
      } catch (err) {
        console.error('Error agregando abono de deuda en Supabase:', err);
      }
    }
    return updated;
  },

  async deleteDebtPayment(debtId: string, paymentId: string): Promise<Debt | undefined> {
    const updated = StorageService.deleteDebtPayment(debtId, paymentId);
    try {
      await supabase.from('debt_payments').delete().eq('id', paymentId);
      if (updated) {
        await supabase.from('debts').update({ is_paid_off: updated.isPaidOff }).eq('id', debtId);
      }
    } catch (err) {
      console.error('Error borrando abono de deuda en Supabase:', err);
    }
    return updated;
  },
};
