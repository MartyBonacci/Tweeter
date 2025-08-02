# System Architecture - Tweeter Project

## Technology Stack

### ⚠️ CRITICAL: Remix Framework Specification
**This is a Remix application using programmatic routing with React Router 7 framework mode**

**IMPORTANT: Do NOT use file-based routing in app/routes/ or Next.js patterns**

### Core Framework
- **Remix** (React Router 7 Framework Mode): Full-stack React framework with SSR
  - **Programmatic Routing**: Use `route()` function calls in `routes.ts`
  - **Loader Functions**: Server-side data fetching via `loader()`
  - **Action Functions**: Server-side mutations via `action()`
  - **Form Component**: Use `<Form>` from `@remix-run/react`
  - **Data Hooks**: `useLoaderData()` and `useActionData()` for type-safe data access
  - **Routes Configuration**: Centralized in `routes.ts` file

### Routing Architecture
- **Primary**: `app/routes.ts` with programmatic route definitions
- **Pattern**: `route("path", "./component.tsx")` with loader/action options
- **Layouts**: Use `layout()` for shared UI components
- **Dynamic**: Use `:param` for dynamic segments
- **Resource Routes**: API endpoints as resource routes with loader/action functions

### Development Stack
- **TypeScript**: Type-safe JavaScript with strict settings
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **React Router 7**: Framework mode with Remix patterns

### Backend & Data
- **Drizzle ORM**: Type-safe database queries
- **Zod**: Type validation for server-side safety and client-side forms
- **UUIDv7**: Time-sortable unique identifiers
- **PostgreSQL**: Primary database (via Neon)
- **Drizzle Kit**: Database migrations and schema management

### Development Tools
- **pnpm**: Package manager
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Routing Patterns (Remix-Compliant)

### ✅ DO: Programmatic Routing
```typescript
// app/routes.ts
import type { RouteConfig } from "@react-router/dev/routes";
import { index, route, layout } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("login", "./routes/login.tsx"),
  route("register", "./routes/register.tsx"),
  route("timeline", "./routes/timeline.tsx", {
    loader: "./routes/timeline.loader",
  }),
  route("tweets/:id", "./routes/tweets/$id.tsx", {
    loader: "./routes/tweets/$id.loader",
  }),
] satisfies RouteConfig;
```

### ❌ DON'T: File-based Routing
- **No** automatic route generation from file structure
- **No** `app/routes/` directory for route files
- **No** Next.js `pages/` or `app/` directory patterns

## Component Patterns

### Loader Functions
```typescript
// routes/timeline.loader.ts
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const tweets = await getTimeline(user.id);
  return json({ tweets, user });
}
```

### Action Functions
```typescript
// routes/tweets.action.ts
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const form = await request.formData();
  const content = form.get("content");
  
  await createTweet(user.id, content);
  return redirect("/timeline");
}
```

### Form Components
```typescript
// routes/create-tweet.tsx
import { Form, useActionData } from "@remix-run/react";

export default function CreateTweet() {
  const actionData = useActionData<typeof action>();
  
  return (
    <Form method="post" action="/tweets">
      <textarea name="content" maxLength={140} required />
      <button type="submit">Tweet</button>
      {actionData?.error && <p>{actionData.error}</p>}
    </Form>
  );
}
```

## Best Practices for Project Consistency
### Code Style
- Use camelCase for JavaScript/TypeScript variables and functions
- Use PascalCase for React components
- Use snake_case for database table and column names
- Use table name prefixes                                                                 

### File Organization
- Separate routes, controllers, and models into distinct files
- Use feature-based folder structure when appropriate
