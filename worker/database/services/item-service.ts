/**
 * Item Service - CRUD operations for items
 *
 * Demonstrates the service pattern for database operations.
 * Use this as a template for your own entity services.
 */

import { eq, and, desc, asc, like, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { items, type Item, type NewItem } from '../schema';
import { generateId } from '../../auth';

// ========================================
// TYPES
// ========================================

export interface CreateItemData {
    title: string;
    description?: string;
    status?: 'draft' | 'active' | 'archived';
    metadata?: Record<string, unknown>;
}

export interface UpdateItemData {
    title?: string;
    description?: string;
    status?: 'draft' | 'active' | 'archived';
    metadata?: Record<string, unknown>;
}

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

// ========================================
// ITEM SERVICE
// ========================================

export class ItemService {
    constructor(private db: Database) {}

    /**
     * Create a new item
     */
    async create(userId: string, data: CreateItemData): Promise<Item> {
        const [item] = await this.db.insert(items).values({
            id: generateId(),
            userId,
            title: data.title,
            description: data.description,
            status: data.status || 'draft',
            metadata: data.metadata || {},
        }).returning();

        return item;
    }

    /**
     * Get item by ID (with ownership check)
     */
    async getById(itemId: string, userId: string): Promise<Item | null> {
        const [item] = await this.db
            .select()
            .from(items)
            .where(
                and(
                    eq(items.id, itemId),
                    eq(items.userId, userId)
                )
            )
            .limit(1);

        return item || null;
    }

    /**
     * Get item by ID (without ownership check - for admin use)
     */
    async getByIdUnsafe(itemId: string): Promise<Item | null> {
        const [item] = await this.db
            .select()
            .from(items)
            .where(eq(items.id, itemId))
            .limit(1);

        return item || null;
    }

    /**
     * Update an item
     */
    async update(itemId: string, userId: string, data: UpdateItemData): Promise<Item | null> {
        // Build update object
        const updates: Partial<NewItem> = {
            updatedAt: new Date(),
        };

        if (data.title !== undefined) updates.title = data.title;
        if (data.description !== undefined) updates.description = data.description;
        if (data.status !== undefined) updates.status = data.status;
        if (data.metadata !== undefined) updates.metadata = data.metadata;

        const [item] = await this.db
            .update(items)
            .set(updates)
            .where(
                and(
                    eq(items.id, itemId),
                    eq(items.userId, userId)
                )
            )
            .returning();

        return item || null;
    }

    /**
     * Delete an item
     */
    async delete(itemId: string, userId: string): Promise<boolean> {
        const result = await this.db
            .delete(items)
            .where(
                and(
                    eq(items.id, itemId),
                    eq(items.userId, userId)
                )
            );

        return result.rowsAffected > 0;
    }

    /**
     * List items for a user with filtering and pagination
     */
    async list(userId: string, options: ListItemsOptions = {}): Promise<PaginatedResult<Item>> {
        const {
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            limit = 20,
            offset = 0,
        } = options;

        // Build where conditions
        const conditions = [eq(items.userId, userId)];

        if (status) {
            conditions.push(eq(items.status, status));
        }

        if (search) {
            conditions.push(
                like(items.title, `%${search}%`)
            );
        }

        // Build order by
        const orderColumn = {
            createdAt: items.createdAt,
            updatedAt: items.updatedAt,
            title: items.title,
        }[sortBy];

        const orderFn = sortOrder === 'asc' ? asc : desc;

        // Execute queries in parallel
        const [data, countResult] = await Promise.all([
            this.db
                .select()
                .from(items)
                .where(and(...conditions))
                .orderBy(orderFn(orderColumn))
                .limit(limit)
                .offset(offset),
            this.db
                .select({ count: sql<number>`count(*)` })
                .from(items)
                .where(and(...conditions)),
        ]);

        const total = countResult[0]?.count || 0;

        return {
            data,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    /**
     * Count items by status for a user
     */
    async countByStatus(userId: string): Promise<Record<string, number>> {
        const results = await this.db
            .select({
                status: items.status,
                count: sql<number>`count(*)`,
            })
            .from(items)
            .where(eq(items.userId, userId))
            .groupBy(items.status);

        const counts: Record<string, number> = {
            draft: 0,
            active: 0,
            archived: 0,
        };

        for (const row of results) {
            if (row.status) {
                counts[row.status] = row.count;
            }
        }

        return counts;
    }

    /**
     * Bulk update status
     */
    async bulkUpdateStatus(
        userId: string,
        itemIds: string[],
        status: 'draft' | 'active' | 'archived'
    ): Promise<number> {
        if (itemIds.length === 0) return 0;

        let updated = 0;
        for (const itemId of itemIds) {
            const result = await this.db
                .update(items)
                .set({ status, updatedAt: new Date() })
                .where(
                    and(
                        eq(items.id, itemId),
                        eq(items.userId, userId)
                    )
                );
            updated += result.rowsAffected;
        }

        return updated;
    }

    /**
     * Bulk delete items
     */
    async bulkDelete(userId: string, itemIds: string[]): Promise<number> {
        if (itemIds.length === 0) return 0;

        let deleted = 0;
        for (const itemId of itemIds) {
            const result = await this.db
                .delete(items)
                .where(
                    and(
                        eq(items.id, itemId),
                        eq(items.userId, userId)
                    )
                );
            deleted += result.rowsAffected;
        }

        return deleted;
    }
}

/**
 * Factory function to create item service
 */
export function createItemService(db: Database): ItemService {
    return new ItemService(db);
}
