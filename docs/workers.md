# Workers

`apps/worker` cria a fila `discord-saas` em Redis e agenda `health-check` a cada minuto. É uma prova da infraestrutura BullMQ, não uma rotina de negócio. Webhooks, entregas e expiração de VIP devem entrar como jobs idempotentes com IDs determinísticos e política de retentativa documentada.

`delete-ticket-channel` é a primeira job de negócio: após 30 segundos de um fechamento, ela confirma que o ticket ainda está fechado, cria o transcript local, envia-o ao canal de logs configurado e remove o canal Discord. A confirmação do estado impede que uma reabertura seja apagada por uma job antiga.

Ao iniciar, o terminal deve exibir `Worker listening on queue "discord-saas".` e, após autenticar no Discord, o identificador do bot. Sem esses processos, jobs atrasadas continuam no Redis e não removem tickets.
