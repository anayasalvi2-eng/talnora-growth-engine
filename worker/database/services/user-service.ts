import { eq, and } from 'drizzle-orm';
import type { Database } from '../index';
import { users, type User, type NewUser } from '../schema';
import { hashPassword, verifyPassword, generateId } from '../../auth';
export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
    username?: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export interface UpdateProfileData {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    theme?: 'light' | 'dark' | 'system';
    preferences?: Record<string, unknown>;
}
export class UserService {
    constructor(private db: Database) {}
    async register(data: RegisterData): Promise<{ user: User; error?: string }> {
        const { email, password, displayName, username } = data;
        const existingUser = await this.findByEmail(email);
        if (existingUser) return { user: null as any, error: 'Email already registered' };
        if (username) {
            const usernameExists = await this.isUsernameTaken(username);
            if (usernameExists) return { user: null as any, error: 'Username already taken' };
        }
        const passwordHash = await hashPassword(password);
        const userId = generateId();
        const [user] = await this.db.insert(users).values({
            id: userId,
            email: email.toLowerCase().trim(),
            username: username?.toLowerCase().trim(),
            displayName: displayName || email.split('@')[0],
            passwordHash,
            provider: 'email',
            providerId: userId,
        }).returning();
        return { user };
    }
    async login(data: LoginData): Promise<{ user: User | null; error?: string }> {
        const { email, password } = data;
        const user = await this.findByEmail(email);
        if (!user) return { user: null, error: 'Invalid email or password' };
        if (user.lockedUntil && user.lockedUntil > new Date()) return { user: null, error: 'Account is locked' };
        if (!user.isActive) return { user: null, error: 'Account deactivated' };
        if (!user.passwordHash) return { user: null, error: 'Password login unavailable' };
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await this.incrementFailedAttempts(user.id);
            return { user: null, error: 'Invalid email or password' };
        }
        await this.resetFailedAttempts(user.id);
        await this.updateLastActive(user.id);
        return { user };
    }
    async findByEmail(email: string): Promise<User | null> {
        const [user] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
        return user || null;
    }
    async isUsernameTaken(username: string): Promise<boolean> {
        const [user] = await this.db.select().from(users).where(eq(users.username, username.toLowerCase().trim())).limit(1);
        return !!user;
    }
    async changePassword(userId: string, newPassword: string): Promise<boolean> {
        const passwordHash = await hashPassword(newPassword);
        const result = await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
        return result.meta.changes > 0;
    }
    async updateLastActive(userId: string): Promise<void> {
        await this.db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
    }
    private async incrementFailedAttempts(userId: string): Promise<void> {
        const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
        const attempts = (user?.failedLoginAttempts || 0) + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await this.db.update(users).set({ failedLoginAttempts: attempts, lockedUntil }).where(eq(users.id, userId));
    }
    private async resetFailedAttempts(userId: string): Promise<void> {
        await this.db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId));
    }
    async deactivateAccount(userId: string): Promise<boolean> {
        const result = await this.db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, userId));
        return result.meta.changes > 0;
    }
}
export function createUserService(db: Database): UserService {
    return new UserService(db);
}