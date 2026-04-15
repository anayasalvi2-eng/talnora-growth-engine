/**
 * Database Service - Core D1 connection and utilities
 *
 * Provides database connection using Drizzle ORM with D1.
 * Similar to Lovable's Supabase client pattern.
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export * from './schema';

export type Database = DrizzleD1Database<typeof schema>;

/**
 * Create a database instance from the D1 binding
 */
export function createDatabase(d1: D1Database): Database {
    return drizzle(d1, { schema });
}

/**
 * Database Service class for more complex applications
 * Provides connection management and health checks
 */
export class DatabaseService {
    public readonly db: Database;

    constructor(d1: D1Database) {
        this.db = drizzle(d1, { schema });
    }

    /**
     * Health check - verify database connectivity
     */
    async healthCheck(): Promise<{ healthy: boolean; timestamp: string }> {
        try {
            // Simple query to verify connection
            await this.db.select().from(schema.users).limit(1);
            return {
                healthy: true,
                timestamp: new Date().toISOString(),
            };
        } catch {
            return {
                healthy: false,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<{
        userCount: number;
        itemCount: number;
        sessionCount: number;
    }> {
        const [users, items, sessions] = await Promise.all([
            this.db.select({ count: schema.users.id }).from(schema.users),
            this.db.select({ count: schema.items.id }).from(schema.items),
            this.db.select({ count: schema.sessions.id }).from(schema.sessions),
        ]);

        return {
            userCount: users.length,
            itemCount: items.length,
            sessionCount: sessions.length,
        };
    }
}

/**
 * Factory function to create database service
 */
export function createDatabaseService(d1: D1Database): DatabaseService {
    return new DatabaseService(d1);
}
