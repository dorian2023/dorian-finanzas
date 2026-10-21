import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Check,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import type { Account, Category, IncomeSource, Transaction, TransactionType } from './types';
import { formatMoney, toMinor, type Currency } from '../../shared/lib/money';
import { DatabaseService } from '../../shared/lib/dbService';

interface TransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  todayRate: number;
  accounts: Account[];
  categories: Category[];
  sources: IncomeSource[];
  onClose: () => void;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  todayRate,
  accounts,
  categories,
  sources,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [sourceId, setSourceId] = useState(sources[0]?.id || '');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAmountInput('');
    setMerchant('');
    setNote('');
    setReceiptPreview(null);
    setIsScanning(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      resetForm();

      // Asegurar que la cuenta seleccionada sea válida y exista
      const validAccount = accounts.find((a) => a.id === accountId) || accounts[0];
      if (validAccount) {
        setAccountId(validAccount.id);
        setCurrency(validAccount.currency);
      }

      // Asegurar cuenta destino para cambio
      const validToAccount = accounts.find((a) => a.id !== (validAccount?.id || '')) || accounts[1] || accounts[0];
      if (validToAccount) {
        setToAccountId(validToAccount.id);
      }

      // Asegurar categoría
      if (!categoryId || !categories.some((c) => c.id === categoryId)) {
        if (categories[0]) setCategoryId(categories[0].id);
      }

      // Asegurar fuente de ingreso
      if (!sourceId || !sources.some((s) => s.id === sourceId)) {
        if (sources[0]) setSourceId(sources[0].id);
      }
    }
  }, [isOpen, initialType, accounts, categories, sources]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Actualizar moneda según la cuenta seleccionada si aplica
  const handleAccountChange = (accId: string) => {
    setAccountId(accId);
    const selected = accounts.find((a) => a.id === accId);
    if (selected) {
      setCurrency(selected.currency);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
        // Simular escaneo de prueba inteligente
        setIsScanning(true);
        setTimeout(() => {
          setIsScanning(false);
          // Si no había puesto monto, sugerir
          if (!amountInput) {
            setAmountInput('15.50');
            setMerchant('Comercio según Factura');
            setNote('Factura escaneada con respaldo de imagen');
          }
        }, 1200);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = toMinor(amountInput);
    if (amountMinor <= 0) return;

    const effectiveAcc = accounts.find((a) => a.id === accountId) || accounts[0];
    const finalAccountId = effectiveAcc ? effectiveAcc.id : (accounts[0]?.id || 'acc-usd-cash');
    const finalCurrency = currency || effectiveAcc?.currency || 'USD';

    const newTx: Omit<Transaction, 'id' | 'occurredAt'> = {
      type,
      accountId: finalAccountId,
      amountMinor,
      currency: finalCurrency,
      rateUsed: todayRate,
      categoryId: type === 'expense' ? (categoryId || categories[0]?.id) : undefined,
      sourceId: type === 'income' ? (sourceId || sources[0]?.id) : undefined,
      merchant: merchant.trim() || undefined,
      note: note.trim() || undefined,
      receiptUrl: receiptPreview || undefined,
      toAccountId: type === 'exchange' ? (toAccountId || accounts.find((a) => a.id !== finalAccountId)?.id) : undefined,
    };

    await DatabaseService.saveTransaction(newTx);
    resetForm();
    onSuccess();
    onClose();
  };

  const numericValue = toMinor(amountInput);
  const equivalent =
    currency === 'USD'
      ? Math.round(numericValue * todayRate)
      : Math.round(numericValue / todayRate);
  const targetCurrency = currency === 'USD' ? 'VES' : 'USD';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header con pestañas de tipo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: 3,
            borderRadius: 'var(--radius-full)'
          }}>
            <button
              type="button"
              onClick={() => setType('expense')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                color: type === 'expense' ? '#fb7185' : 'var(--text-tertiary)',
                background: type === 'expense' ? 'rgba(244, 63, 94, 0.2)' : 'none',
              }}
            >
              <TrendingDown size={14} /> Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                color: type === 'income' ? '#34d399' : 'var(--text-tertiary)',
                background: type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'none',
              }}
            >
              <TrendingUp size={14} /> Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType('exchange')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                color: type === 'exchange' ? '#38bdf8' : 'var(--text-tertiary)',
                background: type === 'exchange' ? 'rgba(56, 189, 248, 0.2)' : 'none',
              }}
            >
              <ArrowRightLeft size={14} /> Cambio
            </button>
          </div>

          <button className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Captura de Foto de Factura (botón protagonista para gastos) */}
        {type === 'expense' && (
          <div style={{ marginBottom: 18 }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {!receiptPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
                  border: '1px dashed rgba(16, 185, 129, 0.4)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Camera size={20} color="#10b981" />
                <span>Tomar Foto de la Factura o Ticket</span>
              </button>
            ) : (
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-card)',
                height: 110,
                display: 'flex',
                alignItems: 'center',
                background: '#020617'
              }}>
                <img
                  src={receiptPreview}
                  alt="Factura"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isScanning ? 0.4 : 0.85 }}
                />
                {isScanning ? (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                    <Sparkles size={24} color="#10b981" className="pulse-glow" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>IA leyendo factura...</span>
                  </div>
                ) : (
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    display: 'flex',
                    gap: 6
                  }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="badge badge-usd"
                      style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.8)' }}
                    >
                      <Camera size={12} /> Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptPreview(null)}
                      className="badge badge-danger"
                      style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.8)' }}
                    >
                      <X size={12} /> Quitar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Monto y Moneda */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              Monto
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  required
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: type === 'expense' ? 'var(--color-expense)' : 'var(--color-usd)',
                    padding: '12px 16px',
                  }}
                />
              </div>

              {/* Botón selector de moneda */}
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

            {/* Equivalente en tiempo real */}
            {numericValue > 0 && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Equivale a:</span>
                <span style={{
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: targetCurrency === 'USD' ? 'var(--color-usd)' : 'var(--color-ves)'
                }}>
                  {formatMoney(equivalent, targetCurrency)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Tasa: Bs. {todayRate.toFixed(2)})</span>
              </div>
            )}
          </div>

          {/* Cuenta / Bolsillo Origen */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              {type === 'exchange' ? 'De la cuenta (Origen)' : 'Cuenta / Bolsillo'}
            </label>
            <select
              value={accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency === 'USD' ? '$ USD' : 'Bs VES'})
                </option>
              ))}
            </select>
          </div>

          {/* Cuenta Destino (solo para Cambio de Divisa) */}
          {type === 'exchange' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                A la cuenta (Destino)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {accounts.filter((a) => a.id !== accountId).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency === 'USD' ? '$ USD' : 'Bs VES'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Categoría (solo para Gastos) */}
          {type === 'expense' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                Categoría
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                maxHeight: 140,
                overflowY: 'auto',
                padding: 2
              }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: categoryId === cat.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                      border: categoryId === cat.id ? `1.5px solid ${cat.color}` : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: categoryId === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                    <span style={{ lineHeight: 1.2 }}>{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empleador / Fuente (solo para Ingresos: Policía vs Bellagio) */}
          {type === 'income' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                Fuente del Ingreso
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {sources.map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => {
                      setSourceId(src.id);
                      setCurrency(src.currency);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: sourceId === src.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                      border: sourceId === src.id ? '1.5px solid var(--color-usd)' : '1px solid var(--border-subtle)',
                      color: sourceId === src.id ? '#34d399' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {src.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comercio y Notas */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="text"
              placeholder={type === 'expense' ? 'Comercio / Taller (ej. Repuestos Moto)' : 'Detalle'}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              style={{ flex: 1, fontSize: 13 }}
            />
            <input
              type="text"
              placeholder="Nota corta"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ flex: 1, fontSize: 13 }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              background:
                type === 'expense'
                  ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: type === 'expense' ? '#fff' : '#042f2e',
              boxShadow:
                type === 'expense'
                  ? '0 4px 20px rgba(244, 63, 94, 0.4)'
                  : '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Check size={18} /> Guardar {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Cambio'}
          </button>
        </form>
      </div>
    </div>
  );
};
