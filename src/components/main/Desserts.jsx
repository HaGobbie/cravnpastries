import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useCart } from './CartContext';
import { LazyImage, ModalPortal, SkeletonCard } from './Shared';
import CartWidget from './CartWidget';
import CheckoutModal from './CheckoutModal';
import { OrderHistoryPanel } from './OrderUtils';

/* ── Dessert Detail Modal ── */
const DessertModal = ({ item, stock, onClose, onAddToCart }) => {
  if (!item) return null;
  const inStock = stock > 0;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <ModalPortal>
      <div className="modal-portal-backdrop" onClick={onClose}>
        <div style={{ position: 'relative', borderRadius: 32, boxShadow: '0 28px 72px rgba(0,0,0,0.4)', maxWidth: 480, width: '100%', overflow: 'hidden', background: 'var(--c-cream)', border: '1px solid var(--c-border)', animation: 'slideUpIn 0.28s cubic-bezier(0.16,1,0.3,1)' }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ width: '100%', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            {item.image_url
              ? <LazyImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, background: 'var(--c-oat)' }}>🍮</div>
            }
            <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', ...(inStock ? { background: '#d4edda', color: '#155724' } : { background: '#f8d7da', color: '#721c24' }) }}>
              {inStock ? `${stock} left` : 'Out of Stock'}
            </div>
            <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(253,245,228,0.95)', color: 'var(--c-dark)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div style={{ padding: '28px 28px 24px' }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--c-caramel)', display: 'block', marginBottom: 4 }}>{item.category || 'Pastry'}</span>
            <h2 className="serif italic" style={{ fontSize: 28, color: 'var(--c-dark)', marginBottom: 8 }}>{item.name}</h2>
            {item.description && <p style={{ lineHeight: 1.6, marginBottom: 16, color: 'var(--c-text-muted)' }}>{item.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-caramel)' }}>₱{Number(item.price).toLocaleString()}</span>
              <button
                disabled={!inStock}
                onClick={() => { if (inStock) { onAddToCart(item); onClose(); } }}
                className={inStock ? 'btn-caramel' : ''}
                style={inStock
                  ? { padding: '12px 28px', borderRadius: 999, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 8px 20px rgba(228,140,60,0.3)' }
                  : { padding: '12px 28px', borderRadius: 999, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--c-stone)', color: 'var(--c-text-muted)', border: 'none', cursor: 'not-allowed' }
                }>
                {inStock ? '+ Add to Cart' : 'Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

/* ── Desserts Page ── */
const Desserts = () => {
  const { addToCart } = useCart();
  const [items,         setItems]         = useState([]);
  const [inventory,     setInventory]     = useState({});
  const [categories,    setCategories]    = useState(['all']);
  const [filter,        setFilter]        = useState('all');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);
  const [realtimeFlash, setRealtimeFlash] = useState(false);
  const flashRef = useRef(null);

  const triggerFlash = () => {
    setRealtimeFlash(true);
    clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setRealtimeFlash(false), 700);
  };

  const fetchData = useCallback(async () => {
    try {
      const { data: desserts, error: dErr } = await supabase
        .from('desserts').select('*').eq('is_available', true).order('name');
      if (dErr) throw dErr;
      const ids = (desserts || []).map((d) => d.id);
      let inv = {};
      if (ids.length > 0) {
        const { data: invData, error: iErr } = await supabase
          .from('inventory').select('dessert_id,stock').in('dessert_id', ids);
        if (iErr) throw iErr;
        (invData || []).forEach((r) => { inv[r.dessert_id] = r.stock; });
      }
      setItems(desserts || []);
      setInventory(inv);
      const cats = ['all', ...new Set((desserts || []).map((d) => d.category).filter(Boolean))];
      setCategories(cats);
    } catch (e) {
      console.error(e);
      setError('Could not load the menu right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true); setError(null);
    fetchData();
    const channel = supabase
      .channel('cravn-menu-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desserts' },   () => { triggerFlash(); fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' },  () => { triggerFlash(); fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const filtered      = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const selectedStock = selected ? (inventory[selected.id] ?? 0) : 0;

  return (
    <div className="page-enter min-h-screen" style={{ background: 'var(--c-cream)' }}>
      {/* Header */}
      <div className="pt-40 pb-16 text-center px-6" style={{ background: 'var(--c-cream)' }}>
        <span className="text-[10px] uppercase tracking-[0.5em] font-black mb-3 block" style={{ color: 'var(--c-caramel)' }}>Fresh Daily</span>
        <h2 className="text-5xl md:text-7xl font-bold serif italic leading-tight" style={{ color: 'var(--c-dark)' }}>The Pastry Case</h2>
        <div className="caramel-rule mt-6"></div>
        <p className="mt-6 text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>
          Handcrafted every morning. Stock is live — what you see is what's available.
        </p>
      </div>

      {/* Filter bar */}
      <div className="py-6 px-6" style={{ background: '#fff8f0', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-7xl mx-auto flex justify-center gap-3 flex-wrap">
          {categories.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all duration-200 ${filter === f ? 'pill-active' : 'pill-inactive'}`}
              style={{ cursor: 'pointer' }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="py-20 px-6" style={{ background: 'var(--c-stone)' }}>
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="text-center py-24">
              <div className="text-5xl mb-6">🍮</div>
              <p className="font-bold text-xl serif italic mb-2" style={{ color: 'var(--c-dark)' }}>Oops, something went wrong.</p>
              <p className="text-sm mb-8" style={{ color: 'var(--c-text-muted)' }}>{error}</p>
              <button onClick={() => window.location.reload()} className="btn-caramel px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs">Retry</button>
            </div>
          )}
          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-24">
              <div className="text-5xl mb-6">🥐</div>
              <p className="font-bold text-xl serif italic" style={{ color: 'var(--c-dark)' }}>Nothing here yet.</p>
              <p className="text-sm mt-2" style={{ color: 'var(--c-text-muted)' }}>Check back soon — we bake fresh every day!</p>
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filtered.map((item) => {
                const stock      = inventory[item.id] ?? 0;
                const outOfStock = stock === 0;
                const lowStock   = stock > 0 && stock <= 5;
                return (
                  <div key={item.id} className="dessert-card group cursor-pointer"
                    style={{ opacity: outOfStock ? 0.55 : 1 }}
                    onClick={() => !outOfStock && setSelected(item)}>
                    <div className="aspect-square overflow-hidden mb-4 relative" style={{ borderRadius: '30px', background: '#fff8f0', border: '1px solid var(--c-border)', boxShadow: '0 2px 12px rgba(193,130,55,0.1)' }}>
                      <div className="absolute inset-0 z-10 pointer-events-none transition-all duration-300" style={{ borderRadius: '30px' }}></div>
                      {outOfStock && <span className="absolute top-4 left-4 z-20 text-white text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(43,24,13,0.78)' }}>Sold Out</span>}
                      {lowStock   && <span className="absolute top-4 left-4 z-20 text-white text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full" style={{ background: 'var(--c-caramel)' }}>Only {stock} left!</span>}
                      {!outOfStock && (
                        <div className="absolute inset-0 z-10 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-xl" style={{ background: 'var(--c-cream)', color: 'var(--c-dark)' }}>View Details</span>
                        </div>
                      )}
                      {item.image_url
                        ? <LazyImage src={item.image_url} alt={item.name}
                            className={`card-img-inner w-full h-full object-cover ${!outOfStock ? 'group-hover:scale-110' : ''}`}
                            wrapperClassName="w-full h-full" wrapperStyle={{ borderRadius: '30px' }} />
                        : <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: 'var(--c-oat)' }}>🍮</div>
                      }
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--c-caramel)' }}>{item.category || 'Pastry'}</span>
                    <h3 className="text-2xl font-bold mt-1 mb-1" style={{ color: 'var(--c-dark)' }}>{item.name}</h3>
                    {item.description && <p className="text-sm leading-relaxed mb-2 line-clamp-2" style={{ color: 'var(--c-text-muted)' }}>{item.description}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-semibold" style={{ color: 'var(--c-text-muted)' }}>₱{Number(item.price).toLocaleString()}</p>
                      {!outOfStock && !lowStock && <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: '#c8b89a' }}>{stock} in stock</span>}
                    </div>
                    {!outOfStock && (
                      <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="btn-caramel w-full mt-3"
                        style={{ padding: '10px', borderRadius: 14, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        + Add to Cart
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!loading && !error && (
            <div className="flex items-center justify-center gap-2 mt-16" style={{ color: 'var(--c-text-muted)' }}>
              <span className={`w-2 h-2 rounded-full inline-block ${realtimeFlash ? 'realtime-flash' : 'animate-pulse'}`}
                style={{ background: realtimeFlash ? 'var(--c-caramel)' : '#5cb85c', transition: 'background 0.2s' }}></span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">
                {realtimeFlash ? 'Menu updated!' : 'Live inventory — updates in real time'}
              </span>
            </div>
          )}
        </div>
      </div>

      {selected     && <DessertModal item={selected} stock={selectedStock} onClose={() => setSelected(null)} onAddToCart={(item) => { addToCart(item); }} />}
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
      <CartWidget onCheckout={() => setCheckoutOpen(true)} />
      <OrderHistoryPanel />
    </div>
  );
};

export default Desserts;
