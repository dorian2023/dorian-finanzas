import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  Plus,
  StickyNote,
  Edit2,
  Trash2,
  Receipt,
  Clock
} from 'lucide-react';
import type { DayActivity } from './types';
import type { Account, Category, Transaction } from '../transactions/types';
import { formatMoney } from '../../shared/lib/money';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';

interface DayTimelineProps {
  activity: DayActivity;
  accounts: Account[];
  categories: Category[];
  todayRate: number;
  onToggleTask: (taskId: string) => void;
  onSaveNote: (dateStr: string, content: string) => void;
  onOpenAddExpenseForDate: (dateStr: string) => void;
  onOpenAddIncomeForDate: (dateStr: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  activity,
  accounts,
  categories,
  todayRate,
  onToggleTask,
  onSaveNote,
  onOpenAddExpenseForDate,
  onOpenAddIncomeForDate,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(activity.note || '');
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);

  // Sincronizar estado local de la nota si cambia la fecha
  React.useEffect(() => {
    setNoteContent(activity.note || '');
    setIsEditingNote(false);
  }, [activity.date, activity.note]);

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(activity.date, noteContent);
    setIsEditingNote(false);
  };

  const handleDeleteNote = () => {
    onSaveNote(activity.date, '');
    setNoteContent('');
    setIsEditingNote(false);
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Botones de Acción Rápida para esta Fecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button
          type="button"
          onClick={() => onOpenAddExpenseForDate(activity.date)}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--act-expense-bg)',
            border: '1px solid var(--act-expense-border)',
            color: 'var(--act-expense-text)',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> + Gasto en este día
        </button>

        <button
          type="button"
          onClick={() => onOpenAddIncomeForDate(activity.date)}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--act-income-bg)',
            border: '1px solid var(--act-income-border)',
            color: 'var(--act-income-text)',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> + Ingreso en este día
        </button>
      </div>

      {/* Bloque de Notas / Diario del Día */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 16,
          padding: 14,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ca8a04' }}>
            <StickyNote size={15} />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Nota / Diario del Día
            </span>
          </div>

          {!isEditingNote && activity.note && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="btn-icon"
                style={{ width: 28, height: 28, padding: 0 }}
                title="Editar nota"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                onClick={handleDeleteNote}
                className="btn-icon"
                style={{ width: 28, height: 28, padding: 0, color: '#f43f5e' }}
                title="Eliminar nota"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {isEditingNote ? (
          <form onSubmit={handleSaveNoteSubmit}>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Escribe lo que hiciste hoy, acuerdos de pago o apuntes..."
              rows={3}
              style={{
                width: '100%',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                resize: 'none',
                marginBottom: 8,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--badge-bg-neutral)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: 12, borderRadius: 'var(--radius-full)' }}
              >
                Guardar Nota
              </button>
            </div>
          </form>
        ) : activity.note ? (
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {activity.note}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingNote(true)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-tertiary)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'transparent',
            }}
          >
            <Plus size={13} /> Añadir una nota o recordatorio para este día
          </button>
        )}
      </div>

      {/* Sección de Tareas del Día (si hay tareas) */}
      {activity.tasks.length > 0 && (
        <div
          className="glass-panel"
          style={{
            borderRadius: 16,
            padding: 14,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#0284c7' }}>
            <Clock size={15} />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tareas Programadas ({activity.tasks.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--badge-bg-neutral)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    style={{ padding: 0, color: task.isCompleted ? '#10b981' : 'var(--text-tertiary)' }}
                  >
                    {task.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: task.isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      textDecoration: task.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </span>
                </div>

                {task.dueTime && (
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {task.dueTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Transacciones del Día */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 16,
          padding: 14,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      >
        <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Movimientos Registrados ({activity.transactions.length})
        </span>

        {activity.transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-tertiary)' }}>
            <p style={{ fontSize: 13 }}>No hay transacciones registradas en esta fecha.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activity.transactions.map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const category = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';
              const isExchange = tx.type === 'exchange';

              // Formato de hora
              let timeStr = '';
              if (tx.occurredAt && tx.occurredAt.includes('T')) {
                const timePart = tx.occurredAt.split('T')[1];
                if (timePart) timeStr = timePart.slice(0, 5);
              }

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransactionForDetail(tx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--badge-bg-neutral)',
                    border: '1px solid var(--border-subtle)',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Ver detalles completos de esta transacción"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    {/* Icono del tipo */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-md)',
                        background: isIncome
                          ? 'var(--act-income-bg)'
                          : isExchange
                          ? 'var(--act-exchange-bg)'
                          : 'var(--act-expense-bg)',
                        color: isIncome
                          ? 'var(--act-income-text)'
                          : isExchange
                          ? 'var(--act-exchange-text)'
                          : 'var(--act-expense-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isIncome ? <TrendingUp size={16} /> : isExchange ? <ArrowRightLeft size={16} /> : <TrendingDown size={16} />}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {tx.merchant || category?.name || (isIncome ? 'Ingreso' : isExchange ? 'Cambio' : 'Gasto')}
                        </span>
                        {tx.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setShowImagePreview(tx.receiptUrl || null)}
                            style={{ padding: 0, color: 'var(--color-usd)', display: 'inline-flex' }}
                            title="Ver factura adjunta"
                          >
                            <Receipt size={13} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <span>{account?.name || 'Cuenta'}</span>
                        {timeStr && <span>• {timeStr}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Montos */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: isIncome ? 'var(--act-income-text)' : 'var(--act-expense-text)',
                      }}
                    >
                      {isIncome ? '+' : '-'}
                      {formatMoney(tx.amountMinor, tx.currency)}
                    </span>
                    {tx.currency === 'USD' ? (
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        Bs. {formatMoney(Math.round(tx.amountMinor * (tx.rateUsed || todayRate)), 'VES').replace('Bs. ', '')}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        $ {formatMoney(Math.round(tx.amountMinor / (tx.rateUsed || todayRate)), 'USD').replace('$ ', '')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal visor de foto de factura */}
      {showImagePreview && (
        <div
          className="modal-overlay"
          onClick={() => setShowImagePreview(null)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1100 }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: 400,
              width: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={showImagePreview}
              alt="Factura"
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
            />
            <button
              type="button"
              onClick={() => setShowImagePreview(null)}
              className="badge badge-danger"
              style={{ position: 'absolute', top: 12, right: 12, cursor: 'pointer', background: 'rgba(0,0,0,0.8)' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalle Completo de la Transacción */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTransactionForDetail)}
        transaction={selectedTransactionForDetail}
        accounts={accounts}
        categories={categories}
        todayRate={todayRate}
        onClose={() => setSelectedTransactionForDetail(null)}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
      />
    </div>
  );
};
