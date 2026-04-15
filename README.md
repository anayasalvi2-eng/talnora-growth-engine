# Cloudflare Fullstack Template

A production-ready, batteries-included template for building fullstack applications on Cloudflare Workers. This template combines a modern frontend stack with a robust backend, database, and authentication system, all running on the Cloudflare developer platform.

[cloudflarebutton]

## Key Features

-   **Frontend:** Built with [React](https://react.dev/) (using [Vite](https://vitejs.dev/)), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).
-   **UI Components:** Includes a comprehensive set of pre-installed [shadcn/ui](https://ui.shadcn.com/) components.
-   **Backend:** Powered by [Cloudflare Workers](https://workers.cloudflare.com/) and the lightweight [Hono](https://hono.dev/) web framework.
-   **Database:** Integrated with [Cloudflare D1](https://developers.cloudflare.com/d1/), Cloudflare's serverless SQL database, using [Drizzle ORM](https://orm.drizzle.team/) for type-safe database access.
-   **Authentication:** A complete JWT-based authentication system with email/password signup, login, session management, and password hashing.
-   **Tooling:** Pre-configured with [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for development and deployment, and [Drizzle Kit](https://orm.drizzle.team/drizzle-kit/overview) for database migrations.
-   **Best Practices:** Follows modern development patterns, including a type-safe API client, environment management, and a structured service layer on the backend.

## Technology Stack

| Category        | Technology                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **Runtime**     | [Bun](https://bun.sh/)                                                                               |
| **Frontend**    | [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling**     | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)                          |
| **State**       | [TanStack Query](https://tanstack.com/query/latest)                                                  |
| **Backend**     | [Cloudflare Workers](https://workers.cloudflare.com/), [Hono](https://hono.dev/)                      |
| **Database**    | [Cloudflare D1](https://developers.cloudflare.com/d1/), [Drizzle ORM](https://orm.drizzle.team/)        |
| **Auth**        | [JOSE (JWT)](https://github.com/panva/jose), [bcryptjs](https://github.com/dcodeIO/bcrypt.js)         |
| **Deployment**  | [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)                                  |

## Getting Started

Follow these instructions to get your project up and running.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/) (v1.0 or later)
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) globally installed.

### 1. Installation

Clone the repository and install dependencies.

```bash
git clone <repository-url>
cd <repository-name>
bun install
```

The `bun install` command will automatically trigger a one-time bootstrap script to configure the project name in `package.json` and `wrangler.jsonc`.

### 2. Cloudflare Setup

You need to create the necessary Cloudflare resources (D1 Database and KV Namespaces).

1.  **Login to Wrangler:**
    ```bash
    wrangler login
    ```

2.  **Create D1 Database:**
    ```bash
    wrangler d1 create your-project-name-db
    ```

3.  **Create KV Namespaces:**
    ```bash
    wrangler kv:namespace create SESSIONS
    wrangler kv:namespace create CACHE
    ```

4.  **Update `wrangler.jsonc`:**
    Open the `wrangler.jsonc` file and replace the placeholder values with the details from the commands you just ran. You will find the `database_id` and KV `id` values in the command output.

### 3. Database Migration

Apply the initial database schema to your D1 database.

1.  **Generate Migration Files (Optional):**
    The schema is already defined in `worker/database/schema.ts`. If you make changes, generate a new migration:
    ```bash
    npx drizzle-kit generate
    ```

2.  **Apply Migrations:**
    Run the following command to apply the migrations to your remote D1 database.
    ```bash
    wrangler d1 migrations apply your-project-name-db
    ```
    For local development, use the `--local` flag:
    ```bash
    wrangler d1 migrations apply your-project-name-db --local
    ```

## Development

To start the local development server, which includes both the Vite frontend server and the Wrangler backend worker with hot-reloading:

```bash
bun dev
```

-   Frontend is accessible at `http://localhost:3000`.
-   Backend API is proxied, so frontend requests to `/api/*` will be handled by the local worker.

### Project Structure

-   `src/`: Contains all the frontend React application code.
-   `worker/`: Contains all the backend Cloudflare Worker code, including routes, services, and database schema.
-   `drizzle/`: Contains database migration files generated by Drizzle Kit.

## Deployment

Deploying the application to Cloudflare is a single command.

```bash
bun deploy
```

This command will build the frontend application, then deploy both the static assets and the worker to your Cloudflare account.

Alternatively, you can use the one-click deploy button:

[cloudflarebutton]

## Available Scripts

-   `bun dev`: Starts the local development server.
-   `bun build`: Builds the frontend application for production.
-   `bun deploy`: Builds and deploys the entire application to Cloudflare.
-   `bun lint`: Lints the codebase.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.