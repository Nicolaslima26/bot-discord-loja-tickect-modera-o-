# Desenvolvimento local e migração

O ambiente atual usa PostgreSQL, Redis e armazenamento local, todos sem custo. `docker-compose.yml` é opcional; sem Docker, execute as mesmas dependências localmente e mantenha URLs no `.env`.

Para produção, substitua somente configurações e adapters (PostgreSQL/Redis hospedados, S3/R2, provider de pagamento). Não use caminhos absolutos. Antes da exposição pública, implemente OAuth2, HTTPS, rate limits e gerenciamento de segredos.
