# View Pátio — Rei do ABS

Painel de TV do pátio: exibe em tempo real as ordens de serviço (veículos) consumindo a API do sistema de gestão da oficina.

- Atualização automática a cada 15 s  
- Etapas ordenadas (Garantia, Aguardando avaliação, Em serviço, etc.)  
- Overlays: orçamento aprovado, garantia, alerta de avaliação pendente  
- Paginação e som opcional em horário de expediente  

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

- `App.tsx` — estado, refresh, overlays e paginação  
- `services/patioApiService.ts` — chamada a `GET /api/service-orders?orderType=vehicle` e mapeamento para o modelo do painel  
- `types.ts` — `Vehicle`, `Stage`, `WorkshopData`  
- Componentes: `VehicleRow`, `Clock`, `CelebrationOverlay`, `GarantiaOverlay`
