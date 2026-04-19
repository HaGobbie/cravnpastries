/**
 * CartContext.jsx
 *
 * Cart state is persisted to localStorage under the key 'cravn_cart_v1'.
 * On mount the cart is restored; on every change it is saved.
 * JSON parse errors (corrupted storage) are silently caught and the
 * cart starts fresh so the site never breaks on a bad storage value.
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

const STORAGE_KEY = 'cravn_cart_v1';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  /* ── Initialise from localStorage ── */
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /* ── Persist every change ── */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* localStorage full or unavailable — fail silently */
    }
  }, [cart]);

  /* ── Cart actions ── */
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.item.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart((prev) => prev.map((c) => c.item.id === id ? { ...c, qty } : c));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.qty * Number(c.item.price), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
