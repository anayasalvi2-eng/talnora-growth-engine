import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { campaigns, type Campaign, type NewCampaign } from '../schema';
import { generateId } from '../../auth';
export interface ListCampaignOptions {
    limit?: number;
    offset?: number;
}
export class CampaignService {
    constructor(private db: Database) {}
    async create(userId: string, data: { name: string; template?: string; metadata?: Record<string, any> }): Promise<Campaign> {
        const [campaign] = await this.db.insert(campaigns).values({
            id: generateId(),
            userId,
            name: data.name,
            template: data.template,
            status: 'draft',
            totalLeads: 0,
            sentCount: 0,
            openCount: 0,
            metadata: data.metadata || {},
        }).returning();
        return campaign;
    }
    async list(userId: string, options: ListCampaignOptions = {}): Promise<{ data: Campaign[], total: number }> {
        const { limit = 20, offset = 0 } = options;
        const conditions = [eq(campaigns.userId, userId)];
        const [data, countResult] = await Promise.all([
            this.db.select().from(campaigns)
                .where(and(...conditions))
                .orderBy(desc(campaigns.createdAt))
                .limit(limit)
                .offset(offset),
            this.db.select({ count: sql<number>`count(*)` })
                .from(campaigns)
                .where(and(...conditions))
        ]);
        return {
            data,
            total: countResult[0]?.count || 0
        };
    }
    async updateStatus(id: string, userId: string, status: Campaign['status']): Promise<Campaign | null> {
        const [campaign] = await this.db.update(campaigns)
            .set({ status })
            .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
            .returning();
        return campaign || null;
    }
    async delete(id: string, userId: string): Promise<boolean> {
        const result = await this.db.delete(campaigns)
            .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
        return result.meta.changes > 0;
    }
}
export function createCampaignService(db: Database): CampaignService {
    return new CampaignService(db);
}