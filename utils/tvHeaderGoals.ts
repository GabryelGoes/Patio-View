import type { TvSlide, TvWeeklyGoal } from '../types.ts';

export type TvGoalPeriod = 'weekly' | 'monthly';

export interface TvHeaderGoal {
  id: string;
  period: TvGoalPeriod;
  currentAmount: number;
  targetAmount: number;
  /** Rótulo livre vindo da gestão, quando não for só "meta semanal/mensal". */
  sourceLabel: string;
}

export function headerGoalLabel(period: TvGoalPeriod): string {
  return period === 'monthly' ? 'Meta mensal' : 'Meta semanal';
}

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function parseGoalPeriod(value: unknown, fallback: TvGoalPeriod = 'weekly'): TvGoalPeriod {
  const s = fold(String(value ?? ''));
  if (s === 'monthly' || s === 'mensal' || s === 'month' || s === 'mes') return 'monthly';
  if (s === 'weekly' || s === 'semanal' || s === 'week' || s === 'semana') return 'weekly';
  return fallback;
}

export function inferGoalPeriodFromText(value: string | null | undefined): TvGoalPeriod | null {
  const s = fold(String(value ?? ''));
  if (!s) return null;
  if (s.includes('mensal') || s.includes('mes')) return 'monthly';
  if (s.includes('semanal') || s.includes('semana')) return 'weekly';
  return null;
}

export function goalBarPercent(current: number, target: number): number {
  if (!(target > 0) || !Number.isFinite(current) || !Number.isFinite(target)) return 0;
  const ratio = current / target;
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(0, Math.min(130, ratio * 100));
}

function isGenericGoalLabel(label: string): boolean {
  const s = fold(label);
  return (
    s === '' ||
    s === 'meta' ||
    s === 'meta da semana' ||
    s === 'meta semanal' ||
    s === 'meta do mes' ||
    s === 'meta mensal' ||
    s === 'semanal' ||
    s === 'mensal' ||
    s === 'weekly' ||
    s === 'monthly'
  );
}

/** Texto da barra: o período escolhido na inserção. O nome livre só entra se houver duas metas do mesmo período. */
export function displayHeaderGoalLabel(goal: TvHeaderGoal, samePeriodCount: number): string {
  const base = headerGoalLabel(goal.period);
  if (samePeriodCount > 1 && !isGenericGoalLabel(goal.sourceLabel)) {
    return `${base} · ${goal.sourceLabel.trim()}`;
  }
  return base;
}

export function normalizePlaylistGoal(raw: unknown, fallbackPeriod: TvGoalPeriod): TvWeeklyGoal | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const currentAmount = Number(o.currentAmount ?? o.current_amount);
  const targetAmount = Number(o.targetAmount ?? o.target_amount);
  if (!Number.isFinite(currentAmount) || !Number.isFinite(targetAmount)) return null;
  const period = parseGoalPeriod(o.period ?? o.goalPeriod ?? o.goal_period, fallbackPeriod);
  const label = String(o.label ?? '').trim();
  const showRaw = o.showWeeklyBar ?? o.show_weekly_bar ?? o.showBar ?? o.show_bar;
  return {
    label: label || headerGoalLabel(period),
    currentAmount,
    targetAmount,
    showWeeklyBar: showRaw !== false,
    period,
  };
}

export function attachSlideGoalPeriod(slide: TvSlide, raw: Record<string, unknown>): TvSlide {
  if (slide.slideType !== 'goal') return slide;
  const fromField = raw.goalPeriod ?? raw.goal_period ?? raw.period;
  const inferred = inferGoalPeriodFromText(String(raw.goalLabel ?? raw.goal_label ?? raw.title ?? slide.goalLabel ?? slide.title ?? ''));
  const goalPeriod =
    fromField != null && String(fromField).trim() !== ''
      ? parseGoalPeriod(fromField, inferred ?? 'weekly')
      : (inferred ?? 'weekly');
  return { ...slide, goalPeriod };
}

function goalFromAmounts(
  id: string,
  period: TvGoalPeriod,
  currentAmount: number,
  targetAmount: number,
  sourceLabel: string
): TvHeaderGoal | null {
  if (!(targetAmount > 0) || !Number.isFinite(currentAmount) || !Number.isFinite(targetAmount)) return null;
  return { id, period, currentAmount, targetAmount, sourceLabel };
}

/** Barras do cabeçalho: meta da playlist (semanal/mensal) e slides do tipo goal, que deixam de ser página. */
export function collectHeaderGoals(
  weeklyGoal: TvWeeklyGoal | null | undefined,
  monthlyGoal: TvWeeklyGoal | null | undefined,
  slides: TvSlide[] | null | undefined
): TvHeaderGoal[] {
  const goals: TvHeaderGoal[] = [];

  const pushPlaylist = (goal: TvWeeklyGoal | null | undefined, fallbackId: string, fallbackPeriod: TvGoalPeriod) => {
    if (!goal || goal.showWeeklyBar === false) return;
    const period = goal.period ?? fallbackPeriod;
    const row = goalFromAmounts(fallbackId, period, goal.currentAmount, goal.targetAmount, goal.label);
    if (row) goals.push(row);
  };

  pushPlaylist(weeklyGoal, 'weekly-goal', 'weekly');
  pushPlaylist(monthlyGoal, 'monthly-goal', 'monthly');

  for (const slide of slides ?? []) {
    if (slide.slideType !== 'goal') continue;
    const period =
      slide.goalPeriod ??
      inferGoalPeriodFromText(slide.goalLabel || slide.title) ??
      'weekly';
    const currentAmount = slide.goalCurrent ?? 0;
    const targetAmount = slide.goalTarget ?? 0;
    const duplicated = goals.some(
      (goal) =>
        goal.period === period &&
        goal.currentAmount === currentAmount &&
        goal.targetAmount === targetAmount
    );
    if (duplicated) continue;
    const row = goalFromAmounts(
      `slide-${slide.id}`,
      period,
      currentAmount,
      targetAmount,
      slide.goalLabel || slide.title || ''
    );
    if (row) goals.push(row);
  }

  return goals;
}
