# vite-cf-fullstack-runner

## When to Select This Template

Choose this template when you need a **full-stack application** with database, authentication, and CRUD operations - similar to what Lovable.dev provides with Supabase.

### Ideal For:
- SaaS applications requiring user accounts
- Apps with persistent data storage
- Projects needing authentication out-of-the-box
- Full-stack applications with API endpoints
- Multi-user applications with data isolation

### Key Features:
- **D1 Database** - Cloudflare's serverless SQL database
- **Drizzle ORM** - Type-safe database queries
- **JWT Authentication** - Secure session management
- **User Management** - Registration, login, profile updates
- **CRUD API** - Ready-to-use item management endpoints
- **KV Storage** - For sessions and caching
- **React Frontend** - With auth hooks and API client

### Tech Stack:
- React 18 + TypeScript + Vite
- Cloudflare Workers + D1 + KV
- Drizzle ORM for database operations
- Hono for API routing
- shadcn/ui components
- Tailwind CSS

### When NOT to Choose:
- Simple static sites (use `minimal-vite`)
- AI chat applications (use `vite-cfagents-runner`)
- Real-time collaborative apps (use DO templates)
- If you don't need database features
