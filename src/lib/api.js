import { supabase } from './supabase';

/**
 * Fetches all data required by the admin Dashboard in a single
 * parallel round-trip using Promise.all.
 *
 * Returns:
 *   totalOrders   – total order count (number)
 *   pendingOrders – pending order count (number)
 *   orders        – 5 most-recent orders for the "Recent Orders" table
 *   desserts      – every dessert (id + is_available) for stat cards
 *   inventory     – every inventory row (stock) for total-stock stat
 */
export const fetchAdminData = async () => {
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { data: orders },
    { data: desserts },
    { data: inventory },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('id,total_price,status,payment_status,guest_name,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('desserts')
      .select('id,is_available'),
    supabase
      .from('inventory')
      .select('stock'),
  ]);

  return {
    totalOrders:   totalOrders   ?? 0,
    pendingOrders: pendingOrders ?? 0,
    orders:        orders        ?? [],
    desserts:      desserts      ?? [],
    inventory:     inventory     ?? [],
  };
};
