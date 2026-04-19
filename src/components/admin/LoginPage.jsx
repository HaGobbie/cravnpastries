/**
 * LoginPage.jsx
 *
 * Changes from original:
 *   • admin_profiles query now selects `id, role` instead of just `id`
 *   • onLogin callback receives (user, role) so App.jsx can store the
 *     role in state without a second query after the redirect
 */

import { useState } from 'react';
import { supabase as sb } from '../../lib/supabase';
import { LOGO_URL }       from '../../lib/constants';
import { Icon, Spinner }  from './Shared';

const LoginPage = ({ onLogin }) => {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');

    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setLoading(false); return; }

    /* Fetch id AND role in a single query */
    const { data: profile } = await sb
      .from('admin_profiles')
      .select('id, role')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      await sb.auth.signOut();
      setErr('Access denied. Not an admin account.');
      setLoading(false);
      return;
    }

    /* Pass both the Auth user object and the role back to App */
    onLogin(data.user, profile.role ?? 'admin');
    setLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="w-full" style={{ maxWidth: 440, padding: '0 20px' }}>
        <div className="text-center mb-8 fade-in">
          <img src={LOGO_URL} alt="Cravn"
            style={{ height: 64, margin: '0 auto 16px', display: 'block', filter: 'drop-shadow(0 4px 12px rgba(228,140,60,0.25))' }} />
          <p className="fredoka text-3xl" style={{ color: 'var(--c-caramel)', marginBottom: 4 }}>Cravn</p>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--c-muted)' }}>Admin Dashboard</p>
        </div>

        <div className="flan-card p-8 fade-up">
          <h2 className="serif italic text-3xl mb-1" style={{ color: 'var(--c-dark)' }}>Welcome back</h2>
          <p className="text-sm mb-7" style={{ color: 'var(--c-muted)' }}>Sign in to manage your bakeshop.</p>

          {err && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Icon name="warning" size={14} />{err}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
                placeholder="admin@cravn.ph"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                required
                className="flan-input w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--c-oat)', border: '1.5px solid var(--c-border)', color: 'var(--c-dark)' }}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-caramel w-full" disabled={loading} style={{ marginTop: 4, padding: '14px' }}>
              {loading ? <><Spinner /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
