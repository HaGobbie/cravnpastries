import { useState, useEffect, useRef } from 'react';
import { useCart } from './CartContext';
import { ModalPortal } from './Shared';

const CartWidget = ({ onCheckout }) => {
  const { cart, removeFromCart, updateQty, totalItems, totalPrice } = useCart();
  const [collapsed, setCollapsed] = useState(false);
  const [bounce,    setBounce]    = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    if (totalItems > prevCount.current) {
      setBounce(true);
      setCollapsed(false);
      setTimeout(() => setBounce(false), 350);
    }
    prevCount.current = totalItems;
  }, [totalItems]);

  const isEmpty = cart.length === 0;

  return (
    <ModalPortal>
      <div className={`cart-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Header / collapse toggle */}
        <div className="cart-sidebar-header" onClick={() => setCollapsed((p) => !p)}>
          <div className={`${bounce ? 'cart-bounce' : ''}`} style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-caramel)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: -7, right: -7, width: 17, height: 17, borderRadius: '50%', background: 'var(--c-caramel)', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--c-syrup)' }}>
                {totalItems}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--c-custard)', lineHeight: 1.2 }}>
              {isEmpty ? 'Your Cart' : `Your Cart (${totalItems})`}
            </p>
            {!isEmpty && <p style={{ fontSize: 11, color: 'var(--c-caramel)', fontWeight: 700 }}>₱{totalPrice.toLocaleString()}</p>}
            {isEmpty  && <p style={{ fontSize: 10, color: 'rgba(253,245,228,0.4)', fontWeight: 600 }}>Add items to order</p>}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(253,245,228,0.4)" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'transform 0.25s', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Empty state */}
        {isEmpty && !collapsed && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: 10 }}>
            <div style={{ fontSize: 36 }}>🛒</div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', textAlign: 'center' }}>Nothing here yet</p>
            <p style={{ fontSize: 11, color: 'var(--c-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>Browse the pastry case below and tap <strong>+ Add to Cart</strong> on anything that looks good.</p>
          </div>
        )}

        {/* Cart items */}
        {!isEmpty && !collapsed && (
          <div className="cart-items-scroll">
            {cart.map(({ item, qty }) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(193,130,55,0.08)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'var(--c-stone)', flexShrink: 0 }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🍮</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--c-dark)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--c-caramel)', fontWeight: 700 }}>₱{(Number(item.price) * qty).toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => updateQty(item.id, qty - 1)} style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--c-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-dark)', fontWeight: 900, fontSize: 13, lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-dark)', minWidth: 14, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => updateQty(item.id, qty + 1)} style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--c-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-dark)', fontWeight: 900, fontSize: 13, lineHeight: 1 }}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8b89a', padding: 2, flexShrink: 0, lineHeight: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Checkout footer */}
        {!isEmpty && !collapsed && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--c-border)', background: '#fff8f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--c-caramel)' }}>₱{totalPrice.toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} className="btn-caramel"
              style={{ width: '100%', padding: '11px', borderRadius: 12, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 4px 16px rgba(228,140,60,0.3)' }}>
              Checkout →
            </button>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};

export default CartWidget;
