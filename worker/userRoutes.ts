import { Hono, Context } from 'hono';
import { eq } from 'drizzle-orm';
import { createDatabase } from './database';
import { users } from './database/schema';
import { 
    createUserService, 
    createContentService, 
    createLeadService, 
    createCampaignService,
    createBlogService,
    createEventService,
    createTopicService,
    createItemService
} from './database/services';
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
export function userRoutes(app: Hono<any>) {
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
    app.put('/api/auth/me', authMiddleware, async (c) => {
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const currentUser = c.get('user');
        const [updatedUser] = await db.update(users)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(users.id, currentUser.id))
            .returning();
        return c.json({ success: true, data: updatedUser });
    });
    app.get('/api/items', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const result = await createItemService(db).list(c.get('user').id);
        return c.json({ success: true, data: result.data });
    });
    app.post('/api/items', authMiddleware, async (c) => {
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const item = await createItemService(db).create(c.get('user').id, body);
        return c.json({ success: true, data: item });
    });
    app.delete('/api/items/:id', authMiddleware, async (c) => {
        const id = c.req.param('id');
        if (!id) return c.json({ success: false, error: 'ID required' }, 400);
        const db = createDatabase(c.env.DB);
        await createItemService(db).delete(id, c.get('user').id);
        return c.json({ success: true });
    });
    app.get('/api/topics', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const topicService = createTopicService(db);
        let list = await topicService.listSuggestions();
        if (list.length === 0) {
            list = await topicService.generateSuggestions(c.get('user').id);
        }
        return c.json({ success: true, data: list });
    });
    app.patch('/api/topics/:id', authMiddleware, async (c) => {
        const id = c.req.param('id');
        if (!id) return c.json({ success: false, error: 'ID required' }, 400);
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const topic = await createTopicService(db).updateStatus(id, body.status);
        return c.json({ success: true, data: topic });
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
        const mockContent = `[AI Generated ${body.type.toUpperCase()}]\n\nTopic: ${body.topic}\n\nOptimized for Talnora Growth Engine.`;
        const asset = await contentService.create(user.id, {
            type: body.type,
            topic: body.topic,
            content: mockContent
        });
        return c.json({ success: true, data: asset });
    });
    app.get('/api/blogs', async (c) => {
        const db = createDatabase(c.env.DB);
        const result = await createBlogService(db).list({ status: 'published' });
        return c.json({ success: true, ...result });
    });
    app.get('/api/blogs/:slug', async (c) => {
        const slug = c.req.param('slug');
        if (!slug) return c.json({ success: false, error: 'Slug required' }, 400);
        const db = createDatabase(c.env.DB);
        const blog = await createBlogService(db).getBySlug(slug);
        if (!blog) return c.json({ success: false, error: 'Not found' }, 404);
        return c.json({ success: true, data: blog });
    });
    app.post('/api/public/score-resume', async (c) => {
        const formData = await c.req.formData();
        const email = formData.get('email')?.toString();
        const resume = formData.get('resume') as File | null;
        if (!email || !resume) return c.json({ success: false, error: 'Email and resume required' }, 400);
        const db = createDatabase(c.env.DB);
        const leadService = createLeadService(db);
        const eventService = createEventService(db);
        const score = 70 + Math.floor(Math.random() * 25);
        try {
            const lead = await leadService.create({
                email,
                name: email.split('@')[0],
                source: 'resume-scorer',
                resumeScore: score,
                status: 'new',
                metadata: { filename: resume.name }
            });
            await eventService.logEvent({
                leadId: lead.id,
                eventType: 'resume_upload',
                metadata: { score, filename: resume.name }
            });
            return c.json({ success: true, data: { score, feedback: ["Optimized formatting for ATS", "Improved skill density"] } });
        } catch (err) {
            return c.json({ success: false, error: 'Failed to process lead capture' }, 500);
        }
    });
    app.get('/api/leads', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const status = (c.req.query('status') || undefined) as any;
        const result = await createLeadService(db).list({ status });
        return c.json({ success: true, ...result });
    });
    app.get('/api/leads/stats', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const stats = await createLeadService(db).getStats();
        return c.json({ success: true, data: stats });
    });
    app.patch('/api/leads/:id', authMiddleware, async (c) => {
        const id = c.req.param('id');
        if (!id) return c.json({ success: false, error: 'ID required' }, 400);
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const lead = await createLeadService(db).updateStatus(id, body.status);
        return c.json({ success: true, data: lead });
    });
    app.post('/api/campaigns/:id/execute', authMiddleware, async (c) => {
        const id = c.req.param('id');
        if (!id) return c.json({ success: false, error: 'ID required' }, 400);
        const db = createDatabase(c.env.DB);
        const campaignService = createCampaignService(db);
        const campaign = await campaignService.updateStatus(id, c.get('user').id, 'active');
        return c.json({ success: true, data: campaign });
    });
    app.get('/api/campaigns', authMiddleware, async (c) => {
        const user = c.get('user');
        const db = createDatabase(c.env.DB);
        const result = await createCampaignService(db).list(user.id);
        return c.json({ success: true, ...result });
    });
    app.post('/api/campaigns', authMiddleware, async (c) => {
        const user = c.get('user');
        const body = await c.req.json();
        const db = createDatabase(c.env.DB);
        const campaign = await createCampaignService(db).create(user.id, body);
        return c.json({ success: true, data: campaign });
    });
    app.delete('/api/campaigns/:id', authMiddleware, async (c) => {
        const id = c.req.param('id');
        if (!id) return c.json({ success: false, error: 'ID required' }, 400);
        const db = createDatabase(c.env.DB);
        await createCampaignService(db).delete(id, c.get('user').id);
        return c.json({ success: true });
    });
    app.get('/api/events/recent', authMiddleware, async (c) => {
        const db = createDatabase(c.env.DB);
        const events = await createEventService(db).getRecentEvents(10);
        return c.json({ success: true, data: events });
    });
}