/**
 * User Service - User management and authentication operations
 *
 * Provides registration, login, profile management, and user queries.
 * Similar to Lovable's Supabase Auth service.
 */

import { eq, and } from 'drizzle-orm';
import type { Database } from '../index';
import { users, type User, type NewUser } from '../schema';
import { hashPassword, verifyPassword, generateId } from '../../auth';

// ========================================
// TYPES
// ========================================

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

// ========================================
// USER SERVICE
// ========================================

export class UserService {
    constructor(private db: Database) {}

    /**
     * Register a new user with email/password
     */
    async register(data: RegisterData): Promise<{ user: User; error?: string }> {
        const { email, password, displayName, username } = data;

        // Check if email already exists
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            return { user: null as unknown as User, error: 'Email already registered' };
        }

        // Check if username is taken (if provided)
        if (username) {
            const usernameExists = await this.isUsernameTaken(username);
            if (usernameExists) {
                return { user: null as unknown as User, error: 'Username already taken' };
            }
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
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

    /**
     * Authenticate user with email/password
     */
    async login(data: LoginData): Promise<{ user: User | null; error?: string }> {
        const { email, password } = data;

        // Find user
        const user = await this.findByEmail(email);
        if (!user) {
            return { user: null, error: 'Invalid email or password' };
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return { user: null, error: 'Account is temporarily locked' };
        }

        // Check if account is active
        if (!user.isActive) {
            return { user: null, error: 'Account is deactivated' };
        }

        // Verify password
        if (!user.passwordHash) {
            return { user: null, error: 'Password login not available for this account' };
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            // Increment failed attempts
            await this.incrementFailedAttempts(user.id);
            return { user: null, error: 'Invalid email or password' };
        }

        // Reset failed attempts on successful login
        await this.resetFailedAttempts(user.id);

        // Update last active
        await this.updateLastActive(user.id);

        return { user };
    }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<User | null> {
        const [user] = await this.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return user || null;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        const [user] = await this.db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()))
            .limit(1);
        return user || null;
    }

    /**
     * Find user by username
     */
    async findByUsername(username: string): Promise<User | null> {
        const [user] = await this.db
            .select()
            .from(users)
            .where(eq(users.username, username.toLowerCase().trim()))
            .limit(1);
        return user || null;
    }

    /**
     * Check if username is taken
     */
    async isUsernameTaken(username: string): Promise<boolean> {
        const user = await this.findByUsername(username);
        return !!user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, data: UpdateProfileData): Promise<User | null> {
        const updates: Partial<NewUser> = {
            updatedAt: new Date(),
        };

        if (data.displayName !== undefined) {
            updates.displayName = data.displayName;
        }
        if (data.username !== undefined) {
            // Check if new username is available
            if (data.username) {
                const existing = await this.findByUsername(data.username);
                if (existing && existing.id !== userId) {
                    throw new Error('Username already taken');
                }
            }
            updates.username = data.username?.toLowerCase().trim() || null;
        }
        if (data.avatarUrl !== undefined) {
            updates.avatarUrl = data.avatarUrl;
        }
        if (data.theme !== undefined) {
            updates.theme = data.theme;
        }
        if (data.preferences !== undefined) {
            updates.preferences = data.preferences;
        }

        const [user] = await this.db
            .update(users)
            .set(updates)
            .where(eq(users.id, userId))
            .returning();

        return user || null;
    }

    /**
     * Change user password
     */
    async changePassword(userId: string, newPassword: string): Promise<boolean> {
        const passwordHash = await hashPassword(newPassword);

        const result = await this.db
            .update(users)
            .set({
                passwordHash,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return result.rowsAffected > 0;
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(userId: string): Promise<void> {
        await this.db
            .update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, userId));
    }

    /**
     * Increment failed login attempts
     */
    private async incrementFailedAttempts(userId: string): Promise<void> {
        const [user] = await this.db
            .select({ attempts: users.failedLoginAttempts })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const attempts = (user?.attempts || 0) + 1;

        // Lock account after 5 failed attempts for 15 minutes
        const lockedUntil = attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null;

        await this.db
            .update(users)
            .set({
                failedLoginAttempts: attempts,
                lockedUntil,
            })
            .where(eq(users.id, userId));
    }

    /**
     * Reset failed login attempts
     */
    private async resetFailedAttempts(userId: string): Promise<void> {
        await this.db
            .update(users)
            .set({
                failedLoginAttempts: 0,
                lockedUntil: null,
            })
            .where(eq(users.id, userId));
    }

    /**
     * Deactivate user account
     */
    async deactivateAccount(userId: string): Promise<boolean> {
        const result = await this.db
            .update(users)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return result.rowsAffected > 0;
    }

    /**
     * Get public user profile (safe to expose)
     */
    async getPublicProfile(userId: string): Promise<{
        id: string;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        createdAt: Date | null;
    } | null> {
        const [user] = await this.db
            .select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(
                and(
                    eq(users.id, userId),
                    eq(users.isActive, true)
                )
            )
            .limit(1);

        return user || null;
    }
}

/**
 * Factory function to create user service
 */
export function createUserService(db: Database): UserService {
    return new UserService(db);
}
