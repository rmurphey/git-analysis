# Rapid Test Suite

A rapid and comprehensive test suite system that enables developers to quickly generate, run, and maintain automated tests across their codebase.

## Project Structure

```
src/
├── cli/           # Command-line interface
├── config/        # Configuration management
├── generator/     # Test stub generator
├── reporter/      # Coverage reporter
├── runner/        # Smart test runner
├── types/         # TypeScript interfaces
└── index.ts       # Main entry point

tests/
├── config/        # Configuration tests
└── ...            # Additional test directories

dist/              # Compiled JavaScript output
coverage/          # Test coverage reports
```

## Features

- **Automatic Test Generation**: Generate comprehensive test stubs for TypeScript/JavaScript code
- **Smart Test Running**: Run only affected tests based on code changes
- **Coverage Reporting**: Detailed coverage analysis with gap identification
- **File Watching**: Automatic test execution on code changes
- **Git Integration**: Detect changes and run relevant tests
- **Flexible Configuration**: Customizable settings for different project needs

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Generate test stubs
rapid-test generate

# Run affected tests
rapid-test run

# Watch mode
rapid-test watch

# Generate coverage report
rapid-test coverage
```

## Configuration

Create a `rapid-test.config.json` file in your project root:

```json
{
  "testDir": "tests",
  "sourceDir": "src",
  "coverageThreshold": 80,
  "excludePatterns": ["node_modules/**", "dist/**"],
  "includePatterns": ["**/*.ts", "**/*.js"]
}
```

## Development

```bash
# Build the project
npm run build

# Run tests
npm test

# Development mode with watch
npm run dev
```