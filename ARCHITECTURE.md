# Tweeter Architecture

## Technology Stack

- **Frontend Framework**: React Router 7 in Framework Mode
- **Routing**: Programmatic routes
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Backend Database**: PostgreSQL (provided by Neon)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Build Tool**: Vite
- **ID Generation**: UUIDv7

### Naming Conventions
- Variables in JavaScript and TypeScript: camelCase
- Database names and attributes: snake_case
- Database attributes use table name prefixes (e.g., tweet_id)
- IDs: UUIDv7

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend      │    │    Backend       │    │   Database       │
│                 │    │                  │    │                  │
│  React Router 7 │◄──►│  Controllers     │◄──►│   PostgreSQL     │
│  TypeScript     │    │  Routes          │    │   (Neon)         │
│  TailwindCSS    │    │  Models          │    │                  │
│                 │    │  Validation      │    │                  │
└─────────────────┘    │  (Zod)           │    └──────────────────┘
                       │                  │
                       │  Drizzle ORM     │
                       └──────────────────┘
```

## Component Descriptions and Interactions

### Frontend (React Router 7 Framework Mode)

The frontend is built using React Router 7 in framework mode, which provides a structured approach to building the application with:

1. **Routes**: Defined programmatically for dynamic routing capabilities
2. **Components**: Reusable UI elements following a component-based architecture
3. **State Management**: Using React's built-in state management and context API
4. **Styling**: TailwindCSS for utility-first CSS framework

### Backend Structure

The backend follows a clear separation of concerns with three main components:

1. **Routes**: Handle URL routing and direct requests to appropriate controllers
2. **Controllers**: Contain business logic and handle HTTP requests/responses
3. **Models**: Represent data structures and handle database interactions

### Database (PostgreSQL/Neon)

The database layer uses PostgreSQL provided by Neon with:

1. **Drizzle ORM**: For type-safe database queries and migrations
2. **UUIDv7**: For all primary keys and unique identifiers
3. **Naming Conventions**: 
   - Table and column names in snake_case
   - Column names prefixed with table name (e.g., tweet_id, user_email)

## Data Flow

1. **User Interaction**: User interacts with frontend components
2. **API Request**: Frontend makes HTTP requests to backend routes
3. **Route Handling**: Routes direct requests to appropriate controllers
4. **Validation**: Controllers validate input using Zod
5. **Business Logic**: Controllers process data and interact with models
6. **Database Operations**: Models use Drizzle ORM to interact with PostgreSQL
7. **Response**: Data is returned to the controller and sent back to frontend
8. **UI Update**: Frontend updates the user interface with new data

## Security Considerations

### Authentication and Authorization
- JWT-based authentication for secure user sessions
- Role-based access control for different user permissions
- Secure password storage with bcrypt hashing

### Data Protection
- Environment variables for sensitive configuration
- Input validation with Zod to prevent injection attacks
- Prepared statements through Drizzle ORM to prevent SQL injection
- HTTPS enforcement in production

### API Security
- Rate limiting to prevent abuse
- CORS configuration for controlled cross-origin requests
- Request validation and sanitization

### Frontend Security
- Content Security Policy (CSP) headers
- XSS prevention through proper data escaping
- Secure handling of client-side storage

## Scalability Considerations

### Database
- Connection pooling for efficient database connections
- Indexing strategies for frequently queried columns
- Read replicas for scaling read operations

### Application
- Stateless design for horizontal scaling
- Caching strategies for frequently accessed data
- Load balancing for distributing traffic

### Deployment
- Containerization for consistent deployment environments
- CI/CD pipeline for automated testing and deployment
- Monitoring and logging for performance tracking