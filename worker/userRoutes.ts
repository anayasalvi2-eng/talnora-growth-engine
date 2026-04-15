import { Hono } from 'hono';
import { createDatabase } from './database';
import { createUserService } from './database/services/user-service';
import { createContentService } from './database/services/content-service';
import {
    createSession,
    validateSession,
    revokeSession,
    revokeAllSessions,
    extractBearerToken,
} from './auth';
import type { AppEnv } from './types/app-env';
const authMiddleware = async (c: any, next: () => Promise<void>) => {
    const token = extractBearerToken(c.req.raw);
    if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const db = createDatabase(c.env.DB);
    const result = await validateSession(db, token, c.env.JWT_SECRET);
    if (!result) return c.json({ success: false, error: 'Invalid session' }, 401);
    c.set('user', result.user);
    c.set('session', result.session);
    await next();
};
export function userRoutes(app: Hono<AppEnv>) {
    app.post('/api/auth/register', async (c) => {
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const { user, error } = await createUserService(db).register(body);
        if (error) return c.json({ success: false, error }, 400);
        const { token } = await createSession(db, user.id, c.req.raw, c.env.JWT_SECRET);
        return c.json({ success: true, data: { user, token } });
    });
    app.post('/api/auth/login', async (c) => {
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const { user, error } = await createUserService(db).login(body);
        if (error || !user) return c.json({ success: false, error: error || 'Login failed' }, 401);
        const { token } = await createSession(db, user.id, c.req.raw, c.env.JWT_SECRET);
        return c.json({ success: true, data: { user, token } });
    });
    app.get('/api/auth/me', authMiddleware, async (c) => {
        return c.json({ success: true, data: c.get('user') });
    });
    app.get('/api/content', authMiddleware, async (c) => {
        const user = c.get('user');
        const db = createDatabase(c.env.DB);
        const type = c.req.query('type') as any;
        const result = await createContentService(db).list(user.id, { type });
        return c.json({ success: true, ...result });
    });
    app.post('/api/content/generate', authMiddleware, async (c) => {
        const user = c.get('user');
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const contentService = createContentService(db);
        // Mock OpenAI logic for MVP
        const mockContent = `[AI Generated ${body.type.toUpperCase()}]\n\nTopic: ${body.topic}\n\nThis is a placeholder for high-quality marketing content generated for Talnora Growth Engine. In production, this would interface with OpenAI GPT-4o to provide tailored outreach material based on lead profiles and business goals.`;
        const asset = await contentService.create(user.id, {
            type: body.type,
            topic: body.topic,
            content: mockContent
        });
        return c.json({ success: true, data: asset });
    });
}