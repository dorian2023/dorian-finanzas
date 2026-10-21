import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import type { DayActivity } from './types';
import { formatMoney } from '../../shared/lib/money';

interface DaySummaryCardProps {
  activity: DayActivity;
  todayRate: number;
  todayStr: string;
}

export const DaySummaryCard: React.FC<DaySummaryCardProps> = ({
  activity,
  todayRate,
  todayStr,
}) => {
  // Formatear fecha legible
  const formattedDate = React.useMemo(() => {
    try {
      const [year, month, day] = activity.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);
    } catch {
      return activity.date;
    }
  }, [activity.date]);

  const isToday = activity.date === todayStr;

  // Equivalentes en Bolívares
  const incomeVES = Math.round(activity.totalIncomeEquivUSD * todayRate);
  const expenseVES = Math.round(activity.totalExpenseEquivUSD * todayRate);
  const netVES = Math.round(activity.netBalanceEquivUSD * todayRate);

  const isNetPositive = activity.netBalanceEquivUSD > 0;
  const isNetNegative = activity.netBalanceEquivUSD < 0;

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 20,
        padding: '16px 14px',
        marginBottom: 16,
        border: '1px solid var(--border-card)',
        background: 'var(--bg-card)',
      }}
    >
      {/* Cabecera del día */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Resumen del Día
          </span>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {formattedDate}
          </h3>
        </div>

        {isToday && (
          <span
            className="badge badge-usd"
            style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px' }}
          >
            HOY
          </span>
        )}
      </div>

      {/* Grid de 3 Métricas: Ingresos, Gastos y Balance Neto */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Total Ingresado */}
        <div
          style={{
            padding: '9px 6px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--act-income-bg)',
            border: '1px solid var(--act-income-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--act-income-text)' }}>
            <TrendingUp size={11} />
            <span style={{ fontSize: 9, fontWeight: 800 }}>Ingresos</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--act-income-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            +{formatMoney(activity.totalIncomeEquivUSD, 'USD')}
          </span>
          <span style={{ fontSize: 9, opacity: 0.8, color: 'var(--act-income-text)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Bs. {formatMoney(incomeVES, 'VES').replace('Bs. ', '')}
          </span>
        </div>

        {/* Total Gastado */}
        <div
          style={{
            padding: '9px 6px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--act-expense-bg)',
            border: '1px solid var(--act-expense-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--act-expense-text)' }}>
            <TrendingDown size={11} />
            <span style={{ fontSize: 9, fontWeight: 800 }}>Gastos</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--act-expense-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            -{formatMoney(activity.totalExpenseEquivUSD, 'USD')}
          </span>
          <span style={{ fontSize: 9, opacity: 0.8, color: 'var(--act-expense-text)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Bs. {formatMoney(expenseVES, 'VES').replace('Bs. ', '')}
          </span>
        </div>

        {/* Balance Neto */}
        <div
          style={{
            padding: '9px 6px',
            borderRadius: 'var(--radius-md)',
            background: isNetPositive
              ? 'rgba(16, 185, 129, 0.12)'
              : isNetNegative
              ? 'rgba(239, 68, 68, 0.12)'
              : 'var(--badge-bg-neutral)',
            border: isNetPositive
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : isNetNegative
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: isNetPositive ? '#10b981' : isNetNegative ? '#f43f5e' : 'var(--text-tertiary)' }}>
            <Scale size={11} />
            <span style={{ fontSize: 9, fontWeight: 800 }}>Neto</span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: isNetPositive ? '#10b981' : isNetNegative ? '#f43f5e' : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isNetPositive ? '+' : ''}
            {formatMoney(activity.netBalanceEquivUSD, 'USD')}
          </span>
          <span style={{ fontSize: 9, opacity: 0.8, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Bs. {formatMoney(netVES, 'VES').replace('Bs. ', '')}
          </span>
        </div>
      </div>
    </div>
  );
};
