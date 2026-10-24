import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Bell,
  Circle,
  AlertCircle,
  Shield,
  Briefcase,
  ChevronRight,
  Sparkles,
  Camera,
  HandCoins,
  Settings,
  Sun,
  Moon,
  Calendar,
  Cloud,
  PiggyBank
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Account, Category, Transaction } from '../transactions/types';
import type { TaskReminder } from '../tasks/types';
import type { Debt } from '../debts/types';
import type { RateSource } from '../../shared/lib/exchangeRateService';
import type { CloudSyncStatus } from '../../shared/lib/cloudSyncService';
import { formatMoney } from '../../shared/lib/money';
import { getTodayDateStr } from '../../shared/lib/storage';

interface DashboardViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  todayRate: number;
  bcvRate: number;
  binanceRate: number;
  activeRateSource: RateSource;
  onSwitchRateSource: (source: RateSource) => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  tasks: TaskReminder[];
  debts?: Debt[];
  onOpenRateModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenExchangeModal: () => void;
  onOpenTaskModal: () => void;
  onToggleTask: (id: string) => void;
  onNavigateToTab: (tab: 'history' | 'tasks' | 'debts' | 'analytics') => void;
  onOpenCalendar: () => void;
  onOpenBellagio: () => void;
  onOpenPolicia?: () => void;
  cloudStatus?: CloudSyncStatus;
  onOpenCloudSync?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  theme,
  onToggleTheme,
  todayRate,
  bcvRate,
  binanceRate,
  activeRateSource,
  onSwitchRateSource,
  transactions,
  accounts,
  categories,
  tasks,
  debts = [],
  onOpenRateModal,
  onOpenExpenseModal,
  onOpenIncomeModal,
  onOpenExchangeModal,
  onOpenTaskModal,
  onToggleTask,
  onNavigateToTab,
  onOpenCalendar,
  onOpenBellagio,
  onOpenPolicia,
  cloudStatus = 'connected',
  onOpenCloudSync,
}) => {
  // Calcular saldos por cuenta
  const accountBalances = accounts.map((acc) => {
    let balanceMinor = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income' && tx.accountId === acc.id) {
        balanceMinor += tx.amountMinor;
      } else if (tx.type === 'expense' && tx.accountId === acc.id) {
        balanceMinor -= tx.amountMinor;
      } else if (tx.type === 'exchange') {
        if (tx.accountId === acc.id) {
          balanceMinor -= tx.amountMinor;
        }
        if (tx.toAccountId === acc.id) {
          // Si fue a otra moneda, calcular equivalente
          const converted =
            tx.currency === 'USD'
              ? Math.round(tx.amountMinor * tx.rateUsed)
              : Math.round(tx.amountMinor / tx.rateUsed);
          balanceMinor += converted;
        }
      }
    });
    return { ...acc, balanceMinor };
  });

  // Identificar cuenta de ahorro ("Sobre")
  const isSavingsAccount = (acc: Account) =>
    acc.id === 'acc-sobre' || acc.name.toLowerCase().includes('sobre') || Boolean(acc.isSavings);

  const availableAccounts = accountBalances.filter((acc) => !isSavingsAccount(acc));
  const savingsAccounts = accountBalances.filter(isSavingsAccount);

  // 1. Saldo DISPONIBLE (Líquido para gastar sin tocar el Sobre)
  let availableUsdMinor = 0;
  let availableVesMinor = 0;
  availableAccounts.forEach((acc) => {
    if (acc.currency === 'USD') {
      availableUsdMinor += acc.balanceMinor;
      availableVesMinor += Math.round(acc.balanceMinor * todayRate);
    } else {
      availableVesMinor += acc.balanceMinor;
      availableUsdMinor += Math.round(acc.balanceMinor / todayRate);
    }
  });

  // 2. Saldo en el SOBRE (Ahorro reservado)
  let savingsUsdMinor = 0;
  let savingsVesMinor = 0;
  savingsAccounts.forEach((acc) => {
    if (acc.currency === 'USD') {
      savingsUsdMinor += acc.balanceMinor;
      savingsVesMinor += Math.round(acc.balanceMinor * todayRate);
    } else {
      savingsVesMinor += acc.balanceMinor;
      savingsUsdMinor += Math.round(acc.balanceMinor / todayRate);
    }
  });

  // 3. Saldo Total Global (Disponible + Sobre)
  const totalUsdMinor = availableUsdMinor + savingsUsdMinor;
  const totalVesMinor = availableVesMinor + savingsVesMinor;

  // Gastos de hoy
  const todayStr = getTodayDateStr();
  const todayExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.occurredAt.startsWith(todayStr)
  );
  const todayExpensesUsdMinor = todayExpenses.reduce((acc, tx) => {
    const usd = tx.currency === 'USD' ? tx.amountMinor : Math.round(tx.amountMinor / tx.rateUsed);
    return acc + usd;
  }, 0);

  // Tareas de hoy o pendientes urgentes
  const pendingTasks = tasks.filter((t) => !t.isCompleted).slice(0, 3);

  // Deudas pendientes
  const pendingDebts = debts.filter((d) => !d.isPaidOff);
  let pendingDebtsUsdMinor = 0;
  pendingDebts.forEach((d) => {
    const paid = d.payments.reduce((acc, p) => acc + p.amountMinor, 0);
    const rem = Math.max(0, d.originalAmountMinor - paid);
    pendingDebtsUsdMinor += d.currency === 'USD' ? rem : Math.round(rem / todayRate);
  });

  const handleTaskCheck = (taskId: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#06b6d4', '#f59e0b'],
    });
    onToggleTask(taskId);
  };

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      {/* Header superior: Fila 1 (Perfil y Acciones de Cabecera) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Hola,</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 }}>Dorian 👋</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={onOpenPolicia}
              className="badge"
              style={{
                background: 'rgba(59, 130, 246, 0.18)',
                color: '#60a5fa',
                border: '1.5px solid rgba(59, 130, 246, 0.45)',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 9px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
              title="Registrar sueldos y bonos de Policía (Bs)"
            >
              <Shield size={10} /> Policía
            </button>
            <button
              type="button"
              onClick={onOpenBellagio}
              className="badge"
              style={{
                background: 'rgba(168, 85, 247, 0.18)',
                color: '#c084fc',
                border: '1.5px solid rgba(168, 85, 247, 0.45)',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 9px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
              title="Abrir pedidos y comisiones de Muebles Bellagio"
            >
              <Briefcase size={10} /> Bellagio
            </button>
          </div>
        </div>

        {/* Controles: Nube, Calendario, Selector de Tema (Dark / Light) y Engranaje */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="btn-icon"
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-full)',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
                border: `1px solid ${cloudStatus === 'connected' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
              title={`Estado Nube: ${cloudStatus === 'connected' ? 'Sincronizado' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Modo Local'}`}
              aria-label="Estado y respaldo en la nube"
            >
              <Cloud
                size={17}
                color={cloudStatus === 'connected' ? '#10b981' : cloudStatus === 'syncing' ? '#38bdf8' : '#ef4444'}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 7,
                  right: 7,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: cloudStatus === 'connected' ? '#10b981' : cloudStatus === 'syncing' ? '#38bdf8' : '#ef4444',
                  boxShadow: cloudStatus === 'connected' ? '0 0 6px #10b981' : 'none',
                }}
              />
            </button>
          )}

          <button
            onClick={onOpenCalendar}
            className="btn-icon"
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-full)',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Abrir Calendario y Diario Financiero"
            aria-label="Abrir Calendario y Diario Financiero"
          >
            <Calendar size={17} color="var(--text-secondary)" />
          </button>

          <button
            onClick={onToggleTheme}
            className="btn-icon"
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-full)',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={theme === 'dark' ? 'Cambiar a modo claro (Día)' : 'Cambiar a modo oscuro (Noche)'}
            aria-label="Cambiar tema claro u oscuro"
          >
            {theme === 'dark' ? (
              <Sun size={17} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))' }} />
            ) : (
              <Moon size={17} color="#6366f1" style={{ filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.3))' }} />
            )}
          </button>

          <button
            onClick={onOpenRateModal}
            className="btn-icon"
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-full)',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Configurar y sincronizar tasas"
            aria-label="Configuración de tasas"
          >
            <Settings size={17} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Header superior: Fila 2 (Selector Dual de Tasas Binance vs BCV) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {/* Botón Tasa Binance */}
        <button
          onClick={() => onSwitchRateSource('binance')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-lg)',
            background: activeRateSource === 'binance'
              ? (theme === 'dark' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)')
              : 'var(--badge-bg-neutral)',
            border: activeRateSource === 'binance' ? '1.5px solid #f59e0b' : '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 2,
            boxShadow: activeRateSource === 'binance' ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none',
            transition: 'all 0.18s ease',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
              🟡 BINANCE
            </span>
            {activeRateSource === 'binance' && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 10,
                  background: '#f59e0b',
                  color: '#000000',
                  textTransform: 'uppercase',
                }}
              >
                ACTIVA
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: activeRateSource === 'binance' ? '#f59e0b' : 'var(--text-primary)',
            }}
          >
            Bs. {binanceRate.toFixed(2)}
          </span>
        </button>

        {/* Botón Tasa BCV */}
        <button
          onClick={() => onSwitchRateSource('bcv')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-lg)',
            background: activeRateSource === 'bcv'
              ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)')
              : 'var(--badge-bg-neutral)',
            border: activeRateSource === 'bcv' ? '1.5px solid #3b82f6' : '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 2,
            boxShadow: activeRateSource === 'bcv' ? '0 0 12px rgba(59, 130, 246, 0.2)' : 'none',
            transition: 'all 0.18s ease',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
              🏛️ BCV
            </span>
            {activeRateSource === 'bcv' && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 10,
                  background: '#3b82f6',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                ACTIVA
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: activeRateSource === 'bcv' ? '#3b82f6' : 'var(--text-primary)',
            }}
          >
            Bs. {bcvRate.toFixed(2)}
          </span>
        </button>
      </div>

      {/* Hero Card Bimonetaria con Ahorro "Sobre" */}
      <div
        className="glass-panel pulse-glow"
        style={{
          background: 'var(--hero-gradient)',
          border: '1px solid var(--hero-border)',
          borderRadius: 24,
          padding: '18px 16px 14px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 18,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{
          position: 'absolute',
          top: -25,
          right: -25,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'var(--hero-glow)',
          pointerEvents: 'none',
        }} />

        {/* Fila Superior: Patrimonio Disponible (Principal) + Cápsula Sobre/Ahorro (Al lado, más pequeño) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 10,
        }}>
          {/* Bloque Izquierdo: Patrimonio Disponible */}
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--text-secondary)',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              Patrimonio Disponible
            </div>

            {/* Saldo en USD */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
              <span style={{
                fontSize: 32,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#34d399',
                letterSpacing: -1,
                lineHeight: 1,
              }}>
                {formatMoney(availableUsdMinor, 'USD')}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>USD</span>
            </div>

            {/* Equivalente en Bolívares */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Eq:</span>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: activeRateSource === 'binance' ? '#fbbf24' : '#60a5fa',
              }}>
                {formatMoney(availableVesMinor, 'VES')}
              </span>
              <span className="badge" style={{
                fontSize: 8.5,
                padding: '1px 5px',
                fontWeight: 800,
                borderRadius: 6,
                background: activeRateSource === 'binance' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                color: activeRateSource === 'binance' ? '#fbbf24' : '#60a5fa',
                border: `1px solid ${activeRateSource === 'binance' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
              }}>
                {activeRateSource === 'binance' ? 'Binance' : 'BCV'}
              </span>
            </div>
          </div>

          {/* Bloque Derecho: Micro-cápsula Sobre (Ahorro) */}
          <div
            style={{
              flex: '0 0 auto',
              background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 16,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 2,
            }}>
              <PiggyBank size={12} color="#10b981" />
              <span style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: '#10b981',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                Sobre (Ahorro)
              </span>
            </div>

            <div style={{
              fontSize: 16,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}>
              {formatMoney(savingsUsdMinor, 'USD')}
            </div>

            <div style={{
              fontSize: 9.5,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              marginTop: 2,
            }}>
              {formatMoney(savingsVesMinor, 'VES')}
            </div>
          </div>
        </div>

        {/* Fila Inferior: Total Global (Disponible + Ahorro) y Gastado hoy */}
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
        }}>
          {/* Total Global con Ahorro */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11 }}>Total Global:</span>
            <span style={{
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              fontSize: 12,
            }}>
              {formatMoney(totalUsdMinor, 'USD')}
            </span>
            <span style={{ fontSize: 9.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              ({formatMoney(totalVesMinor, 'VES')})
            </span>
          </div>

          {/* Gastado hoy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Gastado hoy:</span>
            <span style={{
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: todayExpensesUsdMinor > 0 ? '#fb7185' : 'var(--text-secondary)',
            }}>
              {formatMoney(todayExpensesUsdMinor, 'USD')}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción Rápida */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 22,
      }}>
        {/* + Gasto con Cámara */}
        <button
          onClick={onOpenExpenseModal}
          style={{
            flexDirection: 'column',
            gap: 6,
            padding: '14px 6px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--act-expense-bg)',
            border: '1px solid var(--act-expense-border)',
            color: 'var(--act-expense-text)',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--act-expense-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Camera size={20} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700 }}>+ Gasto</span>
        </button>

        {/* + Ingreso */}
        <button
          onClick={onOpenIncomeModal}
          style={{
            flexDirection: 'column',
            gap: 6,
            padding: '14px 6px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--act-income-bg)',
            border: '1px solid var(--act-income-border)',
            color: 'var(--act-income-text)',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--act-income-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TrendingUp size={20} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700 }}>+ Ingreso</span>
        </button>

        {/* Cambio Divisa */}
        <button
          onClick={onOpenExchangeModal}
          style={{
            flexDirection: 'column',
            gap: 6,
            padding: '14px 6px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--act-exchange-bg)',
            border: '1px solid var(--act-exchange-border)',
            color: 'var(--act-exchange-text)',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--act-exchange-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ArrowRightLeft size={18} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Cambio $</span>
        </button>

        {/* + Tarea */}
        <button
          onClick={onOpenTaskModal}
          style={{
            flexDirection: 'column',
            gap: 6,
            padding: '14px 6px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--act-task-bg)',
            border: '1px solid var(--act-task-border)',
            color: 'var(--act-task-text)',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--act-task-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bell size={18} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700 }}>+ Tarea</span>
        </button>
      </div>

      {/* Acceso directo a Diario Financiero & Calendario */}
      <div
        onClick={onOpenCalendar}
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          marginBottom: 18,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-usd)',
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              Diario Financiero & Calendario
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Consulta o registra gastos, ingresos y notas por fecha
            </div>
          </div>
        </div>
        <ChevronRight size={18} color="var(--text-tertiary)" />
      </div>

      {/* Sección: Mis Cuentas y Bolsillos */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
            Bolsillos & Cuentas ({accounts.length})
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Desliza ➔</span>
        </div>

        <div style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollbarWidth: 'none',
        }}>
          {accountBalances.map((acc) => {
            const isSavings = isSavingsAccount(acc);
            return (
              <div
                key={acc.id}
                className="glass-card"
                style={{
                  minWidth: 140,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  border: isSavings
                    ? '1.5px solid rgba(16, 185, 129, 0.45)'
                    : '1px solid var(--border-subtle)',
                  background: isSavings
                    ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)')
                    : undefined,
                  boxShadow: isSavings ? '0 0 12px rgba(16, 185, 129, 0.12)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSavings ? '#10b981' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    {isSavings && <PiggyBank size={12} color="#10b981" />}
                    {acc.name}
                  </span>
                  <span
                    className={`badge ${isSavings ? 'badge-usd' : acc.currency === 'USD' ? 'badge-usd' : 'badge-ves'}`}
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: isSavings ? 'rgba(16, 185, 129, 0.2)' : undefined,
                      color: isSavings ? '#34d399' : undefined,
                      border: isSavings ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                    }}
                  >
                    {isSavings ? 'AHORRO' : acc.currency}
                  </span>
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: acc.currency === 'USD' ? 'var(--color-usd)' : 'var(--color-ves)',
                }}>
                  {formatMoney(acc.balanceMinor, acc.currency)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección: Recordatorios y Tareas de Hoy */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={16} color="var(--color-task)" />
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
              Para no olvidar ({pendingTasks.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('tasks')}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-task)', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Sparkles size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>¡Estás al día! No tienes pendientes olvidados.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingTasks.map((t) => (
              <div
                key={t.id}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <button
                    onClick={() => handleTaskCheck(t.id)}
                    style={{ color: 'var(--text-tertiary)', padding: 0 }}
                  >
                    <Circle size={20} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: t.priority === 'high' ? '#f43f5e' : t.priority === 'medium' ? '#f59e0b' : '#06b6d4',
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {t.title}
                      </span>
                    </div>
                    {t.isFinancial && t.estimatedAmountMinor && (
                      <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        Costo estimado: {formatMoney(t.estimatedAmountMinor, t.estimatedCurrency || 'USD')}
                      </div>
                    )}
                  </div>
                </div>

                {t.dueTime && (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t.dueTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección: Compromisos y Deudas Pendientes */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HandCoins size={16} color="#fb7185" />
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
              Deudas & Compromisos ({pendingDebts.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('debts')}
            style={{ fontSize: 12, fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            Ver deudas <ChevronRight size={14} />
          </button>
        </div>

        {pendingDebts.length === 0 ? (
          <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              No tienes deudas activas registradas.
            </div>
            <button
              className="btn-secondary"
              onClick={() => onNavigateToTab('debts')}
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              + Registrar
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Restante por Pagar:
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
                {formatMoney(pendingDebtsUsdMinor, 'USD')}
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => onNavigateToTab('debts')}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
              }}
            >
              Abonar / Ver
            </button>
          </div>
        )}
      </div>

      {/* Sección: Últimos Movimientos */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
            Últimos Gastos e Ingresos
          </h3>
          <button
            onClick={() => onNavigateToTab('history')}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-usd)', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            Ver historial <ChevronRight size={14} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={28} color="#64748b" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Sin movimientos aún</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              Toca "+ Gasto" para tomarle una foto a tu primera factura o ticket.
            </div>
            <button className="btn-primary" onClick={onOpenExpenseModal} style={{ margin: '0 auto', fontSize: 13, padding: '10px 18px' }}>
              <Camera size={16} /> Registrar primer gasto
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.slice(0, 5).map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const category = categories.find((c) => c.id === tx.categoryId);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="glass-card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
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
                      {isExpense ? <TrendingDown size={18} /> : isIncome ? <TrendingUp size={18} /> : <ArrowRightLeft size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {tx.merchant || category?.name || (isIncome ? 'Ingreso' : 'Movimiento')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {account?.name} · {new Date(tx.occurredAt).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' })}
                        {tx.receiptUrl && ' 📸'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isExpense ? '#fb7185' : '#34d399',
                    }}>
                      {isExpense ? '-' : '+'}{formatMoney(tx.amountMinor, tx.currency)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      Tasa: Bs. {tx.rateUsed.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
