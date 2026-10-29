import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const brands = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/brands' }),
  schema: z.object({
    name: z.string(),
    category: z.string(),
    principal: z.string().optional().default(''),
    description: z.string(),
    images: z.array(z.string()).min(1),
    order: z.number().default(99),
  }),
});

const principals = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/principals' }),
  schema: z.object({
    name: z.string(),
    image: z.string().optional(),
    order: z.number().default(99),
  }),
});

const clients = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/clients' }),
  schema: z.object({
    category: z.string(),
    names: z.array(z.string()),
    order: z.number().default(99),
  }),
});

export const collections = { brands, principals, clients };
