/**
 * API do sistema principal — painel da TV do Laboratório (ordens tipo módulo).
 */

import { WorkshopData, Vehicle, Stage, TvSlide, TvWeeklyGoal } from '../types';
import { normalizeTvChimeConfig, type TvChimeScheduleConfig } from '../utils/tvChimeSchedule';

const getEnv = (key: string): string =>
  (import.meta as any).env?.[key] ?? '';

const API_BASE = getEnv('VITE_API_BASE').replace(/\/+$/, '');

/** Token de leitura da TV (deve casar com TV_API_TOKEN no servidor). Opcional. */
const TV_TOKEN = getEnv('VITE_TV_TOKEN').trim();

/** Headers de autenticação para as chamadas da TV (envia o token se configurado). */
const tvHeaders = (): Record<string, string> =>
  TV_TOKEN ? { Authorization: `Bearer ${TV_TOKEN}` } : {};

const STATUS_TO_STAGE: Record<string, Stage> = {
  AGUARDANDO_AVALIACAO: 'Aguardando Avaliação',
  AVALIACAO_TECNICA: 'Avaliação Técnica',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  ORCAMENTO_APROVADO: 'Orçamento Aprovado',
  AGUARDANDO_PECAS: 'Aguardando Peças',
  PECAS_DISPONIVEIS: 'Peças Disponíveis',
  ENVIO_CONSERTO: 'Envio Conserto',
  CHEGADA_CONSERTO: 'Chegada Conserto',
  EM_SERVICO: 'Em Serviço',
  PRONTO_PRA_RETIRADA: 'Pronto pra Retirada',
  GARANTIA: 'Garantia',
  ORCAMENTO_NAO_APROVADO: 'Orçamento Não Aprovado',
  /** Legado (OS antigas do fluxo do pátio) */
  FINALIZADO: 'Pronto pra Retirada',
  FASE_DE_TESTE: 'Em Serviço',
};

function mapStatusToStage(status: string): Stage {
  return STATUS_TO_STAGE[status] ?? 'Aguardando Avaliação';
}

const MODULE_KIND_LABELS: Record<string, string> = {
  completo: 'Módulo completo',
  eletronico: 'Módulo eletrônico',
  hidraulico: 'Módulo hidráulico',
  pinca_freio: 'Pinça de freio',
  outro: 'Outro produto',
};

/** Produto encaminhado da oficina (pátio): a OS de laboratório nasce com esta descrição. */
function isFromWorkshop(issueDescription: string | null | undefined): boolean {
  const s = String(issueDescription ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return s.includes('servico enviado do patio');
}

/** Extrai o rótulo do serviço encaminhado do pátio (legado em issue_description). */
function extractPatioServiceFromIssue(issueDescription: string | null | undefined): string {
  const issue = String(issueDescription ?? '').trim();
  const m = issue.match(/Serviço enviado do pátio \(OS #[^)]+\):\s*(.+?)(?:\n|$)/i);
  return m?.[1]?.trim() ?? '';
}

/**
 * Rótulo do tipo de produto do laboratório; para "outro" usa o texto livre.
 * OS antigas do pátio gravavam o nome do serviço em module_product_other — não exibir como produto.
 */
function labProductLabel(
  kind: string | null | undefined,
  other: string | null | undefined,
  moduleIdentification: string | null | undefined,
  issueDescription: string | null | undefined
): string {
  const k = String(kind ?? '').toLowerCase().trim();
  if (k === 'outro') {
    const t = String(other ?? '').trim();
    if (t && isFromWorkshop(issueDescription)) {
      const patioService = extractPatioServiceFromIssue(issueDescription);
      const modId = String(moduleIdentification ?? '').trim();
      if (
        (patioService && patioService.toLowerCase() === t.toLowerCase()) ||
        (modId && modId.toLowerCase() === t.toLowerCase())
      ) {
        return MODULE_KIND_LABELS.outro;
      }
    }
    return t || MODULE_KIND_LABELS.outro;
  }
  return MODULE_KIND_LABELS[k] ?? '—';
}

interface ServiceOrderRow {
  id: string;
  os_number?: number;
  customer_id?: string;
  vehicle_model?: string | null;
  vehicle_brand?: string | null;
  module_identification?: string | null;
  plate?: string | null;
  delivery_date?: string | null;
  status: string;
  assigned_technician?: string | null;
  assigned_technician_name?: string | null;
  garantia_tag?: boolean;
  bench_slot?: number | null;
  module_kind?: string | null;
  module_product_other?: string | null;
  issue_description?: string | null;
  order_type?: 'vehicle' | 'module';
  created_at?: string;
  updated_at?: string;
  customer_name?: string | null;
  customers?: { id: string; name?: string; phone?: string } | null;
}

function formatDeliveryDate(value: string | null | undefined): string {
  if (!value) return '---';
  try {
    return new Date(value).toLocaleDateString('pt-BR');
  } catch {
    return '---';
  }
}

function parseDeliveryDateLocal(value: string | null | undefined): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const s = value.trim();
  const datePart = s.slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match.map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatLastActivity(value: string | null | undefined): string {
  if (!value) return '--:--';
  try {
    return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

/** Dois primeiros nomes do cliente (ex.: "Maria Aparecida"). */
function firstTwoNames(fullName: string | null | undefined): string {
  const name = (fullName ?? '').trim();
  if (!name) return 'Cliente';
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.join(' ') || 'Cliente';
}

function formatOsLabel(osNumber: number | null | undefined): string {
  if (osNumber == null || !Number.isFinite(osNumber)) return '---';
  return `OS ${Math.trunc(osNumber)}`;
}

/** Nome do veículo na TV (marca + modelo); não usa identificação do módulo na 1ª coluna. */
function formatVehicleDisplay(row: ServiceOrderRow): string {
  const brand = row.vehicle_brand?.trim() ?? '';
  const model = row.vehicle_model?.trim() ?? '';
  const combined = [brand, model].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  if (row.plate?.trim()) return row.plate.trim().toUpperCase();
  return 'Veículo';
}

function normalizeTvSlide(raw: Record<string, unknown>): TvSlide {
  const base = raw as unknown as TvSlide;
  const pin = base.pinImmediate === true || raw.pin_immediate === true;
  return { ...base, pinImmediate: pin };
}

async function fetchTvPlaylist(): Promise<{
  tvSlides: TvSlide[];
  weeklyGoal: TvWeeklyGoal | null;
  chimeSchedule: TvChimeScheduleConfig | null;
}> {
  if (!API_BASE) return { tvSlides: [], weeklyGoal: null, chimeSchedule: null };
  try {
    const res = await fetch(`${API_BASE}/tv/playlist?scope=laboratorio`, { cache: 'no-store', headers: tvHeaders() });
    if (!res.ok) return { tvSlides: [], weeklyGoal: null, chimeSchedule: null };
    const data = await res.json();
    const slides = Array.isArray(data.slides)
      ? (data.slides as Record<string, unknown>[]).map(normalizeTvSlide)
      : [];
    const weeklyGoal =
      data.weeklyGoal &&
      typeof data.weeklyGoal === 'object' &&
      data.weeklyGoal !== null
        ? ({
            ...(data.weeklyGoal as TvWeeklyGoal),
            showWeeklyBar: (data.weeklyGoal as { showWeeklyBar?: boolean }).showWeeklyBar !== false,
          } as TvWeeklyGoal)
        : null;
    const chimeSchedule = normalizeTvChimeConfig(data.chimeSchedule ?? null);
    return { tvSlides: slides, weeklyGoal, chimeSchedule };
  } catch {
    return { tvSlides: [], weeklyGoal: null, chimeSchedule: null };
  }
}

export async function fetchWorkshopData(): Promise<WorkshopData> {
  if (!API_BASE) {
    console.warn('VITE_API_BASE não configurada.');
    return {
      boardName: 'Configurar VITE_API_BASE no ambiente',
      vehicles: [],
      tvSlides: [],
      weeklyGoal: null,
      chimeSchedule: null,
    };
  }

  try {
    const params = new URLSearchParams();
    params.set('orderType', 'module');
    const url = `${API_BASE}/service-orders?${params.toString()}`;
    const [res, tvBundle] = await Promise.all([fetch(url, { headers: tvHeaders() }), fetchTvPlaylist()]);

    if (!res.ok) {
      const text = await res.text();
      console.error('API service-orders error:', res.status, text);
      return {
        boardName: 'Erro de Conexão',
        vehicles: [],
        tvSlides: tvBundle.tvSlides,
        weeklyGoal: tvBundle.weeklyGoal,
        chimeSchedule: tvBundle.chimeSchedule,
      };
    }

    const rows: ServiceOrderRow[] = await res.json();
    const vehicles: Vehicle[] = rows
      .filter((row) => row.status !== 'CANCELLED')
      // Conserto externo: saiu da oficina para reparo em terceiros → não exibir na TV até chegar.
      .filter((row) => row.status !== 'EM_CONSERTO_EXTERNO')
      .filter((row) => row.order_type !== 'vehicle')
      .map((row) => {
        const customerName = firstTwoNames(row.customer_name ?? row.customers?.name);
        const model = formatVehicleDisplay(row);
        const deliveryDate = formatDeliveryDate(row.delivery_date);
        const rawDue = parseDeliveryDateLocal(row.delivery_date);

        return {
          id: row.id,
          model,
          plate: formatOsLabel(row.os_number),
          client: customerName,
          stage: mapStatusToStage(row.status),
          deliveryDate,
          rawDueDate: rawDue,
          mechanic:
            (row.assigned_technician_name || row.assigned_technician || 'Laboratório').trim() ||
            'Laboratório',
          lastActivity: formatLastActivity(row.updated_at ?? row.created_at),
          garantiaTag: row.garantia_tag === true,
          benchSlot:
            row.bench_slot != null && Number.isFinite(Number(row.bench_slot))
              ? Number(row.bench_slot)
              : null,
          productType: labProductLabel(
            row.module_kind,
            row.module_product_other,
            row.module_identification,
            row.issue_description
          ),
          fromWorkshop: isFromWorkshop(row.issue_description),
        };
      });

    return {
      boardName: 'Rei do ABS • Laboratório',
      vehicles,
      tvSlides: tvBundle.tvSlides,
      weeklyGoal: tvBundle.weeklyGoal,
      chimeSchedule: tvBundle.chimeSchedule,
    };
  } catch (err) {
    console.error('Erro ao buscar dados do laboratório:', err);
    return {
      boardName: 'Erro de Conexão',
      vehicles: [],
      tvSlides: [],
      weeklyGoal: null,
      chimeSchedule: null,
    };
  }
}
