export type ProductCategory =
  | 'fertilizante'
  | 'defensivo'
  | 'semente'
  | 'irrigacao'
  | 'maquinario'
  | 'nutricao';

export type Product = {
  id: string;
  name: string;
  manufacturer: string;
  sku: string;
  category: ProductCategory;
  subcategory: string;
  npk?: string;
  unit: 'kg' | 'L' | 'sc' | 'un';
  packageSize: string;
  price: number;
  oldPrice?: number;
  pmf?: number;
  rating: number;
  reviews: number;
  stock: number;
  minMultiple?: number;
  dosage: string;
  description: string;
  application: string;
  technicalSheetUrl: string;
  seasonalStartsAt?: string;
  seasonalEndsAt?: string;
  wholesalePrice?: number;
  media: {
    id: string;
    type: 'image' | 'video';
    title: string;
    url?: string;
  }[];
  mapa?: string;
  toxicClass?: 'I' | 'II' | 'III' | 'IV';
  requiresAgronomistCpf?: boolean;
  marker: string;
};

export const categoryLabels: Record<ProductCategory, string> = {
  fertilizante: 'Fertilizante',
  defensivo: 'Defensivo',
  semente: 'Semente',
  irrigacao: 'Irrigacao',
  maquinario: 'Maquinario',
  nutricao: 'Nutricao',
};
