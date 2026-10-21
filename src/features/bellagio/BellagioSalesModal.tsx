import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Briefcase,
  Plus,
  Copy,
  Check,
  Trash2,
  DollarSign,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import type { BellagioOrder } from './types';
import { BellagioService } from './bellagioService';
import type { Account } from '../transactions/types';
import { formatMoney, toMinor, type Currency } from '../../shared/lib/money';

interface BellagioSalesModalProps {
  isOpen: boolean;
  accounts: Account[];
  todayRate: number;
  onClose: () => void;
  onOrderPaidSuccess: () => void; // Para refrescar datos en la app general
}

export const BellagioSalesModal: React.FC<BellagioSalesModalProps> = ({
  isOpen,
  accounts,
  todayRate,
  onClose,
  onOrderPaidSuccess,
}) => {
  const [orders, setOrders] = useState<BellagioOrder[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Formulario nuevo pedido
  const [customerName, setCustomerName] = useState('');
  const [itemsDescription, setItemsDescription] = useState('');
  const [saleAmountInput, setSaleAmountInput] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Modal para cobrar comisión (seleccionar cuenta de destino)
  const [payingOrder, setPayingOrder] = useState<BellagioOrder | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  // Cargar pedidos al abrir
  useEffect(() => {
    if (isOpen) {
      setOrders(BellagioService.getOrders());
    }
  }, [isOpen]);

  const refreshOrders = () => {
    setOrders(BellagioService.getOrders());
  };

  // Cálculo en vivo de la comisión al escribir en el formulario (4%)
  const numericSaleMinor = toMinor(saleAmountInput);
  const liveCommissionMinor = Math.round(numericSaleMinor * 0.04);

  // Métricas del corte seleccionado
  const cutoffSummary = useMemo(() => {
    return BellagioService.calculateCutoff(orders, selectedPeriod);
  }, [orders, selectedPeriod]);

  // Pedidos filtrados
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => o.orderDate.startsWith(selectedPeriod))
      .filter((o) => {
        if (filterStatus === 'pending') return o.status === 'pending';
        if (filterStatus === 'paid') return o.status === 'paid';
        return true;
      });
  }, [orders, selectedPeriod, filterStatus]);

  if (!isOpen) return null;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Por favor ingresa el nombre del cliente');
      return;
    }
    if (!itemsDescription.trim()) {
      setFormError('Describe los muebles del pedido (ej. Cama King + Sofá)');
      return;
    }
    if (numericSaleMinor <= 0) {
      setFormError('Ingresa un monto de venta válido mayor a 0');
      return;
    }

    BellagioService.saveOrder({
      customerName: customerName.trim(),
      itemsDescription: itemsDescription.trim(),
      totalSaleMinor: numericSaleMinor,
      currency,
      commissionRate: 0.04,
      orderDate,
      status: 'pending',
      notes: notes.trim() || undefined,
    });

    // Resetear formulario
    setCustomerName('');
    setItemsDescription('');
    setSaleAmountInput('');
    setNotes('');
    setShowAddForm(false);
    refreshOrders();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este pedido de Bellagio?')) {
      BellagioService.deleteOrder(id);
      refreshOrders();
    }
  };

  const handleConfirmPayout = async () => {
    if (!payingOrder) return;
    await BellagioService.markAsPaid(payingOrder.id, selectedAccountId, todayRate);
    setPayingOrder(null);
    refreshOrders();
    onOrderPaidSuccess();
  };

  const handleCopyReport = () => {
    const reportText = BellagioService.generateWhatsAppReport(orders, cutoffSummary);
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-handle" />

        {/* Cabecera del Módulo Bellagio */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(168, 85, 247, 0.18)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Muebles Bellagio
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  4% COMISIÓN
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Control de pedidos y liquidación de ventas
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} style={{ width: 36, height: 36 }}>
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          {/* Tarjeta de Resumen del Corte Mensual */}
          <div
            className="glass-panel"
            style={{
              borderRadius: 18,
              padding: 14,
              marginBottom: 14,
              border: '1px solid var(--border-card)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Corte: {cutoffSummary.periodLabel}
              </span>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--badge-bg-neutral)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Grid de 3 Métricas: Total Ventas, Comisión Total y Pendiente por Pagar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {/* Ventas Totales */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--badge-bg-neutral)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, display: 'block' }}>
                  Ventas ({cutoffSummary.totalOrdersCount})
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {formatMoney(cutoffSummary.totalSalesUSD, 'USD')}
                </span>
              </div>

              {/* Comisión Total 4% */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 10, color: '#c084fc', fontWeight: 700, display: 'block' }}>
                  Comisión 4%
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                  {formatMoney(cutoffSummary.totalCommissionUSD, 'USD')}
                </span>
              </div>

              {/* Pendiente por Cobrar al Jefe */}
              <div
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-md)',
                  background: cutoffSummary.pendingCommissionUSD > 0 ? 'rgba(245, 158, 11, 0.18)' : 'var(--badge-bg-neutral)',
                  border: cutoffSummary.pendingCommissionUSD > 0 ? '1.5px solid #f59e0b' : '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, display: 'block' }}>
                  Por Cobrar
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
                  {formatMoney(cutoffSummary.pendingCommissionUSD, 'USD')}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción de Cabecera: + Nuevo Pedido y Reporte WhatsApp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
              style={{
                padding: '10px 12px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                background: showAddForm
                  ? 'var(--badge-bg-neutral)'
                  : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                color: showAddForm ? 'var(--text-primary)' : '#ffffff',
                boxShadow: showAddForm ? 'none' : '0 4px 15px rgba(168, 85, 247, 0.35)',
              }}
            >
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              <span>{showAddForm ? 'Cerrar Formulario' : '+ Nuevo Pedido'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              style={{
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                background: copiedReport ? 'rgba(16, 185, 129, 0.2)' : 'var(--badge-bg-neutral)',
                border: copiedReport ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                color: copiedReport ? '#10b981' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedReport ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedReport ? '¡Reporte Copiado!' : 'Reporte WhatsApp'}</span>
            </button>
          </div>

          {/* Formulario desplegable para registrar nuevo pedido */}
          {showAddForm && (
            <form
              onSubmit={handleCreateOrder}
              className="glass-panel"
              style={{
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                background: 'var(--bg-card)',
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#c084fc', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Registrar Venta Bajo Pedido
              </h3>

              {formError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nombre del Cliente */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                  Nombre del Cliente
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Mendoza"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 'var(--radius-md)' }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Muebles Pedidos */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                  Muebles Pedidos (Detalle)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cama Matrimonial 2x2 + Sofá 3 puestos gris"
                  value={itemsDescription}
                  onChange={(e) => setItemsDescription(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 'var(--radius-md)' }}
                />
              </div>

              {/* Monto de la Venta Total y Selector de Moneda */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                  Monto Total de la Venta
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={saleAmountInput}
                    onChange={(e) => setSaleAmountInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  />
                  <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        color: currency === 'USD' ? '#042f2e' : 'var(--text-secondary)',
                        background: currency === 'USD' ? 'var(--color-usd)' : 'none',
                      }}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('VES')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        color: currency === 'VES' ? '#1c1303' : 'var(--text-secondary)',
                        background: currency === 'VES' ? 'var(--color-ves)' : 'none',
                      }}
                    >
                      Bs
                    </button>
                  </div>
                </div>

                {/* Cálculo en vivo de la comisión del 4% */}
                {numericSaleMinor > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#c084fc' }}>
                      ✨ Tu comisión (4%):
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                      {formatMoney(liveCommissionMinor, currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Fecha del Pedido y Notas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                    Fecha del Pedido
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                    Nota / Anticipo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Anticipo 50%"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                }}
              >
                <Check size={16} /> Guardar Pedido en Bellagio
              </button>
            </form>
          )}

          {/* Filtro de Estado: Todos / Pendientes / Cobrados */}
          <div
            style={{
              display: 'flex',
              background: 'var(--badge-bg-neutral)',
              padding: 3,
              borderRadius: 'var(--radius-full)',
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                color: filterStatus === 'all' ? '#c084fc' : 'var(--text-secondary)',
                background: filterStatus === 'all' ? 'rgba(168, 85, 247, 0.2)' : 'none',
              }}
            >
              Todos ({orders.filter((o) => o.orderDate.startsWith(selectedPeriod)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                color: filterStatus === 'pending' ? '#f59e0b' : 'var(--text-secondary)',
                background: filterStatus === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'none',
              }}
            >
              Pendientes ({orders.filter((o) => o.orderDate.startsWith(selectedPeriod) && o.status === 'pending').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('paid')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                color: filterStatus === 'paid' ? '#10b981' : 'var(--text-secondary)',
                background: filterStatus === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'none',
              }}
            >
              Cobrados ({orders.filter((o) => o.orderDate.startsWith(selectedPeriod) && o.status === 'paid').length})
            </button>
          </div>

          {/* Lista de Pedidos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 12px',
                  borderRadius: 16,
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                }}
              >
                <ShoppingBag size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>No hay pedidos registrados en este corte.</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Usa el botón "+ Nuevo Pedido" para registrar tu primera venta.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isPending = order.status === 'pending';

                return (
                  <div
                    key={order.id}
                    className="glass-panel"
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      border: isPending ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {/* Fila 1: Cliente y Estado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {order.customerName}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            • {order.orderDate}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {order.itemsDescription}
                        </p>
                      </div>

                      {/* Badge de Estado */}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 10,
                          textTransform: 'uppercase',
                          background: isPending ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                          color: isPending ? '#fbbf24' : '#34d399',
                          border: isPending ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        {isPending ? 'Pendiente' : 'Cobrado'}
                      </span>
                    </div>

                    {/* Fila 2: Montos (Venta vs Comisión 4%) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--badge-bg-neutral)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block' }}>
                          Venta Total
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {formatMoney(order.totalSaleMinor, order.currency)}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 10, color: '#c084fc', fontWeight: 700, display: 'block' }}>
                          Comisión 4%
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isPending ? '#fbbf24' : '#34d399' }}>
                          +{formatMoney(order.commissionMinor, order.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Fila 3: Acciones (Cobrar o Eliminar) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                      {order.notes ? (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                          Nota: {order.notes}
                        </span>
                      ) : (
                        <div />
                      )}

                      <div style={{ display: 'flex', gap: 6 }}>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setPayingOrder(order)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 11,
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <DollarSign size={13} /> Cobrar al Jefe
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="btn-icon"
                          style={{ width: 30, height: 30, padding: 0, color: '#f43f5e' }}
                          title="Eliminar pedido"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal emergente para liquidar/cobrar la comisión a una cuenta de finanzas */}
        {payingOrder && (
          <div
            className="modal-overlay"
            onClick={() => setPayingOrder(null)}
            style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <div
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 380,
                borderRadius: 20,
                padding: 18,
                background: 'var(--bg-app)',
                border: '1.5px solid #10b981',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', marginBottom: 12 }}>
                <Check size={20} />
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Liquidar Comisión</h3>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                ¿Tu jefe te pagó la comisión de <strong>{formatMoney(payingOrder.commissionMinor, payingOrder.currency)}</strong> de la venta de <strong>{payingOrder.customerName}</strong>?
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>
                  ¿En qué cuenta recibiste el dinero?
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-md)' }}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency === 'USD' ? '$ USD' : 'Bs VES'})
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Se sumará a tu saldo y se registrará como ingreso bajo Muebles Bellagio.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--badge-bg-neutral)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-full)', fontSize: 12 }}
                >
                  Confirmar Cobro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
