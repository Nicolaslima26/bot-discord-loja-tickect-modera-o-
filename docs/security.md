# Segurança — Fase 1

- Isolamento por `guildId` é obrigatório no modelo, consultas e mutações.
- `/setup` valida contexto de guild e Administrador Discord.
- Setup é transacional e pode ser repetido sem duplicar módulos/membros.
- API usa Helmet e Zod; ainda não possui autenticação, portanto liga somente em `127.0.0.1` por padrão.
- Webhooks e pagamentos não foram implementados. Quando existirem, validar assinatura, buscar status no provider e deduplicar `eventId` antes de entregar produto.
