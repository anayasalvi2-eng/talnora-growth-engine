import { desc } from 'drizzle-orm';
import type { Database } from '../index';
import { events, type Event } from '../schema';
import { generateId } from '../../auth';
export class EventService {
  constructor(private db: Database) {}
  async logEvent(data: { userId?: string; leadId?: string; eventType: string; metadata?: any }): Promise<Event> {
    const [event] = await this.db.insert(events).values({
      id: generateId(),
      userId: data.userId,
      leadId: data.leadId,
      eventType: data.eventType,
      metadata: data.metadata || {},
    }).returning();
    if (!event) {
        throw new Error('Failed to log event');
    }
    // Background workflow simulation
    this.triggerWorkflows(event);
    return event;
  }
  private triggerWorkflows(event: Event) {
    if (event.eventType === 'resume_upload') {
      console.log(`[WORKFLOW] Triggered automation for resume_upload for lead ${event.leadId}`);
    }
  }
  async getRecentEvents(limit: number = 10): Promise<Event[]> {
    return this.db.select()
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(limit);
  }
}
export function createEventService(db: Database): EventService {
  return new EventService(db);
}