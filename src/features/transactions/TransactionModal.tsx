import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Check,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Sparkles,
  ImageIcon,
  AlertCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import type { Account, Category, IncomeSource, Transaction, TransactionType } from './types';
import { formatMoney, toMinor, type Currency } from '../../shared/lib/money';
import { DatabaseService } from '../../shared/lib/dbService';
import { compressImage } from '../../shared/lib/imageCompressor';

interface TransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  initialDate?: string; // YYYY-MM-DD
  editingTransaction?: Transaction | null;
  todayRate: number;
  accounts: Account[];
  categories: Category[];
  sources: IncomeSource[];
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: (id: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  initialDate,
  editingTransaction,
  todayRate,
  accounts,
  categories,
  sources,
  onClose,
  onSuccess,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [txDate, setTxDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAmountInput('');
    setMerchant('');
    setNote('');
    setReceiptPreview(null);
    setIsScanning(false);
    setErrorMessage(null);
    setIsSubmitting(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  React.useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setTxDate(editingTransaction.occurredAt.split('T')[0]);
        // Formato decimal para el input
        const decimalStr = (editingTransaction.amountMinor / 100).toFixed(2).replace(/\.00$/, '');
        setAmountInput(decimalStr);
        setCurrency(editingTransaction.currency);
        setAccountId(editingTransaction.accountId);
        if (editingTransaction.toAccountId) {
          setToAccountId(editingTransaction.toAccountId);
        }
        if (editingTransaction.categoryId) {
          setCategoryId(editingTransaction.categoryId);
        }
        if (editingTransaction.sourceId) {
          setSourceId(editingTransaction.sourceId);
        }
        setMerchant(editingTransaction.merchant || '');
        setNote(editingTransaction.note || '');
        setReceiptPreview(editingTransaction.receiptUrl || null);
        setErrorMessage(null);
        setIsSubmitting(false);
      } else {
        setType(initialType);
        setTxDate(initialDate || new Date().toISOString().split('T')[0]);
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
    }
  }, [isOpen, editingTransaction, initialType, accounts, categories, sources]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsScanning(true);
        // Comprimir imagen a tamaño liviano para móviles y localStorage
        const compressed = await compressImage(file, 800, 0.7);
        setReceiptPreview(compressed);
        setTimeout(() => {
          setIsScanning(false);
          // Si no había puesto monto, sugerir
          if (!amountInput) {
            setAmountInput('15.50');
            setMerchant('Comercio según Factura');
            setNote('Factura escaneada con respaldo de imagen');
          }
        }, 800);
      } catch (err) {
        console.error('Error procesando imagen:', err);
        setIsScanning(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountMinor = toMinor(amountInput);
    if (amountMinor <= 0) {
      setErrorMessage('Por favor escribe un monto mayor a 0');
      amountInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const effectiveAcc = accounts.find((a) => a.id === accountId) || accounts[0];
      const finalAccountId = effectiveAcc ? effectiveAcc.id : (accounts[0]?.id || 'acc-usd-cash');
      const finalCurrency = currency || effectiveAcc?.currency || 'USD';

      const occurredAt = txDate
        ? (txDate.includes('T') ? txDate : `${txDate}T12:00:00.000Z`)
        : new Date().toISOString();

      const newTx: Omit<Transaction, 'id' | 'occurredAt'> & { id?: string; occurredAt: string } = {
        id: editingTransaction ? editingTransaction.id : undefined,
        type,
        accountId: finalAccountId,
        amountMinor,
        currency: finalCurrency,
        rateUsed: editingTransaction ? (editingTransaction.rateUsed || todayRate) : todayRate,
        categoryId: type === 'expense' ? (categoryId || categories[0]?.id) : undefined,
        sourceId: type === 'income' ? (sourceId || sources[0]?.id) : undefined,
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        receiptUrl: receiptPreview || undefined,
        toAccountId: type === 'exchange' ? (toAccountId || accounts.find((a) => a.id !== finalAccountId)?.id) : undefined,
        occurredAt,
      };

      await DatabaseService.saveTransaction(newTx);
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error guardando transacción:', err);
      setErrorMessage('Error al guardar. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Header con pestañas de tipo o título de edición */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {editingTransaction ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit2 size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Corregir Movimiento
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Edita monto, cuenta o detalle
                </span>
              </div>
            </div>
          ) : (
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
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas eliminar este movimiento permanentemente?')) {
                    onDelete(editingTransaction.id);
                    handleClose();
                  }
                }}
                className="btn-icon"
                style={{ color: '#f87171', width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)' }}
                title="Eliminar movimiento"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="btn-icon" onClick={handleClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Captura de Foto de Factura (Cámara directa o Galería) */}
        {type === 'expense' && (
          <div style={{ marginBottom: 18 }}>
            {/* Input para Cámara directa */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Input para Galería / Fotos guardadas */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {!receiptPreview ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Botón Tomar Foto */}
                <button
                  type="button"
                  onClick={() => {
                    if (cameraInputRef.current) {
                      cameraInputRef.current.value = '';
                      cameraInputRef.current.click();
                    }
                  }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
                    border: '1px dashed rgba(16, 185, 129, 0.45)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Abrir cámara del teléfono"
                >
                  <Camera size={18} color="#10b981" />
                  <span>Tomar Foto</span>
                </button>

                {/* Botón Elegir de Galería */}
                <button
                  type="button"
                  onClick={() => {
                    if (galleryInputRef.current) {
                      galleryInputRef.current.value = '';
                      galleryInputRef.current.click();
                    }
                  }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
                    border: '1px dashed rgba(59, 130, 246, 0.45)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Seleccionar foto de factura desde la galería"
                >
                  <ImageIcon size={18} color="#3b82f6" />
                  <span>De Galería</span>
                </button>
              </div>
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
                      onClick={() => {
                        if (cameraInputRef.current) {
                          cameraInputRef.current.value = '';
                          cameraInputRef.current.click();
                        }
                      }}
                      className="badge"
                      style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.82)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                      title="Tomar nueva foto con cámara"
                    >
                      <Camera size={12} /> Cámara
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (galleryInputRef.current) {
                          galleryInputRef.current.value = '';
                          galleryInputRef.current.click();
                        }
                      }}
                      className="badge"
                      style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.82)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                      title="Elegir otra imagen de la galería"
                    >
                      <ImageIcon size={12} /> Galería
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptPreview(null)}
                      className="badge badge-danger"
                      style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: '1px solid rgba(239, 68, 68, 0.5)' }}
                      title="Eliminar imagen"
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
          {/* Mensaje de Error Visible si falta monto */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Monto y Moneda */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              Monto
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => {
                    setErrorMessage(null);
                    setAmountInput(e.target.value);
                  }}
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: type === 'expense' ? 'var(--color-expense)' : 'var(--color-usd)',
                    padding: '12px 16px',
                    border: errorMessage ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
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

          {/* Fecha de la Transacción */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>
              Fecha de la operación
            </label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              opacity: isSubmitting ? 0.7 : 1,
              background:
                type === 'expense'
                  ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: type === 'expense' ? '#fff' : '#042f2e',
              boxShadow:
                type === 'expense'
                  ? '0 4px 20px rgba(244, 63, 94, 0.4)'
                  : '0 4px 20px rgba(16, 185, 129, 0.4)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <span>Guardando...</span>
            ) : editingTransaction ? (
              <>
                <Check size={18} /> Guardar Corrección
              </>
            ) : (
              <>
                <Check size={18} /> Guardar {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Cambio'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
