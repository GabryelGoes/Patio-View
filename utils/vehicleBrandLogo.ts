/** Marcas com arquivo em /public/brands/{slug}.png (mesmos arquivos do Sistema-Completo2). */
export const VEHICLE_BRAND_LOGO_SLUGS = [
  'amg', 'audi', 'bmw', 'byd', 'chery', 'chevrolet', 'citroen', 'dodge', 'ferrari', 'fiat',
  'ford', 'geely', 'gm', 'gwm', 'honda', 'hummer', 'hyundai', 'iveco', 'jeep', 'kia', 'lamborghini',
  'land-rover', 'lifan', 'mercedes-benz', 'mini', 'mitsubishi', 'nissan', 'peugeot',
  'porsche', 'ram', 'renault', 'subaru', 'suzuki', 'tesla', 'toyota', 'volkswagen', 'volvo', 'yamaha',
] as const;

export type VehicleBrandLogoSlug = (typeof VEHICLE_BRAND_LOGO_SLUGS)[number];

const BRAND_ALIASES: Record<string, VehicleBrandLogoSlug> = {
  amg: 'amg',
  'mercedes amg': 'amg',
  'mercedes-amg': 'amg',
  audi: 'audi',
  bmw: 'bmw',
  byd: 'byd',
  chery: 'chery',
  'caoa chery': 'chery',
  chevrolet: 'chevrolet',
  chevy: 'chevrolet',
  gm: 'gm',
  'general motors': 'gm',
  citroen: 'citroen',
  citroën: 'citroen',
  dodge: 'dodge',
  ram: 'ram',
  ferrari: 'ferrari',
  fiat: 'fiat',
  ford: 'ford',
  geely: 'geely',
  gwm: 'gwm',
  'great wall': 'gwm',
  'great wall motor': 'gwm',
  honda: 'honda',
  hummer: 'hummer',
  hyundai: 'hyundai',
  iveco: 'iveco',
  jeep: 'jeep',
  kia: 'kia',
  lifan: 'lifan',
  lamborghini: 'lamborghini',
  'land rover': 'land-rover',
  'land-rover': 'land-rover',
  range: 'land-rover',
  'range rover': 'land-rover',
  mercedes: 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
  'mercedes-benz': 'mercedes-benz',
  benz: 'mercedes-benz',
  mini: 'mini',
  mitsubishi: 'mitsubishi',
  nissan: 'nissan',
  peugeot: 'peugeot',
  porsche: 'porsche',
  renault: 'renault',
  subaru: 'subaru',
  suzuki: 'suzuki',
  tesla: 'tesla',
  toyota: 'toyota',
  volkswagen: 'volkswagen',
  vw: 'volkswagen',
  volvo: 'volvo',
  yamaha: 'yamaha',
};

function normalizeBrandKey(brand: string): string {
  return brand
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Resolve o slug do arquivo de logo a partir do nome da marca (vehicle_brand). */
export function resolveVehicleBrandLogoSlug(brand?: string | null): VehicleBrandLogoSlug | null {
  const key = normalizeBrandKey(brand ?? '');
  if (!key) return null;
  if (key in BRAND_ALIASES) return BRAND_ALIASES[key];
  const slug = key.replace(/\s+/g, '-');
  if ((VEHICLE_BRAND_LOGO_SLUGS as readonly string[]).includes(slug)) {
    return slug as VehicleBrandLogoSlug;
  }
  return null;
}

export function getVehicleBrandLogoUrl(brand?: string | null): string | null {
  const slug = resolveVehicleBrandLogoSlug(brand);
  return slug ? `/brands/${slug}.png` : null;
}

function stripBrandPrefix(brand: string, model: string): string {
  const text = model.trim();
  const source = brand.trim();
  if (!text || !source) return text;
  const norm = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const nb = norm(source);
  const nt = norm(text);
  if (nt === nb || !nt.startsWith(`${nb} `)) return text;
  const words = source.split(/\s+/).filter(Boolean).length;
  const rest = text.split(/\s+/).filter(Boolean).slice(words).join(' ');
  return rest || text;
}

/** Marca para a logo e modelo sem repetir a marca na faixa da celebração. */
export function celebrationVehicleParts(
  brand: string | null | undefined,
  model: string,
): { brand: string | null; model: string } {
  const rawModel = (model || '').trim();
  const explicit = (brand || '').trim();

  if (explicit && resolveVehicleBrandLogoSlug(explicit)) {
    return { brand: explicit, model: stripBrandPrefix(explicit, rawModel) || rawModel };
  }

  const parts = rawModel.split(/\s+/).filter(Boolean);
  const max = Math.min(3, Math.max(0, parts.length - 1));
  for (let n = max; n >= 1; n -= 1) {
    const candidate = parts.slice(0, n).join(' ');
    if (resolveVehicleBrandLogoSlug(candidate)) {
      const rest = parts.slice(n).join(' ');
      return { brand: candidate, model: rest || rawModel };
    }
  }

  if (explicit) {
    return { brand: explicit, model: stripBrandPrefix(explicit, rawModel) || rawModel };
  }
  return { brand: null, model: rawModel };
}
