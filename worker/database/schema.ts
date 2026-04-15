


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
  totalLeads: integer('total_leads').default(0),
  sentCount: integer('sent_count').default(0),
  openCount: integer('open_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('campaigns_user_id_idx').on(table.userId)
}));



export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type ContentAsset = typeof contentAssets.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewLead = typeof leads.$inferInsert;
export type NewContentAsset = typeof contentAssets.$inferInsert;
export type NewCampaign = typeof campaigns.$inferInsert;export const items = { _stubComment: "This is a **STUB** export for 'items', please implement it properly", id: () => {return null;}, userId: () => {return null;}, status: () => {return null;}, title: () => {return null;}, createdAt: () => {return null;}, updatedAt: () => {return null;} };export const Item = { _stubComment: "This is a **STUB** export for 'Item', please implement it properly", _stubFor: "Item" };export const NewItem = { _stubComment: "This is a **STUB** export for 'NewItem', please implement it properly", _stubFor: "NewItem" };