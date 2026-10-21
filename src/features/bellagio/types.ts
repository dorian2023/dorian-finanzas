import type { Currency } from '../../shared/lib/money';

export type BellagioOrderStatus = 'pending' | 'paid';

export interface BellagioOrder {
  id: string;
  customerName: string;
  itemsDescription: string;
  totalSaleMinor: number; // Monto total de la venta en céntimos
  currency: Currency; // 'USD' | 'VES'
  commissionRate: number; // Por defecto 0.04 (4%)
  commissionMinor: number; // Monto de la comisión en céntimos (totalSaleMinor * commissionRate)
  orderDate: string; // YYYY-MM-DD
  status: BellagioOrderStatus;
  paidAt?: string; // ISO String cuando el jefe le liquida la comisión
  notes?: string;
  incomeTxId?: string; // ID de la transacción en dorian-finanzas cuando se cobra
  createdAt: string; // ISO
}

export interface BellagioCutoffSummary {
  periodKey: string; // YYYY-MM
  periodLabel: string; // Ej: "Octubre 2026"
  totalSalesUSD: number; // En céntimos
  totalCommissionUSD: number; // En céntimos
  pendingCommissionUSD: number; // En céntimos
  paidCommissionUSD: number; // En céntimos
  totalOrdersCount: number;
  pendingOrdersCount: number;
}
