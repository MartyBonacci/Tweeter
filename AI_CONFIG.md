# AI Configuration Guide - Tweeter Project

## Introduction
This file serves as the central configuration guide for AI-assisted development of the Tweeter project. It establishes standardized workflows, communication protocols, and best practices to ensure consistent, high-quality development outcomes. All AI interactions should begin by reviewing this document.

## Important Files
- **CLAUDE.md** - points to AI_CONFIG.md file to be used in place of CLAUDE.md file
- **AI_CONFIG.md** - defines the standard workflow and
  processes to follow while developing and maintaining this project
- **README.md** - explains this project and how to use it for developers
- **STRATEGIC_VISION.md** - contains project vision, value propositions, personas, interaction flows and UI/UX requirements to satisfy the needs of the interaction flows
- **ARCHITECTURE.md** - defines the project tech stack and how the technologies will be used
- **DEVELOPMENT_PLAN.md** - a development plan structured in sprints and a record of the progress
- **TASKS.md** - a task list for the current sprint that gets checked off as the tasks are confirmed complete

## Standard Workflow

### 1. Project Initialization and Requirements Gathering
- Review existing codebase and documentation
- Identify current sprint goals and tasks
- Clarify any ambiguous requirements using follow-up questions
- Validate understanding of technical constraints and architecture

### 2. Sprint Planning and Task Breakdown
- Analyze current TASKS.md file
- Break down complex tasks into smaller, manageable units
- Identify dependencies between tasks
- Estimate effort and assign priorities
- Update DEVELOPMENT_PLAN.md with any new insights

### 3. Development Process
- **Coding Standards**: Follow established patterns in codebase
- **Testing**: Write tests before implementation (TDD approach)
- **Documentation**: Update relevant documentation with changes
- **Validation**: Use zod schemas for all data validation
- **Database**: Use drizzle ORM with snake_case naming conventions
- **IDs**: Use UUIDv7 for all entity identifiers

### 4. Code Review and Quality Assurance
- Run linting and type checking before marking tasks complete
- Ensure all tests pass
- Verify database migrations work correctly
- Check for security vulnerabilities
- Validate user experience flows

### 5. Deployment and Monitoring
- Follow deployment checklist in DEVELOPMENT_PLAN.md
- Monitor application performance post-deployment
- Check error logs and user feedback
- Document any issues encountered

### 6. Retrospective and Improvement
- Review completed sprint outcomes
- Identify process improvements
- Update documentation based on lessons learned
- Plan adjustments for next sprint


## Best Practices for Project Consistency


### Documentation Standards
- Update README.md for setup/installation changes
- Document API endpoints in code comments
- Keep architecture diagrams current
- Maintain changelog for user-facing changes

## Communication Protocol

1. **Start each session** by reviewing current TASKS.md and DEVELOPMENT_PLAN.md
2. **End each session** by updating task status and noting progress
3. **Report blockers** immediately with suggested solutions
4. **Ask for clarification** on any ambiguous requirements
5. **Provide concise updates** on task completion status

