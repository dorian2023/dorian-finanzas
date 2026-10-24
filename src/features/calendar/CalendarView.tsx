import React, { useState } from 'react';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import type { Transaction, Account, Category } from '../transactions/types';
import type { TaskReminder } from '../tasks/types';
import { useCalendarData } from './useCalendarData';
import { CalendarGrid } from './CalendarGrid';
import { DaySummaryCard } from './DaySummaryCard';
import { DayTimeline } from './DayTimeline';

interface CalendarViewProps {
  todayRate: number;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  tasks: TaskReminder[];
  onToggleTask: (id: string) => void;
  onBackToHome: () => void;
  onOpenAddExpenseForDate: (dateStr: string) => void;
  onOpenAddIncomeForDate: (dateStr: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  todayRate,
  transactions,
  accounts,
  categories,
  tasks,
  onToggleTask,
  onBackToHome,
  onOpenAddExpenseForDate,
  onOpenAddIncomeForDate,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  // Fecha actual en formato YYYY-MM-DD
  const now = new Date();
  const todayStr = React.useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const { activityMap, getDayActivity, saveDayNote } = useCalendarData({
    transactions,
    tasks,
    todayRate,
  });

  const selectedActivity = getDayActivity(selectedDate);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  return (
    <div style={{ padding: '14px 12px 90px', width: '100%', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Barra superior de navegación del Calendario */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          type="button"
          onClick={onBackToHome}
          className="btn-icon"
          style={{ width: 40, height: 40 }}
          title="Volver al Inicio"
          aria-label="Volver al Inicio"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarIcon size={18} color="var(--color-usd)" />
          <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
            Diario Financiero
          </h1>
        </div>

        {/* Espacio para balance visual */}
        <div style={{ width: 40 }} />
      </div>

      {/* Matriz interactiva del Calendario Mensual */}
      <CalendarGrid
        currentYear={currentYear}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        todayStr={todayStr}
        activityMap={activityMap}
        onSelectDate={(date) => setSelectedDate(date)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToToday={handleGoToToday}
      />

      {/* Tarjeta de Resumen y Métricas del Día Seleccionado */}
      <DaySummaryCard
        activity={selectedActivity}
        todayRate={todayRate}
        todayStr={todayStr}
      />

      {/* Línea de tiempo detallada: Gastos, Ingresos, Tareas y Notas */}
      <DayTimeline
        activity={selectedActivity}
        accounts={accounts}
        categories={categories}
        todayRate={todayRate}
        onToggleTask={onToggleTask}
        onSaveNote={saveDayNote}
        onOpenAddExpenseForDate={onOpenAddExpenseForDate}
        onOpenAddIncomeForDate={onOpenAddIncomeForDate}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />
    </div>
  );
};
