# AI Configuration Guide for Tweeter Project

## Introduction

This file serves as the primary guide for AI-assisted development of the Tweeter project. It defines workflows, best practices, and interaction patterns to ensure consistent, high-quality development throughout the project lifecycle.

## Standard Workflow

### 1. Project Initialization and Requirements Gathering
- Review project documentation (STRATEGIC_VISION.md, ARCHITECTURE.md)
- Identify any missing requirements or clarifications needed
- Ask follow-up questions using the prescribed format
- Ensure all dependencies and tools are properly configured

### 2. Sprint Planning and Task Breakdown
- Refer to DEVELOPMENT_PLAN.md for current sprint goals
- Review TASKS.md for detailed task list
- Break down complex tasks into manageable subtasks
- Identify dependencies and blockers
- Estimate effort using story points or time estimates

### 3. Development Process
- **Coding Standards:**
  - JavaScript/TypeScript variables: camelCase
  - Database names and attributes: snake_case with table prefixes
  - IDs: UUIDv7 format
  - Follow React Router 7 framework mode conventions
  - Separate routes, controllers, and models in dedicated files
  
- **Testing:**
  - Write unit tests for models and utility functions
  - Integration tests for API endpoints
  - E2E tests for critical user flows
  - Ensure 80% code coverage minimum
  
- **Documentation:**
  - Update relevant documentation as features are implemented
  - Include JSDoc comments for public APIs
  - Maintain clear commit messages

### 4. Code Review and Quality Assurance
- Run linting and type checking before marking tasks complete
- Ensure all tests pass
- Check for security vulnerabilities
- Verify database migrations are reversible
- Review code for performance implications

### 5. Deployment and Monitoring
- Follow deployment checklist
- Verify environment variables are set
- Run database migrations
- Monitor application logs post-deployment
- Check performance metrics

### 6. Retrospective and Improvement
- Document lessons learned
- Update workflows based on experience
- Refine estimates for future sprints
- Identify technical debt for future consideration

## Guidelines for Follow-up Questions

When additional information is needed, use this format:

```
<follow_up_question>
[Your specific question here]
Examples:
- "Should the tweet character limit be exactly 140 or allow for some overflow?"
- "What authentication method would you prefer: JWT tokens or session-based?"
- "Should we implement rate limiting for tweet creation?"
</follow_up_question>
```

## Iterative Development Approach

1. **Start Small:** Implement core functionality first, then iterate
2. **Frequent Validation:** Check assumptions early and often
3. **Flexibility:** Be prepared to pivot based on new requirements
4. **User Feedback:** Incorporate feedback loops into development
5. **Progressive Enhancement:** Build features incrementally

## Deploying Sub-Agents

When specialized expertise is needed, deploy sub-agents using this format:

```
<deploy_sub_agent>
Role: [Database Migration Specialist]
Responsibilities: 
- Design and implement database schema changes
- Ensure backward compatibility
- Create rollback procedures
Scope: 
- Limited to database layer only
- Must follow established naming conventions
- Coordinate with main development flow
</deploy_sub_agent>
```

Common sub-agent roles:
- Security Auditor
- Performance Optimizer
- UI/UX Specialist
- Database Migration Specialist
- Testing Automation Engineer

## Best Practices

### Code Quality
- Maintain consistent code style using ESLint and Prettier
- Use TypeScript strict mode
- Implement proper error handling with meaningful messages
- Avoid magic numbers and strings - use constants
- Keep functions small and focused (single responsibility)

### Database Practices
- Always use migrations for schema changes
- Include both up and down migrations
- Use transactions for multi-table operations
- Index frequently queried columns
- Implement soft deletes where appropriate

### Security Considerations
- Never store sensitive data in code or version control
- Use environment variables for configuration
- Implement proper input validation with Zod
- Sanitize user inputs before database operations
- Use parameterized queries (handled by Drizzle ORM)
- Implement rate limiting on API endpoints

### Performance Guidelines
- Implement pagination for list endpoints
- Use database connection pooling
- Cache frequently accessed data
- Optimize images and assets
- Implement lazy loading where appropriate
- Monitor and optimize database queries

### Git Workflow
- Create feature branches from main
- Use conventional commit messages
- Keep commits atomic and focused
- Rebase feature branches before merging
- Delete branches after merging

## Project-Specific Conventions

### File Structure
```
src/
├── routes/         # React Router route definitions
├── controllers/    # Business logic handlers
├── models/         # Database models and schemas
├── components/     # React components
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── db/            # Database configuration and migrations
```

### Naming Conventions
- Routes: `/tweets`, `/users/:userId`
- Controllers: `tweetController.ts`, `userController.ts`
- Models: `Tweet.ts`, `User.ts`
- Components: `TweetCard.tsx`, `UserProfile.tsx`
- Database tables: `tweets`, `users`, `follows`
- Database columns: `tweet_id`, `user_email`, `created_at`

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data

## Continuous Improvement

This document should be treated as a living guide. Update it when:
- New patterns or conventions are established
- Better practices are discovered
- Tools or dependencies change
- Team feedback suggests improvements

Remember: The goal is to build a high-quality, maintainable application that captures the simplicity and elegance of early Twitter while using modern development practices.