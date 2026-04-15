/**
 * Database Schema - Drizzle ORM with D1
 *
 * This schema provides a production-ready foundation similar to Lovable's Supabase integration.
 * Includes users, sessions, and a sample items table for demonstration.
 *
 * To generate migrations: npx drizzle-kit generate
 * To apply migrations: npx drizzle-kit migrate
 */

import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ========================================
// USERS - Core user identity and authentication
// ========================================

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').unique(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),

    // Authentication
    passwordHash: text('password_hash'), // Bcrypt hashed password
    provider: text('provider').notNull().default('email'), // 'email', 'github', 'google'
    providerId: text('provider_id'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),

    // User preferences
    preferences: text('preferences', { mode: 'json' }).default('{}'),
    theme: text('theme', { enum: ['light', 'dark', 'system'] }).default('system'),

    // Account status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    // Security
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: integer('locked_until', { mode: 'timestamp' }),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
}, (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    usernameIdx: index('users_username_idx').on(table.username),
    providerIdx: index('users_provider_idx').on(table.provider, table.providerId),
}));

// ========================================
// SESSIONS - JWT session management
// ========================================

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Session metadata
    deviceInfo: text('device_info'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),

    // Token management
    tokenHash: text('token_hash').notNull(),

    // Security
    isRevoked: integer('is_revoked', { mode: 'boolean' }).default(false),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revokedReason: text('revoked_reason'),

    // Timestamps
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActivity: integer('last_activity', { mode: 'timestamp' }),
}, (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tokenHashIdx: index('sessions_token_hash_idx').on(table.tokenHash),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

// ========================================
// ITEMS - Sample CRUD table for demonstration
// ========================================

export const items = sqliteTable('items', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Item data
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['draft', 'active', 'archived'] }).default('draft'),

    // Metadata
    metadata: text('metadata', { mode: 'json' }).default('{}'),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdIdx: index('items_user_id_idx').on(table.userId),
    statusIdx: index('items_status_idx').on(table.status),
    createdAtIdx: index('items_created_at_idx').on(table.createdAt),
}));

// ========================================
// API KEYS - For programmatic access
// ========================================

export const apiKeys = sqliteTable('api_keys', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    keyPreview: text('key_preview').notNull(), // e.g., "sk_...abc123"

    // Scopes and permissions
    scopes: text('scopes', { mode: 'json' }).default('["read"]'),

    // Usage tracking
    lastUsed: integer('last_used', { mode: 'timestamp' }),
    requestCount: integer('request_count').default(0),

    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdIdx: index('api_keys_user_id_idx').on(table.userId),
    keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(table.keyHash),
}));

// ========================================
// TYPE EXPORTS - Auto-generated from schema
// ========================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
