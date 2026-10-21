import React, { useState, useEffect } from 'react';
import { X, Check, Bell, DollarSign, Calendar, Clock } from 'lucide-react';
import type { TaskPriority, TaskReminder } from './types';
import type { Category } from '../transactions/types';
import { toMinor, type Currency } from '../../shared/lib/money';
import { getTodayDateStr } from '../../shared/lib/storage';
import { DatabaseService } from '../../shared/lib/dbService';

interface TaskModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateStr());
  const [dueTime, setDueTime] = useState('20:00');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isFinancial, setIsFinancial] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [estimatedCurrency, setEstimatedCurrency] = useState<Currency>('USD');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(getTodayDateStr());
    setDueTime('20:00');
    setPriority('medium');
    setIsFinancial(false);
    setEstimatedAmount('');
    setEstimatedCurrency('USD');
    setCategoryId(categories[0]?.id || '');
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
    if (!title.trim()) return;

    const newTask: Omit<TaskReminder, 'id'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      dueTime: dueTime || undefined,
      priority,
      isCompleted: false,
      isFinancial,
      estimatedAmountMinor: isFinancial ? toMinor(estimatedAmount) : undefined,
      estimatedCurrency: isFinancial ? estimatedCurrency : undefined,
      categoryId: isFinancial ? categoryId : undefined,
    };

    await DatabaseService.saveTask(newTask);
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
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-task)',
            }}>
              <Bell size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Nuevo Recordatorio</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Para que no se te olvide ningún pendiente</p>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Título de la tarea */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              ¿Qué debes recordar hacer?
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="Ej. Comprar repuesto de moto, pagar recibo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="Detalle o nota opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Fecha y Hora de Alarma */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
                <Calendar size={13} /> DÍA
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ fontSize: 14 }}
              />
            </div>
            <div style={{ width: 120 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
                <Clock size={13} /> HORA
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                style={{ fontSize: 14 }}
              />
            </div>
          </div>

          {/* Prioridad */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>
              Prioridad
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['high', 'medium', 'normal'] as TaskPriority[]).map((p) => {
                const label = p === 'high' ? '🔥 Alta' : p === 'medium' ? '⚡ Media' : 'Normal';
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 700,
                      background: isSelected
                        ? p === 'high'
                          ? 'rgba(244, 63, 94, 0.2)'
                          : p === 'medium'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(6, 182, 212, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected
                        ? `1.5px solid ${p === 'high' ? '#f43f5e' : p === 'medium' ? '#f59e0b' : '#06b6d4'}`
                        : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ¿Requiere Dinero? Conexión financiera */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: 12,
            marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} color="var(--color-usd)" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>¿Requiere dinero o compra?</span>
              </div>
              <input
                type="checkbox"
                checked={isFinancial}
                onChange={(e) => setIsFinancial(e.target.checked)}
                style={{ width: 22, height: 22, accentColor: 'var(--color-usd)', cursor: 'pointer' }}
              />
            </div>

            {isFinancial && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Monto estimado (ej. 20.00)"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    style={{ flex: 1, fontSize: 14 }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setEstimatedCurrency('USD')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        background: estimatedCurrency === 'USD' ? 'var(--color-usd)' : 'rgba(255,255,255,0.06)',
                        color: estimatedCurrency === 'USD' ? '#042f2e' : 'var(--text-secondary)',
                      }}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstimatedCurrency('VES')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        background: estimatedCurrency === 'VES' ? 'var(--color-ves)' : 'rgba(255,255,255,0.06)',
                        color: estimatedCurrency === 'VES' ? '#1c1303' : 'var(--text-secondary)',
                      }}
                    >
                      Bs
                    </button>
                  </div>
                </div>

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ fontSize: 13 }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      Categoría: {c.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  ✨ Al marcar esta tarea como lista, podrás registrar el gasto con 1 toque.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              color: '#082f49',
              boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Check size={18} /> Guardar Recordatorio
          </button>
        </form>
      </div>
    </div>
  );
};
