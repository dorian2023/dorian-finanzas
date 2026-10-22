import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogOut,
  Smartphone,
  Laptop
} from 'lucide-react';
import { CloudSyncService, type CloudSyncStatus } from '../../shared/lib/cloudSyncService';
import { StorageService } from '../../shared/lib/storage';
import { BellagioService } from '../bellagio/bellagioService';

interface CloudSyncModalProps {
  isOpen: boolean;
  syncStatus: CloudSyncStatus;
  lastSyncTime: Date | null;
  onClose: () => void;
  onRefreshAll: () => void;
  onLockApp: () => void;
  onLogout: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  syncStatus,
  lastSyncTime,
  onClose,
  onRefreshAll,
  onLockApp,
  onLogout,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [counts, setCounts] = useState(() => ({
    txs: StorageService.getTransactions().length,
    tasks: StorageService.getTasks().length,
    debts: StorageService.getDebts().length,
    bellagio: BellagioService.getOrders().length,
  }));

  const refreshCounts = () => {
    setCounts({
      txs: StorageService.getTransactions().length,
      tasks: StorageService.getTasks().length,
      debts: StorageService.getDebts().length,
      bellagio: BellagioService.getOrders().length,
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      refreshCounts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePushToCloud = async () => {
    setIsProcessing(true);
    setFeedback(null);
    const result = await CloudSyncService.pushLocalDataToCloud();
    setIsProcessing(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: `¡Respaldo exitoso! Subidas ${result.txCount} transacciones, ${result.tasksCount} tareas y ${result.debtsCount} deudas a Supabase Cloud.`,
      });
      refreshCounts();
      onRefreshAll();
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Error al conectar con la nube.',
      });
    }
  };

  const handlePullFromCloud = async () => {
    setIsProcessing(true);
    setFeedback(null);
    const success = await CloudSyncService.pullCloudData();
    setIsProcessing(false);

    if (success) {
      refreshCounts();
      setFeedback({
        type: 'success',
        message: '¡Datos actualizados desde la nube exitosamente!',
      });
      onRefreshAll();
    } else {
      setFeedback({
        type: 'error',
        message: 'No se pudo descargar de la nube. Revisa tu conexión.',
      });
    }
  };

  const statusColor =
    syncStatus === 'connected' ? '#10b981' : syncStatus === 'syncing' ? '#38bdf8' : '#ef4444';
  const statusLabel =
    syncStatus === 'connected'
      ? 'Conectado a la Nube'
      : syncStatus === 'syncing'
      ? 'Sincronizando...'
      : 'Modo Local / Sin Conexión';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                Sincronización en la Nube
              </h2>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Consistencia multidispositivo (Móvil ↔ PC)
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Tarjeta de Estado de Conexión */}
        <div
          className="glass-panel"
          style={{
            borderRadius: 16,
            padding: 14,
            marginBottom: 16,
            background: 'var(--bg-card)',
            border: `1px solid ${statusColor}40`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: statusColor,
                  boxShadow: `0 0 10px ${statusColor}`,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 800, color: statusColor }}>
                {statusLabel}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Supabase Postgres
            </span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Servidor:{' '}
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              nxqiyqjsxpstnfirlnwf.supabase.co
            </code>
          </p>
          {lastSyncTime && (
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Última actualización: {lastSyncTime.toLocaleTimeString('es-VE')}
            </p>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              background:
                feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border:
                feedback.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
              color: feedback.type === 'success' ? '#34d399' : '#f87171',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Conteo de datos locales */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: 'var(--badge-bg-neutral)',
              padding: '10px 4px',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'block' }}>
              {counts.txs}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Gastos</span>
          </div>
          <div
            style={{
              background: 'var(--badge-bg-neutral)',
              padding: '10px 4px',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'block' }}>
              {counts.tasks}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Tareas</span>
          </div>
          <div
            style={{
              background: 'var(--badge-bg-neutral)',
              padding: '10px 4px',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'block' }}>
              {counts.debts}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Deudas</span>
          </div>
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              padding: '10px 4px',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: '#c084fc', display: 'block' }}>
              {counts.bellagio}
            </span>
            <span style={{ fontSize: 10, color: '#c084fc', fontWeight: 700 }}>Bellagio</span>
          </div>
        </div>

        {/* Acciones de Sincronización */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Subir a la nube */}
          <button
            type="button"
            onClick={handlePushToCloud}
            disabled={isProcessing}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CloudUpload size={18} />
              <div style={{ textAlign: 'left' }}>
                <div>Subir datos locales a la Nube</div>
                <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>
                  Usa esto en tu teléfono para enviar tus $23.95 a la base de datos
                </div>
              </div>
            </div>
            <Smartphone size={16} style={{ opacity: 0.8 }} />
          </button>

          {/* Descargar de la nube */}
          <button
            type="button"
            onClick={handlePullFromCloud}
            disabled={isProcessing}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CloudDownload size={18} />
              <div style={{ textAlign: 'left' }}>
                <div>Descargar datos más recientes</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Usa esto en tu PC para traer lo que registraste en el móvil
                </div>
              </div>
            </div>
            <Laptop size={16} style={{ opacity: 0.8 }} />
          </button>
        </div>

        {/* Seguridad y Sesión */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onLockApp}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Lock size={14} /> Bloquear App
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
