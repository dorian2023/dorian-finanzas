import React, { useState } from 'react';
import {
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
  Shield,
  Briefcase
} from 'lucide-react';
import type { Category, IncomeSource, Transaction } from '../transactions/types';
import { formatMoney } from '../../shared/lib/money';

interface AnalyticsViewProps {
  transactions: Transaction[];
  categories: Category[];
  sources: IncomeSource[];
  todayRate: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categories,
  sources,
  todayRate,
}) => {
  const [period, setPeriod] = useState<'month' | 'all'>('month');

  // Filtrar por período
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const filtered = transactions.filter((tx) => {
    if (period === 'month') {
      return tx.occurredAt.startsWith(currentMonthPrefix);
    }
    return true;
  });

  // Calcular ingresos y gastos consolidados en USD
  let totalIncomeUsdMinor = 0;
  let totalExpenseUsdMinor = 0;

  filtered.forEach((tx) => {
    const usdEquivalentMinor =
      tx.currency === 'USD'
        ? tx.amountMinor
        : Math.round(tx.amountMinor / tx.rateUsed);

    if (tx.type === 'income') {
      totalIncomeUsdMinor += usdEquivalentMinor;
    } else if (tx.type === 'expense') {
      totalExpenseUsdMinor += usdEquivalentMinor;
    }
  });

  const netSavingsUsdMinor = totalIncomeUsdMinor - totalExpenseUsdMinor;

  // Desglose de gastos por categoría
  const categoryExpenses: Record<string, number> = {};
  filtered
    .filter((tx) => tx.type === 'expense' && tx.categoryId)
    .forEach((tx) => {
      const catId = tx.categoryId!;
      const usdEquivalent =
        tx.currency === 'USD'
          ? tx.amountMinor
          : Math.round(tx.amountMinor / tx.rateUsed);
      categoryExpenses[catId] = (categoryExpenses[catId] || 0) + usdEquivalent;
    });

  const sortedCategories = categories
    .map((c) => ({
      ...c,
      totalUsdMinor: categoryExpenses[c.id] || 0,
      percentage: totalExpenseUsdMinor > 0 ? Math.round(((categoryExpenses[c.id] || 0) / totalExpenseUsdMinor) * 100) : 0,
    }))
    .filter((c) => c.totalUsdMinor > 0)
    .sort((a, b) => b.totalUsdMinor - a.totalUsdMinor);

  // Categoría top
  const topCategory = sortedCategories[0];

  // Desglose de ingresos por empleador (Policía vs Bellagio)
  let policiaIncomeVesMinor = 0;
  let bellagioIncomeUsdMinor = 0;

  filtered
    .filter((tx) => tx.type === 'income')
    .forEach((tx) => {
      const source = sources.find((s) => s.id === tx.sourceId);
      if (source?.employer === 'Policía' || tx.currency === 'VES') {
        policiaIncomeVesMinor += tx.amountMinor;
      } else {
        bellagioIncomeUsdMinor += tx.amountMinor;
      }
    });

  // Agrupación histórica mensual
  const monthlyData: Record<string, { incomeUsd: number; expenseUsd: number }> = {};
  transactions.forEach((tx) => {
    const monthKey = tx.occurredAt.slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { incomeUsd: 0, expenseUsd: 0 };
    }
    const usd = tx.currency === 'USD' ? tx.amountMinor : Math.round(tx.amountMinor / tx.rateUsed);
    if (tx.type === 'income') {
      monthlyData[monthKey].incomeUsd += usd;
    } else if (tx.type === 'expense') {
      monthlyData[monthKey].expenseUsd += usd;
    }
  });

  const months = Object.keys(monthlyData).sort().reverse();

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Análisis de Finanzas</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Entiende en qué se va tu dinero
          </p>
        </div>

        {/* Selector de Período */}
        <div style={{
          display: 'flex',
          background: 'var(--badge-bg-neutral)',
          padding: 3,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => setPeriod('month')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 700,
              background: period === 'month' ? 'var(--act-income-bg)' : 'transparent',
              color: period === 'month' ? 'var(--color-usd)' : 'var(--text-secondary)',
              border: period === 'month' ? '1px solid var(--act-income-border)' : 'none',
            }}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriod('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 700,
              background: period === 'all' ? 'var(--text-primary)' : 'transparent',
              color: period === 'all' ? 'var(--bg-app)' : 'var(--text-secondary)',
            }}
          >
            Histórico
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Clave */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 18,
      }}>
        {/* Ganado */}
        <div className="glass-card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <TrendingUp size={14} color="#10b981" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ingresos</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
            {formatMoney(totalIncomeUsdMinor, 'USD')}
          </div>
        </div>

        {/* Gastado */}
        <div className="glass-card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <TrendingDown size={14} color="#f43f5e" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gastos</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
            {formatMoney(totalExpenseUsdMinor, 'USD')}
          </div>
        </div>

        {/* Balance Neto */}
        <div className="glass-card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Wallet size={14} color={netSavingsUsdMinor >= 0 ? '#10b981' : '#f43f5e'} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Balance</span>
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: netSavingsUsdMinor >= 0 ? '#34d399' : '#fb7185',
          }}>
            {formatMoney(netSavingsUsdMinor, 'USD')}
          </div>
        </div>
      </div>

      {/* Insight del mayor gasto */}
      {topCategory && (
        <div
          className="glass-panel"
          style={{
            padding: 14,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid rgba(255,255,255,0.08)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <PieChart size={18} color={topCategory.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Rubro de Mayor Gasto
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {topCategory.name}: <strong style={{ color: '#fbbf24' }}>{topCategory.percentage}%</strong> de tus salidas ({formatMoney(topCategory.totalUsdMinor, 'USD')})
            </div>
          </div>
        </div>
      )}

      {/* Desglose por Empleadores (Policía vs Bellagio) */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 10 }}>
          Ingresos por Empleo
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div className="glass-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Shield size={16} color="#60a5fa" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>Policía</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
              {formatMoney(policiaIncomeVesMinor, 'VES')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              ≈ {formatMoney(Math.round(policiaIncomeVesMinor / todayRate), 'USD')}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Briefcase size={16} color="#c084fc" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#c084fc' }}>Bellagio</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              {formatMoney(bellagioIncomeUsdMinor, 'USD')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Dólares en efectivo
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de Gastos por Categoría */}
      <div style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 10 }}>
          ¿En qué se fue el dinero? ({sortedCategories.length} categorías)
        </h3>

        {sortedCategories.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No hay gastos registrados en este período.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedCategories.map((c) => (
              <div key={c.id} className="glass-card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
                      {formatMoney(c.totalUsdMinor, 'USD')}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                      ({c.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Barra de Porcentaje con hardware accelerated transform */}
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: c.color,
                    borderRadius: 999,
                    transform: `scaleX(${c.percentage / 100})`,
                    transformOrigin: 'left',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial Comparativo por Meses */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 10 }}>
          Evolución Mensual
        </h3>
        {months.length === 0 ? (
          <div className="glass-card" style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 12 }}>Los resúmenes mensuales aparecerán a medida que registres movimientos.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {months.map((m) => {
              const data = monthlyData[m];
              const monthLabel = new Date(`${m}-02`).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
              return (
                <div
                  key={m}
                  className="glass-card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                      {monthLabel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Ingresos: <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>+{formatMoney(data.incomeUsd, 'USD')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
                      -{formatMoney(data.expenseUsd, 'USD')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Gastado
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
