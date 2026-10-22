import type { BellagioOrder, BellagioCutoffSummary } from './types';
import { DatabaseService } from '../../shared/lib/dbService';
import { formatMoney } from '../../shared/lib/money';
import { supabase } from '../../shared/lib/supabaseClient';
import type { Transaction } from '../transactions/types';

const STORAGE_KEY = 'dorian_bellagio_orders';

export const BellagioService = {
  getOrders(): BellagioOrder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const orders: BellagioOrder[] = JSON.parse(raw);
      return orders.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
    } catch (err) {
      console.error('Error cargando pedidos de Bellagio:', err);
      return [];
    }
  },

  /**
   * Sincroniza los pedidos locales con la nube de Supabase
   */
  async syncToCloud(orders?: BellagioOrder[]): Promise<void> {
    try {
      const payload = orders || this.getOrders();
      await supabase.from('tasks').upsert({
        id: 'sys-bellagio-orders',
        title: '__BELLAGIO_ORDERS_CLOUD__',
        description: JSON.stringify(payload),
        due_date: '2099-12-31',
        priority: 'low',
        is_completed: true,
      });
    } catch (err) {
      console.warn('Error sincronizando Bellagio con la nube:', err);
    }
  },

  /**
   * Descarga los pedidos más recientes de Supabase Cloud para que se vean en la PC
   */
  async fetchFromCloud(): Promise<BellagioOrder[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('description')
        .eq('id', 'sys-bellagio-orders');

      if (!error && data && data.length > 0 && data[0]?.description) {
        const cloudOrders: BellagioOrder[] = JSON.parse(data[0].description);
        if (Array.isArray(cloudOrders)) {
          if (cloudOrders.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudOrders));
            return cloudOrders.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
          } else {
            const localOrders = this.getOrders();
            if (localOrders.length > 0) {
              await this.syncToCloud(localOrders);
            }
          }
        }
      } else {
        const localOrders = this.getOrders();
        if (localOrders.length > 0) {
          await this.syncToCloud(localOrders);
        }
      }
    } catch (err) {
      console.warn('Error trayendo pedidos de Bellagio desde la nube:', err);
    }
    return this.getOrders();
  },

  saveOrder(
    orderData: Omit<BellagioOrder, 'id' | 'commissionMinor' | 'createdAt'> & {
      id?: string;
    }
  ): BellagioOrder {
    const orders = this.getOrders();
    const id = orderData.id || `bellagio-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const commissionRate = orderData.commissionRate || 0.04;
    const commissionMinor = Math.round(orderData.totalSaleMinor * commissionRate);

    const newOrder: BellagioOrder = {
      ...orderData,
      id,
      commissionRate,
      commissionMinor,
      createdAt: new Date().toISOString(),
    };

    const existingIndex = orders.findIndex((o) => o.id === id);
    if (existingIndex >= 0) {
      orders[existingIndex] = newOrder;
    } else {
      orders.unshift(newOrder);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Error guardando pedido de Bellagio en localStorage:', err);
    }

    // Sincronizar en la nube automáticamente
    this.syncToCloud(orders);

    return newOrder;
  },

  deleteOrder(id: string): void {
    const orders = this.getOrders().filter((o) => o.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Error eliminando pedido de Bellagio:', err);
    }

    this.syncToCloud(orders);
  },

  /**
   * Marca una comisión como cobrada e inserta automáticamente
   * la transacción como Ingreso en dorian-finanzas
   */
  async markAsPaid(
    orderId: string,
    accountId: string,
    todayRate: number
  ): Promise<BellagioOrder | null> {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    // Crear la transacción de ingreso en la contabilidad general
    const incomeTx: Omit<Transaction, 'id' | 'occurredAt'> = {
      type: 'income',
      accountId,
      amountMinor: order.commissionMinor,
      currency: order.currency,
      rateUsed: todayRate,
      sourceId: 'src-bellagio',
      merchant: 'Muebles Bellagio (Comisión)',
      note: `Comisión 4% Venta - Cliente: ${order.customerName} (${order.itemsDescription})`,
    };

    const savedTx = await DatabaseService.saveTransaction(incomeTx);

    // Actualizar el estado del pedido
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    order.incomeTxId = savedTx.id;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Error actualizando estado del pedido Bellagio:', err);
    }

    this.syncToCloud(orders);

    return order;
  },

  /**
   * Agrupa y calcula métricas por corte mensual
   */
  calculateCutoff(orders: BellagioOrder[], periodKey?: string): BellagioCutoffSummary {
    const now = new Date();
    const currentPeriod = periodKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const filtered = orders.filter((o) => o.orderDate.startsWith(currentPeriod));

    let totalSalesUSD = 0;
    let totalCommissionUSD = 0;
    let pendingCommissionUSD = 0;
    let paidCommissionUSD = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    for (const o of filtered) {
      if (o.status === 'cancelled') {
        cancelledCount++;
        continue; // Los pedidos anulados NO suman a las comisiones activas
      }

      // Si la venta está en VES, aproximamos a USD con tasa fija estándar para estadísticas consolidadas
      const saleUSD = o.currency === 'USD' ? o.totalSaleMinor : Math.round(o.totalSaleMinor / 880);
      const commUSD = o.currency === 'USD' ? o.commissionMinor : Math.round(o.commissionMinor / 880);

      totalSalesUSD += saleUSD;
      totalCommissionUSD += commUSD;

      if (o.status === 'pending') {
        pendingCommissionUSD += commUSD;
        pendingCount++;
      } else if (o.status === 'paid') {
        paidCommissionUSD += commUSD;
      }
    }

    // Formatear etiqueta de mes
    const [y, m] = currentPeriod.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, 1);
    const monthName = new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(dateObj);

    return {
      periodKey: currentPeriod,
      periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      totalSalesUSD,
      totalCommissionUSD,
      pendingCommissionUSD,
      paidCommissionUSD,
      totalOrdersCount: filtered.length,
      pendingOrdersCount: pendingCount,
      cancelledOrdersCount: cancelledCount,
    };
  },

  /**
   * Cambia el estado de un pedido a Anulado o lo reactiva a Pendiente
   */
  toggleCancelOrder(orderId: string): BellagioOrder | null {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    if (order.status === 'cancelled') {
      order.status = 'pending';
    } else {
      order.status = 'cancelled';
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Error actualizando estado anulado del pedido:', err);
    }

    this.syncToCloud(orders);

    return order;
  },

  /**
   * Genera el texto formateado para enviar por WhatsApp al jefe
   */
  generateWhatsAppReport(orders: BellagioOrder[], summary: BellagioCutoffSummary): string {
    const filtered = orders.filter((o) => o.orderDate.startsWith(summary.periodKey));
    const activeOrders = filtered.filter((o) => o.status !== 'cancelled');
    const cancelledOrders = filtered.filter((o) => o.status === 'cancelled');

    let text = `🛋️ *Muebles Bellagio - Reporte de Comisiones de Ventas*\n`;
    text += `📅 *Corte:* ${summary.periodLabel}\n`;
    text += `👤 *Asesor:* Dorian\n\n`;

    text += `📊 *Resumen de Comisiones:*\n`;
    text += `• Total Ventas Válidas: ${formatMoney(summary.totalSalesUSD, 'USD')}\n`;
    text += `• Total Comisión Ganada (4%): ${formatMoney(summary.totalCommissionUSD, 'USD')}\n`;
    text += `• Comisiones Ya Liquidadas: ${formatMoney(summary.paidCommissionUSD, 'USD')}\n`;
    text += `💰 *Saldo Pendiente por Liquidar: ${formatMoney(summary.pendingCommissionUSD, 'USD')}*\n\n`;

    text += `📋 *Detalle de Pedidos Activos (${activeOrders.length}):*\n`;
    activeOrders.forEach((o, index) => {
      const statusIcon = o.status === 'paid' ? '✅' : '⏳';
      const statusLabel = o.status === 'paid' ? 'Cobrado' : 'Pendiente';
      text += `${index + 1}. ${statusIcon} *${o.customerName}* (${o.itemsDescription})\n`;
      text += `   Venta: ${formatMoney(o.totalSaleMinor, o.currency)} | Comisión (4%): *${formatMoney(o.commissionMinor, o.currency)}* [${statusLabel}]\n`;
    });

    if (cancelledOrders.length > 0) {
      text += `\n🚫 *Pedidos Anulados (${cancelledOrders.length}):*\n`;
      cancelledOrders.forEach((o, index) => {
        text += `${index + 1}. ❌ *${o.customerName}* (${o.itemsDescription}) - Venta: ${formatMoney(o.totalSaleMinor, o.currency)} [ANULADO]\n`;
      });
    }

    return text;
  },
};
