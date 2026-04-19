import { useState, useEffect, useCallback } from 'react';
import { supabase as sb }       from '../../lib/supabase';
import { AdminContext }         from '../../lib/AdminContext';
import { Spinner }              from './Shared';
import { toast, ToastContainer } from './Toast';
import LoginPage                from './LoginPage';
import Sidebar                  from './Sidebar';
import Dashboard                from './Dashboard';
import AnalyticsPage            from './AnalyticsPage';
import DessertsPage             from './DessertsPage';
import InventoryPage            from './InventoryPage';
import OrdersPage               from './OrdersPage';
import UserManagementPage       from './UserManagementPage';

const LOW_STOCK_THRESHOLD = 5;

const HamburgerIcon = ({ open }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {open
      ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
      : <><line x1="3" y1="6"  x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
    }
  </svg>
);

const App = () => {
  /*
   * user      – Supabase Auth user object | null | undefined (loading)
   * role      – 'admin' | 'super_admin' | null
   * Stored separately so AdminContext.Provider always has fresh values.
   */
  const [user,          setUser]          = useState(undefined);
  const [role,          setRole]          = useState(null);
  const [page,          setPage]          = useState('dashboard');
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const addNewOrders = useCallback((n) => setNewOrderCount((p) => p + n), []);

  /* ── Session: now fetches `role` alongside `id` ── */
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        sb.from('admin_profiles')
          .select('id, role')
          .eq('id', data.session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser(data.session.user);
              setRole(profile.role ?? 'admin');
            } else {
              sb.auth.signOut();
              setUser(null);
              setRole(null);
            }
          });
      } else {
        setUser(null);
        setRole(null);
      }
    });

    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setRole(null); }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  /* ── Stock + order real-time notifications ── */
  const checkLowStock = useCallback(async () => {
    const { data } = await sb
      .from('inventory')
      .select('stock, dessert_id, desserts(name)')
      .lt('stock', LOW_STOCK_THRESHOLD)
      .order('stock', { ascending: true });
    (data || []).forEach((item) => {
      const name = item.desserts?.name || 'Unknown Item';
      toast.critical(
        item.stock === 0
          ? `🚨 OUT OF STOCK: "${name}" — restock immediately!`
          : `⚠ Low Stock: "${name}" — only ${item.stock} unit${item.stock === 1 ? '' : 's'} left`
      );
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    checkLowStock();
    const stockCh = sb.channel('admin-stock-monitor')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inventory' },
        async ({ new: row }) => {
          if (row.stock < LOW_STOCK_THRESHOLD) {
            const { data: d } = await sb.from('desserts').select('name').eq('id', row.dessert_id).single();
            const name = d?.name || 'Unknown Item';
            toast.critical(row.stock === 0
              ? `🚨 OUT OF STOCK: "${name}" — restock immediately!`
              : `⚠ Low Stock: "${name}" — ${row.stock} left`
            );
          }
        })
      .subscribe();
    const orderCh = sb.channel('admin-order-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        setNewOrderCount((p) => p + 1);
        toast.info('🛎 New order received!');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, ({ new: row }) => {
        if (row.status === 'cancelled') toast.error(`Order #${row.id.split('-')[0].toUpperCase()} was cancelled`);
      })
      .subscribe();
    return () => { sb.removeChannel(stockCh); sb.removeChannel(orderCh); };
  }, [user, checkLowStock]);

  /* ── Loading / login ── */
  if (user === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-cream)' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner large />
        <p style={{ marginTop: 12, color: 'var(--c-muted)', fontSize: 13 }}>Checking session…</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={(u, r) => { setUser(u); setRole(r); }} />;

  const handleLogout = async () => {
    await sb.auth.signOut();
    setUser(null); setRole(null);
    toast.info('Signed out.');
  };

  /*
   * Security gate — fires whether navigation comes from the sidebar,
   * a programmatic call, or any other in-app source.
   *
   * Because this is a state-based SPA (no URL routing), "direct URL
   * access" is handled here: if anything tries to set page='users'
   * and the current user is not super_admin, we block it, fire an
   * error toast, and fall back to the dashboard.
   *
   * If you later add React Router, mirror this check in a
   * <ProtectedRoute requiredRole="super_admin"> component.
   */
  const handleSetPage = (p) => {
    if (p === 'users' && role !== 'super_admin') {
      toast.error('Super Admin access required.');
      setPage('dashboard');
      setSidebarOpen(false);
      return;
    }
    if (p === 'orders') setNewOrderCount(0);
    setPage(p);
    setSidebarOpen(false);
  };

  /* Render UserManagementPage only when the role actually matches.
     This is a second defensive layer — even if handleSetPage's gate
     were somehow bypassed, the page itself would not mount. */
  const pages = {
    dashboard: <Dashboard       setPage={handleSetPage} />,
    analytics: <AnalyticsPage />,
    desserts:  <DessertsPage />,
    inventory: <InventoryPage />,
    orders:    <OrdersPage      onNewOrderCount={addNewOrders} />,
    users:     role === 'super_admin' ? <UserManagementPage /> : null,
  };

  return (
    <AdminContext.Provider value={{ user, role }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <button className="hamburger-btn" onClick={() => setSidebarOpen((p) => !p)} aria-label="Toggle menu">
          <HamburgerIcon open={sidebarOpen} />
        </button>
        <Sidebar
          page={page}
          setPage={handleSetPage}
          user={user}
          role={role}
          onLogout={handleLogout}
          newOrderCount={newOrderCount}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--c-cream)' }}>
          {pages[page] ?? pages.dashboard}
        </main>
        <ToastContainer />
      </div>
    </AdminContext.Provider>
  );
};

export default App;
