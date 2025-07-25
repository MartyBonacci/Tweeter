# AI Configuration Guide for Tweeter Project

## Introduction
This file serves as a guide for AI assistants working on the Tweeter project. It outlines the established workflow, best practices, and protocols to ensure consistent, high-quality development. Following these guidelines will help maintain project coherence and facilitate effective collaboration between human developers and AI assistants.

## Standard Workflow
The development process follows an iterative, sprint-based approach:

### 1. Project Initialization and Requirements Gathering
- Review project vision and strategic goals
- Identify core features and user personas
- Document functional and non-functional requirements
- Define success metrics and acceptance criteria

### 2. Sprint Planning and Task Breakdown
- Review and prioritize backlog items
- Break down user stories into actionable tasks
- Estimate effort for each task
- Assign tasks to team members (including AI assistants)

### 3. Development Process
- Set up local development environment
- Create feature branches for each task
- Implement code following established patterns and conventions
- Write unit tests and integration tests
- Update documentation as features are developed
- Commit frequently with descriptive messages

### 4. Code Review and Quality Assurance
- Submit pull requests for completed features
- Conduct code reviews focusing on correctness, efficiency, and maintainability
- Address feedback and refactor as needed
- Run automated test suites
- Perform manual testing of UI components

### 5. Deployment and Monitoring
- Merge approved code to main branch
- Deploy to staging environment for final verification
- Deploy to production environment
- Monitor application performance and error rates
- Respond to alerts and user feedback

### 6. Retrospective and Improvement
- Conduct sprint retrospective to identify successes and areas for improvement
- Document lessons learned
- Update development processes and guidelines based on findings
- Plan improvements for future sprints

## Guidelines for Asking Follow-up Questions and Iterative Development
- Ask specific, focused questions when requirements are unclear
- Validate assumptions before implementing features
- Request clarification on edge cases and error handling
- Confirm technical decisions with human team members when appropriate
- Break complex tasks into smaller, manageable subtasks
- Seek feedback early and often during development

## Instructions for Deploying Sub-agents
When specialized tasks require dedicated attention, sub-agents may be deployed:

<deploy_sub_agent>
Role: [Specify the role - e.g., "Frontend Specialist", "Database Optimizer"]
Responsibilities: [List the main responsibilities - e.g., "Implement UI components", "Optimize query performance"]
Scope: [Define the scope of work - e.g., "Create all user profile components", "Review and optimize all database queries in the tweet service"]
</deploy_sub_agent>

## Best Practices for Maintaining Project Consistency and Quality
1. Code Style and Conventions:
   - Follow the established tech stack conventions
   - Use camelCase for variables in JS/TS files
   - Use snake_case for database names and attributes
   - Apply table name prefixes for database attributes (e.g., tweet_id)
   - Use UUIDv7 for all IDs

2. Code Organization:
   - Separate routes, controllers, and models into their own files
   - Follow the React Router 7 framework mode with programmatic routes
   - Organize components in a logical folder structure

3. Data Validation:
   - Use Zod for all input validation
   - Validate data at system boundaries (API endpoints, forms)

4. Database Management:
   - Use Drizzle ORM for database operations
   - PostgreSQL provided by Neon for database hosting
   - Apply proper indexing for frequently queried fields

5. Testing:
   - Write unit tests for all business logic
   - Implement integration tests for API endpoints
   - Include end-to-end tests for critical user flows

6. Documentation:
   - Keep README.md updated with installation and usage instructions
   - Document complex algorithms or business logic
   - Maintain up-to-date API documentation

7. Version Control:
   - Use descriptive commit messages
   - Create feature branches for all non-trivial work
   - Squash and merge feature branches after code review