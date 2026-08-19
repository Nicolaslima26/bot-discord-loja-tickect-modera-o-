# ADR-001 — Fundação local e modular

## Contexto

O MVP precisa ser executável sem custo e evoluir para SaaS multi-tenant.

## Decisão

Usar monorepo pnpm, Node/TypeScript, Discord.js, Fastify, Prisma/PostgreSQL e Redis/BullMQ locais.

## Motivo

Separa processos e contratos, preserva integridade relacional e torna jobs assíncronos explícitos sem contratar infraestrutura.

## Consequências

Docker é conveniência, não requisito. A equipe deve manter APIs de providers desacopladas e filtros `guildId` em toda consulta de tenant.

## Status

Accepted.
