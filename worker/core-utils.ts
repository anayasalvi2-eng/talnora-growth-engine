/**
 * Core Utilities - Environment types and shared utilities
 *
 * DO NOT MODIFY this file - it defines the core environment bindings.
 */

// ========================================
// ENVIRONMENT TYPES
// ========================================

export interface Env {
    // D1 Database binding
    DB: D1Database;

    // KV Namespace bindings
    SESSIONS: KVNamespace;
    CACHE: KVNamespace;

    // Static assets binding
    ASSETS: Fetcher;

    // Environment variables
    JWT_SECRET: string;
    SESSION_TTL: string;
}

// ========================================
// RESPONSE HELPERS
// ========================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export function successResponse<T>(data: T): ApiResponse<T> {
    return { success: true, data };
}

export function errorResponse(error: string): ApiResponse {
    return { success: false, error };
}

// ========================================
// VALIDATION HELPERS
// ========================================

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

// ========================================
// DATE HELPERS
// ========================================

export function toTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

export function fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + hours * 60 * 60 * 1000);
    return result;
}
