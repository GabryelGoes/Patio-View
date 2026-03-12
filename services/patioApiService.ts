/**
 * Serviço que consome a API do sistema principal para o painel do pátio (ordens de serviço).
 */

import { WorkshopData, Vehicle, Stage } from '../types';

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
  customers?: { id: string; name?: string; phone?: string } | null;
}

function formatDeliveryDate(value: string | null | undefined): string {
  if (!value) return 'Sem data';
  try {
    return new Date(value).toLocaleDateString('pt-BR');
  } catch {
    return 'Sem data';
  }
}

function formatLastActivity(value: string | null | undefined): string {
  if (!value) return '--:--';
  try {
    return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
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
        const customerName = row.customers?.name ?? 'Cliente';
        const model = row.order_type === 'module'
          ? (row.module_identification || row.vehicle_model || 'Módulo')
          : (row.vehicle_model || row.module_identification || 'Veículo');
        const deliveryDate = formatDeliveryDate(row.delivery_date);
        const rawDue = row.delivery_date ? new Date(row.delivery_date) : undefined;

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
