const PLACEHOLDERS = new Set([
  'patio',
  'laboratorio',
  '---',
  '—',
  '-',
  'n/a',
  'na',
]);

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Nome que a TV pode mostrar como mecânico. Identificador cru e placeholder contam como vazio. */
export function isAssignedMechanicName(value: string | null | undefined): boolean {
  const raw = (value || '').trim();
  if (!raw) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return false;
  return !PLACEHOLDERS.has(fold(raw));
}

/** Nome legível do técnico, ou string vazia quando a OS está sem mecânico. */
export function readableMechanicName(
  name: string | null | undefined,
  id: string | null | undefined,
): string {
  const named = (name || '').trim();
  if (isAssignedMechanicName(named)) return named;
  const rawId = (id || '').trim();
  if (isAssignedMechanicName(rawId)) return rawId;
  return '';
}
