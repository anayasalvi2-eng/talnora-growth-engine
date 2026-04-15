import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { topics, type Topic } from '../schema';
import { generateId } from '../../auth';
export class TopicService {
    constructor(private db: Database) {}
    /**
     * Content Decision Engine logic:
     * Suggests topics based on system metrics (simulated weights)
     */
    async generateSuggestions(userId?: string): Promise<Topic[]> {
        const categories: Topic['suggestedType'][] = ['blog', 'linkedin', 'linkedin', 'reddit', 'video_script'];
        const sources = ['user_pain', 'seo', 'trend'];
        const mockSuggestions = [
            "Why ATS scores under 70 are killing your job search",
            "5 Secret keywords that unlock HR interviews",
            "How to use Cloudflare Workers to scale your SaaS marketing",
            "Reddit: I built a resume scorer and found something shocking",
            "Video: 30 seconds to a better resume summary"
        ];
        const results: Topic[] = [];
        for (let i = 0; i < mockSuggestions.length; i++) {
            const [suggestion] = await this.db.insert(topics).values({
                id: generateId(),
                userId: userId || null,
                topic: mockSuggestions[i],
                score: 75 + Math.floor(Math.random() * 20),
                source: sources[i % sources.length],
                suggestedType: categories[i % categories.length],
                status: 'suggested'
            }).returning();
            results.push(suggestion);
        }
        return results;
    }
    async listSuggestions(status: Topic['status'] = 'suggested'): Promise<Topic[]> {
        return this.db.select().from(topics)
            .where(eq(topics.status, status))
            .orderBy(desc(topics.createdAt))
            .limit(10);
    }
    async updateStatus(id: string, status: Topic['status']): Promise<Topic | null> {
        const [updated] = await this.db.update(topics)
            .set({ status })
            .where(eq(topics.id, id))
            .returning();
        return updated || null;
    }
}
export function createTopicService(db: Database): TopicService {
    return new TopicService(db);
}