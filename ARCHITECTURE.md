# Architecture Overview for Tweeter

## Technology Stack
<tech_stack>
- Frontend: React with React Router 7 (framework mode with programmatic routes)
- Backend: Node.js with TypeScript
- Database: PostgreSQL (hosted on Neon)
- ORM: Drizzle ORM
- Validation: Zod
- Styling: TailwindCSS
- Build Tool: Vite
</tech_stack>

## System Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Web Browser   │◄──►│  Vite Dev Server │◄──►│   Node.js API    │
└─────────────────┘    └──────────────────┘    └─────────┬────────┘
                                                           │
                                                   ┌───────▼───────┐
                                                   │  PostgreSQL   │
                                                   │   (Neon)      │
                                                   └───────────────┘
```

## Component Descriptions and Interactions

### Frontend (React + React Router 7)
- **Routing**: Programmatic routes defined in separate route files
- **Components**: Reusable UI components organized by feature
- **State Management**: React hooks for local state, Context API for global state
- **API Integration**: Custom hooks for data fetching and mutation
- **Styling**: TailwindCSS for utility-first styling approach

### Backend (Node.js + TypeScript)
- **Controllers**: Handle HTTP requests and responses
- **Models**: Define data structures and business logic
- **Routes**: Define API endpoints and connect to controllers
- **Validation**: Zod schemas for input validation
- **Database**: Drizzle ORM for database operations

### Database (PostgreSQL via Neon)
- **Schema**: Relational schema with tables for users, tweets, followers, etc.
- **Naming Convention**: snake_case for table and column names
- **Primary Keys**: UUIDv7 for all primary keys
- **Indexing**: Proper indexing for frequently queried fields
- **Relationships**: Foreign key constraints for data integrity

## Data Flow and Storage

### User Data Flow
1. User submits registration form
2. Frontend validates data with Zod
3. Data sent to registration endpoint
4. Backend validates and creates user record
5. Database stores user information

### Tweet Data Flow
1. User composes tweet in frontend
2. Frontend enforces 140-character limit
3. Data sent to tweet creation endpoint
4. Backend validates and creates tweet record
5. Database stores tweet with user relationship

### Timeline Data Flow
1. Frontend requests timeline data
2. API queries database for tweets from followed users
3. Database returns ordered results
4. Backend processes and sends data to frontend
5. Frontend displays timeline to user

## Security Considerations
1. **Authentication**: JWT-based authentication with secure storage
2. **Authorization**: Role-based access control for API endpoints
3. **Input Validation**: Zod validation on all user inputs
4. **SQL Injection Prevention**: Parameterized queries through Drizzle ORM
5. **XSS Prevention**: Proper escaping of user-generated content
6. **CSRF Protection**: Implementation of CSRF tokens for state-changing operations
7. **Rate Limiting**: API rate limiting to prevent abuse
8. **Data Encryption**: HTTPS encryption in transit, password hashing at rest