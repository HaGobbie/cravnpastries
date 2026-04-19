/**
 * AnalyticsPage.jsx
 *
 * DEPENDENCY: npm install recharts
 *
 * Sections:
 *  1. Revenue summary stat cards (30-day totals)
 *  2. Revenue AreaChart — daily paid revenue over the last 30 days
 *  3. Top-5 Best-Selling Desserts BarChart — from order_items
 *  4. Low Stock Warnings — inventory rows where stock < 5
 *  5. Download Report — CSV of all orders
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { Icon, Spinner, fmt, fmtDate } from './Shared';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

/* ── helpers ── */
const pad   = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shortLabel = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

/* ── custom recharts tooltip ── */
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--c-cream)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 20px rgba(74,44,26,0.12)' }}>
      <p style={{ fontWeight: 700, color: 'var(--c-dark)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--c-caramel)', fontWeight: 800 }}>{fmt(payload[0].value)}</p>
      <p style={{ color: 'var(--c-muted)', fontSize: 10, marginTop: 2 }}>{payload[0].payload.orders} order{payload[0].payload.orders !== 1 ? 's' : ''}</p>
    </div>
  );
};

const DessertTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--c-cream)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 20px rgba(74,44,26,0.12)' }}>
      <p style={{ fontWeight: 700, color: 'var(--c-dark)', marginBottom: 4 }}>{payload[0].payload.name}</p>
      <p style={{ color: 'var(--c-caramel)', fontWeight: 800 }}>{payload[0].value} sold</p>
      <p style={{ color: 'var(--c-muted)', fontSize: 10, marginTop: 2 }}>{fmt(payload[0].payload.revenue)} revenue</p>
    </div>
  );
};

/* ── bar colours cycling through flan palette ── */
const BAR_COLORS = [
  'rgb(228,140,60)', '#c97a28', '#4a2c1a', '#7c5a3a', '#a07040',
];

/* ── CSV export ── */
const downloadCSV = (orders) => {
  const headers = [
    'Order ID', 'Customer', 'Phone', 'Pickup Date',
    'Total (₱)', 'Status', 'Payment', 'GCash Ref', 'Created At',
  ];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = orders.map((o) => [
    o.id,
    o.guest_name   || '',
    o.guest_phone  || '',
    o.pickup_date  || '',
    Number(o.total_price).toFixed(2),
    o.status,
    o.payment_status,
    o.gcash_ref    || '',
    o.created_at,
  ].map(escape).join(','));

  const csv  = [headers.map(escape).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cravn-orders-${toIso(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════
   AnalyticsPage
══════════════════════════════════════════ */
const AnalyticsPage = () => {
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [revenueData,  setRevenueData]  = useState([]);
  const [topDesserts,  setTopDesserts]  = useState([]);
  const [lowStock,     setLowStock]     = useState([]);
  const [allOrders,    setAllOrders]    = useState([]);
  const [summary,      setSummary]      = useState({ revenue30: 0, orders30: 0, avgOrder: 0, bestDay: '' });
  const [exporting,    setExporting]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const [
        { data: orders30 },
        { data: orderItems },
        { data: lowStockRows },
        { data: allOrdersData },
      ] = await Promise.all([
        sb.from('orders')
          .select('id, total_price, payment_status, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString()),
        sb.from('order_items')
          .select('quantity, unit_price, dessert_id, desserts(name, category)'),
        sb.from('inventory')
          .select('stock, dessert_id, desserts(name, category, image_url)')
          .lt('stock', 5)
          .order('stock', { ascending: true }),
        sb.from('orders')
          .select('id, guest_name, guest_phone, pickup_date, total_price, status, payment_status, gcash_ref, created_at')
          .order('created_at', { ascending: false }),
      ]);

      /* ── Revenue by day ── */
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(thirtyDaysAgo);
        d.setDate(d.getDate() + i);
        return toIso(d);
      });
      const byDay = {};
      days.forEach((d) => { byDay[d] = { revenue: 0, orders: 0 }; });
      (orders30 || []).forEach((o) => {
        const day = o.created_at.split('T')[0];
        if (byDay[day] !== undefined) {
          if (o.payment_status === 'paid') byDay[day].revenue += Number(o.total_price);
          byDay[day].orders += 1;
        }
      });
      const chartData = days.map((d) => ({
        date:    d,
        label:   shortLabel(d),
        revenue: byDay[d].revenue,
        orders:  byDay[d].orders,
      }));
      setRevenueData(chartData);

      /* ── Summary stats ── */
      const paidOrders = (orders30 || []).filter((o) => o.payment_status === 'paid');
      const revenue30  = paidOrders.reduce((s, o) => s + Number(o.total_price), 0);
      const orders30n  = (orders30 || []).length;
      const avgOrder   = paidOrders.length ? revenue30 / paidOrders.length : 0;
      const bestDayEntry = chartData.reduce((best, d) => d.revenue > (best?.revenue || 0) ? d : best, null);
      setSummary({
        revenue30,
        orders30: orders30n,
        avgOrder,
        bestDay:  bestDayEntry?.label || '—',
      });

      /* ── Top 5 best-selling desserts ── */
      const dessertMap = {};
      (orderItems || []).forEach((item) => {
        const id   = item.dessert_id;
        const name = item.desserts?.name || 'Unknown';
        if (!dessertMap[id]) dessertMap[id] = { name, qty: 0, revenue: 0 };
        dessertMap[id].qty     += item.quantity;
        dessertMap[id].revenue += item.quantity * Number(item.unit_price);
      });
      const top5 = Object.values(dessertMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
      setTopDesserts(top5);

      /* ── Low stock ── */
      setLowStock(lowStockRows || []);

      /* ── All orders for export ── */
      setAllOrders(allOrdersData || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    setExporting(true);
    try { downloadCSV(allOrders); }
    finally { setTimeout(() => setExporting(false), 800); }
  };

  /* ── Loading skeleton ── */
  if (loading) return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: 280 }} />
        </div>
        <div className="skeleton" style={{ height: 40, width: 160, borderRadius: 12 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flan-card" style={{ padding: 24 }}>
            <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 32, width: '70%' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="flan-card skeleton" style={{ height: 280 }} />
        <div className="flan-card skeleton" style={{ height: 280 }} />
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ padding: '64px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <p style={{ fontWeight: 700, color: 'var(--c-dark)', marginBottom: 6 }}>{error}</p>
      <button className="btn btn-caramel btn-sm" onClick={load}>Retry</button>
    </div>
  );

  /* ── Page ── */
  return (
    <div className="fade-up" style={{ padding: '32px 32px 48px' }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="serif italic" style={{ fontSize: 36, color: 'var(--c-dark)', marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 14 }}>
            30-day overview · {allOrders.length} total orders on record
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
          <button
            className="btn btn-caramel"
            onClick={handleExport}
            disabled={exporting || !allOrders.length}
            style={{ gap: 8 }}
          >
            {exporting
              ? <><Spinner /> Exporting…</>
              : <><Icon name="upload" size={14} /> Download Report (CSV)</>
            }
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="stat-grid stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: '30-Day Revenue',
            value: fmt(summary.revenue30),
            icon: 'peso',
            color: '#f3e8ff',
            icolor: '#7c3aed',
            sub: 'from paid orders',
          },
          {
            label: 'Orders Placed',
            value: summary.orders30,
            icon: 'orders',
            color: '#dbeafe',
            icolor: '#1d4ed8',
            sub: 'in last 30 days',
          },
          {
            label: 'Avg. Order Value',
            value: fmt(summary.avgOrder),
            icon: 'analytics',
            color: '#dcfce7',
            icolor: '#15803d',
            sub: 'per paid order',
          },
          {
            label: 'Best Revenue Day',
            value: summary.bestDay,
            icon: 'calendar',
            color: '#fef3c7',
            icolor: '#b45309',
            sub: 'this month',
          },
        ].map((s, i) => (
          <div key={i} className="stat-card fade-up">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.icolor }}>
                <Icon name={s.icon} size={18} />
              </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--c-dark)', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-muted)' }}>{s.label}</p>
            <p style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2, opacity: 0.7 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Top Desserts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 20 }}>

        {/* Revenue Area Chart */}
        <div className="flan-card" style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)' }}>Revenue Trend</h3>
              <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>Daily paid revenue — last 30 days</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'var(--c-custard)', color: 'var(--c-caramel)' }}>
              {fmt(summary.revenue30)} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="caramelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="rgb(228,140,60)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="rgb(228,140,60)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,130,55,0.12)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#8a6a4a', fontWeight: 600 }}
                axisLine={false} tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#8a6a4a', fontWeight: 600 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `₱${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                width={48}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'rgba(228,140,60,0.2)', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="revenue"
                stroke="rgb(228,140,60)" strokeWidth={2.5}
                fill="url(#caramelGrad)"
                dot={false}
                activeDot={{ r: 5, fill: 'rgb(228,140,60)', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Desserts + Low Stock ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>

        {/* Top 5 Best-Selling Desserts */}
        <div className="flan-card" style={{ padding: '24px 24px 16px' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)' }}>Top 5 Best-Selling Desserts</h3>
            <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>By total units sold — all time</p>
          </div>

          {topDesserts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>No order data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topDesserts} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,130,55,0.1)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#8a6a4a' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8a6a4a', fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<DessertTooltip />} cursor={{ fill: 'rgba(228,140,60,0.06)' }} />
                  <Bar dataKey="qty" radius={[0, 6, 6, 0]}>
                    {topDesserts.map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Ranking table below chart */}
              <div style={{ marginTop: 16 }}>
                {topDesserts.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: idx < topDesserts.length - 1 ? '1px solid rgba(193,130,55,0.08)' : 'none' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: BAR_COLORS[idx], color: '#fff', fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--c-dark)' }}>{d.name}</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--c-caramel)' }}>{d.qty} sold</span>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)', minWidth: 72, textAlign: 'right' }}>{fmt(d.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Low Stock Warnings */}
        <div className="flan-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)' }}>Inventory Forecast</h3>
              <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>Items with fewer than 5 units remaining</p>
            </div>
            {lowStock.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: '#fee2e2', color: '#dc2626' }}>
                {lowStock.length} critical
              </span>
            )}
          </div>

          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#15803d', marginBottom: 4 }}>All stocked up!</p>
              <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>No items below the 5-unit threshold.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStock.map((item, i) => {
                const name  = item.desserts?.name     || 'Unknown Item';
                const cat   = item.desserts?.category || '';
                const isOut = item.stock === 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: isOut ? '#fff1f2' : '#fffbeb',
                    border: `1px solid ${isOut ? '#fecdd3' : '#fde68a'}`,
                  }}>
                    {/* Stock gauge */}
                    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" width="40" height="40">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={isOut ? '#fecdd3' : '#fde68a'} strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke={isOut ? '#dc2626' : '#d97706'} strokeWidth="3"
                          strokeDasharray={`${(item.stock / 5) * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: isOut ? '#dc2626' : '#d97706' }}>
                        {item.stock}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name}</p>
                      <p style={{ fontSize: 11, color: isOut ? '#dc2626' : '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                        {isOut ? '🚨 Out of stock' : `⚠ ${item.stock} left`}
                      </p>
                    </div>

                    {cat && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: isOut ? '#fecdd3' : '#fde68a', color: isOut ? '#dc2626' : '#92400e', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>
                        {cat}
                      </span>
                    )}
                  </div>
                );
              })}
              <p style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 4, textAlign: 'center' }}>
                Go to <strong>Inventory</strong> to update stock levels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
