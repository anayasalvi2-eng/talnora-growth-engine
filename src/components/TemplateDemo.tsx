/**
 * Template Demo - Showcases the fullstack capabilities
 *
 * Demonstrates authentication, CRUD operations, and database integration.
 * Similar to Lovable's Supabase-powered demo components.
 */

// Signal to HomePage that this template has a demo
export const HAS_TEMPLATE_DEMO = true;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth, AuthProvider } from '@/hooks/use-auth';
import { api, type Item } from '@/lib/api-client';
import { Database, User, Key, Plus, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';

// ========================================
// AUTH DEMO COMPONENT
// ========================================

function AuthDemo() {
    const { user, loading, error, login, register, logout, clearError } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (isLogin) {
            await login(email, password);
        } else {
            await register(email, password, displayName);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        Authenticated
                    </CardTitle>
                    <CardDescription>You are logged in as {user.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium">User Details</p>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p>ID: {user.id}</p>
                            <p>Email: {user.email}</p>
                            <p>Display Name: {user.displayName}</p>
                            {user.username && <p>Username: @{user.username}</p>}
                        </div>
                    </div>
                    <Button onClick={logout} variant="outline" className="w-full">
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
                <CardDescription>
                    {isLogin ? 'Sign in to your account' : 'Create a new account to get started'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <Input
                            placeholder="Display Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    )}
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <Button type="submit" className="w-full">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            clearError();
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

// ========================================
// ITEMS CRUD DEMO COMPONENT
// ========================================

function ItemsDemo() {
    const { user } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [error, setError] = useState<string | null>(null);

    const loadItems = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const response = await api.listItems({ limit: 10 });
            if (response.success && response.data) {
                setItems(response.data);
            } else {
                setError(response.error || 'Failed to load items');
            }
        } catch {
            setError('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    const createItem = async () => {
        if (!newTitle.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const response = await api.createItem({ title: newTitle, status: 'active' });
            if (response.success && response.data) {
                setItems([response.data, ...items]);
                setNewTitle('');
            } else {
                setError(response.error || 'Failed to create item');
            }
        } catch {
            setError('Failed to create item');
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.deleteItem(id);
            if (response.success) {
                setItems(items.filter((item) => item.id !== id));
            } else {
                setError(response.error || 'Failed to delete item');
            }
        } catch {
            setError('Failed to delete item');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Items CRUD</CardTitle>
                    <CardDescription>Sign in to manage your items</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Authentication required. Please sign in first.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Your Items</span>
                    <Button size="sm" variant="outline" onClick={loadItems} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                    </Button>
                </CardTitle>
                <CardDescription>Create, read, update, and delete items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Create form */}
                <div className="flex gap-2">
                    <Input
                        placeholder="New item title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createItem()}
                    />
                    <Button onClick={createItem} disabled={loading || !newTitle.trim()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {/* Items list */}
                <div className="space-y-2">
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No items yet. Create one above!
                        </p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div>
                                    <p className="font-medium">{item.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                            {item.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteItem(item.id)}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ========================================
// MAIN TEMPLATE DEMO
// ========================================

export function TemplateDemo() {
    return (
        <AuthProvider>
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Full-Stack Template Demo</h2>
                    <p className="text-muted-foreground">
                        D1 Database + Drizzle ORM + Authentication + CRUD
                    </p>
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                        <Database className="h-3 w-3" />
                        D1 Database
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Authentication
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                        <Key className="h-3 w-3" />
                        JWT Sessions
                    </Badge>
                </div>

                {/* Demo tabs */}
                <Tabs defaultValue="auth" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="auth">Authentication</TabsTrigger>
                        <TabsTrigger value="items">Items CRUD</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auth" className="mt-4">
                        <AuthDemo />
                    </TabsContent>
                    <TabsContent value="items" className="mt-4">
                        <ItemsDemo />
                    </TabsContent>
                </Tabs>

                {/* Setup instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Getting Started</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                            To use the database features, you need to set up D1:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>
                                Create a D1 database:{' '}
                                <code className="bg-muted px-1 rounded">
                                    wrangler d1 create your-db-name
                                </code>
                            </li>
                            <li>Update the database_id in wrangler.jsonc</li>
                            <li>
                                Generate migrations:{' '}
                                <code className="bg-muted px-1 rounded">npx drizzle-kit generate</code>
                            </li>
                            <li>
                                Apply migrations:{' '}
                                <code className="bg-muted px-1 rounded">
                                    wrangler d1 migrations apply your-db-name
                                </code>
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </AuthProvider>
    );
}

export default TemplateDemo;
