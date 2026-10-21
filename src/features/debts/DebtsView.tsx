import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles
} from 'lucide-react';
import type { Debt } from './types';
import { formatMoney } from '../../shared/lib/money';
import { DebtModal } from './DebtModal';
import { PaymentModal } from './PaymentModal';

interface DebtsViewProps {
  debts: Debt[];
  todayRate: number;
  onRefreshDebts: () => void;
  onDeleteDebt: (id: string) => void;
  onDeletePayment: (debtId: string, paymentId: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  todayRate,
  onRefreshDebts,
  onDeleteDebt,
  onDeletePayment,
}) => {
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Calcular totales pendientes
  let totalPendingUsdMinor = 0;
  let totalOriginalUsdMinor = 0;

  debts.forEach((d) => {
    const paidMinor = d.payments.reduce((acc, p) => acc + p.amountMinor, 0);
    const remainingMinor = Math.max(0, d.originalAmountMinor - paidMinor);

    if (d.currency === 'USD') {
      totalPendingUsdMinor += remainingMinor;
      totalOriginalUsdMinor += d.originalAmountMinor;
    } else {
      totalPendingUsdMinor += Math.round(remainingMinor / todayRate);
      totalOriginalUsdMinor += Math.round(d.originalAmountMinor / todayRate);
    }
  });

  const totalPaidUsdMinor = Math.max(0, totalOriginalUsdMinor - totalPendingUsdMinor);
  const globalProgress = totalOriginalUsdMinor > 0 ? Math.round((totalPaidUsdMinor / totalOriginalUsdMinor) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedDebtId(expandedDebtId === id ? null : id);
  };

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Deudas & Compromisos</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Amortización y control de lo que debes
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsDebtModalOpen(true)}
          style={{
            padding: '10px 16px',
            fontSize: 13,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
          }}
        >
          <Plus size={16} /> Nueva Deuda
        </button>
      </div>

      {/* Hero Card de Deudas */}
      <div
        className="glass-panel"
        style={{
          padding: 18,
          marginBottom: 18,
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          Total Deuda Pendiente
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 32,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: '#fb7185',
            lineHeight: 1,
          }}>
            {formatMoney(totalPendingUsdMinor, 'USD')}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>USD Aprox.</span>
        </div>

        {/* Equivalente en Bs */}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Equivale a: <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{formatMoney(Math.round(totalPendingUsdMinor * todayRate), 'VES')}</strong>
        </div>

        {/* Barra de amortización global */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Amortización total pagada</span>
            <span style={{ color: '#34d399' }}>{globalProgress}% saldado</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              borderRadius: 999,
              transform: `scaleX(${globalProgress / 100})`,
              transformOrigin: 'left',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>
      </div>

      {/* Lista de Deudas */}
      {debts.length === 0 ? (
        <div className="glass-card" style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Sparkles size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No tienes deudas registradas</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Si tienes compromisos o préstamos pendientes por pagar, regístralos para llevar el control de tus abonos.
          </div>
          <button
            className="btn-primary"
            onClick={() => setIsDebtModalOpen(true)}
            style={{ margin: '0 auto', fontSize: 13, padding: '10px 18px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          >
            <Plus size={16} /> Registrar Deuda
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {debts.map((d) => {
            const totalPaidMinor = d.payments.reduce((acc, p) => acc + p.amountMinor, 0);
            const remainingMinor = Math.max(0, d.originalAmountMinor - totalPaidMinor);
            const isFullyPaid = remainingMinor === 0 || d.isPaidOff;
            const progress = d.originalAmountMinor > 0 ? Math.min(100, Math.round((totalPaidMinor / d.originalAmountMinor) * 100)) : 100;
            const isExpanded = expandedDebtId === d.id;

            return (
              <div
                key={d.id}
                className="glass-card"
                style={{
                  padding: 16,
                  border: isFullyPaid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                  background: isFullyPaid ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-glass-card)',
                }}
              >
                {/* Cabecera de la tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {d.creditor}
                      </span>
                      <span className={`badge ${d.currency === 'USD' ? 'badge-usd' : 'badge-ves'}`} style={{ fontSize: 9 }}>
                        {d.currency}
                      </span>
                    </div>
                    {d.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {d.description}
                      </div>
                    )}
                  </div>

                  {isFullyPaid ? (
                    <span className="badge badge-usd" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> PAGADA
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ fontSize: 10 }}>
                      PENDIENTE
                    </span>
                  )}
                </div>

                {/* Saldo Restante y Progreso */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: 10,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Resta por Pagar
                    </div>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isFullyPaid ? '#34d399' : '#fb7185',
                    }}>
                      {formatMoney(remainingMinor, d.currency)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <div>Total: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatMoney(d.originalAmountMinor, d.currency)}</strong></div>
                    <div>Abonado: <strong style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{formatMoney(totalPaidMinor, d.currency)}</strong></div>
                  </div>
                </div>

                {/* Barra de progreso de esta deuda */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <span>Progreso de pago</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: isFullyPaid ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #10b981)',
                      borderRadius: 999,
                      transform: `scaleX(${progress / 100})`,
                      transformOrigin: 'left',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} />
                  </div>
                </div>

                {/* Fecha y Acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> Desde: {d.startDate}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {!isFullyPaid && (
                      <button
                        className="btn-primary"
                        onClick={() => setSelectedDebtForPayment(d)}
                        style={{ padding: '6px 12px', fontSize: 11, borderRadius: 'var(--radius-sm)' }}
                      >
                        <Plus size={13} /> + Abonar
                      </button>
                    )}

                    <button
                      className="btn-secondary"
                      onClick={() => toggleExpand(d.id)}
                      style={{ padding: '6px 10px', fontSize: 11, borderRadius: 'var(--radius-sm)', gap: 4 }}
                    >
                      <History size={12} /> Abonos ({d.payments.length})
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la deuda con "${d.creditor}"?`)) {
                          onDeleteDebt(d.id);
                        }
                      }}
                      style={{ color: 'var(--text-tertiary)', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Historial desplegable de abonos */}
                {isExpanded && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-subtle)',
                    animation: 'fadeIn 0.2s ease-out',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Historial de Pagos Realizados
                    </div>

                    {d.payments.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '6px 0' }}>
                        Aún no se han registrado abonos a esta deuda.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {d.payments.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.03)',
                              fontSize: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {p.paidAt} {p.note && `• "${p.note}"`}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                                -{formatMoney(p.amountMinor, d.currency)}
                              </span>
                              <button
                                onClick={() => onDeletePayment(d.id, p.id)}
                                style={{ color: 'var(--text-tertiary)', padding: 2 }}
                                title="Eliminar este abono"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSuccess={onRefreshDebts}
      />

      <PaymentModal
        debt={selectedDebtForPayment}
        isOpen={!!selectedDebtForPayment}
        onClose={() => setSelectedDebtForPayment(null)}
        onSuccess={onRefreshDebts}
      />
    </div>
  );
};
