# Arquitetura

```text
Discord Bot ─┐
             ├── PostgreSQL (Prisma)
Fastify API ─┤
             └── Redis → BullMQ Worker
Dashboard (Fase 5) ── API
```

O monorepo separa processos executáveis de contratos compartilhados. O bot trata interações; API concentra endpoints; worker executa tarefas adiáveis. Futuras integrações de storage e pagamento entram atrás de interfaces no módulo consumidor, nunca no núcleo.

## Isolamento

`Guild.id` é o Discord `guildId`. Tabelas de tenant usam FK e chaves compostas com `guildId`. Não introduza um `findMany()` em dados de tenant sem `where: { guildId }`.
