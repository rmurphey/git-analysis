# Linting Implementation Plan

## Overview
Add comprehensive linting to the rapid-test-suite project using ESLint with TypeScript support, aligned with functional programming preferences and existing project structure.

## Current State Analysis
- **Language**: TypeScript with strict mode enabled
- **Build System**: TypeScript compiler (tsc)
- **Testing**: Jest with ts-jest
- **Code Style**: Functional programming patterns preferred, avoid mutation
- **Project Structure**: Modular architecture with clear separation of concerns

## Implementation Steps

### 1. Dependencies Installation
Add the following dev dependencies:
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier
```

### 2. ESLint Configuration (.eslintrc.json)
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "eslint:recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    // Functional programming alignment
    "prefer-const": "error",
    "no-var": "error",
    "no-param-reassign": "error",
    "no-let": "off", // Allow let for necessary cases
    
    // TypeScript-specific
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    
    // Code quality
    "no-console": "warn",
    "complexity": ["warn", 10]
  },
  "env": {
    "node": true,
    "jest": true,
    "es2020": true
  }
}
```

### 3. Ignore Configuration (.eslintignore)
```
dist/
node_modules/
coverage/
*.d.ts
jest.config.js
```

### 4. Package.json Scripts
Add to the scripts section:
```json
{
  "lint": "eslint 'src/**/*.{ts,tsx}' --max-warnings 0",
  "lint:fix": "eslint 'src/**/*.{ts,tsx}' --fix",
  "lint:changed": "eslint $(git diff --name-only --diff-filter=ACMR | grep '\\.tsx\\?$' | xargs)",
  "lint:changed:fix": "eslint $(git diff --name-only --diff-filter=ACMR | grep '\\.tsx\\?$' | xargs) --fix"
}
```

### 5. IDE Integration (.vscode/settings.json)
```json
{
  "eslint.validate": ["typescript"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

### 6. Integration Points

#### Build Process
- Add linting as a pre-build step
- Ensure `npm run build` fails if linting errors exist
- Update build script: `"prebuild": "npm run lint"`

#### Testing Integration
- Run linting before tests
- Add to pre-test hook: `"pretest": "npm run lint"`

#### Git Hooks (Optional)
- Consider pre-commit hook for changed files
- Use husky + lint-staged for automation

### 7. Migration Strategy

#### Phase 1: Setup
1. Install dependencies
2. Create configuration files
3. Add package.json scripts

#### Phase 2: Initial Assessment
1. Run `npm run lint` to identify existing issues
2. Categorize issues: auto-fixable vs manual
3. Document any rule adjustments needed

#### Phase 3: Remediation
1. Run `npm run lint:fix` for auto-fixable issues
2. Address remaining issues manually
3. Update configurations if needed for project-specific patterns

#### Phase 4: Integration
1. Add to build process
2. Update development workflow documentation
3. Configure IDE settings for team consistency

### 8. Functional Programming Rule Considerations

Given the project's preference for functional programming:
- Enable `no-param-reassign` to prevent mutation
- Configure `prefer-const` to encourage immutability
- Consider `functional/no-mutation` plugin for stricter functional patterns
- Allow necessary imperative patterns for CLI and I/O operations

### 9. Maintenance
- Regular updates to ESLint and TypeScript ESLint packages
- Review and adjust rules based on team feedback
- Monitor for new recommended rules in updates

### 10. Success Criteria
- ✅ All existing code passes linting with minimal configuration changes
- ✅ `lint:changed:fix` command works as specified in CLAUDE.md
- ✅ Linting integrates seamlessly with existing build and test processes
- ✅ IDE provides real-time linting feedback
- ✅ Functional programming patterns are enforced through rules

## Notes
- This plan aligns with the existing TypeScript strict mode configuration
- Rules are chosen to support the modular architecture and functional programming approach
- The `lint:changed:fix` command specifically matches the requirement in CLAUDE.md
- Configuration allows for gradual adoption without breaking existing development workflow