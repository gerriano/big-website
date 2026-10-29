import { getCollection } from 'astro:content';
import site from '../content/settings/site.json';
import home from '../content/pages/home.json';
import about from '../content/pages/about.json';

export { site, home, about };

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function getBrands() {
  return (await getCollection('brands')).sort(byOrder);
}

export async function getPrincipals() {
  return (await getCollection('principals')).sort(byOrder);
}

export async function getClients() {
  return (await getCollection('clients')).sort(byOrder);
}

// Distribution coverage as stated in the company profile.
export const regions = [
  { id: 'sumatera', name: 'Sumatera' },
  { id: 'jawa', name: 'Jawa' },
  { id: 'bali', name: 'Bali' },
  { id: 'kalimantan', name: 'Kalimantan' },
  { id: 'sulawesi', name: 'Sulawesi' },
  { id: 'papua', name: 'Papua' },
] as const;
