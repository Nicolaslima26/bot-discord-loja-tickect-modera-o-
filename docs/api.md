# API — Fase 1

## `GET /health`

Verifica conectividade PostgreSQL. Retorna `200 { status: "ok", service: "api" }`.

## `GET /api/guilds/:guildId/modules`

Lista módulos de uma guild. `guildId` deve ser snowflake Discord de 17–20 dígitos. A resposta só contém registros daquele tenant.

## `PUT /api/guilds/:guildId/modules/:module`

Body: `{ "enabled": boolean }`; `module` é `STORE`, `TICKETS` ou `MODERATION`. Faz upsert pela chave composta do tenant.

**Segurança:** os endpoints são locais para desenvolvimento. OAuth2, sessão e autorização de administrador serão obrigatórios antes de exposição pública.
