import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart_items') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  function addToCart(product, variant, quantity = 1) {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === variant.id);
      if (existing) {
        return prev.map(i =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          variantId:   variant.id,
          productId:   product.id,
          productName: product.name,
          imageUrl:    product.image_url,
          size:        variant.size,
          price:       product.price,
          quantity,
        },
      ];
    });
  }

  function removeFromCart(variantId) {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  }

  function updateQuantity(variantId, quantity) {
    if (quantity < 1) { removeFromCart(variantId); return; }
    setItems(prev =>
      prev.map(i => i.variantId === variantId ? { ...i, quantity } : i)
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
