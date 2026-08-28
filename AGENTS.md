# AGENTS.md - Guidance for AI Coding Agents

This document provides guidance for AI coding agents working on the `storejs` project.

## Project Overview

`storejs` is a minimal Node.js CRUD demo application built with Express.js and EJS templating. It demonstrates basic web application patterns including:
- Express server setup and routing
- EJS templating for view rendering
- In-memory data storage (non-persistent)
- OpenTelemetry instrumentation for observability

## Build Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Build Steps

```bash
# Install dependencies
npm install

# Verify the build with tests
npm test

# Start the development server
npm start
```

The application listens on `http://localhost:3000` by default and respects the `PORT` environment variable for deployment scenarios.

## Testing

This project uses **Vitest** as the test runner.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (useful during development)
npm run test -- --watch
```

### Test Location
- Test files are located in the `test/` directory
- Test files use the pattern: `*.test.js`

### Test Coverage Expectations
- API endpoints should have corresponding tests
- Critical business logic should be unit tested
- Integration tests should validate express routes and handlers

## Repository Structure

```
.
├── src/
│   ├── server.js              # Main Express application
│   ├── instrumentation.js     # OpenTelemetry setup
│   └── [other modules]
├── test/
│   └── *.test.js              # Test files
├── scripts/
│   └── daytona-prepare-sandbox.sh
├── .github/
│   └── workflows/             # CI/CD configurations
├── package.json               # Project dependencies and scripts
├── package-lock.json          # Locked dependency versions
├── README.md                  # User-facing documentation
├── spec.md                    # Technical specifications
├── render.yaml                # Render.com deployment config
├── vitest.config.cjs          # Vitest configuration
└── .gitignore
```

## Key Dependencies

- **express** (^4.21.2) - Web framework
- **ejs** (^3.1.10) - Templating engine
- **@opentelemetry/* - Observability and instrumentation
- **supertest** (^7.1.1) - HTTP testing (dev)
- **vitest** (^3.2.4) - Test runner (dev)

## Development Workflow

### Adding Features

1. **Understand the current structure** - Review `src/server.js` to understand routing patterns
2. **Create/modify application code** - Follow existing patterns and conventions
3. **Add tests first** - Write tests in `test/` before implementing features
4. **Run tests locally** - Ensure `npm test` passes
5. **Verify the app runs** - Confirm `npm start` works without errors

### Code Quality Guidelines

- Follow the existing code style (consistent indentation, naming conventions)
- Use descriptive variable and function names
- Keep functions focused and testable
- Document complex logic with comments
- Ensure no console errors or warnings during development

### Testing Expectations

- All new endpoint handlers should have corresponding tests
- Tests should be isolated and independent
- Use descriptive test names that explain what is being tested
- Aim for meaningful coverage of critical paths

## Data Storage

**Important:** Data is stored in-memory and will reset when the process restarts or redeploys.

This is intentional for a demo application. If persistent storage is needed in the future, consider:
- Adding a database layer (e.g., SQLite, PostgreSQL)
- Implementing a data initialization strategy
- Adding data validation and schema enforcement

## Deployment

The project includes `render.yaml` for Blueprint deployments on Render.com.

### Build & Start Commands
- **Build:** `npm install`
- **Start:** `npm start`

### Port Configuration
The application respects `process.env.PORT`, making it compatible with Render web services.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `OTEL_*` - OpenTelemetry configuration variables (optional for observability)

## CI/CD

The project includes GitHub Actions workflows in `.github/workflows/`. Ensure:
- All tests pass before pushing
- CI checks pass before merging
- No console errors or security warnings

## Troubleshooting

### Tests Failing
- Ensure dependencies are installed: `npm install`
- Check that the server can start without errors
- Review test output for specific error messages

### Server Not Starting
- Check for port conflicts: `lsof -i :3000`
- Verify all dependencies installed correctly: `npm install`
- Review `src/instrumentation.js` for telemetry configuration issues

### Port Already in Use
- Change the PORT: `PORT=3001 npm start`
- Or kill the process: `kill -9 $(lsof -t -i:3000)`

## Questions for Agent Developers

When working on this repository, ask yourself:
- Does my change follow the existing patterns?
- Have I added tests for new functionality?
- Will this change work in the Render deployment environment?
- Am I respecting the in-memory storage constraints?
- Have I checked for console errors/warnings?

## Related Documentation

- See `README.md` for user-facing documentation
- See `spec.md` for technical specifications
- See test files for usage examples
