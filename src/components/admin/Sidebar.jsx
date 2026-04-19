/**
 * Sidebar.jsx
 *
 * Changes from original:
 *   • Accepts a new `role` prop ('admin' | 'super_admin')
 *   • "User Management" nav item is rendered only when role === 'super_admin'
 *   • User card at the bottom now shows the role label with appropriate
 *     colour coding (gold crown for super_admin, muted for admin)
 */

import { LOGO_URL, ADMIN_CONFIG } from '../../lib/constants';
import { Icon }                    from './Shared';

/* Role display config */
const ROLE_DISPLAY = {
  super_admin: { label: '👑 Super Admin', color: 'var(--c-caramel)' },
  admin:       { label: 'Admin',           color: 'rgba(253,245,228,0.3)' },
};

const Sidebar = ({ page, setPage, user, role, onLogout, newOrderCount, isOpen, onClose }) => {
  const roleDisplay = ROLE_DISPLAY[role] ?? ROLE_DISPLAY.admin;
  const isSuperAdmin = role === 'super_admin';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside
        className={`sidebar-scroll sidebar-drawer ${isOpen ? 'open' : ''}`}
        style={{
          width: 220, background: 'var(--s-bg)',
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0,
          overflowY: 'auto', flexShrink: 0,
        }}
      >
        {/* ── Logo ── */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={LOGO_URL} alt="Cravn"
              style={{ height: 36, borderRadius: 8, filter: 'drop-shadow(0 2px 6px rgba(228,140,60,0.45)) brightness(1.08) saturate(1.1)' }}
            />
            <div>
              <p className="fredoka" style={{ color: 'var(--c-caramel)', fontSize: 18, lineHeight: 1 }}>Cravn</p>
              <p style={{ fontSize: 9, color: 'rgba(253,245,228,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Admin</p>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {/* Regular nav items from ADMIN_CONFIG (dashboard, orders, desserts, inventory, analytics) */}
          {ADMIN_CONFIG.nav.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${page === n.key ? 'active' : ''}`}
              onClick={() => { setPage(n.key); onClose(); }}
              style={{ position: 'relative', marginBottom: 2 }}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
              {n.key === 'orders' && newOrderCount > 0 && (
                <span className="sidebar-badge">{newOrderCount > 99 ? '99+' : newOrderCount}</span>
              )}
            </button>
          ))}

          {/* ── Super Admin exclusive: User Management ──────────────────
           *  This item is only rendered when role === 'super_admin'.
           *  Regular admins never see it in the UI. The navigation gate
           *  in App.jsx provides a second layer if someone somehow calls
           *  setPage('users') programmatically.
           * ─────────────────────────────────────────────────────────── */}
          {isSuperAdmin && (
            <>
              {/* Subtle divider before the privileged section */}
              <div style={{
                margin: '12px 8px 8px',
                borderTop: '1px solid rgba(228,140,60,0.12)',
              }} />
              <p style={{
                fontSize: 9, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(228,140,60,0.45)',
                padding: '0 8px 6px',
              }}>
                Super Admin
              </p>
              <button
                className={`nav-item ${page === 'users' ? 'active' : ''}`}
                onClick={() => { setPage('users'); onClose(); }}
                style={{ position: 'relative', marginBottom: 2 }}
              >
                <Icon name="users" size={16} />
                User Management
              </button>
            </>
          )}
        </nav>

        {/* ── User card + logout ── */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--s-text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
            {/* Role badge — gold for super_admin, muted for admin */}
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginTop: 2, color: roleDisplay.color }}>
              {roleDisplay.label}
            </p>
          </div>
          <button className="nav-item" onClick={onLogout}>
            <Icon name="logout" size={16} />Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
