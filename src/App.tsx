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
import { TransactionModal } from './features/transactions/TransactionModal';
import { RateModal } from './features/exchange-rate/RateModal';
import { TaskModal } from './features/tasks/TaskModal';
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

export type ActiveTab = 'home' | 'history' | 'analytics' | 'debts' | 'tasks';
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<IncomeSource[]>([]);

  // Estados de Modales
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
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
    } catch (err) {
      console.warn('Conexión local activa:', err);
    }
  };

  useEffect(() => {
    refreshData();

    // Actualización automática de tasas al abrir la app si está habilitada
    const currentConfig = ExchangeRateService.getConfig();
    if (currentConfig.autoUpdate) {
      ExchangeRateService.fetchLiveRates().then((res) => {
        if (res.success) {
          setRateConfig({ ...res.config });
        }
      });
    }
  }, []);

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

  const handleOpenExpense = () => {
    setTxModalType('expense');
    setIsTxModalOpen(true);
  };

  const handleOpenIncome = () => {
    setTxModalType('income');
    setIsTxModalOpen(true);
  };

  const handleOpenExchange = () => {
    setTxModalType('exchange');
    setIsTxModalOpen(true);
  };

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
        todayRate={activeRate}
        accounts={accounts}
        categories={categories}
        sources={sources}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={refreshData}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        categories={categories}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}

export default App;
