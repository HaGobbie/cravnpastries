import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { ADMIN_CONFIG } from '../../lib/constants';
import { Icon, fmt, fmtDate } from './Shared';
import { CopyButton } from './Shared';
import { toast } from './Toast';
import OrderDetailModal from './OrderDetailModal';

const STATUS_LABELS = ADMIN_CONFIG.statusLabels;
const PAY_LABELS    = ADMIN_CONFIG.payLabels;

const OrdersPage = ({ onNewOrderCount }) => {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [dateSort,     setDateSort]     = useState('desc');
  const [rtFlash,      setRtFlash]      = useState(false);
  const [newIds,       setNewIds]       = useState(new Set());
  const seenRef = useRef(null);

  const load = useCallback(async (isRt = false) => {
    const { data } = await sb.from('orders')
      .select('*')
      .order('created_at', { ascending: dateSort === 'asc' });
    const rows = data || [];
    if (isRt && seenRef.current) {
      const fresh = rows.filter((o) => new Date(o.created_at) > seenRef.current).map((o) => o.id);
      if (fresh.length) {
        setNewIds((prev) => new Set([...prev, ...fresh]));
        onNewOrderCount(fresh.length);
        toast.info(`🛎 ${fresh.length} new order${fresh.length > 1 ? 's' : ''} received!`);
      }
    }
    seenRef.current = new Date();
    setOrders(rows); setLoading(false);
  }, [dateSort, onNewOrderCount]);

  useEffect(() => {
    load();
    const ch = sb.channel('orders-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        setRtFlash(true); setTimeout(() => setRtFlash(false), 600); load(true);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        setRtFlash(true); setTimeout(() => setRtFlash(false), 600); load();
      })
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [load]);

  const clearNew = (id) => setNewIds((prev) => { const s = new Set(prev); s.delete(id); return s; });

  const filtered = orders.filter((o) => {
    const ms = statusFilter === 'all' ? true : o.status === statusFilter;
    const mt = !search || (o.guest_name || '').toLowerCase().includes(search.toLowerCase()) || (o.gcash_ref || '').toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    return ms && mt;
  });
  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="serif italic" style={{ fontSize: 36, color: 'var(--c-dark)', marginBottom: 4 }}>Orders</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            {orders.length} total&nbsp;
            <span className={`rt-dot ${rtFlash ? 'flash' : ''}`}></span>
            <span style={{ fontSize: 11 }}>{rtFlash ? 'Live update!' : 'Live'}</span>
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all',       label: 'All',       count: orders.length },
          { key: 'pending',   label: 'Pending',   count: counts.pending   || 0 },
          { key: 'confirmed', label: 'Confirmed', count: counts.confirmed || 0 },
          { key: 'ready',     label: 'Ready',     count: counts.ready     || 0 },
          { key: 'completed', label: 'Completed', count: counts.completed || 0 },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled || 0 },
        ].map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
              background: statusFilter === f.key ? 'var(--c-caramel)' : 'transparent', borderColor: statusFilter === f.key ? 'var(--c-caramel)' : 'var(--c-border)', color: statusFilter === f.key ? '#fff' : 'var(--c-muted)' }}>
            {f.label}
            <span style={{ fontWeight: 800, fontSize: 11, padding: '1px 7px', borderRadius: 999, background: statusFilter === f.key ? 'rgba(255,255,255,0.25)' : 'var(--c-stone)', color: statusFilter === f.key ? '#fff' : 'var(--c-dark)' }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }}><Icon name="search" size={16} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="flan-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: '#fff8f0', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
            placeholder="Search by name, GCash ref, or order ID…" />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setDateSort((p) => p === 'desc' ? 'asc' : 'desc')}>
          <Icon name={dateSort === 'desc' ? 'chevdown' : 'chevup'} size={14} /> {dateSort === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      <div className="flan-card" style={{ overflow: 'hidden' }}>
        <div className="table-scroll" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>{ADMIN_CONFIG.orderTableHeaders.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(10)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--c-muted)', padding: '48px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                  <p style={{ fontWeight: 700 }}>No orders found</p>
                </td></tr>
              ) : filtered.map((o) => {
                const isNew = newIds.has(o.id);
                return (
                  <tr key={o.id} style={{ cursor: 'pointer', background: isNew ? 'rgba(228,140,60,0.06)' : undefined }}
                    onClick={() => { clearNew(o.id); setSelected(o); }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--c-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      #{o.id.split('-')[0].toUpperCase()}
                      {isNew && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 999, background: 'var(--c-caramel)', color: '#fff', verticalAlign: 'middle' }}>NEW</span>}
                      <CopyButton text={o.id} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{o.guest_name || '—'}</td>
                    <td style={{ color: 'var(--c-muted)', fontSize: 13 }}>{o.guest_phone || '—'}</td>
                    <td style={{ fontSize: 13 }}>{fmtDate(o.pickup_date)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--c-caramel)' }}>{fmt(o.total_price)}</td>
                    <td><span className={`badge badge-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                    <td><span className={`badge ${o.payment_status === 'paid' ? 'badge-paid' : o.payment_status === 'failed' ? 'badge-failed' : 'badge-unpaid'}`}>{PAY_LABELS[o.payment_status] || o.payment_status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--c-muted)', fontFamily: 'monospace' }}>{o.gcash_ref || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); clearNew(o.id); setSelected(o); }}>
                        <Icon name="eye" size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} onUpdated={() => load()} />
      )}
    </div>
  );
};

export default OrdersPage;
