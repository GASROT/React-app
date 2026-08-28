import { useEffect, useSyncExternalStore } from 'react';

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartResponse,
} from '@/features/cart/api/cart.api';

type CartState = {
  cart: CartResponse | null;
  error: string | null;
  loading: boolean;
};

const emptyCart: CartResponse = {
  items: [],
  summary: {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
  },
};

let state: CartState = {
  cart: null,
  error: null,
  loading: false,
};

const listeners = new Set<() => void>();

function emit(next: Partial<CartState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

async function runCartAction(action: () => Promise<CartResponse>) {
  emit({ loading: true, error: null });

  try {
    const cart = await action();
    emit({ cart, loading: false, error: null });
    return cart;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar o carrinho.';
    emit({ loading: false, error: message });
    throw error;
  }
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!state.cart && !state.loading) {
      void loadCart();
    }
  }, []);

  return {
    ...snapshot,
    cart: snapshot.cart ?? emptyCart,
    loadCart,
    addProduct: (productId: string, quantity = 1) =>
      runCartAction(() => addCartItem(productId, quantity)),
    updateQuantity: (productId: string, quantity: number) =>
      runCartAction(() => updateCartItem(productId, quantity)),
    removeProduct: (productId: string) => runCartAction(() => removeCartItem(productId)),
    getQuantity: (productId: string) =>
      snapshot.cart?.items.find((item) => item.productId === productId)?.quantity ?? 0,
  };
}

export function loadCart() {
  return runCartAction(getCart);
}

export function replaceCart(cart: CartResponse) {
  emit({ cart, error: null, loading: false });
}
