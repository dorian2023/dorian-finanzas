import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Trash2,
  Edit2,
  X,
  Camera
} from 'lucide-react';
import type { Account, Category, Transaction } from './types';
import { formatMoney } from '../../shared/lib/money';

interface HistoryViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  accounts,
  categories,
  onDeleteTransaction,
  onEditTransaction,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | 'USD' | 'VES'>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    if (selectedCurrency !== 'ALL' && tx.currency !== selectedCurrency) return false;
    if (selectedAccountId !== 'ALL' && tx.accountId !== selectedAccountId) return false;
    if (selectedCategory !== 'ALL' && tx.categoryId !== selectedCategory) return false;
    return true;
  });

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Historial de Movimientos</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {filtered.length} movimientos registrados
        </p>
      </div>

      {/* Filtros Rápidos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          onClick={() => setSelectedCurrency('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            background: selectedCurrency === 'ALL' ? 'var(--text-primary)' : 'var(--badge-bg-neutral)',
            color: selectedCurrency === 'ALL' ? 'var(--bg-app)' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          Todas
        </button>
        <button
          onClick={() => setSelectedCurrency('USD')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            background: selectedCurrency === 'USD' ? 'var(--act-income-bg)' : 'var(--badge-bg-neutral)',
            color: selectedCurrency === 'USD' ? 'var(--color-usd)' : 'var(--text-secondary)',
            border: selectedCurrency === 'USD' ? '1px solid var(--act-income-border)' : '1px solid var(--border-subtle)',
          }}
        >
          Solo $ USD
        </button>
        <button
          onClick={() => setSelectedCurrency('VES')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            background: selectedCurrency === 'VES' ? 'rgba(245, 158, 11, 0.18)' : 'var(--badge-bg-neutral)',
            color: selectedCurrency === 'VES' ? 'var(--color-ves)' : 'var(--text-secondary)',
            border: selectedCurrency === 'VES' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-subtle)',
          }}
        >
          Solo Bs VES
        </button>
      </div>

      {/* Selectores de cuenta y categoría */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        >
          <option value="ALL">Todas las cuentas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        >
          <option value="ALL">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No hay movimientos con estos filtros</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Prueba seleccionando otra cuenta o moneda.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((tx) => {
            const account = accounts.find((a) => a.id === tx.accountId);
            const category = categories.find((c) => c.id === tx.categoryId);
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="glass-card"
                onClick={() => onEditTransaction(tx)}
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: isExpense
                      ? 'rgba(244, 63, 94, 0.15)'
                      : isIncome
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isExpense ? '#f43f5e' : isIncome ? '#10b981' : '#38bdf8',
                  }}>
                    {isExpense ? <TrendingDown size={20} /> : isIncome ? <TrendingUp size={20} /> : <ArrowRightLeft size={20} />}
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {tx.merchant || category?.name || (isIncome ? 'Ingreso' : 'Movimiento')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{account?.name}</span>
                      <span>•</span>
                      <span>{new Date(tx.occurredAt).toLocaleDateString('es-VE')}</span>
                    </div>
                    {tx.note && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        "{tx.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: isExpense ? '#fb7185' : '#34d399',
                  }}>
                    {isExpense ? '-' : '+'}{formatMoney(tx.amountMinor, tx.currency)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    Tasa: Bs. {tx.rateUsed.toFixed(2)}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                    {tx.receiptUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPhoto(tx.receiptUrl || null);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          fontSize: 10,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={12} /> Foto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(tx);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        fontSize: 10.5,
                        fontWeight: 700,
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title="Corregir este movimiento"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Seguro que deseas eliminar este movimiento (${tx.merchant || 'Movimiento'})?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      style={{
                        padding: '4px 7px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title="Eliminar movimiento"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para ver la foto de la factura */}
      {previewPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <div
            style={{
              maxWidth: 380,
              width: '90%',
              background: '#090d16',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border-card)',
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Comprobante de Factura</span>
              <button className="btn-icon" onClick={() => setPreviewPhoto(null)}>
                <X size={18} />
              </button>
            </div>
            <img
              src={previewPhoto}
              alt="Factura completa"
              style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
