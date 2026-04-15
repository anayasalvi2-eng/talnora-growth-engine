import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { contentAssets, type ContentAsset, type NewContentAsset } from '../schema';
import { generateId } from '../../auth';
export interface ListContentOptions {
    type?: ContentAsset['type'];
    status?: ContentAsset['status'];
    limit?: number;
    offset?: number;
}
export class ContentService {
    constructor(private db: Database) {}
    async create(userId: string, data: {
        type: ContentAsset['type'];
        topic: string;
        content: string;
        metadata?: Record<string, any>;
    }): Promise<ContentAsset> {
        const [asset] = await this.db.insert(contentAssets).values({
            id: generateId(),
            userId,
            type: data.type,
            topic: data.topic,
            content: data.content,
            status: 'draft',
            metadata: data.metadata || {},
        }).returning();
        return asset;
    }
    async list(userId: string, options: ListContentOptions = {}): Promise<{ data: ContentAsset[], total: number }> {
        const { type, status, limit = 20, offset = 0 } = options;
        const conditions = [eq(contentAssets.userId, userId)];
        if (type) conditions.push(eq(contentAssets.type, type));
        if (status) conditions.push(eq(contentAssets.status, status));
        const [data, countResult] = await Promise.all([
            this.db.select().from(contentAssets)
                .where(and(...conditions))
                .orderBy(desc(contentAssets.createdAt))
                .limit(limit)
                .offset(offset),
            this.db.select({ count: sql<number>`count(*)` })
                .from(contentAssets)
                .where(and(...conditions))
        ]);
        return {
            data,
            total: countResult[0]?.count || 0
        };
    }
    async delete(id: string, userId: string): Promise<boolean> {
        const result = await this.db.delete(contentAssets)
            .where(and(eq(contentAssets.id, id), eq(contentAssets.userId, userId)));
        return result.meta.changes > 0;
    }
}
export function createContentService(db: Database): ContentService {
    return new ContentService(db);
}