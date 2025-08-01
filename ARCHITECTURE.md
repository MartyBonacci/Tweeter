# System Architecture - Tweeter Project

## Technology Stack

- **React Router 7** (Framework Mode): Full-stack React framework mode with SSR (serverside rendering)
  - [Official Documentation for React Router 7 framework mode](https://reactrouter.com/start/framework/installation)
  - [Example how to implement React Router 7 framework mode](https://github.com/MartyBonacci/react-router-7-tutorial/tree/main)
- Use react router 7 progromatic routing(rather than file based routing)

- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server

- **React Router 7 API Routes**: Server-side API endpoints
- **Drizzle ORM**: Type-safe database queries
- **Zod**: type validation server side for type safety and client side for better user experience with forms
- **UUIDv7**: Time-sortable unique identifiers

- **PostgreSQL**: Primary database (via Neon)
- **Drizzle Kit**: Database migrations and schema management
- **Table Name Prefix**: attribute naming

- **pnpm**: Package manager
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **TypeScript**: Type checking

## Best Practices for Project Consistency                                                                               ### Code Style                          - Use camelCase for JavaScript/TypeScript variables and functions               - Use PascalCase for React components   - Use snake_case for database table and column names                            - Use table name prefixes                                                                 

### File Organization                   - Separate routes, controllers, and models into distinct files                  - Use feature-based folder structure when appropriate
