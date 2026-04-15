/**
 * Drizzle Kit Configuration
 *
 * Used for generating and running database migrations.
 *
 * Commands:
 * - Generate migrations: npx drizzle-kit generate
 * - Push to database: npx drizzle-kit push
 * - Open Drizzle Studio: npx drizzle-kit studio
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './worker/database/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    verbose: true,
    strict: true,
    dbCredentials: {
        // For local development with wrangler
        // These are used when running `drizzle-kit push` or `drizzle-kit studio`
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.D1_DATABASE_ID!,
        token: process.env.CLOUDFLARE_API_TOKEN!,
    },
});
