import { useState, useEffect, useCallback } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { ADMIN_CONFIG } from '../../lib/constants';
import { Icon, Spinner, fmtDT } from './Shared';
import { toast } from './Toast';

const InventoryPage = () => {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [saving,  setSaving]  = useState({});
  const [search,  setSearch]  = useState('');
  const [rtFlash, setRtFlash] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from('inventory')
      .select('id, stock, updated_at, dessert_id, desserts(id, name, category, image_url, is_available)')
      .order('desserts(name)');
    setRows(data || []); setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = sb.channel('inventory-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        setRtFlash(true); setTimeout(() => setRtFlash(false), 600); load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desserts' }, () => load())
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [load]);

  const handleSave = async (row) => {
    const n = parseInt(editing[row.id], 10);
    if (isNaN(n) || n < 0) { toast.error('Enter a valid stock number (0 or more).'); return; }
    setSaving((p) => ({ ...p, [row.id]: true }));
    const { error } = await sb.from('inventory').update({ stock: n }).eq('id', row.id);
    setSaving((p) => ({ ...p, [row.id]: false }));
    if (error) { toast.error(error.message); return; }
    toast.success(`Stock updated for ${row.desserts?.name}.`);
    setEditing((p) => { const nxt = { ...p }; delete nxt[row.id]; return nxt; });
  };

  const filtered = rows.filter((r) => (r.desserts?.name || '').toLowerCase().includes(search.toLowerCase()));
  const lowStock  = rows.filter((r) => r.stock <= 5 && r.stock > 0);
  const outStock  = rows.filter((r) => r.stock === 0);

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="serif italic" style={{ fontSize: 36, color: 'var(--c-dark)', marginBottom: 4 }}>Inventory</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            Stock levels&nbsp;<span className={`rt-dot ${rtFlash ? 'flash' : ''}`}></span>
            <span style={{ fontSize: 11 }}>{rtFlash ? 'Updated!' : 'Live'}</span>
          </p>
        </div>
      </div>

      {!loading && outStock.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: '#fee2e2', border: '1px solid #fecaca', marginBottom: 12, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
          <Icon name="warning" size={16} /> {outStock.length} out of stock — {outStock.map((r) => r.desserts?.name).join(', ')}
        </div>
      )}
      {!loading && lowStock.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 16, color: '#92400e', fontSize: 13, fontWeight: 600 }}>
          <Icon name="warning" size={16} /> {lowStock.length} running low — {lowStock.map((r) => r.desserts?.name).join(', ')}
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }}><Icon name="search" size={16} /></span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="flan-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#fff8f0', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
          placeholder="Search items…" />
      </div>

      <div className="flan-card" style={{ overflow: 'hidden' }}>
        <div className="table-scroll" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr>{ADMIN_CONFIG.inventoryHeaders.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 20 }} /></td></tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--c-muted)', padding: 40 }}>No items found.</td></tr>
              ) : filtered.map((row) => {
                const isEditing = row.id in editing;
                const sc = row.stock === 0 ? '#dc2626' : row.stock <= 5 ? '#d97706' : '#15803d';
                return (
                  <tr key={row.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: 'var(--c-stone)', flexShrink: 0 }}>
                          {row.desserts?.image_url && <img src={row.desserts.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{row.desserts?.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--c-muted)', fontSize: 13, textTransform: 'capitalize' }}>{row.desserts?.category || '—'}</td>
                    <td><span className={`badge ${row.desserts?.is_available ? 'badge-ready' : 'badge-cancelled'}`}>{row.desserts?.is_available ? 'Available' : 'Hidden'}</span></td>
                    <td>
                      {isEditing ? (
                        <input type="number" min={0} value={editing[row.id]}
                          onChange={(e) => setEditing((p) => ({ ...p, [row.id]: e.target.value }))}
                          className="flan-input"
                          style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--c-caramel)', background: 'var(--c-custard)', fontSize: 14, fontWeight: 700, color: 'var(--c-dark)' }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSave(row)} autoFocus />
                      ) : (
                        <span style={{ fontWeight: 800, fontSize: 16, color: sc }}>{row.stock} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--c-muted)' }}>units</span></span>
                      )}
                    </td>
                    <td style={{ color: 'var(--c-muted)', fontSize: 12 }}>{fmtDT(row.updated_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isEditing ? (
                          <>
                            <button className="btn btn-caramel btn-sm" onClick={() => handleSave(row)} disabled={saving[row.id]}>
                              {saving[row.id] ? <Spinner /> : <Icon name="check" size={13} />} Save
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditing((p) => { const n = { ...p }; delete n[row.id]; return n; })}>
                              <Icon name="x" size={13} />
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditing((p) => ({ ...p, [row.id]: String(row.stock) }))}>
                            <Icon name="edit" size={13} /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
