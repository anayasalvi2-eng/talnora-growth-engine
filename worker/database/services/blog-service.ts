import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { blogs, type Blog, type NewBlog } from '../schema';
import { generateId } from '../../auth';
export class BlogService {
  constructor(private db: Database) {}
  async create(userId: string, data: { title: string; content: string; metaDescription?: string }): Promise<Blog> {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const [blog] = await this.db.insert(blogs).values({
      id: generateId(),
      userId,
      title: data.title,
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      content: data.content,
      metaDescription: data.metaDescription,
      status: 'published',
    }).returning();
    return blog;
  }
  async list(options: { status?: Blog['status']; limit?: number; offset?: number } = {}): Promise<{ data: Blog[]; total: number }> {
    const { status, limit = 10, offset = 0 } = options;
    const conditions = status ? [eq(blogs.status, status)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [data, countResult] = await Promise.all([
      this.db.select().from(blogs)
        .where(whereClause)
        .orderBy(desc(blogs.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)` })
        .from(blogs)
        .where(whereClause)
    ]);
    return {
      data,
      total: countResult[0]?.count || 0
    };
  }
  async getBySlug(slug: string): Promise<Blog | null> {
    const [blog] = await this.db.select().from(blogs).where(eq(blogs.slug, slug)).limit(1);
    return blog || null;
  }
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(blogs)
      .where(and(eq(blogs.id, id), eq(blogs.userId, userId)));
    return result.meta.changes > 0;
  }
}
export function createBlogService(db: Database): BlogService {
  return new BlogService(db);
}