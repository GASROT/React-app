import { z } from 'zod';

const requiredText = (label: string, minimum = 1) =>
  z.string().trim().min(minimum, `${label} deve ter pelo menos ${minimum} caracteres.`);

const requiredNumber = (label: string, minimum = 0) =>
  z
    .string()
    .trim()
    .min(1, `${label} e obrigatorio.`)
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= minimum, {
      message: `${label} deve ser maior ou igual a ${minimum}.`,
    })
    .transform(Number);

const optionalNumber = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), {
      message: `${label} deve ser um numero maior ou igual a zero.`,
    })
    .transform((value) => (value === '' ? null : Number(value)));

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value));

const httpUrl = (label: string) =>
  z
    .string()
    .trim()
    .url(`${label} deve ser uma URL valida.`)
    .refine((value) => /^https?:\/\//i.test(value), `${label} deve usar HTTP ou HTTPS.`);

const optionalHttpUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/[^\s]+$/i.test(value), {
    message: 'A imagem deve ser uma URL HTTP ou HTTPS valida.',
  })
  .transform((value) => (value === '' ? undefined : value));

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Use o formato AAAA-MM-DD.',
  })
  .transform((value) => (value === '' ? null : value));

export const productEditSchema = z
  .object({
    name: requiredText('Nome', 3),
    manufacturer: requiredText('Fabricante', 2),
    sku: requiredText('SKU', 3),
    category: z.enum([
      'fertilizante',
      'defensivo',
      'semente',
      'irrigacao',
      'maquinario',
      'nutricao',
    ]),
    subcategory: requiredText('Subcategoria'),
    npk: optionalText,
    dosage: requiredText('Dosagem'),
    unit: z.enum(['kg', 'L', 'sc', 'un']),
    packageSize: requiredText('Embalagem'),
    price: requiredNumber('Preco'),
    oldPrice: optionalNumber('Preco anterior'),
    pmf: optionalNumber('PMF'),
    wholesalePrice: optionalNumber('Preco de atacado'),
    stock: requiredNumber('Estoque').refine(Number.isInteger, 'Estoque deve ser inteiro.'),
    minMultiple: requiredNumber('Multiplo minimo', 1).refine(
      Number.isInteger,
      'Multiplo minimo deve ser inteiro.',
    ),
    mapa: optionalText,
    toxicClass: z
      .string()
      .trim()
      .refine((value) => value === '' || ['I', 'II', 'III', 'IV'].includes(value), {
        message: 'Classe toxicologica deve ser I, II, III ou IV.',
      })
      .transform((value) => (value === '' ? null : (value as 'I' | 'II' | 'III' | 'IV'))),
    requiresAgronomistCpf: z.boolean(),
    technicalSheetUrl: httpUrl('Ficha tecnica'),
    seasonalStartsAt: optionalDate,
    seasonalEndsAt: optionalDate,
    description: requiredText('Descricao'),
    application: requiredText('Aplicacao'),
    marker: requiredText('Marcador'),
    imageUrl: optionalHttpUrl,
  })
  .superRefine((value, context) => {
    if (value.pmf !== null && value.price < value.pmf) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Preco nao pode ser inferior ao PMF.',
      });
    }

    if ((value.toxicClass === 'I' || value.toxicClass === 'II') && !value.requiresAgronomistCpf) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requiresAgronomistCpf'],
        message: 'Classes I e II exigem responsavel agronomo.',
      });
    }

    if (
      value.seasonalStartsAt &&
      value.seasonalEndsAt &&
      value.seasonalStartsAt > value.seasonalEndsAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seasonalEndsAt'],
        message: 'Fim sazonal deve ser posterior ao inicio.',
      });
    }
  });

export type ProductEditFormValues = z.input<typeof productEditSchema>;
