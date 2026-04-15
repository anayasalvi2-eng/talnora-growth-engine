/**
 * API Routes - Authentication and CRUD endpoints
 *
 * This file defines all user-facing API routes.
 * Similar to Lovable's Supabase-powered API patterns.
 */

import { Hono } from 'hono';
import { createDatabase } from './database';
import { users } from './database/schema';
import { createUserService } from './database/services/user-service';
import { createItemService } from './database/services/item-service';
import {
    createSession,
    validateSession,
    revokeSession,
    revokeAllSessions,
    extractBearerToken,
} from './auth';
import type { AppEnv } from './types/app-env';

// ========================================
// MIDDLEWARE
// ========================================

/**
 * Authentication middleware - validates session and attaches user to context
 */
const authMiddleware = async (c: any, next: () => Promise<void>) => {
    const token = extractBearerToken(c.req.raw);
    if (!token) {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const db = createDatabase(c.env.DB);
    const jwtSecret = c.env.JWT_SECRET;

    const result = await validateSession(db, token, jwtSecret);
    if (!result) {
        return c.json({ success: false, error: 'Invalid or expired session' }, 401);
    }

    // Attach user and session to context
    c.set('user', result.user);
    c.set('session', result.session);

    await next();
};

// ========================================
// ROUTES
// ========================================

export function userRoutes(app: Hono<AppEnv>) {
    // ----------------------------------------
    // AUTH ROUTES
    // ----------------------------------------

    /**
     * POST /api/auth/register
     * Register a new user with email/password
     */
    app.post('/api/auth/register', async (c) => {
        try {
            const body = await c.req.json();
            const { email, password, displayName, username } = body;

            if (!email || !password) {
                return c.json({ success: false, error: 'Email and password required' }, 400);
            }

            // Validate password strength
            if (password.length < 8) {
                return c.json({ success: false, error: 'Password must be at least 8 characters' }, 400);
            }

            const db = createDatabase(c.env.DB);
            const userService = createUserService(db);

            const { user, error } = await userService.register({
                email,
                password,
                displayName,
                username,
            });

            if (error) {
                return c.json({ success: false, error }, 400);
            }

            // Create session
            const jwtSecret = c.env.JWT_SECRET;
            const ttl = parseInt(c.env.SESSION_TTL || '604800');
            const { token } = await createSession(db, user.id, c.req.raw, jwtSecret, ttl);

            return c.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                    },
                    token,
                },
            });
        } catch (error) {
            console.error('[AUTH] Register error:', error);
            return c.json({ success: false, error: 'Registration failed' }, 500);
        }
    });

    /**
     * POST /api/auth/login
     * Login with email/password
     */
    app.post('/api/auth/login', async (c) => {
        try {
            const body = await c.req.json();
            const { email, password } = body;

            if (!email || !password) {
                return c.json({ success: false, error: 'Email and password required' }, 400);
            }

            const db = createDatabase(c.env.DB);
            const userService = createUserService(db);

            const { user, error } = await userService.login({ email, password });

            if (error || !user) {
                return c.json({ success: false, error: error || 'Login failed' }, 401);
            }

            // Create session
            const jwtSecret = c.env.JWT_SECRET;
            const ttl = parseInt(c.env.SESSION_TTL || '604800');
            const { token } = await createSession(db, user.id, c.req.raw, jwtSecret, ttl);

            return c.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                    },
                    token,
                },
            });
        } catch (error) {
            console.error('[AUTH] Login error:', error);
            return c.json({ success: false, error: 'Login failed' }, 500);
        }
    });

    /**
     * POST /api/auth/logout
     * Logout current session
     */
    app.post('/api/auth/logout', authMiddleware, async (c) => {
        try {
            const session = c.get('session');
            const db = createDatabase(c.env.DB);

            await revokeSession(db, session.id, 'User logout');

            return c.json({ success: true });
        } catch (error) {
            console.error('[AUTH] Logout error:', error);
            return c.json({ success: false, error: 'Logout failed' }, 500);
        }
    });

    /**
     * POST /api/auth/logout-all
     * Logout all sessions for current user
     */
    app.post('/api/auth/logout-all', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const db = createDatabase(c.env.DB);

            await revokeAllSessions(db, user.id, 'User logout all');

            return c.json({ success: true });
        } catch (error) {
            console.error('[AUTH] Logout all error:', error);
            return c.json({ success: false, error: 'Logout failed' }, 500);
        }
    });

    /**
     * GET /api/auth/me
     * Get current user profile
     */
    app.get('/api/auth/me', authMiddleware, async (c) => {
        const user = c.get('user');

        return c.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                theme: user.theme,
                preferences: user.preferences,
                createdAt: user.createdAt,
            },
        });
    });

    /**
     * PUT /api/auth/me
     * Update current user profile
     */
    app.put('/api/auth/me', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();

            const db = createDatabase(c.env.DB);
            const userService = createUserService(db);

            const updatedUser = await userService.updateProfile(user.id, {
                displayName: body.displayName,
                username: body.username,
                avatarUrl: body.avatarUrl,
                theme: body.theme,
                preferences: body.preferences,
            });

            if (!updatedUser) {
                return c.json({ success: false, error: 'Update failed' }, 500);
            }

            return c.json({
                success: true,
                data: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    displayName: updatedUser.displayName,
                    avatarUrl: updatedUser.avatarUrl,
                    theme: updatedUser.theme,
                    preferences: updatedUser.preferences,
                },
            });
        } catch (error: any) {
            console.error('[AUTH] Update profile error:', error);
            return c.json({ success: false, error: error.message || 'Update failed' }, 400);
        }
    });

    // ----------------------------------------
    // ITEMS ROUTES (CRUD EXAMPLE)
    // ----------------------------------------

    /**
     * GET /api/items
     * List items for current user
     */
    app.get('/api/items', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const db = createDatabase(c.env.DB);
            const itemService = createItemService(db);

            // Parse query parameters
            const url = new URL(c.req.url);
            const options = {
                status: url.searchParams.get('status') as 'draft' | 'active' | 'archived' | undefined,
                search: url.searchParams.get('search') || undefined,
                sortBy: (url.searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'title',
                sortOrder: (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
                limit: parseInt(url.searchParams.get('limit') || '20'),
                offset: parseInt(url.searchParams.get('offset') || '0'),
            };

            const result = await itemService.list(user.id, options);

            return c.json({ success: true, ...result });
        } catch (error) {
            console.error('[ITEMS] List error:', error);
            return c.json({ success: false, error: 'Failed to list items' }, 500);
        }
    });

    /**
     * POST /api/items
     * Create a new item
     */
    app.post('/api/items', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();

            if (!body.title) {
                return c.json({ success: false, error: 'Title is required' }, 400);
            }

            const db = createDatabase(c.env.DB);
            const itemService = createItemService(db);

            const item = await itemService.create(user.id, {
                title: body.title,
                description: body.description,
                status: body.status,
                metadata: body.metadata,
            });

            return c.json({ success: true, data: item }, 201);
        } catch (error) {
            console.error('[ITEMS] Create error:', error);
            return c.json({ success: false, error: 'Failed to create item' }, 500);
        }
    });

    /**
     * GET /api/items/:id
     * Get a single item
     */
    app.get('/api/items/:id', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const itemId = c.req.param('id');

            const db = createDatabase(c.env.DB);
            const itemService = createItemService(db);

            const item = await itemService.getById(itemId, user.id);

            if (!item) {
                return c.json({ success: false, error: 'Item not found' }, 404);
            }

            return c.json({ success: true, data: item });
        } catch (error) {
            console.error('[ITEMS] Get error:', error);
            return c.json({ success: false, error: 'Failed to get item' }, 500);
        }
    });

    /**
     * PUT /api/items/:id
     * Update an item
     */
    app.put('/api/items/:id', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const itemId = c.req.param('id');
            const body = await c.req.json();

            const db = createDatabase(c.env.DB);
            const itemService = createItemService(db);

            const item = await itemService.update(itemId, user.id, {
                title: body.title,
                description: body.description,
                status: body.status,
                metadata: body.metadata,
            });

            if (!item) {
                return c.json({ success: false, error: 'Item not found' }, 404);
            }

            return c.json({ success: true, data: item });
        } catch (error) {
            console.error('[ITEMS] Update error:', error);
            return c.json({ success: false, error: 'Failed to update item' }, 500);
        }
    });

    /**
     * DELETE /api/items/:id
     * Delete an item
     */
    app.delete('/api/items/:id', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const itemId = c.req.param('id');

            const db = createDatabase(c.env.DB);
            const itemService = createItemService(db);

            const deleted = await itemService.delete(itemId, user.id);

            if (!deleted) {
                return c.json({ success: false, error: 'Item not found' }, 404);
            }

            return c.json({ success: true });
        } catch (error) {
            console.error('[ITEMS] Delete error:', error);
            return c.json({ success: false, error: 'Failed to delete item' }, 500);
        }
    });

    /**
     * GET /api/items/stats
     * Get item statistics
     */
    app.get('/api/items/stats', authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const db = createDatabase(c.env.DB);
            const itemService = createItemService(db);

            const counts = await itemService.countByStatus(user.id);

            return c.json({
                success: true,
                data: counts,
            });
        } catch (error) {
            console.error('[ITEMS] Stats error:', error);
            return c.json({ success: false, error: 'Failed to get stats' }, 500);
        }
    });

    // ----------------------------------------
    // DATABASE HEALTH
    // ----------------------------------------

    /**
     * GET /api/db/health
     * Check database health
     */
    app.get('/api/db/health', async (c) => {
        try {
            const db = createDatabase(c.env.DB);
            // Simple query to verify connection
            await db.select().from(users).limit(1);

            return c.json({
                success: true,
                data: {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            console.error('[DB] Health check error:', error);
            return c.json({
                success: false,
                data: {
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                },
            }, 500);
        }
    });
}
