# Workers

`apps/worker` cria a fila `discord-saas` em Redis e agenda `health-check` a cada minuto. É uma prova da infraestrutura BullMQ, não uma rotina de negócio. Webhooks, entregas e expiração de VIP devem entrar como jobs idempotentes com IDs determinísticos e política de retentativa documentada.
