/** Tempo corrido desde a entrada na etapa, com unidades em minúsculo (h, m). */
export function formatStageWait(iso: string | null | undefined, now = Date.now()): string {
  const empty = '0h 00m';
  if (!iso) return empty;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return empty;
  const totalMinutes = Math.max(0, Math.floor((now - start) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const hm = `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return days > 0 ? `${days}d ${hm}` : hm;
}
