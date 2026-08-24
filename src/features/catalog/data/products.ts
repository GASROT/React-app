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
  unit: string;
  packageSize: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  minMultiple?: number;
  dosage: string;
  description: string;
  application: string;
  technicalSheetUrl: string;
  wholesalePrice?: number;
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

export const products: Product[] = [
  {
    id: 'ureia-46-50kg',
    name: 'Ureia Granulada 46% N',
    manufacturer: 'Yara Brasil',
    sku: 'AGR-FER-URE-50',
    category: 'fertilizante',
    subcategory: 'Nitrogenado',
    npk: '46-0-0',
    unit: 'sc',
    packageSize: 'Saco 50kg',
    price: 138.9,
    oldPrice: 178,
    rating: 4.3,
    reviews: 218,
    stock: 847,
    minMultiple: 1,
    dosage: '80 a 250 kg/ha conforme cultura e analise de solo',
    description: 'Fonte concentrada de nitrogenio para cobertura e arranque vegetativo.',
    application: 'Aplicar em solo com umidade adequada e incorporar quando recomendado.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/ureia-46.pdf',
    wholesalePrice: 129.9,
    marker: 'N',
  },
  {
    id: 'superfosfato-50kg',
    name: 'Superfosfato Simples',
    manufacturer: 'Mosaic',
    sku: 'AGR-FER-SFS-50',
    category: 'fertilizante',
    subcategory: 'Fosfatado',
    npk: '0-18-0',
    unit: 'sc',
    packageSize: 'Saco 50kg',
    price: 74.9,
    oldPrice: 88,
    rating: 4.6,
    reviews: 132,
    stock: 41,
    dosage: '150 a 450 kg/ha conforme extracao da cultura',
    description: 'Fertilizante fosfatado com calcio e enxofre para correcao nutricional.',
    application: 'Usar preferencialmente no sulco de plantio ou em pre-plantio.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/superfosfato-simples.pdf',
    wholesalePrice: 70.9,
    marker: 'P',
  },
  {
    id: 'map-25kg',
    name: 'MAP Fosfato Monoamonico',
    manufacturer: 'Heringer',
    sku: 'AGR-FER-MAP-25',
    category: 'fertilizante',
    subcategory: 'Fosfatado',
    npk: '11-52-0',
    unit: 'sc',
    packageSize: 'Saco 25kg',
    price: 129,
    rating: 4.8,
    reviews: 96,
    stock: 12,
    dosage: '70 a 220 kg/ha no plantio',
    description: 'Alta concentracao de fosforo com nitrogenio amoniacal.',
    application: 'Indicado para plantio de graos e culturas de alta demanda inicial.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/map-11-52.pdf',
    wholesalePrice: 121,
    marker: 'MAP',
  },
  {
    id: 'kcl-50kg',
    name: 'KCL Cloreto de Potassio',
    manufacturer: 'Vale Fertilizantes',
    sku: 'AGR-FER-KCL-50',
    category: 'fertilizante',
    subcategory: 'Potassico',
    npk: '0-0-60',
    unit: 'sc',
    packageSize: 'Saco 50kg',
    price: 119.9,
    rating: 4.1,
    reviews: 74,
    stock: 0,
    dosage: '60 a 180 kg/ha conforme potassio disponivel',
    description: 'Fonte padrao de potassio para manutencao e reposicao de nutrientes.',
    application: 'Aplicar em cobertura ou pre-plantio conforme recomendacao tecnica.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/kcl-60.pdf',
    wholesalePrice: 112,
    marker: 'K',
  },
  {
    id: 'fungicida-iv-5l',
    name: 'Fungicida Foliar Classe IV',
    manufacturer: 'CropShield',
    sku: 'AGR-DEF-FUN-05',
    category: 'defensivo',
    subcategory: 'Fungicida',
    unit: 'L',
    packageSize: 'Galao 5L',
    price: 249.9,
    rating: 4.2,
    reviews: 51,
    stock: 8,
    mapa: 'SP-004581/2026',
    toxicClass: 'IV',
    dosage: '0,4 a 0,8 L/ha',
    description: 'Defensivo registrado no MAPA para manejo preventivo de doencas foliares.',
    application: 'Aplicar com EPI completo e seguir receituario agronomico.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/fungicida-iv.pdf',
    marker: 'IV',
  },
  {
    id: 'inseticida-classe-ii',
    name: 'Inseticida Sistemico Classe II',
    manufacturer: 'BioCrop',
    sku: 'AGR-DEF-INS-01',
    category: 'defensivo',
    subcategory: 'Inseticida',
    unit: 'L',
    packageSize: 'Frasco 1L',
    price: 189.9,
    rating: 4.0,
    reviews: 27,
    stock: 19,
    mapa: 'BR-009812/2026',
    toxicClass: 'II',
    requiresAgronomistCpf: true,
    dosage: '0,2 a 0,6 L/ha',
    description: 'Produto de uso controlado, condicionado a responsavel tecnico validado.',
    application: 'Venda bloqueada sem CPF/CREA de engenheiro agronomo responsavel.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/inseticida-classe-ii.pdf',
    marker: 'II',
  },
  {
    id: 'milho-hibrido',
    name: 'Semente Milho Hibrido AGX',
    manufacturer: 'AgroGen',
    sku: 'AGR-SEM-MIL-60K',
    category: 'semente',
    subcategory: 'Graos',
    unit: 'sc',
    packageSize: '60 mil sementes',
    price: 489.9,
    oldPrice: 529.9,
    rating: 4.9,
    reviews: 303,
    stock: 64,
    dosage: '55 a 65 mil sementes/ha',
    description: 'Hibrido de alto teto produtivo para safra e safrinha.',
    application: 'Regular populacao conforme altitude, fertilidade e regime hidrico.',
    technicalSheetUrl: 'https://cdn.agroshop.local/fichas/milho-hibrido-agx.pdf',
    wholesalePrice: 465,
    marker: 'S',
  },
];

export const featuredProduct = products[0];
export const featuredBanners = [
  {
    id: 'banner-ureia',
    title: 'Ureia 46% N',
    subtitle: 'Saco 50kg - Yara Brasil - frete gratis acima de R$ 500',
    product: products[0],
    tag: '-22%',
  },
  {
    id: 'banner-milho',
    title: 'Sementes para safra 2026',
    subtitle: 'Hibridos AGX com disponibilidade sazonal controlada',
    product: products[6],
    tag: '-8%',
  },
  {
    id: 'banner-defensivos',
    title: 'Defensivos com registro MAPA',
    subtitle: 'Filtros por classe toxicologica e compra com regra tecnica',
    product: products[4],
    tag: 'MAPA',
  },
];
export const cartPreview = [
  { product: products[0], quantity: 2 },
  { product: products[1], quantity: 1 },
  { product: products[3], quantity: 3 },
];
