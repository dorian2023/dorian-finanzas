import React, { useState, useEffect } from 'react';
import { X, Check, HandCoins, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Debt } from './types';
import { formatMoney, toMinor } from '../../shared/lib/money';
import { getTodayDateStr } from '../../shared/lib/storage';
import { DatabaseService } from '../../shared/lib/dbService';

interface PaymentModalProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  debt,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [paidAt, setPaidAt] = useState(getTodayDateStr());
  const [note, setNote] = useState('');

  const resetForm = () => {
    setAmountInput('');
    setPaidAt(getTodayDateStr());
    setNote('');
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !debt) return null;

  const totalPaidMinor = debt.payments.reduce((acc, p) => acc + p.amountMinor, 0);
  const remainingMinor = Math.max(0, debt.originalAmountMinor - totalPaidMinor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = toMinor(amountInput);
    if (amountMinor <= 0) return;

    const updated = await DatabaseService.addDebtPayment(debt.id, {
      amountMinor,
      paidAt: paidAt || getTodayDateStr(),
      note: note.trim() || undefined,
    });

    if (updated?.isPaidOff) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#fbbf24'],
      });
    }

    resetForm();
    onSuccess();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-usd)',
            }}>
              <HandCoins size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Abonar a Deuda</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Acreedor: <strong style={{ color: 'var(--text-primary)' }}>{debt.creditor}</strong>
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Resumen del Saldo Actual */}
        <div style={{
          padding: 14,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Saldo Pendiente
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#fb7185',
            }}>
              {formatMoney(remainingMinor, debt.currency)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Original
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {formatMoney(debt.originalAmountMinor, debt.currency)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Monto del Abono */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              Monto a Abonar ({debt.currency})
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              required
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-usd)',
                padding: '10px 14px',
              }}
            />
          </div>

          {/* Fecha del Abono */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
              <Calendar size={13} /> FECHA EN QUE REALIZASTE EL PAGO
            </label>
            <input
              type="date"
              required
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              style={{ fontSize: 14 }}
            />
          </div>

          {/* Nota opcional */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Detalle o nota (ej. Pago quincena, efectivo...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Check size={18} /> Registrar Abono
          </button>
        </form>
      </div>
    </div>
  );
};
