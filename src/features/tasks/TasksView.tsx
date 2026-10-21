import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Trash2,
  DollarSign,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TaskReminder } from './types';
import type { Category } from '../transactions/types';
import { formatMoney } from '../../shared/lib/money';
import { getTodayDateStr } from '../../shared/lib/storage';

interface TasksViewProps {
  tasks: TaskReminder[];
  categories: Category[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenTaskModal: () => void;
  onConvertTaskToExpense?: (task: TaskReminder) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  categories,
  onToggleTask,
  onDeleteTask,
  onOpenTaskModal,
  onConvertTaskToExpense,
}) => {
  const [filter, setFilter] = useState<'pending' | 'today' | 'completed'>('pending');

  const todayStr = getTodayDateStr();

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.isCompleted;
    if (filter === 'today') return !t.isCompleted && t.dueDate === todayStr;
    return !t.isCompleted;
  });

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleToggle = (task: TaskReminder) => {
    if (!task.isCompleted) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#10b981', '#fbbf24'],
      });

      // Si es financiera y tiene función de convertir en gasto, sugerir
      if (task.isFinancial && onConvertTaskToExpense) {
        setTimeout(() => {
          if (window.confirm(`¿Quieres registrar el gasto para "${task.title}" ahora?`)) {
            onConvertTaskToExpense(task);
          }
        }, 300);
      }
    }
    onToggleTask(task.id);
  };

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Gestor de Tareas</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Que nada se te pase por alto</p>
        </div>
        <button
          className="btn-primary"
          onClick={onOpenTaskModal}
          style={{
            padding: '10px 16px',
            fontSize: 13,
            background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
            color: '#082f49',
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
          }}
        >
          <Plus size={16} /> Nueva
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="glass-panel" style={{ padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Progreso de pendientes</span>
          <span style={{ color: 'var(--color-task)' }}>{completedCount} de {tasks.length} completadas ({progressPercent}%)</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #06b6d4, #10b981)',
            borderRadius: 999,
            transform: `scaleX(${progressPercent / 100})`,
            transformOrigin: 'left',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: 4,
        borderRadius: 'var(--radius-full)',
        marginBottom: 16,
      }}>
        <button
          onClick={() => setFilter('pending')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            color: filter === 'pending' ? 'var(--color-task)' : 'var(--text-tertiary)',
            background: filter === 'pending' ? 'rgba(6, 182, 212, 0.15)' : 'none',
          }}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('today')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            color: filter === 'today' ? 'var(--color-usd)' : 'var(--text-tertiary)',
            background: filter === 'today' ? 'rgba(16, 185, 129, 0.15)' : 'none',
          }}
        >
          Para Hoy
        </button>
        <button
          onClick={() => setFilter('completed')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            color: filter === 'completed' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            background: filter === 'completed' ? 'rgba(255, 255, 255, 0.1)' : 'none',
          }}
        >
          Hechas ({completedCount})
        </button>
      </div>

      {/* Lista de Tareas */}
      {filteredTasks.length === 0 ? (
        <div className="glass-card" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Sparkles size={32} color="#06b6d4" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {filter === 'completed' ? 'Aún no has completado tareas' : 'No hay tareas en esta lista'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Pulsa "+ Nueva" para anotar lo que no quieres olvidar.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId);
            const isToday = t.dueDate === todayStr;

            return (
              <div
                key={t.id}
                className="glass-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  opacity: t.isCompleted ? 0.6 : 1,
                }}
              >
                {/* Botón check */}
                <button
                  onClick={() => handleToggle(t)}
                  style={{
                    color: t.isCompleted ? 'var(--color-usd)' : 'var(--text-tertiary)',
                    padding: 0,
                    marginTop: 2,
                  }}
                >
                  {t.isCompleted ? <CheckCircle2 size={22} color="#10b981" /> : <Circle size={22} />}
                </button>

                {/* Contenido */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: t.isCompleted ? 'line-through' : 'none',
                    color: t.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                    marginBottom: 4,
                  }}>
                    {t.title}
                  </div>

                  {t.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      {t.description}
                    </div>
                  )}

                  {/* Etiquetas: Fecha, Hora, Dinero */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isToday ? '#fbbf24' : 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}>
                      <Calendar size={12} /> {isToday ? 'Hoy' : t.dueDate}
                    </span>

                    {t.dueTime && (
                      <span style={{
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        <Clock size={12} /> {t.dueTime}
                      </span>
                    )}

                    {t.isFinancial && t.estimatedAmountMinor && (
                      <span className="badge badge-usd" style={{ fontSize: 10, textTransform: 'none' }}>
                        <DollarSign size={10} />
                        Est: {formatMoney(t.estimatedAmountMinor, t.estimatedCurrency || 'USD')}
                        {category && ` (${category.name})`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <button
                  onClick={() => onDeleteTask(t.id)}
                  style={{ color: 'var(--text-tertiary)', padding: 4 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
