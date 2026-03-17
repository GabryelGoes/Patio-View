/**
 * Serviço que consome a API do sistema principal para o painel do pátio (ordens de serviço),
 * quadro de avisos e meta semanal.
 */

import { WorkshopData, WorkshopAndNotices, Vehicle, Stage, Notice, WeeklyGoal } from '../types';

const getEnv = (key: string): string =>
  (import.meta as any).env?.[key] ?? '';

const API_BASE = getEnv('VITE_API_BASE').replace(/\/+$/, '');

/** Mapeia status da API (snake_case) para o tipo Stage usado no app (nomes para exibição). */
const STATUS_TO_STAGE: Record<string, Stage> = {
  AGUARDANDO_AVALIACAO: 'Aguardando Avaliação',
  AVALIACAO_TECNICA: 'Avaliação Técnica',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  ORCAMENTO_APROVADO: 'Orçamento Aprovado',
  AGUARDANDO_PECAS: 'Aguardando Peças',
  EM_SERVICO: 'Em Serviço',
  FASE_DE_TESTE: 'Fase de Teste',
  FINALIZADO: 'Finalizado',
  GARANTIA: 'Garantia',
  ORCAMENTO_NAO_APROVADO: 'Orçamento Não Aprovado',
};

function mapStatusToStage(status: string): Stage {
  return STATUS_TO_STAGE[status] ?? 'Aguardando Avaliação';
}

/** Resposta de um item de GET /api/service-orders (snake_case). */
interface ServiceOrderRow {
  id: string;
  os_number?: number;
  customer_id?: string;
  vehicle_model?: string | null;
  module_identification?: string | null;
  plate?: string | null;
  mileage_km?: number | null;
  delivery_date?: string | null;
  issue_description?: string | null;
  status: string;
  assigned_technician?: string | null;
  assigned_technician_name?: string | null;
  garantia_tag?: boolean;
  order_type?: 'vehicle' | 'module';
  created_at?: string;
  updated_at?: string;
  /** Nome do cliente (enriquecido pelo backend na listagem). */
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

/** Interpreta data de entrega (YYYY-MM-DD ou ISO) como data local, sem mudança de fuso. */
function parseDeliveryDateLocal(value: string | null | undefined): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const s = value.trim();
  const datePart = s.slice(0, 10);
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match.map(Number);
    return new Date(y, m - 1, d); // meia-noite no fuso local
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

/** Retorna apenas o primeiro nome (primeira palavra) do cliente. */
function firstNameOnly(fullName: string | null | undefined): string {
  const name = (fullName ?? '').trim();
  if (!name) return 'Cliente';
  const first = name.split(/\s+/)[0];
  return first || 'Cliente';
}

export async function fetchWorkshopData(): Promise<WorkshopData> {
  if (!API_BASE) {
    console.warn('VITE_API_BASE não configurada.');
    return { boardName: 'Configurar VITE_API_BASE no ambiente', vehicles: [] };
  }

  try {
    const params = new URLSearchParams();
    params.set('orderType', 'vehicle'); // só veículos no pátio
    const url = `${API_BASE}/service-orders?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error('API service-orders error:', res.status, text);
      return { boardName: 'Erro de Conexão', vehicles: [] };
    }

    const rows: ServiceOrderRow[] = await res.json();
    const vehicles: Vehicle[] = rows
      .filter((row) => row.status !== 'CANCELLED')
      .map((row) => {
        const customerName = firstNameOnly(row.customer_name ?? row.customers?.name);
        const model = row.order_type === 'module'
          ? (row.module_identification || row.vehicle_model || 'Módulo')
          : (row.vehicle_model || row.module_identification || 'Veículo');
        const deliveryDate = formatDeliveryDate(row.delivery_date);
        const rawDue = parseDeliveryDateLocal(row.delivery_date);

        return {
          id: row.id,
          model,
          plate: row.plate ?? '---',
          client: customerName,
          stage: mapStatusToStage(row.status),
          deliveryDate,
          rawDueDate: rawDue,
          mechanic: (row.assigned_technician_name || row.assigned_technician || 'Pátio').trim() || 'Pátio',
          lastActivity: formatLastActivity(row.updated_at ?? row.created_at),
          garantiaTag: row.garantia_tag === true,
        };
      });

    return {
      boardName: 'Rei do ABS • Gestão de Pátio',
      vehicles,
    };
  } catch (err) {
    console.error('Erro ao buscar dados do pátio:', err);
    return { boardName: 'Erro de Conexão', vehicles: [] };
  }
}

export async function fetchWorkshopAndNotices(): Promise<WorkshopAndNotices> {
  const base = await fetchWorkshopData();

  if (!API_BASE) {
    return { ...base, notices: [], weeklyGoal: null };
  }

  try {
    const [noticesRes, goalRes] = await Promise.all([
      fetch(`${API_BASE}/notices`),
      fetch(`${API_BASE}/weekly-goal`),
    ]);

    let notices: Notice[] = [];
    if (noticesRes.ok) {
      const raw = await noticesRes.json();
      notices = (Array.isArray(raw) ? raw : []).map((n: any) => ({
        id: String(n.id),
        title: n.title ?? '',
        body: n.body ?? '',
        highlight: !!n.highlight,
        active: n.active !== false,
        sortOrder: typeof n.sortOrder === 'number' ? n.sortOrder : null,
        createdAt: n.createdAt ?? n.created_at ?? '',
        updatedAt: n.updatedAt ?? n.updated_at ?? '',
      }));
    }

    let weeklyGoal: WeeklyGoal | null = null;
    if (goalRes.status !== 404 && goalRes.ok) {
      const g = await goalRes.json();
      weeklyGoal = {
        weekStart: g.weekStart ?? g.week_start ?? '',
        targetAmount: Number(g.targetAmount ?? g.target_amount ?? 0),
        currentAmount: Number(g.currentAmount ?? g.current_amount ?? 0),
      };
    }

    return {
      ...base,
      notices: notices.filter((n) => n.active),
      weeklyGoal,
    };
  } catch (err) {
    console.error('Erro ao buscar avisos/meta semanal para TV:', err);
    return { ...base, notices: [], weeklyGoal: null };
  }
}
