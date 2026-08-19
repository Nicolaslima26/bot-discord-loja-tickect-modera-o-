# Tickets — Fase 2

## Componentes

`apps/bot/src/tickets.ts` implementa o painel, abertura e fechamento. `TicketConfig` concentra as opções por tenant e `Ticket` registra o ciclo de vida do canal.

## Configuração

Um Administrador executa `/tickets setup canal:#suporte cargo_suporte:@Equipe categoria:opcional`. A operação cria/atualiza a configuração, ativa `TICKETS` explicitamente e publica o painel no canal indicado.

## Regras

- Um usuário possui no máximo um ticket aberto no MVP.
- Permissões do canal negam visualização para `@everyone` e a concedem ao autor e ao cargo de suporte.
- Fechamentos ficam registrados em `Ticket` e `AuditLog`; a geração de transcripts e remoção agendada do canal entrarão na próxima etapa.

## Extensão

Adicione categorias de negócio, limite configurável e transcript preservando o filtro `guildId` em toda consulta.
