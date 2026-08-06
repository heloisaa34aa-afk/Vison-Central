# Relatório de Refatoração de Arquitetura - Vision Central

A refatoração completa da arquitetura do projeto foi realizada com sucesso, dividindo o monólito em dois projetos totalmente independentes, seguindo estritamente os princípios SOLID, Clean Architecture e Separation of Concerns (SoC).

Nenhuma regra de negócio, integração (Supabase, Android, Playwright, Scraping) ou funcionalidade de banco de dados foi alterada. Toda a comunicação entre o frontend e backend agora flui nativamente através de requisições HTTP RESTful separadas.

---

## 1. Nova Árvore Completa do Projeto

O projeto foi dividido em duas pastas principais que agora podem ser facilmente isoladas para repositórios independentes caso desejado.

```text
/
├── vision-central-backend/       # Projeto 2 (Render)
│   ├── .env.example
│   ├── package.json
│   ├── server.ts                 # Ponto de entrada (Bootstrapping limpo)
│   ├── tsconfig.json
│   └── src/
│       ├── feedWorker/           # Toda a lógica do Worker, Scraper, Scheduler
│       └── routes/
│           ├── apk.ts            # Rotas para os dispositivos Android
│           ├── feed.ts           # Sincronização de feeds
│           ├── gemini.ts         # Integrações de IA 
│           ├── health.ts         # Health checks
│           └── instagram.ts      # Auth Manual / Sessions
│
├── vision-central-web/           # Projeto 1 (Vercel)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts            # Vite adaptado para Proxy
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── types.ts
│       ├── components/           # Todos os componentes UI React
│       ├── config/
│       │   └── api.ts            # Constante centralizada API_URL
│       ├── hooks/
│       ├── lib/                  # Utils de frontend
│       ├── services/             # API client services
│       └── utils/
│
└── package.json                  # Workspace monorepo p/ Dev Local no AI Studio
```

---

## 2. Arquivos Movidos & Criados

### 🟢 Criados
- `vision-central-backend/server.ts`: Inicialização limpa e minimalista do Express (`app.use` middlewares e rotas unicamente) + bootstrap do Worker.
- `vision-central-backend/src/routes/*.ts`: Lógicas de endpoints que antes engordavam o `server.ts` principal foram isoladas em arquivos roteadores.
- `vision-central-web/src/config/api.ts`: Variável `API_URL` que adapta `fetch` automaticamente para dev e produção.
- Novos arquivos `.env.example` separados para os respectivos escopos.
- Arquivos `tsconfig.json` otimizados para Node 22+ e DOM (React).

### 🔵 Movidos
- Todo o bloco de renderização Vite e `index.html` foram desacoplados do antigo Express Root Server.
- `src/feedWorker` movido integralmente e em segurança para `vision-central-backend/src/feedWorker`.
- `src/components`, `src/lib`, `src/utils`, `src/services`, `src/types.ts` movidos para `vision-central-web`.

### 🔴 Removidos / Limpos
- `vite` e pacotes do frontend foram removidos do backend.
- `express`, `playwright`, `@google/genai`, bibliotecas cron foram removidas do frontend.
- Hardcoded URLs como `fetch('/api/...')` foram substituídas por literals utilizando `API_URL`.

---

## 3. Dependências Divididas

### ⚡ vision-central-web (Frontend)
Dependências exclusivamente voltadas à renderização do painel administrativo.
- `react`, `react-dom`, `react-router-dom`
- `@tailwindcss/vite`, `tailwindcss`
- `lucide-react`, `motion`
- `zustand`
- `jspdf`, `jspdf-autotable`
- `@supabase/supabase-js`

### ⚙️ vision-central-backend (Backend)
Dependências exclusivamente voltadas a servidor, automação e worker de dados.
- `express`, `cors`
- `playwright`
- `node-cron`
- `@google/genai`
- `dotenv`
- `@supabase/supabase-js`
- `multer`

---

## 4. Variáveis de Ambiente

### Backend (`vision-central-backend/.env.example`)
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
ENCRYPTION_KEY=
PORT=
NODE_ENV=
```

### Frontend (`vision-central-web/.env.example`)
```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 5. Ajustes Recomendados e Possíveis Problemas

1. **CORS em Produção:** No `server.ts` recém criado ativamos o CORS estritamente utilizando `app.use(cors())`. Para a produção no Render, é recomendado restringir o CORS ao seu domínio oficial da Vercel para maior segurança.
   - *Correção*: `app.use(cors({ origin: 'https://seu-painel.vercel.app' }))`
2. **Duplicação do Supabase Client:** O frontend e o backend contêm, agora por obrigatoriedade natural, cada qual a sua própria instância do `@supabase/supabase-js`. Assegure-se de que o backend utilize idealmente a Service Role (embora a Anon seja compatível) em cron-jobs, enquanto o frontend use a Anon Key sempre.
3. **Gerenciamento de Tipos (`types.ts`):** O frontend manteve o arquivo de `types.ts`. Algumas estruturas podem cruzar para o `feedWorker`. Se surgirem dessincronizações de payload, a recomendação é extrair as interfaces comuns para um pacote externo ou sub-repositório.

---

## 6. Checklists de Deploy

### 🚀 Deploy no Render (Backend)
- [ ] Criar novo "Web Service".
- [ ] **Root Directory**: preencher como `vision-central-backend`.
- [ ] **Build Command**: `npm install && npm run build`
- [ ] **Start Command**: `npm run start`
- [ ] **Environment Variables**: Adicionar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `ENCRYPTION_KEY`.

### 🚀 Deploy na Vercel (Frontend)
- [ ] Conectar ao repositório via Vercel Dashboard.
- [ ] **Root Directory**: `vision-central-web`
- [ ] **Framework Preset**: Selecionar "Vite".
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`
- [ ] **Environment Variables**: Adicionar `VITE_API_URL` apontando para o link gerado do Render (Ex: `https://vision-central-backend.onrender.com`).
- [ ] Inserir a URL da Vercel nos redirecionamentos aceitos do Supabase Authentication.

---

**Confirmação:** A compatibilidade com todos os recursos (Android Heartbeat, Autenticação Manual no Instagram, Sincronização via Playwright e Supabase Storage/Worker) permanece inalterada na sua totalidade. As regras de sincronização permanecem isoladas e intactas dentro de `src/feedWorker`.
