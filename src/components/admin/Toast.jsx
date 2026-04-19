import { useState, useEffect, useRef } from 'react';

/*
 * Toast system — 4 types:
 *   success  | auto-dismiss after 3.5s   | dark background
 *   error    | auto-dismiss after 3.5s   | red background
 *   info     | auto-dismiss after 3.5s   | caramel background
 *   critical | STICKY — never auto-dismissed; admin must close manually
 *            | used for out-of-stock / low-stock alerts
 *
 * Usage:
 *   toast.success('Dessert saved!')
 *   toast.error('Upload failed.')
 *   toast.info('New order received!')
 *   toast.critical('🚨 OUT OF STOCK: "Flan Cake" — restock immediately!')
 */

let _set = null;

export const toast = {
  success:  (msg) => _set?.((p) => [...p, { id: uid(), type: 'success',  msg, sticky: false }]),
  error:    (msg) => _set?.((p) => [...p, { id: uid(), type: 'error',    msg, sticky: false }]),
  info:     (msg) => _set?.((p) => [...p, { id: uid(), type: 'info',     msg, sticky: false }]),
  critical: (msg) => _set?.((p) => [...p, { id: uid(), type: 'critical', msg, sticky: true  }]),
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* ── Per-toast auto-dismiss hook (only for non-sticky) ── */
const AutoDismiss = ({ id, dismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 3500);
    return () => clearTimeout(t);
  }, [id, dismiss]);
  return null;
};

/* ── Icon glyphs ── */
const ICONS = { success: '✓', error: '✕', info: 'ℹ', critical: '⚠' };

/* ── Inline styles for critical toasts (no CSS class change needed) ── */
const CRITICAL_STYLE = {
  background:  '#7f1d1d',
  color:       '#fef2f2',
  border:      '1.5px solid #dc2626',
  boxShadow:   '0 0 0 2px rgba(220,38,38,0.25), 0 8px 24px rgba(0,0,0,0.25)',
  minWidth:    '300px',
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  _set = setToasts;

  const dismiss = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.sticky ? '' : `toast-${t.type}`}`}
          style={t.sticky ? CRITICAL_STYLE : {}}
        >
          {/* Auto-dismiss watcher — only for non-sticky toasts */}
          {!t.sticky && <AutoDismiss id={t.id} dismiss={dismiss} />}

          <span style={{ fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{ICONS[t.type]}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.msg}</span>

          {/* Sticky toasts get an explicit close button */}
          {t.sticky && (
            <button
              onClick={() => dismiss(t.id)}
              title="Dismiss"
              style={{
                background:  'rgba(255,255,255,0.15)',
                border:      '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                cursor:      'pointer',
                color:       '#fff',
                padding:     '2px 8px',
                fontSize:    12,
                fontWeight:  800,
                flexShrink:  0,
                lineHeight:  1.6,
                transition:  'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              ✕ Dismiss
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
