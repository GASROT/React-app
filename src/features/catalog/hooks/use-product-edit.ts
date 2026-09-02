import { useEffect, useState, useSyncExternalStore } from 'react';

import { getProduct } from '@/features/catalog/api/catalog.api';
import type { Product } from '@/features/catalog/data/products';
import {
  productEditSchema,
  type ProductEditFormValues,
} from '@/features/catalog/schemas/product-edit.schema';
import { updateAdminProduct } from '@/shared/services/api/admin-api';
import { getApiErrorMessage } from '@/shared/services/api/api-client';
import { getCurrentUser, subscribeAuth } from '@/shared/services/api/auth-api';

export type ProductEditErrors = Partial<Record<keyof ProductEditFormValues, string>>;

export function useProductEdit(productId?: string) {
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser, getCurrentUser);
  const [loadResult, setLoadResult] = useState<{
    productId: string;
    product: Product | null;
    error: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const authorized = user?.role === 'ADMIN';

  useEffect(() => {
    let mounted = true;

    if (!authorized || !productId) {
      return undefined;
    }

    getProduct(productId)
      .then((response) => {
        if (!mounted) return;
        setLoadResult({ productId, product: response, error: null });
      })
      .catch(() => {
        if (!mounted) return;
        setLoadResult({
          productId,
          product: null,
          error: 'Nao foi possivel carregar o produto.',
        });
      });

    return () => {
      mounted = false;
    };
  }, [authorized, productId]);

  async function save(values: ProductEditFormValues) {
    if (!authorized || !productId) {
      return { ok: false as const, message: 'Acesso restrito ao administrador.', errors: {} };
    }

    const parsed = productEditSchema.safeParse(values);
    if (!parsed.success) {
      const errors: ProductEditErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProductEditFormValues | undefined;
        if (field && !errors[field]) errors[field] = issue.message;
      });

      const messages = [...new Set(parsed.error.issues.map((issue) => issue.message))];
      return { ok: false as const, message: messages.join('\n'), errors };
    }

    setSaving(true);
    try {
      const updatedProduct = await updateAdminProduct(productId, parsed.data);
      setLoadResult({ productId, product: updatedProduct, error: null });
      return { ok: true as const, product: updatedProduct, errors: {} };
    } catch (error) {
      return {
        ok: false as const,
        message: getApiErrorMessage(error),
        errors: {},
      };
    } finally {
      setSaving(false);
    }
  }

  const currentResult = loadResult?.productId === productId ? loadResult : null;

  return {
    authorized,
    loadError: currentResult?.error ?? null,
    loading: Boolean(authorized && productId && !currentResult),
    product: currentResult?.product ?? null,
    save,
    saving,
    user,
  };
}
