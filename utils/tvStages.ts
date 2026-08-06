/** Detecta etapa "Aguardando avaliação" (com ou sem acento). */
export function normalizeStageText(stage: string): string {
  return String(stage || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isAwaitingEvaluationStage(stage: string): boolean {
  const s = normalizeStageText(stage);
  return s.includes('aguardando') && s.includes('avaliacao');
}
