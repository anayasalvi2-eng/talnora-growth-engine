# Full-Stack Template Usage Guide

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Deploy to Cloudflare
bun run deploy
```

## Database Setup

### 1. Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create my-app-db

# Note the database_id from the output
```

### 2. Update wrangler.jsonc

Replace `{{D1_DATABASE_ID}}` with your actual database ID:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "my-app-db",
    "database_id": "your-actual-database-id"
  }
]
```

### 3. Generate and Apply Migrations

```bash
# Generate migrations from schema
npx drizzle-kit generate

# Apply migrations to local D1
wrangler d1 migrations apply my-app-db --local

# Apply migrations to production D1
wrangler d1 migrations apply my-app-db --remote
```

## KV Namespace Setup

```bash
# Create KV namespaces
wrangler kv namespace create SESSIONS
wrangler kv namespace create CACHE

# Update the IDs in wrangler.jsonc
```

## Authentication

### Register a User

```typescript
import { api } from '@/lib/api-client';

const response = await api.register(
  'user@example.com',
  'securepassword',
  'Display Name'
);

if (response.success) {
  // User is now logged in, token is stored
  console.log(response.data.user);
}
```

### Login

```typescript
const response = await api.login('user@example.com', 'securepassword');

if (response.success) {
  // Token is automatically stored
}
```

### Use Auth Hook in Components

```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return <div>Welcome, {user.displayName}!</div>;
}
```

## CRUD Operations

### Create Item

```typescript
const item = await api.createItem({
  title: 'My Item',
  description: 'Optional description',
  status: 'active',
});
```

### List Items

```typescript
const { data, pagination } = await api.listItems({
  status: 'active',
  search: 'query',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 20,
  offset: 0,
});
```

### Update Item

```typescript
await api.updateItem(itemId, {
  title: 'Updated Title',
  status: 'archived',
});
```

### Delete Item

```typescript
await api.deleteItem(itemId);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/logout-all` - Sign out all sessions
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Items (CRUD)
- `GET /api/items` - List items (with pagination)
- `POST /api/items` - Create item
- `GET /api/items/:id` - Get single item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/stats` - Get item statistics

### Health
- `GET /api/health` - API health check
- `GET /api/db/health` - Database health check

## Adding New Tables

### 1. Define Schema

Edit `worker/database/schema.ts`:

```typescript
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### 2. Create Service

Create `worker/database/services/post-service.ts`:

```typescript
import { eq } from 'drizzle-orm';
import type { Database } from '../index';
import { posts, type Post } from '../schema';

export class PostService {
  constructor(private db: Database) {}

  async create(userId: string, data: { title: string; content?: string }): Promise<Post> {
    const [post] = await this.db.insert(posts).values({
      id: crypto.randomUUID(),
      userId,
      ...data,
    }).returning();
    return post;
  }

  // Add more methods...
}
```

### 3. Add API Routes

Edit `worker/user-routes.ts` to add new endpoints.

### 4. Generate Migration

```bash
npx drizzle-kit generate
wrangler d1 migrations apply my-app-db --local
```

## Production Deployment

### 1. Set Environment Variables

```bash
# Set JWT secret (use a strong random value)
wrangler secret put JWT_SECRET
```

### 2. Deploy

```bash
bun run deploy
```

## Security Best Practices

1. **Change JWT_SECRET** in production - use `wrangler secret put JWT_SECRET`
2. **Enable KV encryption** for sensitive session data
3. **Use HTTPS** - Cloudflare provides this automatically
4. **Implement rate limiting** for auth endpoints
5. **Add CSRF protection** for form submissions
6. **Validate all user input** on the server side

## File Structure

```
├── worker/
│   ├── index.ts           # Main worker entry
│   ├── user-routes.ts     # API routes
│   ├── auth.ts            # Auth utilities
│   ├── core-utils.ts      # Environment types
│   └── database/
│       ├── index.ts       # Database service
│       ├── schema.ts      # Drizzle schema
│       └── services/
│           ├── user-service.ts
│           └── item-service.ts
├── src/
│   ├── lib/
│   │   └── api-client.ts  # Frontend API client
│   ├── hooks/
│   │   └── use-auth.ts    # Auth React hook
│   └── components/
│       └── TemplateDemo.tsx
├── migrations/            # Generated migrations
├── drizzle.config.ts      # Drizzle configuration
└── wrangler.jsonc         # Cloudflare configuration
```
