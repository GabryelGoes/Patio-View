# TV View — Rei do ABS (Pátio + Laboratório)

Painel de TV **unificado**: o mesmo código atende a TV do **Pátio** e a do **Laboratório**, escolhido por uma variável de ambiente. Mostra ordens de serviço em tempo real + **slides da playlist** e **avisos programados** (`chimeSchedule`), consumindo a API do sistema de gestão.

- Atualização automática a cada **15 s** (veículos/módulos + playlist TV)
- Etapas ordenadas conforme o modo (Pátio ou Laboratório)
- Overlays: orçamento aprovado, garantia, alerta de avaliação pendente (e "peças disponíveis" no Pátio)
- **Avisos por horário**: `GET /api/tv/playlist` → `chimeSchedule`
- Paginação e som opcional em horário de expediente

## Modo Pátio vs Laboratório

O modo é definido por `VITE_TV_MODE`:

| `VITE_TV_MODE` | Quadro | Escopo da API | Cor de destaque |
|----------------|--------|---------------|-----------------|
| `patio` (padrão) | Veículos | `?orderType=vehicle` / `playlist?scope=patio` | amarelo |
| `laboratorio` | Módulos | `?orderType=module` / `playlist?scope=laboratorio` | violeta |

Toda diferença entre as duas TVs fica concentrada em **`config/tvMode.ts`** (branding, colunas, prioridade de etapas) e nos arquivos por modo:

- `services/patioApiService.ts` / `services/laboratorioApiService.ts` (selecionados por `services/tvApiService.ts`)
- `VehicleRow.patio.tsx` / `VehicleRow.laboratorio.tsx` (selecionados por `VehicleRow.tsx`)

Todo o resto (App, overlays, slides, players de vídeo, avisos) é **compartilhado** e mantido uma única vez.

### Manutenção em par com o sistema principal

Os arquivos `utils/tvChimeSchedule.ts` e `components/TvChimeBannerCard.tsx` devem **copiar-se do repositório do sistema de gestão** (RDA-Trello) quando a lógica/layout dos avisos mudar.

## Pré-requisitos

- Node.js 18+
- API do sistema principal exposta (ex.: `GET /api/service-orders`)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env.local` (ou use variáveis de ambiente no deploy):

   ```env
   VITE_TV_MODE=patio            # ou "laboratorio"
   VITE_API_BASE=https://url-do-seu-backend.vercel.app/api
   VITE_TV_TOKEN=                # opcional (casar com TV_API_TOKEN no servidor)
   ```

3. Rode localmente:

   ```bash
   npm run dev
   ```

4. Build para produção:

   ```bash
   npm run build
   ```

## Deploy (Vercel)

Use **o mesmo repositório** em dois projetos Vercel, mudando só o `VITE_TV_MODE`:

- **Projeto Pátio** → `VITE_TV_MODE=patio` (ou sem a variável)
- **Projeto Laboratório** → `VITE_TV_MODE=laboratorio`

Ambos apontam para o mesmo `VITE_API_BASE`. No backend, o CORS (`PATIO_VIEW_ORIGINS`) deve incluir as URLs dos dois deploys.

## CORS

Se o painel ficar em domínio diferente da API, o backend precisa permitir o origin de cada deploy nas configurações de CORS.

## Estrutura

- `config/tvMode.ts` — **seletor de modo** e toda a configuração que difere entre Pátio/Laboratório
- `App.tsx` — estado, refresh, overlays, paginação, avisos programados
- `services/tvApiService.ts` — seletor; `patioApiService.ts` / `laboratorioApiService.ts` — dados por modo
- `VehicleRow.tsx` — seletor; `VehicleRow.patio.tsx` / `VehicleRow.laboratorio.tsx` — linha do quadro por modo
- `types.ts` — `Vehicle`, `Stage`, `WorkshopData` (superset dos dois modos)
- `utils/`, `hooks/`, `components/` — compartilhados (slides, avisos, players de vídeo, etc.)
