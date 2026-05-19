# Database Migrations

These "migration" scripts set up the database. Each script is to be run in order, with each subsequent one building on the previous ones. Each script may have a "down" script (`xyz.down.sql` files) to rollback in case of errors. In general, if the changes that a SQL script wants to apply are already applied, its responsibility of the script to do nothing.

See [Cloudflare D1 docs](https://developers.cloudflare.com/d1/get-started/#populate-your-d1-database) for an idea.

## Applying migrations

1. `cd api`
2. During development:
   ```bash
   pnpm db ./migrations/XYZ-abc.sql
   ```
   For production:
   ```bash
   pnpm db:prod ./migrations/XYZ-abc.sql
   ```
