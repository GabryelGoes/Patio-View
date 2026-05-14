# View Pátio — Rei do ABS

Painel de TV do pátio: ordens de serviço em tempo real + **slides da playlist** e **avisos programados** (`chimeSchedule`), consumindo a API do sistema de gestão.

- Atualização automática a cada **2,5 s** (veículos + playlist TV)  
- Etapas ordenadas (Garantia, Aguardando avaliação, Em serviço, etc.)  
- Overlays: orçamento aprovado, garantia, alerta de avaliação pendente  
- **Avisos por horário**: mesma API que o app principal (`GET /api/tv/playlist` → `chimeSchedule`); exibição alinhada ao slide tipo «Aviso» (cabeçalho REI DO ABS + texto grande em fundo preto)  
- Paginação e som opcional em horário de expediente  

### Manutenção em par com o sistema principal

Os ficheiros `utils/tvChimeSchedule.ts` e `components/TvChimeBannerCard.tsx` devem **copiar-se do repositório do sistema de gestão** (RDA-Trello) quando a lógica ou o layout dos avisos mudar, para o painel e o gestor continuarem iguais.

## Pré-requisitos

- Node.js 18+
- API do sistema principal exposta (ex.: backend do sistema de gestão com `GET /api/service-orders`)

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env.local` (ou use variáveis de ambiente no deploy) com:

   ```env
   VITE_API_BASE=https://url-do-seu-backend.vercel.app/api
   ```

   Use a URL base da API do sistema de gestão, **incluindo** o sufixo `/api`.

3. Rode localmente:

   ```bash
   npm run dev
   ```

4. Build para produção:

   ```bash
   npm run build
   ```

   A saída fica em `dist/` (pode ser publicada na Vercel, Netlify, etc.).

## CORS

Se o painel for hospedado em um domínio diferente da API (ex.: `painel-patio.vercel.app` e `sistema.vercel.app`), o backend precisa permitir o origin do painel nas configurações de CORS.

## Estrutura

- `App.tsx` — estado, refresh, overlays, paginação, **avisos programados** (`useTvChimeSchedule`)  
- `services/patioApiService.ts` — `GET /api/service-orders?orderType=vehicle` e **`GET /api/tv/playlist`** (slides + meta + `chimeSchedule`)  
- `types.ts` — `Vehicle`, `Stage`, `WorkshopData`  
- `utils/tvChimeSchedule.ts`, `utils/tvChimeAudio.ts`, `hooks/useTvChimeSchedule.ts` — horários da TV  
- `components/TvChimeBannerCard.tsx` — layout do aviso na TV  
- Componentes: `VehicleRow`, `Clock`, `CelebrationOverlay`, `GarantiaOverlay`, `TvSlidePage`
