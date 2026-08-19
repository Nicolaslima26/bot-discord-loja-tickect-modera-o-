# Changelog

## [0.1.0] - 2026-08-18

### Added

- Fundação do monorepo para Discord SaaS.
- PostgreSQL/Prisma com guilds, módulos, membros e auditoria tenant-scoped.
- Bot Discord com `/ping` e `/setup` idempotente.
- API Fastify local, guard central de módulos e worker BullMQ.
- Docker Compose, configuração de ambiente e documentação de arquitetura.

### Fixed

- Scripts do Bot, API e worker agora carregam o `.env` raiz como os scripts Prisma.
- `/setup` não depende mais do cache local de guilds e usa a flag moderna para respostas efêmeras.
- `/setup` não faz mais uma busca REST de guild desnecessária, evitando falhas `Unknown Guild`.
