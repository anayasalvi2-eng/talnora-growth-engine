import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').unique(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    passwordHash: text('password_hash'),
    provider: text('provider').notNull().default('email'),
    providerId: text('provider_id'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    preferences: text('preferences', { mode: 'json' }).default('{}'),
    theme: text('theme', { enum: ['light', 'dark', 'system'] }).default('system'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: integer('locked_until', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActiveAt: integer('last_active_at', { mode: 'timestamp' })
}, (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    usernameIdx: index('users_username_idx').on(table.username)
}));
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    deviceInfo: text('device_info'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    tokenHash: text('token_hash').notNull(),
    isRevoked: integer('is_revoked', { mode: 'boolean' }).default(false),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revokedReason: text('revoked_reason'),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActivity: integer('last_activity', { mode: 'timestamp' })
}, (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tokenHashIdx: index('sessions_token_hash_idx').on(table.tokenHash)
}));
export const items = sqliteTable('items', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    userIdIdx: index('items_user_id_idx').on(table.userId),
    statusIdx: index('items_status_idx').on(table.status)
}));
export const leads = sqliteTable('leads', {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name'),
    source: text('source').notNull().default('manual'),
    resumeScore: integer('resume_score'),
    resumeUrl: text('resume_url'),
    status: text('status', { enum: ['new', 'contacted', 'qualified', 'converted', 'archived'] }).default('new'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    emailIdx: index('leads_email_idx').on(table.email),
    statusIdx: index('leads_status_idx').on(table.status),
    sourceIdx: index('leads_source_idx').on(table.source)
}));
export const contentAssets = sqliteTable('content_assets', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['blog', 'linkedin', 'reddit', 'video_script', 'email'] }).notNull(),
    topic: text('topic').notNull(),
    content: text('content').notNull(),
    status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    userIdIdx: index('content_assets_user_id_idx').on(table.userId),
    typeIdx: index('content_assets_type_idx').on(table.type),
    statusIdx: index('content_assets_status_idx').on(table.status)
}));
export const campaigns = sqliteTable('campaigns', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: text('status', { enum: ['draft', 'active', 'paused', 'completed'] }).default('draft'),
    template: text('template'),
    totalLeads: integer('total_leads').default(0),
    sentCount: integer('sent_count').default(0),
    openCount: integer('open_count').default(0),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    userIdIdx: index('campaigns_user_id_idx').on(table.userId)
}));
export const topics = sqliteTable('topics', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    score: integer('score').notNull(),
    source: text('source').notNull(),
    status: text('status', { enum: ['suggested', 'approved', 'dismissed', 'generated'] }).default('suggested'),
    suggestedType: text('suggested_type', { enum: ['blog', 'linkedin', 'reddit', 'video_script', 'email'] }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    statusIdx: index('topics_status_idx').on(table.status)
}));
export const blogs = sqliteTable('blogs', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    metaDescription: text('meta_description'),
    content: text('content').notNull(),
    status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    userIdIdx: index('blogs_user_id_idx').on(table.userId),
    slugIdx: uniqueIndex('blogs_slug_idx').on(table.slug)
}));
export const events = sqliteTable('events', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    leadId: text('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
    eventTypeIdx: index('events_type_idx').on(table.eventType),
    userIdIdx: index('events_user_id_idx').on(table.userId),
    leadIdIdx: index('events_lead_id_idx').on(table.leadId)
}));
export const publishLogs = sqliteTable('publish_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    contentId: text('content_id').notNull().references(() => contentAssets.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    status: text('status').notNull(),
    url: text('url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
});
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type ContentAsset = typeof contentAssets.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Blog = typeof blogs.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type PublishLog = typeof publishLogs.$inferSelect;