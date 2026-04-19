import { useState, useRef } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { ADMIN_CONFIG } from '../../lib/constants';
import { uploadImageToGitHub } from '../../lib/github';
import { Icon, Spinner } from './Shared';
import { toast } from './Toast';

const DessertForm = ({ dessert, onSave, onClose }) => {
  const isEdit = !!dessert;
  const [form, setForm] = useState({
    name:         dessert?.name         || '',
    description:  dessert?.description  || '',
    price:        dessert?.price        || '',
    category:     dessert?.category     || '',
    image_url:    dessert?.image_url    || '',
    is_available: dessert?.is_available !== undefined ? dessert.is_available : true,
  });
  const [imgTab,    setImgTab]    = useState('url');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [dragOver,  setDragOver]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const fileInputRef = useRef(null);
  const categories   = ADMIN_CONFIG.dessertCategories;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileUpload = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { toast.error('Only JPG, PNG, WebP or GIF files are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB.'); return; }
    setUploading(true); setUploadPct(20);
    try {
      const tick = setInterval(() => setUploadPct((p) => Math.min(p + 15, 85)), 400);
      const url = await uploadImageToGitHub(file);
      clearInterval(tick); setUploadPct(100);
      set('image_url', url);
      toast.success('Image uploaded to GitHub!');
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploading(false); setUploadPct(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Dessert name is required.'); return; }
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) { toast.error('Enter a valid price.'); return; }
    setSaving(true);
    const payload = { ...form, price: Number(form.price) };
    let error;
    if (isEdit) ({ error } = await sb.from('desserts').update(payload).eq('id', dessert.id));
    else        ({ error } = await sb.from('desserts').insert([payload]));
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Dessert updated!' : 'Dessert added!');
    onSave();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '28px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="serif italic text-2xl" style={{ color: 'var(--c-dark)' }}>{isEdit ? 'Edit Dessert' : 'Add New Dessert'}</h2>
          <button className="expand-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Image preview */}
          {form.image_url && (
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 160, background: 'var(--c-stone)', position: 'relative' }}>
              <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />
              <button onClick={() => set('image_url', '')}
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={13} />
              </button>
            </div>
          )}

          {/* Image source tabs */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 8 }}>Dessert Image</label>
            <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 10, background: 'var(--c-stone)', marginBottom: 12, width: 'fit-content' }}>
              <button className={`img-tab ${imgTab === 'url' ? 'active' : 'inactive'}`} onClick={() => setImgTab('url')}>
                <Icon name="link" size={12} /> Paste URL
              </button>
              <button className={`img-tab ${imgTab === 'github' ? 'active' : 'inactive'}`} onClick={() => setImgTab('github')}>
                <Icon name="upload" size={12} /> Upload to GitHub
              </button>
            </div>

            {imgTab === 'url' && (
              <input value={form.image_url} onChange={(e) => set('image_url', e.target.value)}
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
                placeholder="https://example.com/image.jpg" />
            )}

            {imgTab === 'github' && (
              <div>
                <div
                  className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{ opacity: uploading ? 0.6 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
                >
                  {uploading ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-dark)', marginBottom: 10 }}>Uploading to GitHub…</div>
                      <div style={{ height: 6, borderRadius: 999, background: 'var(--c-stone)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: 'var(--c-caramel)', width: `${uploadPct}%`, transition: 'width 0.3s' }}></div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 6 }}>{uploadPct}%</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 4 }}>Click or drag &amp; drop</p>
                      <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>JPG, PNG, WebP, GIF — max 10 MB</p>
                      <p style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4 }}>Will be saved to <strong>HaGobbie/cravpastries</strong> with a timestamp</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} />
                {form.image_url && imgTab === 'github' && (
                  <p style={{ fontSize: 11, color: '#15803d', marginTop: 8, wordBreak: 'break-all' }}>
                    ✓ Uploaded: <a href={form.image_url} target="_blank" rel="noreferrer" style={{ color: 'var(--c-caramel)' }}>View on GitHub</a>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Name *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="flan-input w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
              placeholder="e.g. Signature Flan Cake" />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
              className="flan-input w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)', resize: 'vertical' }}
              placeholder="A brief description of this item…" />
          </div>

          {/* Price + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Price (₱) *</label>
              <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} min={0} step="0.01"
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
                placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Available toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, background: 'var(--c-oat)', border: '1px solid var(--c-border)' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-dark)' }}>Available for purchase</p>
              <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>Customers can see and order this item</p>
            </div>
            <label className="toggle-wrap">
              <input type="checkbox" className="toggle-input" checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button className="btn btn-caramel flex-1" onClick={handleSave} disabled={saving || uploading}>
              {saving ? <><Spinner /> Saving…</> : (isEdit ? 'Save Changes' : 'Add Dessert')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DessertForm;
