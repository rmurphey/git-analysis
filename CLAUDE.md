# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm run dev` - Run TypeScript compiler in watch mode for development
- `npm start` - Run the compiled CLI tool from `dist/cli/index.js`

### Testing
- `npm test` - Run the Jest test suite
- Jest is configured with `ts-jest` for TypeScript support
- Tests are located in the `tests/` directory
- Coverage reports are generated in the `coverage/` directory with 80% threshold

### CLI Usage
- `node dist/cli/index.js` or `rapid-test` (when installed globally) - Main CLI entry point
- The CLI supports commands like `generate`, `run`, `watch`, and `coverage` (as documented in README)

## Architecture Overview

This is a **Rapid Test Suite** system for TypeScript projects. The codebase follows a modular architecture with clear separation of concerns:

### Core Structure
- **Configuration System**: Centralized config management with `ConfigManager` class that supports multiple config file formats (`rapid-test.config.json`, `.rapid-test.json`, `rapid-test.json`)
- **Modular Components**: Each major feature is isolated in its own module (generator, runner, reporter, parser)
- **TypeScript Interfaces**: Comprehensive type definitions in `src/types/interfaces.ts` define contracts for all components

### Key Components (Currently Stubbed for Future Implementation)
1. **Test Generator** (`src/generator/`) - Analyzes source code and generates test stubs
2. **Smart Runner** (`src/runner/`) - Runs affected tests based on code changes with Git integration
3. **Coverage Reporter** (`src/reporter/`) - Generates detailed coverage reports
4. **AST Parser** (`src/parser/`) - Parses TypeScript/JavaScript files to extract functions, classes, and exports
5. **CLI Interface** (`src/cli/`) - Command-line interface for all operations

### Configuration
- Default config includes test directory (`tests/`), source directory (`src/`), coverage threshold (80%)
- Supports exclude patterns for `node_modules`, `dist`, type definitions
- Configuration is validated and supports hierarchical loading (searches up directory tree)

### Development Patterns
- Uses functional programming patterns and immutables as preferred
- TypeScript strict mode enabled with comprehensive type checking
- Jest testing framework with coverage thresholds
- Modular exports from main `index.ts` entry point

### File Organization
```
src/
├── cli/           # CLI entry point (currently stubbed)
├── config/        # Configuration management (fully implemented)
├── generator/     # Test stub generation (stubbed)
├── parser/        # AST parsing for code analysis (stubbed) 
├── reporter/      # Coverage reporting (stubbed)
├── runner/        # Smart test execution (stubbed)
├── types/         # TypeScript interface definitions
└── index.ts       # Main module exports
```

The project is in early development with most core functionality stubbed out but comprehensive type definitions and configuration system already in place.

## Kiro AI IDE Specs

This project uses Kiro AI IDE's spec-driven development approach. When creating or working with specs:

### Spec Structure
Kiro specs use a three-file markdown structure in `.kiro/specs/[module-name]/`:

- **`requirements.md`** - User stories with EARS (Easy Approach to Requirements Syntax) format
  - Uses "WHEN/THEN/SHALL" acceptance criteria pattern
  - Each requirement has user story and numbered acceptance criteria
  - Focuses on functional requirements and error handling

- **`design.md`** - Technical architecture and implementation details
  - Three-layer architecture patterns preferred
  - Includes dependency rationale and library choices
  - Comprehensive TypeScript interface definitions
  - Component interaction diagrams (mermaid)
  - Error handling strategy with typed exceptions
  - Testing strategy and mocking approaches

- **`tasks.md`** - Implementation checklist with requirement traceability
  - Tasks map to specific requirements via `_Requirements: X.Y_` notation
  - Clear progression from setup through comprehensive testing
  - Each task should be actionable and testable

### Spec-Driven Development Process
1. Start with requirements gathering using EARS format
2. Design technical architecture with clear component boundaries
3. Break down into implementation tasks with requirement traceability
4. Implement following the task checklist
5. Verify all requirements are met through testing

### Example Patterns
- Requirements focus on "As a [user], I want [capability], so that [benefit]"
- Design includes library evaluation and architectural decisions
- Tasks progress logically from types → components → integration → testing

## Automatic Commit Workflow
**IMPORTANT**: After completing any substantial development work, automatically use the task-commit-proposer agent to propose commits. Use the Task tool with `subagent_type="task-commit-proposer"` when:

- TodoWrite tasks are marked as "completed"
- New files created or existing files substantially modified  
- Test files added or updated
- Bug fixes completed
- Refactoring work finished
- Any development milestone reached

The agent will analyze git changes, create appropriate conventional commit messages, and propose commits for user confirmation. This ensures clean, atomic commits that capture logical units of work.

## Communication Guidelines
- Don't be enthusiastic or apologetic. Your tone should be that of a peer coworker, not a servant.

## Memory

### Git Interactions
- When showing a preview of a git commit, include a list of the changed files