import type { Product } from '@/features/catalog/data/products';
import { apiRequest } from '@/shared/services/api/api-client';

export type ProductListResponse = {
  data: Product[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
};

export type FeaturedBanner = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  discountLabel: string;
  productId: string;
  priority: number;
  product: Product;
};

export type ProductListParams = {
  search?: string;
  category?: Product['category'];
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  available?: boolean;
  limit?: number;
};

export function listProducts(params: ProductListParams = {}) {
  const query = [
    ['search', params.search],
    ['category', params.category],
    ['sort', params.sort],
    ['available', params.available === undefined ? undefined : String(params.available)],
    ['limit', String(params.limit ?? 50)],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  return apiRequest<ProductListResponse>(`/catalog/products?${query}`);
}

export function getProduct(id: string) {
  return apiRequest<Product>(`/catalog/products/${encodeURIComponent(id)}`);
}

export function getFeaturedBanners() {
  return apiRequest<FeaturedBanner[]>('/catalog/featured-banners');
}
