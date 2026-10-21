import type { BellagioOrder, BellagioCutoffSummary } from './types';
import { DatabaseService } from '../../shared/lib/dbService';
import { formatMoney } from '../../shared/lib/money';
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

    return newOrder;
  },

  deleteOrder(id: string): void {
    const orders = this.getOrders().filter((o) => o.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.error('Error eliminando pedido de Bellagio:', err);
    }
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

    for (const o of filtered) {
      // Si la venta está en VES, aproximamos a USD con tasa fija estándar para estadísticas consolidadas
      const saleUSD = o.currency === 'USD' ? o.totalSaleMinor : Math.round(o.totalSaleMinor / 880);
      const commUSD = o.currency === 'USD' ? o.commissionMinor : Math.round(o.commissionMinor / 880);

      totalSalesUSD += saleUSD;
      totalCommissionUSD += commUSD;

      if (o.status === 'pending') {
        pendingCommissionUSD += commUSD;
        pendingCount++;
      } else {
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
    };
  },

  /**
   * Genera el texto formateado para enviar por WhatsApp al jefe
   */
  generateWhatsAppReport(orders: BellagioOrder[], summary: BellagioCutoffSummary): string {
    const filtered = orders.filter((o) => o.orderDate.startsWith(summary.periodKey));

    let text = `🛋️ *Muebles Bellagio - Reporte de Comisiones de Ventas*\n`;
    text += `📅 *Corte:* ${summary.periodLabel}\n`;
    text += `👤 *Asesor:* Dorian\n\n`;

    text += `📊 *Resumen de Comisiones:*\n`;
    text += `• Total Ventas Facturadas: ${formatMoney(summary.totalSalesUSD, 'USD')}\n`;
    text += `• Total Comisión Ganada (4%): ${formatMoney(summary.totalCommissionUSD, 'USD')}\n`;
    text += `• Comisiones Ya Liquidadas: ${formatMoney(summary.paidCommissionUSD, 'USD')}\n`;
    text += `💰 *Saldo Pendiente por Pagar: ${formatMoney(summary.pendingCommissionUSD, 'USD')}*\n\n`;

    text += `📋 *Detalle de Pedidos (${filtered.length}):*\n`;
    filtered.forEach((o, index) => {
      const statusIcon = o.status === 'paid' ? '✅' : '⏳';
      const statusLabel = o.status === 'paid' ? 'Cobrado' : 'Pendiente';
      text += `${index + 1}. ${statusIcon} *${o.customerName}* (${o.itemsDescription})\n`;
      text += `   Venta: ${formatMoney(o.totalSaleMinor, o.currency)} | Comisión (4%): *${formatMoney(o.commissionMinor, o.currency)}* [${statusLabel}]\n`;
    });

    return text;
  },
};
