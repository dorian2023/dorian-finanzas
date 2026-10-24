import { useState, useEffect } from 'react';
import {
  Home,
  Camera,
  CheckSquare,
  PieChart,
  HandCoins,
} from 'lucide-react';
import { DashboardView } from './features/dashboard/DashboardView';
import { HistoryView } from './features/transactions/HistoryView';
import { TasksView } from './features/tasks/TasksView';
import { DebtsView } from './features/debts/DebtsView';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { CalendarView } from './features/calendar/CalendarView';
import { TransactionModal } from './features/transactions/TransactionModal';
import { RateModal } from './features/exchange-rate/RateModal';
import { TaskModal } from './features/tasks/TaskModal';
import { BellagioSalesModal } from './features/bellagio/BellagioSalesModal';
import { PoliciaIncomeModal } from './features/policia/PoliciaIncomeModal';
import { AuthScreen } from './features/auth/AuthScreen';
import { AuthService } from './features/auth/authService';
import { CloudSyncModal } from './features/sync/CloudSyncModal';
import { CloudSyncService, type CloudSyncStatus } from './shared/lib/cloudSyncService';
import { StorageService } from './shared/lib/storage';
import { DatabaseService } from './shared/lib/dbService';
import {
  ExchangeRateService,
  type RateConfig,
  type RateSource,
} from './shared/lib/exchangeRateService';
import type { Account, Category, IncomeSource, Transaction, TransactionType } from './features/transactions/types';
import type { TaskReminder } from './features/tasks/types';
import type { Debt } from './features/debts/types';

export type ActiveTab = 'home' | 'history' | 'analytics' | 'debts' | 'tasks' | 'calendar';
export type ThemeMode = 'dark' | 'light';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Tema Dark / Light
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('dorian_theme') as ThemeMode;
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dorian_theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#080c14' : '#f1f5f9');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Tasas duales BCV & Binance
  const [rateConfig, setRateConfig] = useState<RateConfig>(ExchangeRateService.getConfig());
  const activeRate = rateConfig.activeSource === 'bcv' ? rateConfig.bcv : rateConfig.binance;

  // Datos reactivos
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<TaskReminder[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isBellagioModalOpen, setIsBellagioModalOpen] = useState(false);
  const [isPoliciaModalOpen, setIsPoliciaModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<IncomeSource[]>([]);

  // Autenticación y Seguridad
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => AuthService.isSessionActive());
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Estados de Modales
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Carga reactiva: caché local instantánea + sincronización Supabase
  const refreshData = async () => {
    setRateConfig(ExchangeRateService.getConfig());
    // 1. Carga inmediata desde almacenamiento local
    setTransactions(StorageService.getTransactions());
    setTasks(StorageService.getTasks());
    setDebts(StorageService.getDebts());
    setAccounts(StorageService.getAccounts());
    setCategories(StorageService.getCategories());
    setSources(StorageService.getSources());

    // 2. Sincronización en la nube con Supabase
    try {
      const [dbTxs, dbTasks, dbDebts, dbAccs, dbCats, dbSrcs] = await Promise.all([
        DatabaseService.getTransactions(),
        DatabaseService.getTasks(),
        DatabaseService.getDebts(),
        DatabaseService.getAccounts(),
        DatabaseService.getCategories(),
        DatabaseService.getSources(),
      ]);
      setTransactions(dbTxs);
      setTasks(dbTasks);
      setDebts(dbDebts);
      setAccounts(dbAccs);
      setCategories(dbCats);
      setSources(dbSrcs);
      setCloudStatus('connected');
    } catch (err) {
      console.warn('Conexión local activa:', err);
    }
  };

  useEffect(() => {
    refreshData();

    // 1. Suscripción al estado de sincronización con la nube
    const unsubscribeStatus = CloudSyncService.subscribeStatus((status, time) => {
      setCloudStatus(status);
      if (time) setLastSyncTime(time);
    });

    // 2. Suscripción en tiempo real (Supabase Realtime) para actualizar datos automáticamente cuando cambian en otro dispositivo
    const unsubscribeRealtime = CloudSyncService.initRealtime(() => {
      refreshData();
    });

    CloudSyncService.checkConnection();

    // Actualización automática de tasas al abrir la app si está habilitada
    const currentConfig = ExchangeRateService.getConfig();
    if (currentConfig.autoUpdate) {
      ExchangeRateService.fetchLiveRates().then((res) => {
        if (res.success) {
          setRateConfig({ ...res.config });
        }
      });
    }

    return () => {
      unsubscribeStatus();
      unsubscribeRealtime();
    };
  }, []);

  const handleLockApp = () => {
    AuthService.lock();
    setIsAuthenticated(false);
    setIsCloudModalOpen(false);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setIsCloudModalOpen(false);
  };

  // Handlers para tasas
  const handleSwitchRateSource = (source: RateSource) => {
    const updated = ExchangeRateService.setActiveSource(source);
    setRateConfig({ ...updated });
  };

  // Handlers sincronizados
  const handleToggleTask = async (id: string) => {
    await DatabaseService.toggleTaskCompleted(id);
    refreshData();
  };

  const handleDeleteTask = async (id: string) => {
    await DatabaseService.deleteTask(id);
    refreshData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await DatabaseService.deleteTransaction(id);
    refreshData();
  };

  const handleDeleteDebt = async (id: string) => {
    await DatabaseService.deleteDebt(id);
    refreshData();
  };

  const handleDeleteDebtPayment = async (debtId: string, paymentId: string) => {
    await DatabaseService.deleteDebtPayment(debtId, paymentId);
    refreshData();
  };

  const [txModalDate, setTxModalDate] = useState<string | undefined>(undefined);

  const handleOpenExpense = () => {
    setEditingTransaction(null);
    setTxModalType('expense');
    setTxModalDate(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenIncome = () => {
    setEditingTransaction(null);
    setTxModalType('income');
    setTxModalDate(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenExchange = () => {
    setEditingTransaction(null);
    setTxModalType('exchange');
    setTxModalDate(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenExpenseForDate = (dateStr: string) => {
    setEditingTransaction(null);
    setTxModalType('expense');
    setTxModalDate(dateStr);
    setIsTxModalOpen(true);
  };

  const handleOpenIncomeForDate = (dateStr: string) => {
    setEditingTransaction(null);
    setTxModalType('income');
    setTxModalDate(dateStr);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalType(tx.type);
    setIsTxModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthenticated={() => {
          setIsAuthenticated(true);
          refreshData();
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
      {/* Vistas Principales */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <DashboardView
            theme={theme}
            onToggleTheme={toggleTheme}
            todayRate={activeRate}
            bcvRate={rateConfig.bcv}
            binanceRate={rateConfig.binance}
            activeRateSource={rateConfig.activeSource}
            onSwitchRateSource={handleSwitchRateSource}
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            tasks={tasks}
            debts={debts}
            onOpenRateModal={() => setIsRateModalOpen(true)}
            onOpenExpenseModal={handleOpenExpense}
            onOpenIncomeModal={handleOpenIncome}
            onOpenExchangeModal={handleOpenExchange}
            onOpenTaskModal={() => setIsTaskModalOpen(true)}
            onToggleTask={handleToggleTask}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenCalendar={() => setActiveTab('calendar')}
            onOpenBellagio={() => setIsBellagioModalOpen(true)}
            onOpenPolicia={() => setIsPoliciaModalOpen(true)}
            cloudStatus={cloudStatus}
            onOpenCloudSync={() => setIsCloudModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            categories={categories}
            sources={sources}
            todayRate={activeRate}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView
            debts={debts}
            todayRate={activeRate}
            onRefreshDebts={refreshData}
            onDeleteDebt={handleDeleteDebt}
            onDeletePayment={handleDeleteDebtPayment}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            categories={categories}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onOpenTaskModal={() => setIsTaskModalOpen(true)}
            onConvertTaskToExpense={(_task) => {
              setTxModalType('expense');
              setIsTxModalOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            todayRate={activeRate}
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onBackToHome={() => setActiveTab('home')}
            onOpenAddExpenseForDate={handleOpenExpenseForDate}
            onOpenAddIncomeForDate={handleOpenIncomeForDate}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior (PWA Mobile) */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={20} />
          <span>Inicio</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <PieChart size={20} />
          <span>Análisis</span>
        </button>

        {/* Botón flotante central: Captura rápida con Cámara */}
        <button
          className="nav-fab"
          onClick={handleOpenExpense}
          title="Tomar foto de factura / Gasto"
        >
          <Camera size={26} />
        </button>

        <button
          className={`nav-item ${activeTab === 'debts' ? 'active' : ''}`}
          onClick={() => setActiveTab('debts')}
        >
          <HandCoins size={20} />
          <span>Deudas</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={20} />
          <span>Tareas</span>
        </button>
      </nav>

      {/* Modales */}
      <RateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onRateConfigChanged={(newConfig) => {
          setRateConfig(newConfig);
          refreshData();
        }}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        initialType={txModalType}
        initialDate={txModalDate}
        editingTransaction={editingTransaction}
        todayRate={activeRate}
        accounts={accounts}
        categories={categories}
        sources={sources}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
          setTxModalDate(undefined);
        }}
        onSuccess={refreshData}
        onDelete={handleDeleteTransaction}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        categories={categories}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={refreshData}
      />

      <BellagioSalesModal
        isOpen={isBellagioModalOpen}
        accounts={accounts}
        todayRate={activeRate}
        onClose={() => setIsBellagioModalOpen(false)}
        onOrderPaidSuccess={refreshData}
      />

      <PoliciaIncomeModal
        isOpen={isPoliciaModalOpen}
        accounts={accounts}
        transactions={transactions}
        todayRate={activeRate}
        onClose={() => setIsPoliciaModalOpen(false)}
        onSuccess={refreshData}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        syncStatus={cloudStatus}
        lastSyncTime={lastSyncTime}
        onClose={() => setIsCloudModalOpen(false)}
        onRefreshAll={refreshData}
        onLockApp={handleLockApp}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
