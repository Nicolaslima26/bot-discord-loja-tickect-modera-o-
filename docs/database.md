# Banco de dados — Fase 1

| Entidade | Finalidade | Regras/índices |
| --- | --- | --- |
| `Guild` | Tenant Discord | PK é `guildId`; setup atualiza nome e estado. |
| `GuildModule` | Módulos por tenant | Único em `(guildId,module)`; padrão desativado. |
| `GuildMembership` | Papel interno inicial | Único em `(guildId,userId)`. |
| `AuditLog` | Rastreabilidade | Índice `(guildId,createdAt)`. |
| `TicketConfig` | Configuração única de tickets | PK é `guildId`; identifica painel, cargo de suporte e categoria. |
| `Ticket` | Atendimento por canal | Único em `channelId` e `(guildId,sequence)`; índices por autor/status. |

`GuildModule` e demais registros são apagados em cascata com a Guild. Crie migration após instalar dependências com `pnpm db:migrate --name init`.
