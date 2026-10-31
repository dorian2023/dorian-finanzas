import { useMemo, useState, useCallback } from 'react';
import type { Transaction } from '../transactions/types';
import type { TaskReminder } from '../tasks/types';
import type { DayActivity } from './types';
import { DailyNotesService } from './dailyNotesService';

interface UseCalendarDataParams {
  transactions: Transaction[];
  tasks: TaskReminder[];
  todayRate: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  monthPrefix: string;
  totalIncomeEquivUSD: number;
  totalExpenseEquivUSD: number;
  netBalanceEquivUSD: number;
  incomeCount: number;
  expenseCount: number;
  totalTransactionsCount: number;
  savingsRate: number;
}

export function useCalendarData({
  transactions,
  tasks,
  todayRate,
}: UseCalendarDataParams) {
  const [notesTick, setNotesTick] = useState(0);

  const notesMap = useMemo(() => {
    // Escucha cambios locales forzando actualización con notesTick
    void notesTick;
    return DailyNotesService.getAllNotes();
  }, [notesTick]);

  const saveDayNote = useCallback((dateStr: string, content: string) => {
    DailyNotesService.saveNote(dateStr, content);
    setNotesTick((t) => t + 1);
  }, []);

  /**
   * Mapa indexado O(1) con clave YYYY-MM-DD
   */
  const activityMap = useMemo(() => {
    const map: Record<string, DayActivity> = {};

    const getOrCreate = (dateStr: string): DayActivity => {
      if (!map[dateStr]) {
        const note = notesMap[dateStr]?.content;
        map[dateStr] = {
          date: dateStr,
          incomeMinorUSD: 0,
          incomeMinorVES: 0,
          expenseMinorUSD: 0,
          expenseMinorVES: 0,
          totalIncomeEquivUSD: 0,
          totalExpenseEquivUSD: 0,
          netBalanceEquivUSD: 0,
          transactions: [],
          tasks: [],
          note,
          hasIncome: false,
          hasExpense: false,
          hasTasks: false,
          hasNote: !!note,
        };
      }
      return map[dateStr];
    };

    // Procesar Transacciones
    for (const tx of transactions) {
      if (!tx.occurredAt) continue;
      const dateStr = tx.occurredAt.includes('T')
        ? tx.occurredAt.split('T')[0]
        : tx.occurredAt.slice(0, 10);

      const day = getOrCreate(dateStr);
      day.transactions.push(tx);

      const rate = tx.rateUsed || todayRate || 1;

      if (tx.type === 'income') {
        day.hasIncome = true;
        if (tx.currency === 'USD') {
          day.incomeMinorUSD += tx.amountMinor;
          day.totalIncomeEquivUSD += tx.amountMinor;
        } else {
          day.incomeMinorVES += tx.amountMinor;
          day.totalIncomeEquivUSD += Math.round(tx.amountMinor / rate);
        }
      } else if (tx.type === 'expense') {
        day.hasExpense = true;
        if (tx.currency === 'USD') {
          day.expenseMinorUSD += tx.amountMinor;
          day.totalExpenseEquivUSD += tx.amountMinor;
        } else {
          day.expenseMinorVES += tx.amountMinor;
          day.totalExpenseEquivUSD += Math.round(tx.amountMinor / rate);
        }
      }
    }

    // Procesar Tareas
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const dateStr = task.dueDate.slice(0, 10);
      const day = getOrCreate(dateStr);
      day.tasks.push(task);
      day.hasTasks = true;
    }

    // Procesar Notas de días que no tengan ni transacciones ni tareas
    for (const [dateStr, noteItem] of Object.entries(notesMap)) {
      if (noteItem.content.trim()) {
        const day = getOrCreate(dateStr);
        day.note = noteItem.content;
        day.hasNote = true;
      }
    }

    // Calcular balances netos para cada día registrado
    for (const day of Object.values(map)) {
      day.netBalanceEquivUSD = day.totalIncomeEquivUSD - day.totalExpenseEquivUSD;
      // Ordenar transacciones por fecha/hora descendente dentro del día
      day.transactions.sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''));
    }

    return map;
  }, [transactions, tasks, todayRate, notesMap]);

  const getDayActivity = useCallback(
    (dateStr: string): DayActivity => {
      if (activityMap[dateStr]) {
        return activityMap[dateStr];
      }
      const note = notesMap[dateStr]?.content;
      return {
        date: dateStr,
        incomeMinorUSD: 0,
        incomeMinorVES: 0,
        expenseMinorUSD: 0,
        expenseMinorVES: 0,
        totalIncomeEquivUSD: 0,
        totalExpenseEquivUSD: 0,
        netBalanceEquivUSD: 0,
        transactions: [],
        tasks: [],
        note,
        hasIncome: false,
        hasExpense: false,
        hasTasks: false,
        hasNote: !!note,
      };
    },
    [activityMap, notesMap]
  );

  const getMonthSummary = useCallback(
    (year: number, month: number): MonthSummary => {
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      let totalIncomeEquivUSD = 0;
      let totalExpenseEquivUSD = 0;
      let incomeCount = 0;
      let expenseCount = 0;

      for (const tx of transactions) {
        if (!tx.occurredAt || !tx.occurredAt.startsWith(monthPrefix)) continue;
        const rate = tx.rateUsed || todayRate || 1;
        const usdEquiv =
          tx.currency === 'USD'
            ? tx.amountMinor
            : Math.round(tx.amountMinor / rate);

        if (tx.type === 'income') {
          totalIncomeEquivUSD += usdEquiv;
          incomeCount++;
        } else if (tx.type === 'expense') {
          totalExpenseEquivUSD += usdEquiv;
          expenseCount++;
        }
      }

      const netBalanceEquivUSD = totalIncomeEquivUSD - totalExpenseEquivUSD;
      const totalTransactionsCount = incomeCount + expenseCount;
      const savingsRate =
        totalIncomeEquivUSD > 0
          ? Math.max(0, Math.round((netBalanceEquivUSD / totalIncomeEquivUSD) * 100))
          : 0;

      return {
        year,
        month,
        monthPrefix,
        totalIncomeEquivUSD,
        totalExpenseEquivUSD,
        netBalanceEquivUSD,
        incomeCount,
        expenseCount,
        totalTransactionsCount,
        savingsRate,
      };
    },
    [transactions, todayRate]
  );

  return {
    activityMap,
    getDayActivity,
    getMonthSummary,
    saveDayNote,
    notesMap,
  };
}
