# Banco de dados — Fase 1

| Entidade | Finalidade | Regras/índices |
| --- | --- | --- |
| `Guild` | Tenant Discord | PK é `guildId`; setup atualiza nome e estado. |
| `GuildModule` | Módulos por tenant | Único em `(guildId,module)`; padrão desativado. |
| `GuildMembership` | Papel interno inicial | Único em `(guildId,userId)`. |
| `AuditLog` | Rastreabilidade | Índice `(guildId,createdAt)`. |

`GuildModule` e demais registros são apagados em cascata com a Guild. Crie migration após instalar dependências com `pnpm db:migrate --name init`.
