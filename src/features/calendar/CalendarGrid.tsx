import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { DayActivity } from './types';

interface CalendarGridProps {
  currentYear: number;
  currentMonth: number; // 0-11
  selectedDate: string; // YYYY-MM-DD
  todayStr: string; // YYYY-MM-DD
  activityMap: Record<string, DayActivity>;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentYear,
  currentMonth,
  selectedDate,
  todayStr,
  activityMap,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}) => {
  // Generar las celdas de la cuadrícula
  const cells = React.useMemo(() => {
    // Primer día del mes
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Ajustar a Lunes = 0, Domingo = 6
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Número de días en el mes actual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Días en el mes previo
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    interface GridCell {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      activity?: DayActivity;
    }

    const grid: GridCell[] = [];

    // Celdas del mes anterior
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, d);
      const dateStr = prevMonthDate.toISOString().split('T')[0];
      grid.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        activity: activityMap[dateStr],
      });
    }

    // Celdas del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      grid.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        activity: activityMap[dateStr],
      });
    }

    // Celdas del mes siguiente para completar múltiplos de 7 (hasta 35 o 42)
    const remaining = (7 - (grid.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, d);
      const dateStr = nextMonthDate.toISOString().split('T')[0];
      grid.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        activity: activityMap[dateStr],
      });
    }

    return grid;
  }, [currentYear, currentMonth, selectedDate, todayStr, activityMap]);

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 18,
        padding: '12px 8px',
        marginBottom: 16,
        border: '1px solid var(--border-subtle)',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Controles de Navegación del Mes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <CalendarIcon size={16} color="var(--color-usd)" style={{ flexShrink: 0 }} />
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {MONTH_NAMES[currentMonth]} <span style={{ opacity: 0.6 }}>{currentYear}</span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onGoToToday}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              background: 'var(--badge-bg-neutral)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={onPrevMonth}
            className="btn-icon"
            style={{ width: 32, height: 32, padding: 0 }}
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            className="btn-icon"
            style={{ width: 32, height: 32, padding: 0 }}
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Días de la semana (L, M, M, J, V, S, D) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          marginBottom: 6,
          gap: 2,
        }}
      >
        {WEEKDAY_NAMES.map((name) => (
          <span
            key={name}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              padding: '2px 0',
            }}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Matriz de Días (100% responsiva y fluida) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          width: '100%',
        }}
      >
        {cells.map((cell) => {
          const act = cell.activity;
          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              style={{
                aspectRatio: '1 / 1',
                width: '100%',
                minWidth: 0,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                position: 'relative',
                background: cell.isSelected
                  ? 'var(--color-usd)'
                  : cell.isToday
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'transparent',
                color: cell.isSelected
                  ? '#ffffff'
                  : cell.isCurrentMonth
                  ? 'var(--text-primary)'
                  : 'var(--text-tertiary)',
                fontWeight: cell.isSelected || cell.isToday ? 800 : 500,
                border: cell.isSelected
                  ? '1.5px solid rgba(255, 255, 255, 0.4)'
                  : cell.isToday
                  ? '1.5px solid var(--color-usd)'
                  : '1px solid transparent',
                boxShadow: cell.isSelected
                  ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                  : 'none',
                opacity: cell.isCurrentMonth ? 1 : 0.3,
                transition: 'all 0.12s ease',
              }}
            >
              {/* Número del día */}
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                  marginBottom: 2,
                }}
              >
                {cell.dayNum}
              </span>

              {/* Indicadores de actividad (Puntos / Dots) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2.5,
                  minHeight: 5,
                }}
              >
                {act?.hasIncome && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: cell.isSelected ? '#ffffff' : '#10b981',
                    }}
                    title="Ingreso registrado"
                  />
                )}
                {act?.hasExpense && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: cell.isSelected ? '#fecdd3' : '#f43f5e',
                    }}
                    title="Gasto registrado"
                  />
                )}
                {act?.hasTasks && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: cell.isSelected ? '#bae6fd' : '#0284c7',
                    }}
                    title="Tareas programadas"
                  />
                )}
                {act?.hasNote && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: cell.isSelected ? '#fef08a' : '#ca8a04',
                    }}
                    title="Nota guardada"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leyenda visual discreta en el pie de la cuadrícula */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          marginTop: 12,
          paddingTop: 8,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 10,
          color: 'var(--text-tertiary)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Ingreso
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} /> Gasto
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} /> Tarea
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ca8a04' }} /> Nota
        </span>
      </div>
    </div>
  );
};
