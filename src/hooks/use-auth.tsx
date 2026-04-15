/**
 * useAuth Hook - React authentication state management
 *
 * Provides authentication state and methods for React components.
 * Similar to Lovable's Supabase Auth hooks.
 */

/* eslint-disable react-refresh/only-export-components */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { api, type User } from '@/lib/api-client';

// ========================================
// TYPES
// ========================================

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, displayName?: string, username?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    refreshUser: () => Promise<void>;
    clearError: () => void;
}

// ========================================
// CONTEXT
// ========================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ========================================
// PROVIDER COMPONENT
// ========================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            if (!api.isAuthenticated()) {
                setState({ user: null, loading: false, error: null });
                return;
            }

            try {
                const response = await api.getCurrentUser();
                if (response.success && response.data) {
                    setState({ user: response.data, loading: false, error: null });
                } else {
                    // Token is invalid, clear it
                    api.setToken(null);
                    setState({ user: null, loading: false, error: null });
                }
            } catch {
                api.setToken(null);
                setState({ user: null, loading: false, error: null });
            }
        };

        initAuth();
    }, []);

    // Login
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await api.login(email, password);

            if (response.success && response.data) {
                setState({ user: response.data.user, loading: false, error: null });
                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: response.error || 'Login failed',
                }));
                return false;
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Login failed',
            }));
            return false;
        }
    }, []);

    // Register
    const register = useCallback(async (
        email: string,
        password: string,
        displayName?: string,
        username?: string
    ): Promise<boolean> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await api.register(email, password, displayName, username);

            if (response.success && response.data) {
                setState({ user: response.data.user, loading: false, error: null });
                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: response.error || 'Registration failed',
                }));
                return false;
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Registration failed',
            }));
            return false;
        }
    }, []);

    // Logout
    const logout = useCallback(async (): Promise<void> => {
        try {
            await api.logout();
        } finally {
            setState({ user: null, loading: false, error: null });
        }
    }, []);

    // Update profile
    const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await api.updateProfile(data);

            if (response.success && response.data) {
                setState(prev => ({
                    ...prev,
                    user: response.data!,
                    loading: false,
                }));
                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: response.error || 'Update failed',
                }));
                return false;
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Update failed',
            }));
            return false;
        }
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async (): Promise<void> => {
        if (!api.isAuthenticated()) return;

        try {
            const response = await api.getCurrentUser();
            if (response.success && response.data) {
                setState(prev => ({ ...prev, user: response.data! }));
            }
        } catch {
            // Silently fail on refresh
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const value: AuthContextValue = {
        ...state,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ========================================
// HOOK
// ========================================

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// ========================================
// HELPER HOOKS
// ========================================

/**
 * Hook to require authentication
 * Returns user if authenticated, redirects to login otherwise
 */
export function useRequireAuth(): { user: User; loading: boolean } {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            // Redirect to login or show login modal
            // This is a simple example - customize based on your routing
            window.location.href = '/login';
        }
    }, [user, loading]);

    return { user: user!, loading };
}

export default useAuth;
