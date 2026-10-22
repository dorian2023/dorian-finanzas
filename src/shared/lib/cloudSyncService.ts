import { supabase } from './supabaseClient';
import { StorageService } from './storage';
import { DatabaseService } from './dbService';
import { BellagioService } from '../../features/bellagio/bellagioService';
import { DailyNotesService } from '../../features/calendar/dailyNotesService';

export type CloudSyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

class CloudSyncManager {
  private status: CloudSyncStatus = 'offline';
  private lastSyncTime: Date | null = null;
  private listeners: ((status: CloudSyncStatus, lastSync: Date | null) => void)[] = [];
  private realtimeChannel: any = null;

  constructor() {
    this.initNetworkMonitoring();
  }

  private initNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkConnection());
      window.addEventListener('offline', () => this.setStatus('offline'));
    }
  }

  public getStatus(): { status: CloudSyncStatus; lastSyncTime: Date | null } {
    return { status: this.status, lastSyncTime: this.lastSyncTime };
  }

  public subscribeStatus(listener: (status: CloudSyncStatus, lastSync: Date | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.status, this.lastSyncTime);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private setStatus(status: CloudSyncStatus) {
    this.status = status;
    if (status === 'connected') {
      this.lastSyncTime = new Date();
    }
    this.listeners.forEach((l) => l(this.status, this.lastSyncTime));
  }

  /**
   * Verifica la conectividad con Supabase
   */
  public async checkConnection(): Promise<boolean> {
    try {
      this.setStatus('syncing');
      const { error } = await supabase.from('accounts').select('id').limit(1);
      if (error) {
        this.setStatus('error');
        return false;
      }
      this.setStatus('connected');
      return true;
    } catch {
      this.setStatus('offline');
      return false;
    }
  }

  /**
   * Inicia el canal Realtime de Supabase para sincronización instantánea entre PC y Teléfono
   */
  public initRealtime(onDataChanged: () => void): () => void {
    try {
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
      }

      this.realtimeChannel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => {
            console.log('⚡ Cambio en Transacciones detectado en tiempo real desde otro dispositivo');
            onDataChanged();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => {
            console.log('⚡ Cambio en Tareas detectado en tiempo real');
            onDataChanged();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'debts' },
          () => {
            console.log('⚡ Cambio en Deudas detectado en tiempo real');
            onDataChanged();
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.setStatus('connected');
          }
        });

      return () => {
        if (this.realtimeChannel) {
          this.realtimeChannel.unsubscribe();
        }
      };
    } catch (err) {
      console.warn('Realtime no disponible en este entorno:', err);
      return () => {};
    }
  }

  /**
   * Sube todos los datos acumulados en el navegador local (teléfono o PC) hacia Supabase Cloud
   */
  public async pushLocalDataToCloud(): Promise<{
    success: boolean;
    txCount: number;
    tasksCount: number;
    debtsCount: number;
    error?: string;
  }> {
    try {
      this.setStatus('syncing');

      // 1. Cargar datos locales
      const localTxs = StorageService.getTransactions();
      const localTasks = StorageService.getTasks();
      const localDebts = StorageService.getDebts();

      // 2. Subir transacciones a Supabase (Upsert para no duplicar)
      if (localTxs.length > 0) {
        const payload = localTxs.map((t) => ({
          id: t.id,
          type: t.type,
          account_id: t.accountId,
          amount_minor: t.amountMinor,
          currency: t.currency,
          rate_used: t.rateUsed,
          category_id: t.categoryId || null,
          source_id: t.sourceId || null,
          merchant: t.merchant || null,
          note: t.note || null,
          receipt_url: t.receiptUrl || null,
          to_account_id: t.toAccountId || null,
          occurred_at: t.occurredAt,
        }));

        const { error: txErr } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
        if (txErr) {
          console.error('Error subiendo transacciones:', txErr);
        }
      }

      // 3. Subir tareas
      if (localTasks.length > 0) {
        const payload = localTasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || null,
          due_date: t.dueDate,
          due_time: t.dueTime || null,
          priority: t.priority,
          is_completed: t.isCompleted,
          completed_at: t.completedAt || null,
          is_financial: t.isFinancial,
          estimated_amount_minor: t.estimatedAmountMinor || null,
          estimated_currency: t.estimatedCurrency || null,
          category_id: t.categoryId || null,
        }));
        await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
      }

      // 4. Subir deudas
      if (localDebts.length > 0) {
        for (const d of localDebts) {
          await supabase.from('debts').upsert(
            {
              id: d.id,
              creditor: d.creditor,
              description: d.description || null,
              original_amount_minor: d.originalAmountMinor,
              currency: d.currency,
              start_date: d.startDate || null,
              due_date: d.dueDate || null,
              notes: d.notes || null,
              is_paid_off: d.isPaidOff,
            },
            { onConflict: 'id' }
          );

          if (d.payments && d.payments.length > 0) {
            const payPayload = d.payments.map((p) => ({
              id: p.id,
              debt_id: d.id,
              amount_minor: p.amountMinor,
              paid_at: p.paidAt,
              note: p.note || null,
            }));
            await supabase.from('debt_payments').upsert(payPayload, { onConflict: 'id' });
          }
        }
      }

      // 5. Subir pedidos de Bellagio y notas del calendario
      await Promise.all([
        BellagioService.syncToCloud(),
        DailyNotesService.syncToCloud(),
      ]);

      this.setStatus('connected');
      return {
        success: true,
        txCount: localTxs.length,
        tasksCount: localTasks.length,
        debtsCount: localDebts.length,
      };
    } catch (err: any) {
      console.error('Error en respaldo a la nube:', err);
      this.setStatus('error');
      return {
        success: false,
        txCount: 0,
        tasksCount: 0,
        debtsCount: 0,
        error: err?.message || 'Error de sincronización',
      };
    }
  }

  /**
   * Descarga la versión más fresca de la nube y actualiza la caché local
   */
  public async pullCloudData(): Promise<boolean> {
    try {
      this.setStatus('syncing');
      await Promise.all([
        DatabaseService.getTransactions(),
        DatabaseService.getTasks(),
        DatabaseService.getDebts(),
        DatabaseService.getAccounts(),
        DatabaseService.getCategories(),
        DatabaseService.getSources(),
        BellagioService.fetchFromCloud(),
        DailyNotesService.fetchFromCloud(),
      ]);

      this.setStatus('connected');
      return true;
    } catch (err) {
      this.setStatus('error');
      return false;
    }
  }
}

export const CloudSyncService = new CloudSyncManager();
