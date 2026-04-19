import { useState, useEffect, useCallback } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { fetchAdminData } from '../../lib/api';
import { ADMIN_CONFIG } from '../../lib/constants';
import { Icon, fmt, fmtDate } from './Shared';

const STATUS_LABELS = ADMIN_CONFIG.statusLabels;
const PAY_LABELS    = ADMIN_CONFIG.payLabels;

const Dashboard = ({ setPage }) => {
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [rtFlash, setRtFlash] = useState(false);

  const load = useCallback(async () => {
    const { totalOrders, pendingOrders, orders, desserts, inventory } =
      await fetchAdminData();

    const totalRevenue = orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((s, o) => s + Number(o.total_price), 0);

    setStats({
      totalOrders,
      pendingOrders,
      totalDesserts: desserts.length,
      totalStock:    inventory.reduce((s, r) => s + r.stock, 0),
      totalRevenue,
    });
    setRecent(orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = sb.channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },    () => { setRtFlash(true); setTimeout(() => setRtFlash(false), 600); load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desserts' },  () => load())
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [load]);

  if (loading) return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 300 }} />
      </div>
      <div className="stat-grid stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flan-card" style={{ padding: 24 }}>
            <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 12, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 28, width: '55%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '70%' }} />
          </div>
        ))}
      </div>
    </div>
  );

  const statCards = ADMIN_CONFIG.statCards(stats, fmt);

  return (
    <div className="fade-up" style={{ padding: '32px 32px 48px' }}>
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="serif italic" style={{ fontSize: 36, color: 'var(--c-dark)', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 14 }}>Welcome back. Here's what's happening at Cravn today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span className={`rt-dot ${rtFlash ? 'flash' : ''}`}></span>
          {rtFlash ? 'Updated!' : 'Live'}
        </div>
      </div>

      <div className="stat-grid stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card fade-up">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.icolor, boxShadow: `0 4px 12px ${s.color}` }}>
                <Icon name={s.icon} size={20} />
              </div>
              {s.trend && (
                <span className={`stat-card-trend ${s.trend === 'up' ? 'trend-up' : 'trend-warn'}`}>
                  {s.trend === 'up' ? '↑ Good' : '⚠ Review'}
                </span>
              )}
            </div>
            <p style={{ fontSize: 30, fontWeight: 900, color: 'var(--c-dark)', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
        <div className="flan-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)' }}>Recent Orders</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('orders')}>View All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
              <tbody>
                {recent.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--c-muted)', padding: '32px' }}>No orders yet.</td></tr>
                  : recent.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.guest_name || 'Guest'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--c-caramel)' }}>{fmt(o.total_price)}</td>
                      <td><span className={`badge badge-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                      <td><span className={`badge ${o.payment_status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>{PAY_LABELS[o.payment_status] || o.payment_status}</span></td>
                      <td style={{ color: 'var(--c-muted)', fontSize: 13 }}>{fmtDate(o.created_at)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        <div className="flan-card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Add New Dessert', icon: 'plus',    page: 'desserts',  desc: 'List a new item on the menu' },
              { label: 'Update Stock',    icon: 'package', page: 'inventory', desc: 'Adjust available quantities' },
              { label: 'Review Orders',   icon: 'orders',  page: 'orders',    desc: 'Confirm or cancel orders' },
            ].map((a) => (
              <button key={a.page} onClick={() => setPage(a.page)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: 'var(--c-oat)', border: '1px solid var(--c-border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-caramel)'; e.currentTarget.style.background = 'var(--c-custard)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)';   e.currentTarget.style.background = 'var(--c-oat)'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-caramel)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <Icon name={a.icon} size={16} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)' }}>{a.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
