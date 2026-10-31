/*  */import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingDown,
  Search,
  ChevronRight,
  Camera,
  ShoppingBag,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { Account, Category, Transaction } from '../transactions/types';
import { formatMoney } from '../../shared/lib/money';

interface CategoryBreakdownModalProps {
  isOpen: boolean;
  category: Category | null;
  period: 'month' | 'all';
  transactions: Transaction[];
  accounts: Account[];
  todayRate: number;
  totalExpenseUsdMinor: number;
  onClose: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

/**
 * CategoryBreakdownModal
 * Modal Bottom-Sheet de alta precisión (Impeccable Craft) para explorar al detalle
 * las compras individuales y gastos de una categoría en Dorian Finanzas.
 */
export const CategoryBreakdownModal: React.FC<CategoryBreakdownModalProps> = ({
  isOpen,
  category,
  period,
  transactions,
  accounts,
  todayRate,
  totalExpenseUsdMinor,
  onClose,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar transacciones pertenecientes a esta categoría
  const categoryExpenses = useMemo(() => {
    if (!category) return [];

    return transactions
      .filter((tx) => tx.type === 'expense' && tx.categoryId === category.id)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [category, transactions]);

  // Filtrar por término de búsqueda (comercio, nota, cuenta)
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return categoryExpenses;

    const query = searchQuery.toLowerCase().trim();
    return categoryExpenses.filter((tx) => {
      const merchant = (tx.merchant || '').toLowerCase();
      const note = (tx.note || '').toLowerCase();
      const account = accounts.find((a) => a.id === tx.accountId)?.name.toLowerCase() || '';
      return merchant.includes(query) || note.includes(query) || account.includes(query);
    });
  }, [categoryExpenses, searchQuery, accounts]);

  // Totales consolidados de la categoría
  const totalUsdMinor = useMemo(() => {
    return categoryExpenses.reduce((acc, tx) => {
      const usdEquivalent =
        tx.currency === 'USD'
          ? tx.amountMinor
          : Math.round(tx.amountMinor / (tx.rateUsed || todayRate));
      return acc + usdEquivalent;
    }, 0);
  }, [categoryExpenses, todayRate]);

  const totalVesEquivalentMinor = Math.round(totalUsdMinor * todayRate);
  const percentage =
    totalExpenseUsdMinor > 0 ? Math.round((totalUsdMinor / totalExpenseUsdMinor) * 100) : 0;
  const count = categoryExpenses.length;
  const avgUsdMinor = count > 0 ? Math.round(totalUsdMinor / count) : 0;

  if (!isOpen || !category) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1050,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '92vh',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--modal-bg, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          borderTop: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '28px 28px 0 0',
          padding: '16px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden', // Evita doble scrollbar; el scroll vive dentro de la lista
        }}
      >
        {/* Barra superior de arrastre */}
        <div className="modal-handle" style={{ flexShrink: 0, marginBottom: 12 }} />

        {/* Header con categoría, badge de período y botón de cerrar */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `${category.color}22`,
                border: `1.5px solid ${category.color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: category.color,
                boxShadow: `0 4px 14px ${category.color}25`,
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={22} color={category.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: -0.3,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {category.name}
              </h3>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <span>{period === 'month' ? 'Gastos de Este Mes' : 'Histórico Completo'}</span>
                <span>•</span>
                <span style={{ color: '#fb7185', fontWeight: 700 }}>
                  {count} {count === 1 ? 'compra' : 'compras'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar desglose"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tarjeta de Resumen / Métricas Principales (Nunca se comprime con flexShrink: 0) */}
        <div
          className="glass-card"
          style={{
            flexShrink: 0,
            padding: '14px 16px',
            marginBottom: 12,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: `1px solid ${category.color}40`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Resplandor decorativo con el color de la categoría */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: category.color,
              filter: 'blur(34px)',
              opacity: 0.25,
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  letterSpacing: 0.8,
                }}
              >
                Total Invertido
              </span>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#fb7185',
                  lineHeight: 1.25,
                  marginTop: 2,
                }}
              >
                {formatMoney(totalUsdMinor, 'USD')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: 2,
                }}
              >
                ≈ {formatMoney(totalVesEquivalentMinor, 'VES')}
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: `${category.color}22`,
                  border: `1px solid ${category.color}66`,
                  color: category.color,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <Sparkles size={12} />
                <span>{percentage}% del gasto</span>
              </div>

              {count > 1 && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Promedio: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(avgUsdMinor, 'USD')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buscador de compras (si hay más de 3 compras) */}
        {categoryExpenses.length > 3 && (
          <div
            style={{
              flexShrink: 0,
              position: 'relative',
              marginBottom: 10,
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              placeholder={`Buscar en ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-md, 14px)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Cabecera de la lista de compras */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            padding: '0 2px',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Compras Realizadas ({filteredExpenses.length})
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            Toca una compra para ver detalle
          </span>
        </div>

        {/* Lista de compras con scroll interno y scrollbar pulido */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4,
          }}
        >
          {filteredExpenses.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '30px 16px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                }}
              >
                <Layers size={20} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {searchQuery ? 'Sin resultados para la búsqueda' : 'No hay gastos registrados'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 280 }}>
                {searchQuery
                  ? `No encontramos compras que coincidan con "${searchQuery}".`
                  : `Aún no has registrado salidas de dinero en ${category.name} durante este período.`}
              </div>
            </div>
          ) : (
            filteredExpenses.map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const isUSD = tx.currency === 'USD';
              const rate = tx.rateUsed || todayRate;

              // Conversión bimonetaria
              const convertedMinor = isUSD
                ? Math.round(tx.amountMinor * rate)
                : rate > 0
                  ? Math.round(tx.amountMinor / rate)
                  : 0;
              const convertedCurrency = isUSD ? 'VES' : 'USD';

              // Formato de fecha amigable en español
              const txDate = new Date(tx.occurredAt);
              const isToday = new Date().toDateString() === txDate.toDateString();
              const dateLabel = isToday
                ? `Hoy, ${txDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`
                : txDate.toLocaleDateString('es-VE', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

              // Título principal
              const title = tx.merchant?.trim() || tx.note?.trim() || category.name;
              const hasDistinctNote = tx.note && tx.note.trim() !== title;

              return (
                <div
                  key={tx.id}
                  className="glass-card"
                  onClick={() => onSelectTransaction(tx)}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: '11px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = `${category.color}55`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {/* Lado izquierdo: Icono + Detalles de la compra */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fb7185',
                        flexShrink: 0,
                      }}
                    >
                      <TrendingDown size={16} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {title}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        {account && (
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'rgba(255, 255, 255, 0.07)',
                              color: 'var(--text-primary)',
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {account.name}
                          </span>
                        )}
                        <span>{dateLabel}</span>
                        {tx.receiptUrl && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              color: 'var(--color-task, #06b6d4)',
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            <Camera size={10} />
                            Recibo
                          </span>
                        )}
                      </div>

                      {hasDistinctNote && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-tertiary)',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontStyle: 'italic',
                          }}
                        >
                          "{tx.note}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lado derecho: Monto + Chevron */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: '#fb7185',
                        }}
                      >
                        -{formatMoney(tx.amountMinor, tx.currency)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: 1,
                        }}
                      >
                        ≈ {formatMoney(convertedMinor, convertedCurrency)}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-tertiary)" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Botón inferior fijo para cerrar */}
        <div
          style={{
            flexShrink: 0,
            marginTop: 12,
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 'var(--radius-md, 14px)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
