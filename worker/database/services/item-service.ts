import { eq, and, desc, asc, like, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { items, type Item, type NewItem } from '../schema';
import { generateId } from '../../auth';
export interface ListItemsOptions {
    status?: 'draft' | 'active' | 'archived';
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
export class ItemService {
    constructor(private db: Database) {}
    async create(userId: string, data: Partial<NewItem>): Promise<Item> {
        const [item] = await this.db.insert(items).values({
            id: generateId(),
            userId,
            title: data.title || 'Untitled',
            description: data.description,
            status: data.status || 'draft',
            metadata: data.metadata || {},
        }).returning();
        return item;
    }
    async delete(itemId: string, userId: string): Promise<boolean> {
        const result = await this.db
            .delete(items)
            .where(
                and(
                    eq(items.id, itemId),
                    eq(items.userId, userId)
                )
            );
        return (result?.meta?.changes ?? 0) > 0;
    }
    async list(userId: string, options: ListItemsOptions = {}): Promise<PaginatedResult<Item>> {
        const {
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            limit = 20,
            offset = 0,
        } = options;
        const conditions = [eq(items.userId, userId)];
        if (status) conditions.push(eq(items.status, status));
        if (search) conditions.push(like(items.title, `%${search}%`));
        const orderColumn = {
            createdAt: items.createdAt,
            updatedAt: items.updatedAt,
            title: items.title,
        }[sortBy];
        const orderFn = sortOrder === 'asc' ? asc : desc;
        const [data, countResult] = await Promise.all([
            this.db.select().from(items).where(and(...conditions)).orderBy(orderFn(orderColumn)).limit(limit).offset(offset),
            this.db.select({ count: sql<number>`count(*)` }).from(items).where(and(...conditions)),
        ]);
        const total = countResult[0]?.count || 0;
        return {
            data,
            pagination: { total, limit, offset, hasMore: offset + limit < total },
        };
    }
}
export function createItemService(db: Database): ItemService {
    return new ItemService(db);
}