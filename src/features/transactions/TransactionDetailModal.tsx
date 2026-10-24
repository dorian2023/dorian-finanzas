import React, { useState } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  Building2,
  Tag,
  FileText,
  Camera,
  Edit2,
  Trash2,
  Maximize2
} from 'lucide-react';
import type { Account, Category, Transaction } from './types';
import { formatMoney } from '../../shared/lib/money';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  todayRate: number;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  accounts,
  categories,
  todayRate,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';
  const isExchange = transaction.type === 'exchange';
  const isExpense = transaction.type === 'expense';

  const account = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId ? accounts.find((a) => a.id === transaction.toAccountId) : null;
  const category = categories.find((c) => c.id === transaction.categoryId);

  const rate = transaction.rateUsed || todayRate;
  const isUSD = transaction.currency === 'USD';
  const equivalentMinor = isUSD
    ? Math.round(transaction.amountMinor * rate)
    : (rate > 0 ? Math.round(transaction.amountMinor / rate) : 0);
  const equivalentCurrency = isUSD ? 'VES' : 'USD';

  // Fecha y hora formateada
  let dateFormatted = transaction.occurredAt;
  let timeStr = '';
  try {
    const d = new Date(transaction.occurredAt);
    dateFormatted = new Intl.DateTimeFormat('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
    dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

    if (transaction.occurredAt.includes('T')) {
      const timePart = transaction.occurredAt.split('T')[1];
      if (timePart) {
        timeStr = timePart.slice(0, 5);
      }
    }
  } catch (_e) {
    // fallback
  }

  const handleDeleteClick = () => {
    if (window.confirm(`¿Seguro que deseas eliminar este movimiento "${transaction.merchant || 'Movimiento'}"? Se actualizará el saldo de tu cuenta.`)) {
      if (onDelete) {
        onDelete(transaction.id);
      }
      onClose();
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(transaction);
    }
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--modal-bg, #0f172a)',
            color: 'var(--text-primary, #f8fafc)',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '26px 26px 0 0',
            padding: '20px 18px calc(24px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -16px 48px rgba(0, 0, 0, 0.75)',
          }}
        >
          <div className="modal-handle" style={{ marginBottom: 14 }} />

          {/* Cabecera del Detalle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: isIncome
                    ? 'rgba(16, 185, 129, 0.15)'
                    : isExchange
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)',
                  border: isIncome
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : isExchange
                    ? '1px solid rgba(56, 189, 248, 0.35)'
                    : '1px solid rgba(244, 63, 94, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isIncome ? '#34d399' : isExchange ? '#38bdf8' : '#fb7185',
                }}
              >
                {isIncome ? <TrendingUp size={20} /> : isExchange ? <ArrowRightLeft size={20} /> : <TrendingDown size={20} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Detalle del Movimiento
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isIncome ? '#34d399' : isExchange ? '#38bdf8' : '#fb7185',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {isIncome ? 'Ingreso' : isExchange ? 'Cambio de Divisas' : 'Gasto'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{ width: 34, height: 34, borderRadius: '50%' }}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              paddingRight: 2,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Tarjeta Hero del Monto */}
            <div
              style={{
                padding: '16px',
                borderRadius: 18,
                background: isIncome
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 23, 42, 0.6) 100%)'
                  : isExchange
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.16) 0%, rgba(15, 23, 42, 0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(244, 63, 94, 0.16) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: isIncome
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : isExchange
                  ? '1px solid rgba(56, 189, 248, 0.3)'
                  : '1px solid rgba(244, 63, 94, 0.3)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: isIncome ? '#34d399' : isExchange ? '#38bdf8' : '#fb7185',
                  letterSpacing: -0.5,
                }}
              >
                {isIncome ? '+' : isExpense ? '-' : ''}
                {formatMoney(transaction.amountMinor, transaction.currency)}
              </div>

              {equivalentMinor > 0 && (
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  ≈ {formatMoney(equivalentMinor, equivalentCurrency)}
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                    (Tasa: Bs. {rate.toFixed(2)})
                  </span>
                </div>
              )}
            </div>

            {/* Cuadrícula de Información Estructurada */}
            <div
              style={{
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              {/* Concepto / Comercio */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ color: 'var(--text-tertiary)' }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 800 }}>
                    Concepto / Comercio
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                    {transaction.merchant || category?.name || (isIncome ? 'Ingreso' : 'Movimiento')}
                  </div>
                </div>
              </div>

              {/* Cuenta de Origen / Destino */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ color: 'var(--text-tertiary)' }}>
                  <Building2 size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 800 }}>
                    {isExchange ? 'Cuenta Origen → Destino' : 'Cuenta'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                    {account?.name || 'Cuenta'}
                    {toAccount && ` → ${toAccount.name}`}
                  </div>
                </div>
              </div>

              {/* Categoría (si aplica) */}
              {category && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    <Tag size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 800 }}>
                      Categoría
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      {category.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Fecha y Hora */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: transaction.note ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ color: 'var(--text-tertiary)' }}>
                  <Calendar size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 800 }}>
                    Fecha y Hora
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                    {dateFormatted} {timeStr && `• ${timeStr}`}
                  </div>
                </div>
              </div>

              {/* Nota / Descripción si existe */}
              {transaction.note && (
                <div
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 800 }}>
                      Nota Adicional
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                      "{transaction.note}"
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Foto / Evidencia Adjunta */}
            {transaction.receiptUrl && (
              <div
                style={{
                  borderRadius: 16,
                  padding: 14,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 12, fontWeight: 700 }}>
                    <Camera size={16} />
                    <span>Comprobante / Evidencia Fotográfica</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFullPhoto(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Maximize2 size={13} /> Ampliar
                  </button>
                </div>

                <div
                  onClick={() => setShowFullPhoto(true)}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#000',
                    maxHeight: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <img
                    src={transaction.receiptUrl}
                    alt="Evidencia fotográfica"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              </div>
            )}

            {/* Botones de Acción (Editar y Eliminar) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              {onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(59, 130, 246, 0.16)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Edit2 size={16} /> Corregir / Editar
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visor de Foto en Pantalla Completa */}
      {showFullPhoto && transaction.receiptUrl && (
        <div
          className="modal-overlay"
          onClick={() => setShowFullPhoto(false)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1200 }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: 420,
              width: '100%',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#000',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setShowFullPhoto(false)}
                className="btn-icon"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <img
              src={transaction.receiptUrl}
              alt="Comprobante completo"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
          </div>
        </div>
      )}
    </>
  );
};
