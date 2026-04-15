/**
 * Authentication Utilities
 *
 * Provides password hashing, JWT token generation, and session management.
 * Similar to Lovable's Supabase Auth integration.
 */

import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { eq, and, gt, isNull } from 'drizzle-orm';
import type { Database } from './database';
import { users, sessions, type User, type Session } from './database/schema';

// ========================================
// TYPES
// ========================================

export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
}

export interface TokenPayload {
    sub: string; // User ID
    sid: string; // Session ID
    email: string;
    iat: number;
    exp: number;
}

// ========================================
// PASSWORD UTILITIES
// ========================================

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ========================================
// JWT UTILITIES
// ========================================

/**
 * Generate a JWT token for a session
 */
export async function generateToken(
    user: User,
    sessionId: string,
    jwtSecret: string,
    ttlSeconds: number = 604800 // 7 days
): Promise<string> {
    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new jose.SignJWT({
        sub: user.id,
        sid: sessionId,
        email: user.email,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`)
        .sign(secret);

    return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
    token: string,
    jwtSecret: string
): Promise<TokenPayload | null> {
    try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jose.jwtVerify(token, secret);
        return payload as TokenPayload;
    } catch {
        return null;
    }
}

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * Create a new session for a user
 */
export async function createSession(
    db: Database,
    userId: string,
    request: Request,
    jwtSecret: string,
    ttlSeconds: number = 604800
): Promise<{ session: Session; token: string }> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Get user for token generation
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
        throw new Error('User not found');
    }

    // Generate token
    const token = await generateToken(user, sessionId, jwtSecret, ttlSeconds);
    const tokenHash = await hashToken(token);

    // Extract request metadata
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        'unknown';

    // Create session
    const [session] = await db.insert(sessions).values({
        id: sessionId,
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        expiresAt,
        lastActivity: new Date(),
    }).returning();

    return { session, token };
}

/**
 * Validate a session token
 */
export async function validateSession(
    db: Database,
    token: string,
    jwtSecret: string
): Promise<{ user: User; session: Session } | null> {
    // Verify JWT
    const payload = await verifyToken(token, jwtSecret);
    if (!payload) {
        return null;
    }

    // Find session
    const [session] = await db
        .select()
        .from(sessions)
        .where(
            and(
                eq(sessions.id, payload.sid),
                eq(sessions.isRevoked, false),
                gt(sessions.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!session) {
        return null;
    }

    // Find user
    const [user] = await db
        .select()
        .from(users)
        .where(
            and(
                eq(users.id, payload.sub),
                eq(users.isActive, true),
                isNull(users.lockedUntil)
            )
        )
        .limit(1);

    if (!user) {
        return null;
    }

    // Update last activity
    await db
        .update(sessions)
        .set({ lastActivity: new Date() })
        .where(eq(sessions.id, session.id));

    return { user, session };
}

/**
 * Revoke a session
 */
export async function revokeSession(
    db: Database,
    sessionId: string,
    reason?: string
): Promise<void> {
    await db
        .update(sessions)
        .set({
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: reason,
        })
        .where(eq(sessions.id, sessionId));
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllSessions(
    db: Database,
    userId: string,
    reason?: string
): Promise<void> {
    await db
        .update(sessions)
        .set({
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: reason,
        })
        .where(
            and(
                eq(sessions.userId, userId),
                eq(sessions.isRevoked, false)
            )
        );
}

// ========================================
// HELPER UTILITIES
// ========================================

/**
 * Hash a token for storage (we don't store raw tokens)
 */
async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random ID
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}
