# Módulos

Catálogo atual: `STORE`, `TICKETS`, `MODERATION`, exportado por `@discord-saas/shared`. A autorização passa por `apps/api/src/services/module-guard.ts`; a chamada é `await moduleGuard.require(guildId, Module.TICKETS)`.

Para adicionar um módulo: atualize o enum Prisma, o enum compartilhado, gere migration, acrescente o default no setup e documente limites/plano correspondentes. Não faça verificações ad hoc.

No MVP de Tickets, `/tickets setup` é o ponto administrativo explícito que configura e ativa o módulo para aquele tenant.
