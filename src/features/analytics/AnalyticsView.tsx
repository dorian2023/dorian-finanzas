import React, { useState } from 'react';
import {
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
  Shield,
  Briefcase,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import type { Account, Category, IncomeSource, Transaction } from '../transactions/types';
import { formatMoney } from '../../shared/lib/money';
import { CategoryBreakdownModal } from './CategoryBreakdownModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';

export interface AnalyticsViewProps {
  transactions: Transaction[];
  categories: Category[];
  sources: IncomeSource[];
  accounts?: Account[];
  todayRate: number;
  onOpenCalendar?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categories,
  sources,
  accounts = [],
  todayRate,
  onOpenCalendar,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [period, setPeriod] = useState<'month' | 'all'>('month');

  // Estado para el modal de desglose de compras por categoría
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Estado para el modal de detalle completo de una transacción específica
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);

  // Filtrar por período (mes actual vs todo el historial)
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
        : Math.round(tx.amountMinor / (tx.rateUsed || todayRate));

    if (tx.type === 'income') {
      totalIncomeUsdMinor += usdEquivalentMinor;
    } else if (tx.type === 'expense') {
      totalExpenseUsdMinor += usdEquivalentMinor;
    }
  });

  const netSavingsUsdMinor = totalIncomeUsdMinor - totalExpenseUsdMinor;

  // Desglose de gastos por categoría (montos y conteo)
  const categoryExpenses: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  filtered
    .filter((tx) => tx.type === 'expense' && tx.categoryId)
    .forEach((tx) => {
      const catId = tx.categoryId!;
      const usdEquivalent =
        tx.currency === 'USD'
          ? tx.amountMinor
          : Math.round(tx.amountMinor / (tx.rateUsed || todayRate));
      categoryExpenses[catId] = (categoryExpenses[catId] || 0) + usdEquivalent;
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });

  const sortedCategories = categories
    .map((c) => ({
      ...c,
      totalUsdMinor: categoryExpenses[c.id] || 0,
      count: categoryCounts[c.id] || 0,
      percentage:
        totalExpenseUsdMinor > 0
          ? Math.round(((categoryExpenses[c.id] || 0) / totalExpenseUsdMinor) * 100)
          : 0,
    }))
    .filter((c) => c.totalUsdMinor > 0)
    .sort((a, b) => b.totalUsdMinor - a.totalUsdMinor);

  // Categoría top
  const topCategory = sortedCategories[0];

  // Desglose de ingresos por empleador (Policía vs Bellagio vs Otros)
  let policiaIncomeVesMinor = 0;
  let policiaIncomeUsdMinor = 0;
  let bellagioIncomeUsdMinor = 0;
  let otherIncomeUsdMinor = 0;

  filtered
    .filter((tx) => tx.type === 'income')
    .forEach((tx) => {
      const source = sources.find((s) => s.id === tx.sourceId);
      const isPolicia =
        source?.employer === 'Policía' ||
        tx.sourceId === 'src-policia' ||
        tx.merchant?.toLowerCase().includes('polic');

      const isBellagio =
        source?.employer === 'Muebles Bellagio' ||
        tx.sourceId === 'src-bellagio' ||
        tx.merchant?.toLowerCase().includes('bellagio');

      const usdEquiv =
        tx.currency === 'USD'
          ? tx.amountMinor
          : Math.round(tx.amountMinor / (tx.rateUsed || todayRate));

      if (isPolicia) {
        if (tx.currency === 'VES') {
          policiaIncomeVesMinor += tx.amountMinor;
        } else {
          policiaIncomeVesMinor += Math.round(tx.amountMinor * (tx.rateUsed || todayRate));
        }
        policiaIncomeUsdMinor += usdEquiv;
      } else if (isBellagio) {
        bellagioIncomeUsdMinor += usdEquiv;
      } else {
        otherIncomeUsdMinor += usdEquiv;
      }
    });

  // Agrupación histórica mensual
  const monthlyData: Record<string, { incomeUsd: number; expenseUsd: number }> = {};
  transactions.forEach((tx) => {
    const monthKey = tx.occurredAt.slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { incomeUsd: 0, expenseUsd: 0 };
    }
    const usd =
      tx.currency === 'USD'
        ? tx.amountMinor
        : Math.round(tx.amountMinor / (tx.rateUsed || todayRate));
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Análisis de Finanzas</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Entiende en qué se va tu dinero
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              title="Abrir Calendario y Diario Financiero"
              aria-label="Abrir Calendario y Diario Financiero"
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-full)',
                background: 'var(--badge-bg-neutral)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-usd)';
                e.currentTarget.style.borderColor = 'var(--border-active)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <Calendar size={16} />
            </button>
          )}

          {/* Selector de Período */}
          <div
            style={{
              display: 'flex',
              background: 'var(--badge-bg-neutral)',
              padding: 3,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
            }}
          >
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
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
              background: period === 'all' ? 'var(--act-income-bg)' : 'transparent',
              color: period === 'all' ? 'var(--color-usd)' : 'var(--text-secondary)',
              border: period === 'all' ? '1px solid var(--act-income-border)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Histórico
          </button>
        </div>
      </div>
    </div>

      {/* KPI Cards Consolidados (Ingresos, Gastos, Balance) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            <TrendingUp size={12} color="#34d399" />
            <span>Ingresos</span>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#34d399',
              marginTop: 4,
            }}
          >
            {formatMoney(totalIncomeUsdMinor, 'USD')}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            <TrendingDown size={12} color="#fb7185" />
            <span>Gastos</span>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#fb7185',
              marginTop: 4,
            }}
          >
            {formatMoney(totalExpenseUsdMinor, 'USD')}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 10px', textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            <Wallet size={12} color={netSavingsUsdMinor >= 0 ? '#34d399' : '#fb7185'} />
            <span>Balance</span>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: netSavingsUsdMinor >= 0 ? '#34d399' : '#fb7185',
              marginTop: 4,
            }}
          >
            {formatMoney(netSavingsUsdMinor, 'USD')}
          </div>
        </div>
      </div>

      {/* Insight del mayor gasto - Clickeable para abrir el desglose */}
      {topCategory && (
        <div
          className="glass-panel"
          onClick={() => setSelectedCategory(topCategory)}
          role="button"
          tabIndex={0}
          aria-label={`Ver compras de ${topCategory.name}`}
          style={{
            padding: 14,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${topCategory.color}44`,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${topCategory.color}88`;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${topCategory.color}44`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `${topCategory.color}22`,
              border: `1px solid ${topCategory.color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PieChart size={18} color={topCategory.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Rubro de Mayor Gasto</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Toca para ver compras
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {topCategory.name}:{' '}
              <strong style={{ color: '#fbbf24' }}>{topCategory.percentage}%</strong> de tus
              salidas ({formatMoney(topCategory.totalUsdMinor, 'USD')})
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* Desglose por Empleadores (Policía vs Bellagio) */}
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Ingresos por Empleo
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: otherIncomeUsdMinor > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
          <div className="glass-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Shield size={16} color="#60a5fa" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>Policía</span>
            </div>
            <div
              style={{
                fontSize: otherIncomeUsdMinor > 0 ? 14 : 16,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#fbbf24',
              }}
            >
              {formatMoney(policiaIncomeVesMinor, 'VES')}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
              ≈ {formatMoney(Math.round(policiaIncomeVesMinor / todayRate), 'USD')}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Briefcase size={16} color="#c084fc" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#c084fc' }}>Bellagio</span>
            </div>
            <div
              style={{
                fontSize: otherIncomeUsdMinor > 0 ? 14 : 16,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#34d399',
              }}
            >
              {formatMoney(bellagioIncomeUsdMinor, 'USD')}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Comisiones y ventas
            </div>
          </div>

          {otherIncomeUsdMinor > 0 && (
            <div className="glass-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Wallet size={16} color="#38bdf8" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>Otros</span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#38bdf8',
                }}
              >
                {formatMoney(otherIncomeUsdMinor, 'USD')}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Extras y ventas
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desglose de Gastos por Categoría - CON TALADRADO INTERACTIVO */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: 0.5,
              margin: 0,
            }}
          >
            ¿En qué se fue el dinero? ({sortedCategories.length} categorías)
          </h3>
          <span style={{ fontSize: 11, color: 'var(--color-task, #06b6d4)', fontWeight: 600 }}>
            Toca una categoría para ver compras
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              No hay gastos registrados en este período.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedCategories.map((c) => (
              <div
                key={c.id}
                className="glass-card"
                onClick={() => setSelectedCategory(c)}
                role="button"
                tabIndex={0}
                aria-label={`Ver compras realizadas en ${c.name}`}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = `${c.color}66`;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = '';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: c.color,
                        boxShadow: `0 0 8px ${c.color}66`,
                      }}
                    />
                    <div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-tertiary)',
                          marginLeft: 6,
                          fontWeight: 500,
                        }}
                      >
                        ({c.count} {c.count === 1 ? 'compra' : 'compras'})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: '#fb7185',
                        }}
                      >
                        {formatMoney(c.totalUsdMinor, 'USD')}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-tertiary)',
                          marginLeft: 6,
                        }}
                      >
                        ({c.percentage}%)
                      </span>
                    </div>
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </div>
                </div>

                {/* Barra de Porcentaje con hardware accelerated transform */}
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: c.color,
                      borderRadius: 999,
                      transform: `scaleX(${c.percentage / 100})`,
                      transformOrigin: 'left',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial Comparativo por Meses */}
      <div>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Evolución Mensual
        </h3>
        {months.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            <div style={{ fontSize: 12 }}>
              Los resúmenes mensuales aparecerán a medida que registres movimientos.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {months.map((m) => {
              const data = monthlyData[m];
              const monthLabel = new Date(`${m}-02`).toLocaleDateString('es-VE', {
                month: 'long',
                year: 'numeric',
              });
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
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {monthLabel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Ingresos:{' '}
                      <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                        +{formatMoney(data.incomeUsd, 'USD')}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: '#fb7185',
                      }}
                    >
                      -{formatMoney(data.expenseUsd, 'USD')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Gastado</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Deslizante Bottom-Sheet con el Desglose de Compras de la Categoría */}
      <CategoryBreakdownModal
        isOpen={Boolean(selectedCategory)}
        category={selectedCategory}
        period={period}
        transactions={filtered}
        accounts={accounts}
        todayRate={todayRate}
        totalExpenseUsdMinor={totalExpenseUsdMinor}
        onClose={() => setSelectedCategory(null)}
        onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
      />

      {/* Modal Detallado de la Transacción (para ver recibos, editar o eliminar) */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTxForDetail)}
        transaction={selectedTxForDetail}
        accounts={accounts}
        categories={categories}
        todayRate={todayRate}
        onClose={() => setSelectedTxForDetail(null)}
        onEdit={(tx) => {
          setSelectedTxForDetail(null);
          setSelectedCategory(null);
          if (onEditTransaction) onEditTransaction(tx);
        }}
        onDelete={(id) => {
          setSelectedTxForDetail(null);
          if (onDeleteTransaction) onDeleteTransaction(id);
        }}
      />
    </div>
  );
};
