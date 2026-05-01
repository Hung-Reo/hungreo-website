# Codex Guide: How to Create CLAUDE.md for Any Project

## What is CLAUDE.md?

CLAUDE.md is a project configuration file that helps AI assistants (Claude Code, Codex, etc.) understand your project quickly and work effectively.

## Why Create CLAUDE.md?

1. **Faster onboarding** - AI understands project structure immediately
2. **Consistent conventions** - AI follows your coding standards
3. **Avoid mistakes** - AI knows what NOT to do
4. **Better suggestions** - AI understands context and constraints

## CLAUDE.md Structure Template

```markdown
# [Project Name]

[One-line description of the project]

## Project Overview
- Type: [webapp, mobile app, library, CLI tool, etc.]
- Status: [development, production, maintenance]
- Production URL: [if applicable]

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | [Next.js, React, Vue, etc.] |
| Language | [TypeScript, Python, etc.] |
| Database | [PostgreSQL, MongoDB, etc.] |
| Deployment | [Vercel, AWS, etc.] |

## Key Directories
[Brief explanation of folder structure]

## Important Conventions
[Coding standards, naming conventions, patterns used]

## Commands
[Common npm/yarn commands]

## Environment Setup
[How to set up local development]

## Do's and Don'ts
### Do
- [Follow this pattern]
- [Use this approach]

### Don't
- [Avoid this]
- [Never do this]

## Key Files Reference
| Purpose | File |
|---------|------|
| [Description] | [path/to/file] |
```

## Steps to Create CLAUDE.md

### 1. Analyze the Project
- What type of project is it?
- What technologies are used? (check package.json, requirements.txt)
- What's the folder structure?

### 2. Identify Conventions
- Look at existing code patterns
- Check for linting configs (.eslintrc, .prettierrc)
- Review existing documentation

### 3. Note Restrictions
- Security requirements (auth, GDPR, etc.)
- Files that should never be modified
- Patterns that should never be used

### 4. Document Environment
- Required environment variables
- Local development setup
- Deployment process

### 5. List Key Files
- Entry points
- Configuration files
- Important utilities

## Example: Minimal CLAUDE.md

```markdown
# My Express API

REST API for user management.

## Tech Stack
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma

## Commands
npm run dev    # Start dev server
npm run build  # Build for production
npm run test   # Run tests

## Key Directories
src/routes/    # API endpoints
src/services/  # Business logic
src/models/    # Prisma schemas

## Don't
- Commit .env files
- Skip input validation
- Use raw SQL (use Prisma)
```

## Best Practices

1. **Keep it concise** - AI can read code, focus on non-obvious things
2. **Update regularly** - Keep CLAUDE.md in sync with project changes
3. **Be specific** - "Don't track users" is better than "Be careful with data"
4. **Include examples** - Code snippets help AI understand patterns
5. **Link to docs** - Reference detailed documentation where applicable

## When to Update CLAUDE.md

- After adding new major features
- When changing tech stack
- After establishing new conventions
- When onboarding new team members (AI counts!)
