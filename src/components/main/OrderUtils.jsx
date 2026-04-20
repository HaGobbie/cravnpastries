import { useState } from 'react';
import { LOGO_URL } from '../../lib/constants';
import { ModalPortal } from './Shared';

/* ── Calendar constants ── */
const CLOSED_DAYS = [0, 3]; // 0=Sun, 3=Wed
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WDAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/* ── Custom date picker — blocks Wed & Sun ── */
export const CravnCalendar = ({ value, onChange }) => {
  const todayMidnight = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const getInit = () => {
    const base = value ? new Date(value + 'T00:00:00') : new Date(todayMidnight.getTime() + 86400000);
    return { y: base.getFullYear(), m: base.getMonth() };
  };
  const [view, setView] = useState(getInit);
  const prev = () => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const firstDow  = new Date(view.y, view.m, 1).getDay();
  const daysInMon = new Date(view.y, view.m + 1, 0).getDate();
  const cells     = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMon }, (_, i) => i + 1)];

  const isDisabled = (day) => {
    if (!day) return true;
    const d = new Date(view.y, view.m, day);
    if (d <= todayMidnight) return true;
    return CLOSED_DAYS.includes(d.getDay());
  };
  const isSel = (day) => {
    if (!day || !value) return false;
    const s = new Date(value + 'T00:00:00');
    return s.getFullYear() === view.y && s.getMonth() === view.m && s.getDate() === day;
  };
  const isTod = (day) => {
    if (!day) return false;
    return new Date(view.y, view.m, day).getTime() === todayMidnight.getTime();
  };
  const pick = (day) => {
    if (isDisabled(day)) return;
    const mm = String(view.m + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${view.y}-${mm}-${dd}`);
  };

  return (
    <div className="cravn-cal">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button className="cal-hdr-btn" onClick={prev}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--c-dark)' }}>{MONTH_NAMES[view.m]} {view.y}</span>
        <button className="cal-hdr-btn" onClick={next}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {WDAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: d === 'Su' || d === 'We' ? '#e0a060' : 'var(--c-text-muted)', letterSpacing: '0.04em', padding: '3px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
        {cells.map((day, i) => (
          <button key={i}
            className={['cal-day', isSel(day) ? 'cal-selected' : '', isTod(day) ? 'cal-today' : ''].filter(Boolean).join(' ')}
            disabled={isDisabled(day)}
            onClick={() => pick(day)}
            style={{ margin: '0 auto' }}>
            {day || ''}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--c-border)', textAlign: 'center', fontSize: 10, color: 'var(--c-text-muted)', fontWeight: 600 }}>
        🚫 Closed on Wednesdays &amp; Sundays
      </div>
    </div>
  );
};

/* ── Order history localStorage helpers ── */
const HIST_KEY = 'cravn_orders_v1';
export const histLoad  = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; } };
export const histSave  = (arr) => { try { localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(0, 10))); } catch {} };
export const histAdd   = (receipt) => { const existing = histLoad(); histSave([{ ...receipt, _savedAt: Date.now() }, ...existing]); };
export const histClear = () => { try { localStorage.removeItem(HIST_KEY); } catch {} };

/* ── Shared receipt card ────────────────────────────────────────────────
 *
 * BUG FIX: The items array stored on `receipt` (built in CheckoutModal
 * and persisted to localStorage) has the flat shape:
 *
 *   { name: string, qty: number, unit_price: number }
 *
 * The previous code incorrectly destructured each element as `{ item, qty }`
 * (expecting a nested `item` object), so `item` was always `undefined`,
 * causing a TypeError on `item.id` that crashed the component tree and
 * produced a completely blank white page after a successful order.
 *
 * Fixed by reading the correct flat fields: `name`, `qty`, `unit_price`.
 * The `key` now uses the array index since there is no `id` on each item.
 * ──────────────────────────────────────────────────────────────────────── */
export const ReceiptCard = ({ receipt, cardId }) => (
  <div id={cardId} style={{ border: '2px dashed var(--c-caramel)', borderRadius: 20, padding: '20px', background: '#fffdf8' }}>
    {/* Header */}
    <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed var(--c-border)' }}>
      <img src={LOGO_URL} alt="Cravn" style={{ height: 36, margin: '0 auto 8px', display: 'block' }} />
      <p className="fredoka" style={{ color: 'var(--c-caramel)', fontSize: 18 }}>Cravn</p>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-text-muted)' }}>Virtual Receipt</p>
    </div>

    {/* Order details grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
      {[
        { label: 'Order ID',  value: '#' + receipt.id.split('-')[0].toUpperCase() },
        { label: 'Name',      value: receipt.guest_name },
        { label: 'Phone',     value: receipt.guest_phone },
        { label: 'Pickup',    value: new Date(receipt.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) },
        { label: 'GCash Ref', value: receipt.gcash_ref },
        { label: 'Status',    value: 'Pending Confirmation' },
      ].map((f) => (
        <div key={f.label} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--c-oat)' }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 2 }}>{f.label}</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-dark)' }}>{f.value}</p>
        </div>
      ))}
    </div>

    {/* Items list — reads the flat { name, qty, unit_price } shape */}
    <div style={{ paddingTop: 10, borderTop: '1px dashed var(--c-border)' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 6 }}>Items Ordered</p>
      {receipt.items.map(({ name, qty, unit_price }, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
          <span style={{ color: 'var(--c-dark)' }}>{name} ×{qty}</span>
          <span style={{ fontWeight: 700, color: 'var(--c-caramel)' }}>₱{(unit_price * qty).toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--c-border)' }}>
        <span style={{ fontWeight: 800, color: 'var(--c-dark)' }}>Total</span>
        <span style={{ fontWeight: 900, color: 'var(--c-caramel)', fontSize: 16 }}>₱{Number(receipt.total_price).toLocaleString()}</span>
      </div>
    </div>

    <p style={{ fontSize: 10, textAlign: 'center', color: 'var(--c-text-muted)', marginTop: 14, fontStyle: 'italic' }}>Please present this receipt at the shop on your pickup date.</p>
  </div>
);

/* ── Save receipt as PNG image then share/download ── */
export const saveReceiptImage = async (cardId, filename) => {
  const el = document.getElementById(cardId);
  if (!el) return;
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas  = await html2canvas(el, { backgroundColor: '#fffdf8', scale: 2, useCORS: true, logging: false });
    const dataUrl = canvas.toDataURL('image/png');
    const blob    = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const file    = new File([blob], filename + '.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ title: 'Cravn Order Receipt', text: 'My Cravn pastry order receipt', files: [file] }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename + '.png'; a.click();
  } catch (e) {
    console.error('Receipt image capture failed:', e);
    alert('Screenshot not available on this browser. Please take a manual screenshot.');
  }
};

/* ── Order History Panel ── */
export const OrderHistoryPanel = () => {
  const [orders,  setOrders]  = useState(() => histLoad());
  const [open,    setOpen]    = useState(false);
  const [viewing, setViewing] = useState(null);

  const onSave = () => setOrders(histLoad());
  // sync from localStorage when a new order is saved
  useState(() => {
    window.addEventListener('cravn_order_saved', onSave);
    return () => window.removeEventListener('cravn_order_saved', onSave);
  });

  if (orders.length === 0 && !open) return null;

  const remove = (savedAt) => {
    const updated = orders.filter((o) => o._savedAt !== savedAt);
    setOrders(updated); histSave(updated);
    if (updated.length === 0) setOpen(false);
  };

  return (
    <ModalPortal>
      <div className="hist-panel">
        {open && (
          <div className="hist-drawer">
            <div style={{ padding: '12px 14px', background: 'var(--c-syrup)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--c-custard)' }}>My Orders</p>
                <p style={{ fontSize: 10, color: 'rgba(253,245,228,0.45)', fontWeight: 600 }}>{orders.length} saved receipt{orders.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => { setOrders([]); histClear(); setOpen(false); }}
                  style={{ fontSize: 9, fontWeight: 700, color: 'rgba(253,245,228,0.35)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clear all</button>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(253,245,228,0.5)', lineHeight: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="hist-scroll">
              {orders.map((o) => (
                <div key={o._savedAt} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(193,130,55,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--c-dark)' }}>#{o.id.split('-')[0].toUpperCase()}</p>
                    <p style={{ fontSize: 11, color: 'var(--c-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.guest_name} · {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</p>
                    <p style={{ fontSize: 10, color: 'var(--c-caramel)', fontWeight: 700 }}>₱{Number(o.total_price).toLocaleString()} · {new Date(o.pickup_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setViewing(o)} style={{ padding: '5px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: 'var(--c-custard)', border: '1px solid var(--c-border)', cursor: 'pointer', color: 'var(--c-dark)' }}>View</button>
                    <button onClick={() => remove(o._savedAt)} style={{ padding: '5px 7px', borderRadius: 8, background: 'none', border: '1px solid var(--c-border)', cursor: 'pointer', lineHeight: 0, color: 'var(--c-text-muted)' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="hist-fab" onClick={() => setOpen((p) => !p)} title="View past orders">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {orders.length > 0 && <span className="hist-badge">{orders.length}</span>}
        </button>
      </div>

      {viewing && (
        <div className="modal-portal-backdrop" onClick={() => setViewing(null)} style={{ zIndex: 10001 }}>
          <div style={{ background: 'var(--c-cream)', borderRadius: 28, border: '1px solid var(--c-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', padding: '24px', animation: 'slideUpIn 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--c-dark)' }}>Saved Receipt</p>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', lineHeight: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <ReceiptCard receipt={viewing} cardId={'hist-receipt-' + viewing._savedAt} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={() => saveReceiptImage('hist-receipt-' + viewing._savedAt, 'cravn-receipt-' + viewing.id.split('-')[0])}
                className="btn-caramel"
                style={{ flex: 1, padding: '12px', borderRadius: 14, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Save / Share
              </button>
              <button onClick={() => setViewing(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 14, border: '1.5px solid var(--c-border)', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
};
