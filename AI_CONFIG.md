# AI Development Configuration Guide

## Introduction
This file provides guidelines and workflows for AI-assisted development of the Tweeter project. It ensures consistency, quality, and adherence to project requirements throughout the development lifecycle.

## Standard Workflow

### 1. Project Initialization and Requirements Gathering
- Review project vision in STRATEGIC_VISION.md
- Understand technical requirements in ARCHITECTURE.md
- Identify user stories and acceptance criteria
- Validate assumptions with stakeholders

### 2. Sprint Planning and Task Breakdown
- Review DEVELOPMENT_PLAN.md for current sprint goals
- Break down user stories into actionable tasks
- Estimate effort for each task
- Identify dependencies and blockers
- Update TASKS.md with prioritized items

### 3. Development Process
- Follow the technology stack defined in ARCHITECTURE.md
- Implement features according to user stories and acceptance criteria
- Write clean, maintainable code with proper documentation
- Perform unit testing and integration testing
- Update relevant documentation files as needed

### 4. Code Review and Quality Assurance
- Conduct self-review of implemented features
- Ensure code follows established patterns and conventions
- Verify all tests pass
- Confirm acceptance criteria are met
- Prepare for human review

### 5. Deployment and Monitoring
- Deploy to staging environment for testing
- Monitor for issues and performance
- Gather feedback from users and stakeholders
- Address any deployment-related issues

### 6. Retrospective and Improvement
- Review completed sprint
- Identify successes and areas for improvement
- Update processes and documentation as needed
- Plan for next sprint

## Guidelines for Asking Follow-up Questions and Iterative Development

When requirements are unclear or additional information is needed:
1. Use the follow-up question format:
   ```
   <follow_up_question>
   [Your specific question here]
   </follow_up_question>
   ```
2. Focus questions on blocking issues or critical ambiguities
3. Prioritize questions that impact architectural decisions
4. Document answers in the appropriate files for future reference

## Instructions for Deploying Sub-agents

When specialized tasks require focused attention:
1. Deploy sub-agents using the format:
   ```
   <deploy_sub_agent>
   Role: [Specific role]
   Responsibilities: [List of key responsibilities]
   Scope: [Defined boundaries of work]
   </deploy_sub_agent>
   ```
2. Clearly define the scope and expected outcomes
3. Establish communication protocols with the main agent
4. Set deadlines and success criteria

## Best Practices

### Code Quality
- Follow camelCase for variables in JavaScript and TypeScript
- Use snake_case for database names and attributes
- Apply table name prefixes for database attributes (e.g., tweet_id)
- Use UUIDv7 for all IDs
- Implement proper error handling and validation with Zod
- Write clean, self-documenting code with meaningful names

### Architecture
- Maintain separation of routes, controllers, and models
- Follow the defined technology stack
- Use React Router 7 in framework mode with programmatic routes
- Implement proper data flow between components
- Apply security best practices

### Documentation
- Keep documentation updated with code changes
- Write clear, concise explanations
- Include examples where appropriate
- Reference related files and sections

### Collaboration
- Regularly update TASKS.md with current status
- Communicate blockers and dependencies promptly
- Seek clarification before making assumptions
- Maintain consistency with established patterns