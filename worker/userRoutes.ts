import { Hono, Context } from 'hono';
import { createDatabase } from './database';
import { createUserService } from './database/services/user-service';
import { createContentService } from './database/services/content-service';
import { createLeadService } from './database/services/lead-service';
import {
    createSession,
    validateSession,
    extractBearerToken,
} from './auth';
import type { AppEnv } from './types/app-env';
const authMiddleware = async (c: Context<AppEnv>, next: () => Promise<void>) => {
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
        const mockContent = `[AI Generated ${body.type.toUpperCase()}]\n\nTopic: ${body.topic}\n\nThis is placeholder content.`;
        const asset = await contentService.create(user.id, {
            type: body.type,
            topic: body.topic,
            content: mockContent as string
        });
        return c.json({ success: true, data: asset });
    });
    app.post('/api/public/score-resume', async (c) => {
        const formData = await c.req.formData();
        const email = formData.get('email') as string;
        const resume = formData.get('resume') as File;
        
        if (!email || !resume) return c.json({ success: false, error: 'Email and resume required' }, 400);

        const db = createDatabase(c.env.DB);
        const leadService = createLeadService(db);

        const score = 70 + Math.floor(Math.random() * 25); // Mock score
        const lead = await leadService.create({
            email,
            name: email.split('@')[0],
            source: 'resume-scorer',
            resumeScore: score,
            status: 'new',
            metadata: { filename: resume.name }
        });

        return c.json({ success: true, data: { score, feedback: ["Use more action verbs", "quantify achievements", "ATS-friendly layout detected"] } });
    });
    app.get('/api/leads', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const status = (c.req.query('status') || undefined) as any;
        const result = await createLeadService(db).list({ status });
        return c.json({ success: true, ...result });
    });
    app.patch('/api/leads/:id', authMiddleware, async (c) => {
        const id = c.req.param('id');
        const { status } = await c.req.json();
        const db = createDatabase(c.env.DB);
        const lead = await createLeadService(db).updateStatus(id, status);
        return c.json({ success: true, data: lead });
    });
    app.get('/api/leads/stats', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const stats = await createLeadService(db).getStats();
        return c.json({ success: true, data: stats });
    });
}