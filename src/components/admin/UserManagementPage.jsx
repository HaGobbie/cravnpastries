/**
/**
 * UserManagementPage.jsx
 *
 * SUPER ADMIN ONLY — access is gated in App.jsx (handleSetPage) and
 * this component re-checks via useAdmin() as a second defensive layer.
 *
 * Features:
 *   1. Admin list — reads public.admin_profiles joined with display info
 *   2. New admin registration form — uses supabaseAdmin.auth.admin.createUser()
 *      so the current super_admin session is never displaced
 *   3. Deactivate admin — sets is_active=false on admin_profiles (soft delete)
 *
 * ⚠ PREREQUISITES — add these to your .env before this page will work:
 *
 *   VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
 *
 *   Get it from: Supabase Dashboard → Settings → API → service_role (secret)
 *   See src/lib/supabaseAdmin.js for the full security warning.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase as sb }   from '../../lib/supabase';
import { supabaseAdmin }    from '../../lib/supabaseAdmin';
import { useAdmin }         from '../../lib/AdminContext';
import { Icon, Spinner, fmt, fmtDate, ConfirmModal } from './Shared';
import { toast }            from './Toast';

/* ── Password strength helper ── */
const RE_STRONG_PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const pwStrength = (pw) => {
  if (!pw) return { label: '', color: 'transparent', width: 0 };
  if (pw.length < 6)         return { label: 'Too short',  color: '#dc2626', width: 20 };
  if (!RE_STRONG_PW.test(pw)) return { label: 'Fair',       color: '#d97706', width: 50 };
  return                            { label: 'Strong',      color: '#15803d', width: 100 };
};

/* ── Role options ── */
const ROLE_OPTIONS = [
  { value: 'admin',       label: 'Admin',       desc: 'Manage orders, desserts, inventory' },
  { value: 'super_admin', label: 'Super Admin', desc: 'All above + User Management'        },
];

/* ══════════════════════════════════════════
   UserManagementPage
══════════════════════════════════════════ */
const UserManagementPage = () => {
  const { user: currentUser, role: currentRole } = useAdmin();

  /* ── Second defensive layer ── */
  if (currentRole !== 'super_admin') {
    return (
      <div style={{ padding: '64px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 className="serif italic" style={{ fontSize: 28, color: 'var(--c-dark)', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--c-muted)', fontSize: 14 }}>This page requires Super Admin privileges.</p>
      </div>
    );
  }

  /* ── State ── */
  const [admins,   setAdmins]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [confirm,  setConfirm]  = useState(null); // { id, email } for deactivation confirm

  /* Registration form */
  const [form,     setForm]     = useState({ email: '', password: '', displayName: '', role: 'admin' });
  const [formErr,  setFormErr]  = useState({});
  const [saving,   setSaving]   = useState(false);

  const pw = pwStrength(form.password);

	/* ── Load admins from admin_profiles ── */
	const load = useCallback(async () => {
	  setLoading(true);
	  const { data, error } = await sb
		.from('admin_profiles')
		.select('id, role, full_name, created_at, is_active') // Updated from display_name to full_name
		.order('created_at', { ascending: true });

	  if (error) {
		toast.error('Could not load admin list: ' + error.message);
	  } else {
		setAdmins(data || []);
	  }
	  setLoading(false);
	}, []);

  useEffect(() => { load(); }, [load]);

  /* ── Real-time: update list when admin_profiles changes ── */
  useEffect(() => {
    const ch = sb.channel('user-mgmt-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_profiles' }, () => load())
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [load]);

  /* ── Form helpers ── */
  const setF = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (formErr[k]) setFormErr((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      errs.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';
    return errs;
  };

  /* ── Register new admin ──────────────────────────────────────────────
   *
   * We use supabaseAdmin.auth.admin.createUser() (service role) so that
   * calling this endpoint does NOT sign in as the new user and does NOT
   * invalidate the current super_admin session.
   *
   * Flow:
   *   1. createUser — creates the Supabase Auth user
   *   2. insert into admin_profiles — grants admin access in the app
   *
   * If step 2 fails the Auth user is cleaned up with deleteUser to avoid
   * orphaned auth accounts with no matching profile.
   * ─────────────────────────────────────────────────────────────────── */
  const handleRegister = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    /* Guard: check the service role key is configured */
    if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      toast.error('VITE_SUPABASE_SERVICE_ROLE_KEY is not set in .env — see src/lib/supabaseAdmin.js');
      return;
    }

    setSaving(true);
    let newAuthUserId = null;

    try {
      /* Step 1: Create the Auth user */
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email:             form.email.trim(),
        password:          form.password,
        email_confirm:     true, // skip the confirmation email loop
        user_metadata:     { full_name: form.displayName.trim() || form.email.trim() },
      });

      if (authErr) throw new Error(`Auth error: ${authErr.message}`);
      newAuthUserId = authData.user.id;

      /* Step 2: Insert into admin_profiles */
      const { error: profileErr } = await sb
        .from('admin_profiles')
        .insert([{
          id:           newAuthUserId,
          role:         form.role,
          full_name: form.displayName.trim() || form.email.trim(),
          is_active:    true,
        }]);

      if (profileErr) {
        /* Roll back the auth user to avoid orphans */
        await supabaseAdmin.auth.admin.deleteUser(newAuthUserId);
        throw new Error(`Profile error: ${profileErr.message}`);
      }

      toast.success(`Admin account created for ${form.email.trim()}`);
      setForm({ email: '', password: '', displayName: '', role: 'admin' });
      setFormErr({});
    } catch (e) {
      toast.error(e.message || 'Failed to create admin account.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Soft-deactivate an admin ── */
  const handleDeactivate = async (id) => {
    const { error } = await sb
      .from('admin_profiles')
      .update({ is_active: false })
      .eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Admin account deactivated.');
    setConfirm(null);
    /* Note: this only prevents app-level access. To fully revoke,
       also block the user in Supabase Auth (Dashboard → Auth → Users
       or call supabaseAdmin.auth.admin.updateUserById). */
  };

  /* ── Role badge ── */
  const RoleBadge = ({ r }) => (
    <span style={{
      padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      background: r === 'super_admin' ? 'rgba(228,140,60,0.15)' : '#dbeafe',
      color:      r === 'super_admin' ? 'var(--c-caramel)'       : '#1d4ed8',
    }}>
      {r === 'super_admin' ? '👑 Super Admin' : 'Admin'}
    </span>
  );

  return (
    <div className="fade-up" style={{ padding: '32px 32px 48px' }}>

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="serif italic" style={{ fontSize: 36, color: 'var(--c-dark)', marginBottom: 4 }}>User Management</h1>
          <p style={{ color: 'var(--c-muted)', fontSize: 14 }}>
            {admins.length} admin account{admins.length !== 1 ? 's' : ''} — Super Admin only
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </div>

      {/* ── Security Warning Banner ─────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 14, padding: '14px 18px',
        borderRadius: 14, marginBottom: 28,
        background: '#fffbeb', border: '1.5px solid #fde68a',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚠</span>
        <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
          <strong>Security reminder:</strong> This page requires <code>VITE_SUPABASE_SERVICE_ROLE_KEY</code> in your <code>.env</code> file.
          That key bypasses all Row Level Security and grants full database access.{' '}
          <strong>Never commit it to a public repo.</strong>{' '}
          For production, move user creation to a Supabase Edge Function so the key is never shipped to the browser.
          Find it in:{' '}
          <strong>Supabase Dashboard → Settings → API → service_role (secret)</strong>.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* ══════════════════════════════
            Admin List
        ══════════════════════════════ */}
        <div className="flan-card" style={{ padding: 24, gridColumn: 'span 2' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)', marginBottom: 20 }}>
            Current Admins
          </h3>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 52, borderRadius: 12 }} />
              ))}
            </div>
          ) : admins.length === 0 ? (
            <p style={{ color: 'var(--c-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              No admin accounts found.
            </p>
          ) : (
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const isSelf   = a.id === currentUser?.id;
                    const isActive = a.is_active !== false; // treat null as active
                    return (
                      <tr key={a.id} style={{ opacity: isActive ? 1 : 0.5 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Avatar circle from initials */}
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: a.role === 'super_admin' ? 'rgba(228,140,60,0.2)' : '#dbeafe',
                              color: a.role === 'super_admin' ? 'var(--c-caramel)' : '#1d4ed8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 900, flexShrink: 0,
                            }}>
                              {(a.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-dark)' }}>
                                {a.full_name || '—'}
                              </p>
                              {isSelf && (
                                <p style={{ fontSize: 10, color: 'var(--c-caramel)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  You
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><RoleBadge r={a.role} /></td>
                        <td>
                          <span className={`badge ${isActive ? 'badge-ready' : 'badge-cancelled'}`}>
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--c-muted)' }}>{fmtDate(a.created_at)}</td>
                        <td>
                          {/* Cannot deactivate yourself or already inactive accounts */}
                          {!isSelf && isActive ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setConfirm({ id: a.id, email: a.full_name || a.id })}
                              title="Deactivate this admin"
                            >
                              <Icon name="x" size={13} /> Deactivate
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                              {isSelf ? '(current user)' : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            New Admin Registration Form
        ══════════════════════════════ */}
        <div className="flan-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-dark)', marginBottom: 4 }}>
            Register New Admin
          </h3>
          <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Uses <code>auth.admin.createUser</code> — your session is not affected.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Display Name (optional) */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>
                Display Name <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                value={form.displayName}
                onChange={(e) => setF('displayName', e.target.value)}
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
                placeholder="e.g. Jen Dela Cruz"
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setF('email', e.target.value)}
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: `1.5px solid ${formErr.email ? '#dc2626' : 'var(--c-border)'}`, color: 'var(--c-dark)' }}
                placeholder="newadmin@cravn.ph"
              />
              {formErr.email && (
                <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>{formErr.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>
                Temporary Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setF('password', e.target.value)}
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: `1.5px solid ${formErr.password ? '#dc2626' : 'var(--c-border)'}`, color: 'var(--c-dark)' }}
                placeholder="Min. 8 chars — upper, lower, number"
              />
              {/* Strength bar */}
              {form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 999, background: 'var(--c-stone)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: pw.color, width: `${pw.width}%`, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: pw.color, marginTop: 3 }}>{pw.label}</p>
                </div>
              )}
              {formErr.password && (
                <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>{formErr.password}</p>
              )}
              <p style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4 }}>
                Ask the new admin to change this password after their first login.
              </p>
            </div>

            {/* Role selector */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 8 }}>
                Role *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                      background: form.role === opt.value ? 'rgba(228,140,60,0.08)' : 'var(--c-oat)',
                      border: `1.5px solid ${form.role === opt.value ? 'var(--c-caramel)' : 'var(--c-border)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={form.role === opt.value}
                      onChange={() => setF('role', opt.value)}
                      style={{ marginTop: 2, accentColor: 'var(--c-caramel)' }}
                    />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)' }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              className="btn btn-caramel"
              style={{ marginTop: 4, padding: '13px', borderRadius: 14, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleRegister}
              disabled={saving}
            >
              {saving
                ? <><Spinner /> Creating account…</>
                : <><Icon name="plus" size={15} /> Create Admin Account</>
              }
            </button>
          </div>
        </div>

      </div>{/* end grid */}

      {/* ── Deactivation confirm modal ── */}
      {confirm && (
        <ConfirmModal
          danger
          title="Deactivate Admin?"
          message={`"${confirm.email}" will no longer be able to access the dashboard. You can re-activate them manually in the database.`}
          confirmLabel="Deactivate"
          onConfirm={() => handleDeactivate(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
