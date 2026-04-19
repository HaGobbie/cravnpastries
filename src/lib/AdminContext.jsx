/**
 * AdminContext.jsx
 *
 * Provides { user, role } to the entire admin application without
 * prop-drilling through every component.
 *
 * role is one of:
 *   'admin'       – regular admin: full CRUD on orders/desserts/inventory
 *   'super_admin' – all of the above + User Management page
 *   null          – not yet fetched (loading) or not authenticated
 *
 * Usage in any child component:
 *   import { useAdmin } from '../../lib/AdminContext';
 *   const { user, role } = useAdmin();
 *   const isSuperAdmin = role === 'super_admin';
 */

import { createContext, useContext } from 'react';

export const AdminContext = createContext({
  user: null,
  role: null,
});

export const useAdmin = () => useContext(AdminContext);
