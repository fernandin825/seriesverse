# SERIESVERSE AI — versão Android (APK)

Mesmo app que você já viu, agora rodando **dentro do celular**, sem servidor. Uso pessoal.

## Como obter o APK (sem instalar nada no PC) — ~15 minutos, uma vez só

1. Crie uma conta grátis em **github.com** (se ainda não tem).
2. Clique em **+ > New repository**. Nome: `seriesverse`. Marque **Private** (privado). Create.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. **Extraia este ZIP** no computador e arraste **todo o conteúdo da pasta** (incluindo a pasta oculta `.github`) para a página. ⚠ Se a pasta `.github` não subir (pastas ocultas às vezes ficam de fora), clique em *Add file > Create new file*, digite o nome `.github/workflows/build-apk.yml` e cole o conteúdo do arquivo de mesmo nome do ZIP. Clique **Commit changes**.
5. Abra a aba **Actions**. Se pedir, clique em *“I understand my workflows, enable them”*. Escolha **Gerar APK** > **Run workflow** > **Run workflow** (verde).
6. Espere ~5–10 min até aparecer um ✓ verde. Clique na execução e, no fim da página, em **Artifacts**, baixe **SERIESVERSE-AI-apk** (vem num .zip com o `app-debug.apk`; extraia).
7. Passe o `app-debug.apk` para o celular (WhatsApp para você mesmo, Drive, cabo USB…).

## Instalar no Android
1. Toque no arquivo `.apk`.
2. Se aparecer “bloqueado por segurança”, toque em **Configurações** e ative **Permitir desta fonte**. Volte e toque em **Instalar**.
3. Se o Play Protect avisar “app não reconhecido”, é normal (o app é seu, não está na loja): **Instalar mesmo assim**.

## Primeiro uso
- Abra o app > **Carregar demonstração** para testar.
- Para pesquisar séries reais: **Ajustes > Chaves de acesso**.
  - **TMDB** (grátis): crie conta em themoviedb.org > Configurações > API > copie o *Token de Leitura da API* e cole.
  - **IA (Gemini, gratuita)**: entre em **aistudio.google.com/apikey** com sua conta Google, clique em **Criar chave de API** e copie a chave (começa com `AIza`). Cole em *Chave do Gemini*. Habilita relatórios de qualquer série, correção de respostas abertas e chat. O plano gratuito tem limite de uso por minuto/dia: se aparecer “limite atingido”, espere um pouco. Se aparecer erro de modelo, mude o nome em *Modelo do Gemini* (o app já tenta alternativas sozinho).
- As chaves ficam só no celular (e quem abrir o APK/aparelho desbloqueado pode ver). Não compartilhe o APK com outras pessoas.

## O que funciona sem internet
| Função | Offline? |
|---|---|
| Abrir o app, biblioteca, progresso, marcar episódios, **“Terminei o episódio”** | ✅ |
| Cronograma, painel, conquistas, ajustes, exportar dados | ✅ |
| Séries já abertas antes (episódios/títulos ficam salvos) | ✅ |
| Relatório/quiz/lições já gerados | ✅ |
| Catálogo local (4 séries) e cadastro manual | ✅ |
| Relatório offline do Piloto de The Mentalist (limitado) | ✅ |
| Pesquisar séries novas, pôsteres, plataformas | ❌ precisa de internet + chave TMDB |
| Gerar relatório novo, corrigir respostas abertas com IA, chat livre | ❌ precisa de internet + chave do Gemini |

## Seus dados
Ficam no armazenamento do app. **Desinstalar ou “limpar dados” apaga o progresso.** Use *Ajustes > Exportar meus dados* para guardar cópia. Atualizar o app (instalar um APK novo por cima) mantém os dados — desde que seja assinado com a mesma chave (o GitHub gera uma chave de debug nova a cada build; se o Android recusar a atualização, exporte os dados, desinstale e instale de novo).

## Para testar no navegador do PC (sem APK)
Dentro desta pasta: `python3 -m http.server 8080 --directory www` e abra http://localhost:8080 (precisa de Python). Ou use o arquivo de prévia em HTML único que já te enviei.

## Sobre a versão antiga (ZIP com servidor, `seriesverse.zip`) no PC
Precisa do **Node.js 22.13 ou mais novo** (nodejs.org). Extraia, abra o terminal na pasta e rode `npm start`; depois abra http://localhost:3000. O jeito mais fácil no PC, porém, é o arquivo **seriesverse-previa.html**: dê dois cliques e ele abre no navegador.

## Limitações honestas
- O APK **não foi compilado no ambiente onde o projeto foi criado** (sem Android SDK e sem acesso aos repositórios do Google). O motor do app foi testado em navegador com TMDB e IA simulados; o workflow de build é a receita padrão do Capacitor, mas **não foi executado**. Se o passo de build falhar, copie a mensagem de erro do Actions e me envie.
- TMDB e Gemini reais não foram testados com suas chaves (testei só com simulação). Os nomes dos modelos do Gemini vieram de fontes secundárias e podem mudar.
- É um APK de *debug* (instalável, mas não otimizado/assinado para loja).
