import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { leads, type Lead, type NewLead } from '../schema';
import { generateId } from '../../auth';
export interface ListLeadsOptions {
    status?: Lead['status'];
    limit?: number;
    offset?: number;
}
export class LeadService {
    constructor(private db: Database) {}
    async create(data: Omit<NewLead, 'id'>): Promise<Lead> {
        const [lead] = await this.db.insert(leads).values({ 
            id: generateId(),
            ...data,
        }).returning();
        if (!lead) {
            throw new Error('Failed to create lead: Insert operation returned no result.');
        }
        return lead;
    }
    async list(options: ListLeadsOptions = {}): Promise<{ data: Lead[], total: number }> {
        const { status, limit = 50, offset = 0 } = options;
        const conditions = [];
        if (status) conditions.push(eq(leads.status, status));
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const [data, countResult] = await Promise.all([
            this.db.select().from(leads)
                .where(whereClause)
                .orderBy(desc(leads.createdAt))
                .limit(limit)
                .offset(offset),
            this.db.select({ count: sql<number>`count(*)` })
                .from(leads)
                .where(whereClause)
        ]);
        return {
            data,
            total: countResult[0]?.count || 0
        };
    }
    async updateStatus(id: string, status: Lead['status']): Promise<Lead | null> {
        const [lead] = await this.db.update(leads)
            .set({ status, updatedAt: new Date() })
            .where(eq(leads.id, id))
            .returning();
        return lead || null;
    }
    async getStats(): Promise<Record<string, number>> {
        const results = await this.db.select({
            status: leads.status,
            count: sql<number>`count(*)`
        }).from(leads).groupBy(leads.status);
        const stats: Record<string, number> = {
            total: 0,
            new: 0,
            contacted: 0,
            qualified: 0,
            converted: 0,
            archived: 0
        };
        results.forEach(row => {
            if (row.status && row.status in stats) {
                stats[row.status] = row.count;
            }
        });
        const total = results.reduce((acc, curr) => acc + (curr.count || 0), 0);
        stats.total = total;
        return stats;
    }
    async delete(id: string): Promise<boolean> {
        const result = await this.db.delete(leads).where(eq(leads.id, id));
        return (result.meta.changes ?? 0) > 0;
    }
}
export function createLeadService(db: Database): LeadService {
    return new LeadService(db);
}