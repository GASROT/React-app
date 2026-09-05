import { useEffect, useSyncExternalStore } from 'react';

import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartResponse,
} from '@/features/cart/api/cart.api';
import type { Product } from '@/features/catalog/data/products';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';

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

// Carrinho de quem ainda nao fez login: guardado so em memoria neste dispositivo,
// nunca chega ao backend. Ao autenticar, esses itens sobem para o carrinho do usuario.
const localItems = new Map<string, { product: Product; quantity: number }>();

function computeLocalCart(): CartResponse {
  const items = Array.from(localItems.values()).map(({ product, quantity }) => ({
    productId: product.id,
    quantity,
    product,
    lineTotal: product.price * quantity,
    warning: product.stock < quantity ? 'Estoque alterado desde a inclusao.' : null,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = subtotal * 0.1;
  const shipping = subtotal > 0 && subtotal < 500 ? 34.5 : 0;

  return {
    items,
    summary: { subtotal, discount, shipping, total: subtotal - discount + shipping },
  };
}

function isAuthenticated() {
  return Boolean(getCurrentUser());
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

function addLocalItem(product: Product, quantity: number) {
  const current = localItems.get(product.id);
  localItems.set(product.id, { product, quantity: (current?.quantity ?? 0) + quantity });
  const cart = computeLocalCart();
  emit({ cart, error: null, loading: false });
  return cart;
}

function updateLocalItem(productId: string, quantity: number) {
  const current = localItems.get(productId);
  if (current) {
    localItems.set(productId, { ...current, quantity });
  }
  const cart = computeLocalCart();
  emit({ cart, error: null, loading: false });
  return cart;
}

function removeLocalItem(productId: string) {
  localItems.delete(productId);
  const cart = computeLocalCart();
  emit({ cart, error: null, loading: false });
  return cart;
}

// Ao logar/registrar com itens pendentes no carrinho local, sobe cada um para o
// carrinho do usuario no backend antes de carregar o carrinho definitivo.
async function syncLocalCartToBackend() {
  const pending = Array.from(localItems.values());
  localItems.clear();

  for (const { product, quantity } of pending) {
    try {
      await addCartItem(product.id, quantity);
    } catch {
      // Se um item nao puder ser adicionado (ex.: sem estoque), os demais continuam subindo.
    }
  }

  await loadCart();
}

let wasAuthenticated = isAuthenticated();
subscribeAuth(() => {
  const authenticated = isAuthenticated();

  if (authenticated && !wasAuthenticated) {
    void syncLocalCartToBackend();
  } else if (!authenticated && wasAuthenticated) {
    localItems.clear();
    emit({ cart: emptyCart, error: null, loading: false });
  }

  wasAuthenticated = authenticated;
});

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
    addProduct: (product: Product, quantity = 1) =>
      isAuthenticated()
        ? runCartAction(() => addCartItem(product.id, quantity))
        : Promise.resolve(addLocalItem(product, quantity)),
    updateQuantity: (productId: string, quantity: number) =>
      isAuthenticated()
        ? runCartAction(() => updateCartItem(productId, quantity))
        : Promise.resolve(updateLocalItem(productId, quantity)),
    removeProduct: (productId: string) =>
      isAuthenticated()
        ? runCartAction(() => removeCartItem(productId))
        : Promise.resolve(removeLocalItem(productId)),
    getQuantity: (productId: string) =>
      snapshot.cart?.items.find((item) => item.productId === productId)?.quantity ?? 0,
  };
}

export function loadCart() {
  if (!isAuthenticated()) {
    const cart = computeLocalCart();
    emit({ cart, error: null, loading: false });
    return Promise.resolve(cart);
  }

  return runCartAction(getCart);
}

export function replaceCart(cart: CartResponse) {
  emit({ cart, error: null, loading: false });
}
