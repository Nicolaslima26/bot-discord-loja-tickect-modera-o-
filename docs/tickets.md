# Tickets — Fase 2

## Componentes

`apps/bot/src/tickets.ts` implementa o painel, abertura e fechamento. `TicketConfig` concentra as opções por tenant e `Ticket` registra o ciclo de vida do canal.

## Configuração

Um Administrador executa `/tickets setup canal:#suporte cargo_suporte:@Equipe categoria:opcional canal_logs:opcional`. A operação cria/atualiza a configuração, ativa `TICKETS` explicitamente e publica o painel no canal indicado.

## Regras

- Um usuário possui no máximo um ticket aberto no MVP; um lock transacional PostgreSQL protege contra cliques simultâneos.
- Permissões do canal negam visualização para `@everyone` e a concedem ao autor e ao cargo de suporte.
- Fechamentos bloqueiam mensagens e criação/envio em tópicos pelo autor. O Worker verifica tickets fechados a cada 10 segundos e, após 30 segundos, gera transcript HTML em `storage/transcripts/`, envia o arquivo ao canal de logs configurado e remove o canal.
- `/tickets reabrir` cancela a remoção e libera novamente o canal enquanto os 30 segundos não tiverem passado.

## Extensão

Adicione categorias de negócio, limite configurável e transcript preservando o filtro `guildId` em toda consulta.
