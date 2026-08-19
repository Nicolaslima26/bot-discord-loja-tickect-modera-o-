# Discord SaaS

Plataforma SaaS multi-tenant para Discord. Cada servidor é um tenant identificado pelo `guildId`; a fundação atual contém Bot, API, worker, PostgreSQL/Prisma, Redis/BullMQ e o sistema central de módulos.

## Estado atual

Fase 1 implementada: monorepo TypeScript, schema inicial, `/ping`, `/setup`, guard de módulos, API local e worker. Loja, tickets, AutoMod, OAuth2, dashboard e billing ainda não foram implementados.

## Requisitos e custo

Node.js 24+ e pnpm 11+ são necessários. PostgreSQL e Redis podem rodar localmente ou via Docker Compose. Docker não está instalado nesta máquina no momento; instale Docker Desktop ou forneça instâncias locais já em execução.

| Componente | Custo inicial | Cartão | Local |
| --- | --- | --- | --- |
| Node.js, pnpm, TypeScript | R$ 0 | Não | Sim |
| PostgreSQL, Redis, BullMQ | R$ 0 | Não | Sim |
| Discord Developer Portal | R$ 0 | Não | Não |
| Docker Desktop (opcional) | R$ 0 | Não | Sim |

## Como executar

1. Copie `.env.example` para `.env` e configure as credenciais do Discord. Todos os processos carregam explicitamente esse arquivo raiz.
2. Inicie PostgreSQL e Redis: `docker compose up -d postgres redis` (ou use serviços locais nas mesmas URLs).
3. Instale dependências: `pnpm install`.
4. Gere o Prisma Client: `pnpm db:generate`.
5. Crie a primeira migration: `pnpm db:migrate --name init`.
6. Registre os comandos: `pnpm --filter @discord-saas/bot commands:deploy`.
7. Inicie Bot, API e worker: `pnpm dev`.

API health check: `GET http://127.0.0.1:3001/health`.

## Segurança e limites de Fase 1

- Todo dado de tenant no schema usa `guildId`; as leituras e gravações de módulos são condicionadas por esse ID.
- `/setup` requer Administrador do Discord e usa transação/idempotência.
- A API ainda **não tem OAuth2 nem sessão**; os endpoints de configuração são apenas para desenvolvimento local e não devem ser expostos publicamente antes da Fase 5.
- Nenhum segredo é versionado; use somente `.env` local.

Leia [AI_CONTEXT.md](AI_CONTEXT.md) e `docs/` antes de estender a aplicação.
