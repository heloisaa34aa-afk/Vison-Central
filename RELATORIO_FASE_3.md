# Relatório Final - Fase 3: MVP Funcional do Feed Instagram

## 1. Arquivos Modificados e Criados
* **Criados:**
  * `src/feedWorker/instagram_tables.sql`: Migrations para criação das tabelas `instagram_sessions` e `instagram_sync_logs`.
  * `src/feedWorker/scraper/crypto.ts`: Serviço AES de criptografia de cookies e estado.
  * `src/feedWorker/scraper/sessionManager.ts`: Gerenciamento unificado da sessão (persiste, carrega e detecta expiração da sessão no banco de dados).
  * `src/feedWorker/scraper/proxyManager.ts`: Mock manager preparado para sistema de proxy.
  * `src/feedWorker/scraper/metrics.ts`: Logger focado em registrar as estatísticas de telemetria no banco de dados.
  * `src/feedWorker/scraper/browser.ts`: O *BrowserManager*, que reaproveita a mesma instância principal do Chromium por toda vida útil do app, instanciando Contextos efêmeros e injetando as sessões decriptografadas neles.
  * `src/feedWorker/scraper/login.ts`: Função de setup isolada para abrir uma navegação de login, preencher campos, capturar e armazenar os cookies limpos na nuvem.
  * `src/feedWorker/scraper/instagram.ts`: Refatoração do FeedProvider, com limitador restritivo no Fallback e Fallback em network.
  * `src/components/InstagramLogin.tsx`: Painel de input para conectar a conta (UI).
* **Modificados:**
  * `src/feedWorker/scraper/config.ts`: Adição da limitação expressa `MAX_POSTS = 1`.
  * `src/components/FeedSourcesManager.tsx`: Integração da tela de Conexão com o Instagram e do botão "Sincronizar Agora" nos feeds.
  * `server.ts`: Implementação do endpoint de Autenticação (`/api/instagram/login`) e Sync Automático em Background (`/api/feed/sync/:id`).
  * `src/feedWorker/database.ts`: Inserido gatilho manual para incrementar a propriedade `config_revision` da playlist na finalização de novos vínculos, garantindo atualização passiva do APK Android.

## 2. Indicadores do Processo de Recuperação (MVP)
* **Quantidade de Browsers:** O limite fixo é travado em `1` processo pai global (o executável Chromium via Playwright), vivo e persistente.
* **Quantidade de Contexts:** Um Context (isolamento) instanciado para cada sincronização (logo em seguida, morre, descartando fingerprints em cache que não são úteis à conta logada).
* **Quantidade de Pages:** Restrito à aba única navegada e imediatamente morta após a execução de cada profile.
* **Uso da Criptografia:** Os states (localStorage e Cookies) injetados pelo Playwright são empacotados, criptografados por AES (Cipher iv-256) na aplicação back-end e escritos em texto sujo na base `instagram_sessions`. Durante a inicialização do *Context*, a engine decodifica, aplica e apaga os dados da memória heap em seguida.
* **Compatibilidade:** O núcleo do feed original permaneceu intocável, usando a mesma tipagem e injeção do Supabase, atendendo os mesmos tipos.
* **Memória & CPU:** Telemetrias e deltas salvos em `instagram_sync_logs` capturam a flutuação exata para cada request de maneira autônoma (utilizando logs via `os.loadavg()`).

## 3. Checklist de Produção MVP
- [x] O Feed importa *exatamente* uma última publicação por vez.
- [x] Sessão é conectada de forma única através do painel.
- [x] Conexão retém as flags da conta para a próxima sincronização.
- [x] Impedimento mecânico (slice, index block) evitando múltiplas importações do mesmo post.
- [x] Integração invisível com o aplicativo Android (apenas incrementando a chave `config_revision`).
- [x] Telemetria e retries persistidos nas tabelas base de observabilidade.
