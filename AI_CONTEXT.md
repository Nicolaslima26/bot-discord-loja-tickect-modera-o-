# AI Context — Discord SaaS

## Objetivo e estado

SaaS comercial multi-tenant para Discord. Cada `guildId` é um tenant; isolamento é a regra prioritária. A Fase 2 possui Tickets com painel, canais privados, fechamento/reabertura, exclusão assíncrona, transcripts locais e logs opcionais.

## Estrutura

- `apps/bot`: Discord.js, comandos e eventos.
- `apps/api`: Fastify. O `ModuleGuard` é a única entrada para verificar módulos.
- `apps/worker`: BullMQ; jobs lentos ou que exigem retentativa devem ir aqui.
- `apps/dashboard`: reservado para Next.js/OAuth2 na Fase 5.
- `packages/database`: Prisma Client compartilhado.
- `packages/shared`: contratos sem dependência de infraestrutura.
- `prisma/schema.prisma`: fonte de verdade do banco.

## Regras invariantes

1. Toda entidade específica de servidor deve ter `guildId`, índices adequados e consultas filtradas por ele.
2. Não se verifica módulo fora de `ModuleGuard`.
3. Mudanças multi-registro críticas usam transação e são idempotentes.
4. Segredos ficam em `.env`; nunca em código, logs ou git.
5. Ao implementar: código, testes, docs, changelog e este contexto.

O `/setup` usa `interaction.guildId` como a identidade confiável do tenant e não faz uma busca REST de guild durante a inicialização; falhas nessa busca não podem impedir o setup.

Fechar ticket agenda `delete-ticket-channel` no BullMQ. Portanto o Worker deve estar executando para gerar o HTML em `storage/transcripts/`, enviar o arquivo ao canal de logs e remover o canal. Não substitua esta job por `setTimeout`, pois jobs precisam sobreviver a reinicializações.

## Execução

Veja `README.md`. Requer Node/pnpm, PostgreSQL e Redis locais. Prisma, Bot, API e worker carregam explicitamente o `.env` raiz. Não há custo nem dependência de serviço pago. Docker é opcional.

## Decisões

- Fastify por baixo overhead e validação explícita com Zod.
- Prisma/PostgreSQL para relações e integridade transacional.
- Redis/BullMQ para trabalho assíncrono e retentativas futuras.
- Módulos começam desativados no setup (secure by default).

## Lacunas conhecidas

OAuth2/dashboard, planos/assinaturas, autorização interna por papel, todos os módulos de negócio, migrations versionadas e testes de integração dependentes de banco ainda não existem.
