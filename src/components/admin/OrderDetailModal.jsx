import { useState, useEffect } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { ADMIN_CONFIG } from '../../lib/constants';
import { Icon, Spinner, fmt, fmtDate } from './Shared';
import { CopyButton } from './Shared';
import { toast } from './Toast';
import RefundModal from './RefundModal';

const STATUS_LABELS = ADMIN_CONFIG.statusLabels;
const STATUS_NEXT   = ADMIN_CONFIG.statusNext;
const PAY_LABELS    = ADMIN_CONFIG.payLabels;

const OrderDetailModal = ({ order: initialOrder, onClose, onUpdated }) => {
  const [order,      setOrder]      = useState(initialOrder);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const reloadOrder = async () => {
    const { data } = await sb.from('orders').select('*').eq('id', initialOrder.id).single();
    if (data) setOrder(data);
  };

  useEffect(() => {
    const loadItems = async () => {
      const { data } = await sb.from('order_items')
        .select('id, quantity, unit_price, dessert_id, desserts(name, image_url)')
        .eq('order_id', initialOrder.id);
      setItems(data || []); setLoading(false);
    };
    loadItems();
    const ch = sb.channel(`order-detail-${initialOrder.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${initialOrder.id}` },
        (payload) => { setOrder(payload.new); })
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [initialOrder.id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    const { error } = await sb.from('orders').update({ status }).eq('id', order.id);
    setUpdating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order moved to "${STATUS_LABELS[status]}".`);
    onUpdated(); setOrder((p) => ({ ...p, status }));
  };

  const updatePayment = async (payment_status) => {
    setUpdating(true);
    const { error } = await sb.from('orders').update({ payment_status }).eq('id', order.id);
    setUpdating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Payment marked as "${PAY_LABELS[payment_status]}".`);
    onUpdated(); setOrder((p) => ({ ...p, payment_status }));
  };

  const cancelUnpaid = async () => {
    setUpdating(true);
    const { error } = await sb.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    setUpdating(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Order cancelled.');
    onUpdated(); onClose();
  };

  const handleRefundConfirm = async (refundAmt, note) => {
    setUpdating(true);
    const refundNote    = `[REFUND ₱${refundAmt.toFixed(2)} | ${new Date().toLocaleDateString('en-PH')}${note ? ' | ' + note : ''}]`;
    const existingNotes = order.notes ? order.notes + '\n' : '';
    const { error } = await sb.from('orders').update({
      status:         'cancelled',
      payment_status: 'failed',
      notes:           existingNotes + refundNote,
    }).eq('id', order.id);
    setUpdating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Refund of ₱${refundAmt.toFixed(2)} recorded. Send to GCash: ${order.guest_phone}`);
    setShowRefund(false);
    onUpdated(); onClose();
  };

  const nextStatus  = STATUS_NEXT[order.status];
  const isPaid      = order.payment_status === 'paid';
  const isClosed    = order.status === 'completed' || order.status === 'cancelled';
  const refundNotes = (order.notes || '').split('\n').filter((l) => l.startsWith('[REFUND'));

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="serif italic text-2xl" style={{ color: 'var(--c-dark)' }}>Order Details</h2>
              <p style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                #{order.id.split('-')[0].toUpperCase()}
                <CopyButton text={order.id} />
              </p>
            </div>
            <button className="expand-btn" onClick={onClose}><Icon name="x" size={20} /></button>
          </div>

          <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Customer info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Customer',    value: order.guest_name  || '—' },
                { label: 'Phone',       value: order.guest_phone || '—' },
                { label: 'Pickup Date', value: fmtDate(order.pickup_date) },
                { label: 'GCash Ref',   value: order.gcash_ref   || 'Not yet provided' },
              ].map((f) => (
                <div key={f.label} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 4 }}>{f.label}</p>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-dark)' }}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
                <span className={`badge badge-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment</span>
                <span className={`badge ${order.payment_status === 'paid' ? 'badge-paid' : order.payment_status === 'failed' ? 'badge-failed' : 'badge-unpaid'}`}>
                  {PAY_LABELS[order.payment_status] || order.payment_status}
                </span>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--c-custard)', border: '1px solid var(--c-border)' }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--c-caramel)' }}>{fmt(order.total_price)}</span>
              </div>
            </div>

            {/* Refund history */}
            {refundNotes.length > 0 && (
              <div className="refund-box">
                <p style={{ fontSize: 11, fontWeight: 700, color: '#5b21b6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Refund Records</p>
                {refundNotes.map((n, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#5b21b6', fontFamily: 'monospace', lineHeight: 1.6 }}>{n.replace(/^\[|\]$/g, '')}</p>
                ))}
              </div>
            )}

            {/* Order notes */}
            {order.notes && !order.notes.startsWith('[REFUND') && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--c-dark)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{order.notes.split('\n').filter((l) => !l.startsWith('[REFUND')).join('\n')}</p>
              </div>
            )}

            {/* Items */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 8 }}>Order Items</p>
              {loading ? <Spinner /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: 'var(--c-stone)', flexShrink: 0 }}>
                        {item.desserts?.image_url && <img src={item.desserts.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{item.desserts?.name || 'Unknown'}</span>
                      <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>×{item.quantity}</span>
                      <span style={{ fontWeight: 700, color: 'var(--c-caramel)' }}>{fmt(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock info */}
            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 11, color: '#15803d', fontWeight: 700, marginBottom: 2 }}>📦 Stock Management</p>
              <p style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>
                Stock is automatically <strong>deducted when payment_status = paid</strong> (set when the customer submits their order).
                If this order is <strong>cancelled</strong>, stock is automatically <strong>restored</strong> by the database trigger.
              </p>
            </div>

            {/* Actions */}
            {!isClosed && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {order.payment_status !== 'paid' && (
                  <button className="btn btn-caramel btn-sm" onClick={() => updatePayment('paid')} disabled={updating}>
                    <Icon name="check" size={13} /> Mark Paid
                  </button>
                )}
                {nextStatus && (
                  <button className="btn btn-dark btn-sm" onClick={() => updateStatus(nextStatus)} disabled={updating}>
                    <Icon name="chevright" size={13} /> Move to {STATUS_LABELS[nextStatus]}
                  </button>
                )}
                {!isPaid && (
                  <button className="btn btn-danger btn-sm" onClick={cancelUnpaid} disabled={updating}>
                    <Icon name="x" size={13} /> Cancel Order
                  </button>
                )}
                {isPaid && (
                  <button className="btn btn-purple btn-sm" onClick={() => setShowRefund(true)} disabled={updating}>
                    <Icon name="refund" size={13} /> Cancel &amp; Refund
                  </button>
                )}
              </div>
            )}

            {/* Refund for completed paid orders */}
            {order.status === 'completed' && isPaid && refundNotes.length === 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 8 }}>This order is completed. You can still log a refund if needed.</p>
                <button className="btn btn-purple btn-sm" onClick={() => setShowRefund(true)} disabled={updating}>
                  <Icon name="refund" size={13} /> Issue Refund
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showRefund && (
        <RefundModal order={order} onConfirm={handleRefundConfirm} onCancel={() => setShowRefund(false)} />
      )}
    </>
  );
};

export default OrderDetailModal;
