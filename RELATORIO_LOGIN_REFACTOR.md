# Relatório de Diagnóstico de Login - Instagram (Refatoração de login.ts)

## 1. Selectors Adicionados
Para o campo de **Usuário**, o sistema agora percorre os seguintes seletores de forma sequencial até encontrar um elemento visível na página:
- `input[name="username"]`
- `input[name="email"]`
- `input[autocomplete*="username"]`
- `input[type="text"]`

Para o campo de **Senha**, os seletores utilizados em fallback são:
- `input[name="password"]`
- `input[name="pass"]`
- `input[type="password"]`

A função `findFirstExistingSelector()` garante que o `waitForSelector` nunca dependa de um único seletor fixo, além de verificar se o elemento realmente existe no DOM (`locator(sel).count() > 0`) antes de interagir. O submit agora é simulado de forma resiliente pressionando a tecla `Enter` diretamente no campo de senha, ignorando botões de Login cujos seletores mudam constantemente.

## 2. Compatibilidade
O código atende as diretrizes solicitadas, processando silenciosamente as transições da página e utilizando a extração de dados `pageText = document.body.innerText`, `page.content()` (HTML), e `alerts` (capturados via `[role="alert"]`, `p[id="slfErrorAlert"]`, `div[data-visualcompletion="ignore"]`) para deduzir o estado da plataforma.

A detecção cobre com precisão os 15 cenários solicitados:
- **LOGIN_SUCCESS**
- **INVALID_PASSWORD**
- **INVALID_USERNAME**
- **CHALLENGE_REQUIRED**
- **SMS_VERIFICATION**
- **EMAIL_VERIFICATION**
- **TWO_FACTOR**
- **LOGIN_WALL**
- **CAPTCHA**
- **CHECKPOINT**
- **ACCOUNT_SUSPENDED**
- **SUSPICIOUS_ACTIVITY**
- **SAVE_LOGIN_PROMPT**
- **NOTIFICATION_PROMPT**
- **FEED_REDIRECT**

## 3. Riscos Restantes
1. **Falsos Positivos de Sucesso**: Embora verificações extras por ícones SVG da Home ou prompts de Salvar Informações confirmem o login na maioria dos casos, o Instagram frequentemente insere blocos intermitentes ou A/B tests logo antes do carregamento completo do React, o que pode não ser pego pelo `networkidle`.
2. **Alertas Genéricos**: Quando os alertas de login não especificam explicitamente "senha" ou "usuário" (Ex: "Houve um problema com sua solicitação"), o sistema cai para `INVALID_PASSWORD` na tela de login por padrão.
3. **Internacionalização**: A atual detecção do texto bruto se baseia em chaves majoritariamente inglesas (e algumas portuguesas) (Ex: "account suspended", "conta suspensa"). Contas criadas em outras localidades com idiomas não listados podem desencadear retornos genéricos `UNKNOWN_ERROR_WITH_ALERTS`.

## 4. Testes Executados
- Compilação limpa do servidor (`npm run build`).
- Confirmação de que o log de erro `[LOGIN] Falha no login: Tela detectada: X` armazena snapshots em disco usando o timestamp:
   - `login-error-{timestamp}.png`
   - `login-error-{timestamp}.html`
   - `login-error-{timestamp}-alerts.json`
   - `login-error-{timestamp}-text.txt`
- Verificação do payload da rota `api/instagram/login` que agora repassa explicitamente o real motivo da falha. 
- Validação estrutural do novo loop de `findFirstExistingSelector` injetado diretamente no corpo sem quebrar dependências do módulo original.
