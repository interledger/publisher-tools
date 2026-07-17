# Database Migrations

These "migration" scripts set up the database. See [Cloudflare D1 docs](https://developers.cloudflare.com/d1/reference/migrations/) for details.

## Applying migrations

During development:

```bash
pnpm -C api migrate
```

For production:

```bash
pnpm -C api migrate:prod
```
