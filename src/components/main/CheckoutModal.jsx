import { useState } from 'react';
import { supabase }    from '../../lib/supabase';
import { useCart }     from './CartContext';
import { ModalPortal } from './Shared';
import { CravnCalendar, ReceiptCard, saveReceiptImage, histAdd } from './OrderUtils';

/* ── Validators ── */
const RE_NAME  = /\S.+\S|\S{2,}/;
const RE_PHONE = /^(\+639|09)\d{9}$|^0\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
const RE_GCASH = /^\d{6,20}$/;

const VALIDATORS = {
  name: (v) => {
    if (!v.trim()) return 'Full name is required.';
    if (!RE_NAME.test(v.trim())) return 'Enter your full name (at least 2 characters).';
    return '';
  },
  phone: (v) => {
    if (!v.trim()) return 'Contact number is required.';
    const clean = v.replace(/[\s\-().]/g, '');
    if (!RE_PHONE.test(clean)) return 'Enter a valid PH mobile number (e.g. 09171234567).';
    return '';
  },
  pickupDate: (v) => {
    if (!v) return 'Please select a pickup date.';
    const d = new Date(v + 'T00:00:00');
    if ([0, 3].includes(d.getDay())) return 'We are closed on Wednesdays and Sundays.';
    return '';
  },
  gcashRef: (v) => {
    if (!v.trim()) return 'GCash transaction ID is required.';
    if (!RE_GCASH.test(v.trim())) return 'Transaction ID should be 6–20 digits.';
    return '';
  },
};

const FieldError = ({ msg }) =>
  msg ? (
    <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </p>
  ) : null;

const FieldOk = ({ show }) =>
  show ? (
    <p style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Looks good
    </p>
  ) : null;

const borderColor = (touched, error) => {
  if (!touched) return 'var(--c-border)';
  return error ? '#dc2626' : '#15803d';
};

/* ── GCash QR code — pinned to a specific commit so the image never 404s
      even if the branch moves forward. Append ?raw=true to serve the file
      directly instead of the GitHub HTML wrapper page.                   ── */
const GCASH_QR_URL =
  'https://github.com/HaGobbie/cravpastries/blob/7a94cdceddca460d9402ebeb123d6b35719fb8ae/CravnGcash.jpg?raw=true';

/* ════════════════════════════════════════
   CheckoutModal
════════════════════════════════════════ */
const CheckoutModal = ({ onClose }) => {
  const { cart, totalPrice, clearCart } = useCart();

  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState({ name: '', phone: '', pickupDate: '', gcashRef: '' });
  const [errors,     setErrors]     = useState({ name: '', phone: '', pickupDate: '', gcashRef: '' });
  const [touched,    setTouched]    = useState({ name: false, phone: false, pickupDate: false, gcashRef: false });
  const [submitting, setSubmitting] = useState(false);
  const [receipt,    setReceipt]    = useState(null);

  const setF = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (touched[key]) setErrors((e) => ({ ...e, [key]: VALIDATORS[key](value) }));
  };

  const handleBlur = (key) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({ ...e, [key]: VALIDATORS[key](form[key]) }));
  };

  const allStep2Valid = () =>
    ['name', 'phone', 'pickupDate', 'gcashRef'].every((k) => VALIDATORS[k](form[k]) === '');

  const handleSubmit = async () => {
    setTouched({ name: true, phone: true, pickupDate: true, gcashRef: true });
    const newErrors = Object.fromEntries(
      Object.keys(VALIDATORS).map((k) => [k, VALIDATORS[k](form[k])])
    );
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert([{
          guest_name:     form.name.trim(),
          guest_phone:    form.phone.trim(),
          pickup_date:    form.pickupDate,
          gcash_ref:      form.gcashRef.trim(),
          total_price:    totalPrice,
          payment_status: 'paid',
          status:         'pending',
        }])
        .select()
        .single();
      if (oErr) throw oErr;

      const items = cart.map((c) => ({
        order_id:   order.id,
        dessert_id: c.item.id,
        quantity:   c.qty,
        unit_price: Number(c.item.price),
      }));
      const { error: iErr } = await supabase.from('order_items').insert(items);
      if (iErr) throw iErr;

      const fullReceipt = {
        ...order,
        items: cart.map((c) => ({
          name:       c.item.name,
          qty:        c.qty,
          unit_price: Number(c.item.price),
        })),
      };
      histAdd(fullReceipt);
      setReceipt(fullReceipt);
      clearCart();
      setStep(3);
    } catch (e) {
      setErrors((prev) => ({ ...prev, gcashRef: e.message || 'Something went wrong. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const fmtPrice = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <ModalPortal>
      <div className="modal-portal-backdrop" onClick={onClose}>
        <div
          style={{ position: 'relative', width: '100%', maxWidth: 520, background: 'var(--c-cream)', borderRadius: 32, border: '1px solid var(--c-border)', boxShadow: '0 28px 72px rgba(43,24,13,0.35)', overflow: 'hidden', animation: 'slideUpIn 0.28s cubic-bezier(0.16,1,0.3,1)', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Step indicator ── */}
          <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={`checkout-step-dot ${step === s ? 'step-active' : step > s ? 'step-done' : 'step-inactive'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div style={{ width: 28, height: 2, borderRadius: 1, background: step > s ? 'var(--c-caramel)' : 'var(--c-stone)', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
            <button onClick={onClose}
              style={{ marginLeft: 'auto', background: 'var(--c-oat)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ═══════════════════════════════════
              STEP 1 — Order Summary + GCash Pay
          ═══════════════════════════════════ */}
          {step === 1 && (
            <div style={{ padding: '20px 28px 28px' }}>
              <h2 className="serif italic" style={{ fontSize: 26, color: 'var(--c-dark)', marginBottom: 6 }}>Order Summary</h2>
              <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 20 }}>Review your items, then pay via GCash before continuing.</p>

              {/* Cart items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {cart.map(({ item, qty }) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'var(--c-stone)', flexShrink: 0 }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍮</div>
                      }
                    </div>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--c-dark)' }}>{item.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>×{qty}</span>
                    <span style={{ fontWeight: 700, color: 'var(--c-caramel)', fontSize: 14 }}>{fmtPrice(Number(item.price) * qty)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 14, background: 'var(--c-custard)', border: '1px solid rgba(228,140,60,0.25)', marginBottom: 20 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-dark)' }}>Total to Pay</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--c-caramel)' }}>{fmtPrice(totalPrice)}</span>
              </div>

              {/* ── GCash QR code ── */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 10 }}>
                  📱 Scan to Pay via GCash
                </p>
                <div style={{ display: 'inline-block', padding: 10, borderRadius: 16, background: '#fff', border: '2px solid var(--c-border)', boxShadow: '0 4px 16px rgba(43,24,13,0.08)' }}>
                  <img
                    src={GCASH_QR_URL}
                    alt="Crav'n GCash QR Code"
                    style={{ width: 200, height: 200, display: 'block', borderRadius: 8, objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8 }}>
                  Send exactly <strong style={{ color: 'var(--c-caramel)' }}>{fmtPrice(totalPrice)}</strong>
                </p>
              </div>

              {/* After-pay instruction */}
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>✅ After paying</p>
                <p style={{ fontSize: 11, color: '#166534', lineHeight: 1.6 }}>
                  Copy your <strong>GCash Transaction ID</strong> from the GCash app — you'll paste it on the next step to confirm your order.
                </p>
              </div>

              <button onClick={() => setStep(2)} className="btn-caramel"
                style={{ width: '100%', padding: '14px', borderRadius: 16, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(228,140,60,0.3)' }}>
                I've Paid · Continue →
              </button>
            </div>
          )}

          {/* ═══════════════════
              STEP 2 — Details
          ═══════════════════ */}
          {step === 2 && (
            <div style={{ padding: '20px 28px 28px' }}>
              <h2 className="serif italic" style={{ fontSize: 26, color: 'var(--c-dark)', marginBottom: 6 }}>Your Details</h2>
              <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 20 }}>No account needed — just your name, number, and GCash ref.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 6 }}>Full Name *</label>
                  <input className="cravn-input" value={form.name} placeholder="e.g. Juan dela Cruz"
                    onChange={(e) => setF('name', e.target.value)} onBlur={() => handleBlur('name')}
                    style={{ borderColor: borderColor(touched.name, errors.name) }} />
                  <FieldError msg={touched.name && errors.name} />
                  <FieldOk show={touched.name && !errors.name} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 6 }}>Contact Number *</label>
                  <input className="cravn-input" value={form.phone} placeholder="e.g. 09171234567" type="tel"
                    onChange={(e) => setF('phone', e.target.value)} onBlur={() => handleBlur('phone')}
                    style={{ borderColor: borderColor(touched.phone, errors.phone) }} />
                  <FieldError msg={touched.phone && errors.phone} />
                  <FieldOk show={touched.phone && !errors.phone} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 6 }}>Pickup Date *</label>
                  {form.pickupDate && (
                    <p style={{ fontSize: 12, color: 'var(--c-caramel)', fontWeight: 700, marginBottom: 8 }}>
                      Selected: {new Date(form.pickupDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  <CravnCalendar
                    value={form.pickupDate}
                    onChange={(v) => { setF('pickupDate', v); setTouched((t) => ({ ...t, pickupDate: true })); }}
                  />
                  <FieldError msg={touched.pickupDate && errors.pickupDate} />
                  <FieldOk show={touched.pickupDate && !errors.pickupDate} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', marginBottom: 6 }}>GCash Transaction ID *</label>
                  <input className="cravn-input" value={form.gcashRef} placeholder="e.g. 1234567890123"
                    onChange={(e) => setF('gcashRef', e.target.value)} onBlur={() => handleBlur('gcashRef')}
                    style={{ borderColor: borderColor(touched.gcashRef, errors.gcashRef) }} />
                  <FieldError msg={touched.gcashRef && errors.gcashRef} />
                  <FieldOk show={touched.gcashRef && !errors.gcashRef} />
                  <p style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>Found in your GCash transaction history after payment.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid var(--c-border)', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--c-text-muted)' }}>← Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-caramel"
                  style={{ flex: 2, padding: '13px', borderRadius: 14, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !allStep2Valid() ? 0.75 : 1, transition: 'opacity 0.2s' }}>
                  {submitting
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}></span> Placing…</>
                    : 'Place Order ✓'}
                </button>
              </div>
              <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ═══════════════════
              STEP 3 — Receipt
          ═══════════════════ */}
          {step === 3 && receipt && (
            <div style={{ padding: '20px 28px 28px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d4edda', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>✓</div>
                <h2 className="serif italic" style={{ fontSize: 26, color: 'var(--c-dark)', marginBottom: 4 }}>Order Placed!</h2>
                <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 4 }}>Show this receipt at pickup. A staff member will verify your order.</p>
                <p style={{ fontSize: 11, color: '#15803d', fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '6px 12px', display: 'inline-block' }}>
                  💾 Receipt auto-saved — find it in the 📄 button on the desserts page
                </p>
              </div>
              <ReceiptCard receipt={receipt} cardId="receipt-live" />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => saveReceiptImage('receipt-live', 'cravn-receipt-' + receipt.id.split('-')[0])}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid var(--c-border)', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: 'var(--c-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Save / Share
                </button>
                <button onClick={onClose} className="btn-caramel" style={{ flex: 1, padding: '13px', borderRadius: 14, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </ModalPortal>
  );
};

export default CheckoutModal;
