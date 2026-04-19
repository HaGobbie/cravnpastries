import { useState, useEffect, useCallback } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { Icon, fmt } from './Shared';
import { toast } from './Toast';
import { ConfirmModal } from './Shared';
import DessertForm from './DessertForm';

const DessertsPage = () => {
  const [desserts, setDesserts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [rtFlash,  setRtFlash]  = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from('desserts').select('*').order('created_at', { ascending: false });
    setDesserts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = sb.channel('desserts-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'desserts' }, () => {
        setRtFlash(true); setTimeout(() => setRtFlash(false), 600); load();
      })
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [load]);

  const handleDelete = async (id) => {
    const { error } = await sb.from('desserts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Dessert deleted.'); setConfirm(null);
  };

  const handleToggle = async (d) => {
    const { error } = await sb.from('desserts').update({ is_available: !d.is_available }).eq('id', d.id);
    if (error) { toast.error(error.message); return; }
    toast.success(d.is_available ? 'Marked as unavailable.' : 'Marked as available.');
  };

  const filtered = desserts.filter((d) => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase()) || (d.category || '').toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' ? true : filter === 'available' ? d.is_available : !d.is_available;
    return ms && mf;
  });

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="serif italic" style={{ fontSize: 36, color: 'var(--c-dark)', marginBottom: 4 }}>Desserts</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            {desserts.length} items&nbsp;
            <span className={`rt-dot ${rtFlash ? 'flash' : ''}`}></span>
            <span style={{ fontSize: 11 }}>{rtFlash ? 'Updated!' : 'Live'}</span>
          </p>
        </div>
        <button className="btn btn-caramel" onClick={() => setModal('add')}><Icon name="plus" size={16} /> Add Dessert</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }}><Icon name="search" size={16} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="flan-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: '#fff8f0', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
            placeholder="Search desserts…" />
        </div>
        {['all', 'available', 'unavailable'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
              background: filter === f ? 'var(--c-caramel)' : 'transparent', borderColor: filter === f ? 'var(--c-caramel)' : 'var(--c-border)', color: filter === f ? '#fff' : 'var(--c-muted)' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flan-card" style={{ padding: 16 }}>
              <div className="skeleton" style={{ height: 160, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--c-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍮</div>
          <p style={{ fontWeight: 700, fontSize: 16 }}>No desserts found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {filtered.map((d) => (
            <div key={d.id} className="flan-card fade-up" style={{ overflow: 'hidden', opacity: d.is_available ? 1 : 0.65 }}>
              <div style={{ height: 160, background: 'var(--c-stone)', position: 'relative', overflow: 'hidden' }}>
                {d.image_url && <img src={d.image_url} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--c-muted)', zIndex: -1 }}>🍮</div>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span className={`badge ${d.is_available ? 'badge-ready' : 'badge-cancelled'}`}>{d.is_available ? 'Available' : 'Hidden'}</span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-caramel)', marginBottom: 2 }}>{d.category || 'Uncategorized'}</p>
                <h4 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)', marginBottom: 2 }}>{d.name}</h4>
                <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{d.description || 'No description.'}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--c-caramel)' }}>{fmt(d.price)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" title={d.is_available ? 'Hide' : 'Show'} onClick={() => handleToggle(d)}>
                      <Icon name={d.is_available ? 'eyeoff' : 'eye'} size={13} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setModal(d)}><Icon name="edit" size={13} /></button>
                    <button className="btn btn-danger btn-sm" title="Delete" onClick={() => setConfirm(d)}><Icon name="trash" size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <DessertForm dessert={modal === 'add' ? null : modal} onSave={() => setModal(null)} onClose={() => setModal(null)} />}
      {confirm && (
        <ConfirmModal danger title="Delete Dessert?"
          message={`"${confirm.name}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
};

export default DessertsPage;
