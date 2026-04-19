import { useState } from 'react';
import { Icon, Spinner, fmt } from './Shared';
import { toast } from './Toast';

const RefundModal = ({ order, onConfirm, onCancel }) => {
  const [refundAmt,  setRefundAmt]  = useState(String(order.total_price));
  const [refundNote, setRefundNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    const amt = parseFloat(refundAmt);
    if (isNaN(amt) || amt < 0)                { toast.error('Enter a valid refund amount.'); return; }
    if (amt > Number(order.total_price))       { toast.error('Refund cannot exceed the order total.'); return; }
    setProcessing(true);
    await onConfirm(amt, refundNote.trim());
    setProcessing(false);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 300 }} onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="serif italic text-2xl" style={{ color: 'var(--c-dark)' }}>Process Refund</h2>
          <button className="expand-btn" onClick={onCancel}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="refund-box">
            <p style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6', marginBottom: 4 }}>⚠ This order has been paid</p>
            <p style={{ fontSize: 12, color: '#5b21b6', lineHeight: 1.5 }}>
              Cancelling will restore stock automatically. Specify the refund amount below and record it for your GCash records. The refund is <strong>processed manually</strong> by sending back via GCash to the customer's number: <strong>{order.guest_phone}</strong>.
            </p>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)' }}>
            <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Total</p>
            <p style={{ fontWeight: 900, fontSize: 20, color: 'var(--c-caramel)' }}>{fmt(order.total_price)}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Refund Amount (₱) *</label>
            <input type="number" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} min={0} step="0.01" max={order.total_price}
              className="flan-input w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Note (optional)</label>
            <textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} rows={2}
              className="flan-input w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)', resize: 'vertical' }}
              placeholder="e.g. Partial refund due to stock issue…" />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost flex-1" onClick={onCancel}>Cancel</button>
            <button className="btn btn-purple flex-1" onClick={handleConfirm} disabled={processing}>
              {processing ? <><Spinner /> Processing…</> : <><Icon name="refund" size={14} /> Confirm Refund &amp; Cancel</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
