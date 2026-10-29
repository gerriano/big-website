// Generates src/data/indonesia-map.json: SVG paths of Indonesia grouped per region,
// plus projected positions for hubs and region labels. Run: npm run build:map
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoMercator, geoPath, geoCentroid } from 'd3-geo';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const countries = feature(topo, topo.objects.countries);
const indonesia = countries.features.find((f) => f.properties.name === 'Indonesia');

const WIDTH = 1000;
const HEIGHT = 380;
const projection = geoMercator().fitExtent([[10, 10], [WIDTH - 10, HEIGHT - 10]], indonesia);
const path = geoPath(projection);

function regionOf([lon, lat]) {
  if (lon >= 105 && lon < 114.4 && lat < -5.4) return 'jawa';
  if (lon >= 114.4 && lon < 115.75 && lat < -7.9) return 'bali';
  if (lon < 109 && lat > -5.4) return 'sumatera';
  if (lon >= 108.5 && lon < 118.6 && lat > -4.6) return 'kalimantan';
  if (lon >= 118.6 && lon < 126 && lat > -7.4 && lat < 5) return 'sulawesi';
  if ((lon >= 130.8 && lat > -4.5) || lon >= 136) return 'papua';
  if (lat < -7.4 && lon < 127.5) return 'nusatenggara';
  return 'maluku';
}

const groups = {};
for (const polygon of indonesia.geometry.coordinates) {
  const f = { type: 'Feature', geometry: { type: 'Polygon', coordinates: polygon } };
  const region = regionOf(geoCentroid(f));
  (groups[region] ??= []).push(path(f));
}

const round = (d) => d.replace(/(\d+\.\d{2})\d+/g, '$1');
const p = (lon, lat) => projection([lon, lat]).map((n) => Math.round(n * 10) / 10);

const out = {
  width: WIDTH,
  height: HEIGHT,
  regions: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, round(v.join(''))])),
  // Approximate visual centre of each region, used for labels and route endpoints.
  anchors: {
    sumatera: p(101.5, 0.2),
    jawa: p(110.2, -7.3),
    bali: p(115.15, -8.4),
    kalimantan: p(114.2, 0.3),
    sulawesi: p(120.6, -2.2),
    papua: p(138.2, -4.3),
  },
  hubs: {
    jakarta: p(106.77, -6.19),
    surabaya: p(112.75, -7.29),
  },
};

writeFileSync(new URL('../src/data/indonesia-map.json', import.meta.url), JSON.stringify(out));
console.log('regions:', Object.keys(out.regions).map((k) => `${k}(${groups[k].length})`).join(', '));
