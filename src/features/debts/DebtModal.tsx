import React, { useState, useEffect } from 'react';
import { X, Check, HandCoins, Calendar } from 'lucide-react';
import type { Debt } from './types';
import { toMinor, type Currency } from '../../shared/lib/money';
import { getTodayDateStr } from '../../shared/lib/storage';
import { DatabaseService } from '../../shared/lib/dbService';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [creditor, setCreditor] = useState('');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCreditor('');
    setDescription('');
    setAmountInput('');
    setCurrency('USD');
    setStartDate(getTodayDateStr());
    setDueDate('');
    setNotes('');
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const originalAmountMinor = toMinor(amountInput);
    if (!creditor.trim() || originalAmountMinor <= 0) return;

    const newDebt: Omit<Debt, 'id' | 'payments' | 'isPaidOff'> = {
      creditor: creditor.trim(),
      description: description.trim() || undefined,
      originalAmountMinor,
      currency,
      startDate: startDate || getTodayDateStr(),
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    };

    await DatabaseService.saveDebt(newDebt);
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
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}>
              <HandCoins size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Nueva Deuda / Compromiso</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Registra el dinero que debes amortizar</p>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Acreedor */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              ¿A quién le debes? (Acreedor / Persona)
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="Ej. Juan Pérez, Préstamo familiar, Taller..."
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              style={{ fontSize: 15, fontWeight: 600 }}
            />
          </div>

          {/* Monto Inicial y Moneda */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              Monto Original de la Deuda
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="Ej. 17500.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#fb7185',
                  padding: '10px 14px',
                }}
              />
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 4,
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: currency === 'USD' ? '#042f2e' : 'var(--text-secondary)',
                    background: currency === 'USD' ? 'var(--color-usd)' : 'none',
                  }}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('VES')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: currency === 'VES' ? '#1c1303' : 'var(--text-secondary)',
                    background: currency === 'VES' ? 'var(--color-ves)' : 'none',
                  }}
                >
                  Bs
                </button>
              </div>
            </div>
          </div>

          {/* Concepto / Motivo */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              Concepto o Motivo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Préstamo para repuestos moto, compra personal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Fechas */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
                <Calendar size={13} /> FECHA OBTENIDA
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
                <Calendar size={13} /> FECHA LÍMITE (OPCIONAL)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          {/* Notas */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Notas adicionales (acuerdos, cuotas pactadas...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Check size={18} /> Registrar Deuda
          </button>
        </form>
      </div>
    </div>
  );
};
