# Git Analysis

A comprehensive TypeScript library for analyzing Git repository history, providing tools to query commits, analyze file changes, and extract repository insights.

## Project Structure

```
src/
├── cli/           # Command-line interface
├── config/        # Configuration management
├── git-history/   # Git history analysis module
│   ├── cache/     # Result caching system  
│   ├── errors/    # Custom error types
│   ├── processor/ # Data processing components
│   ├── query/     # Query engine
│   ├── types/     # TypeScript interfaces
│   └── wrapper/   # Git command wrapper
├── generator/     # Test stub generator (planned)
├── parser/        # AST parsing utilities
├── reporter/      # Coverage reporter (planned)
├── runner/        # Smart test runner (planned)
├── types/         # Core TypeScript interfaces
└── index.ts       # Main entry point

tests/
├── git-history/   # Git history module tests
└── config/        # Configuration tests

dist/              # Compiled JavaScript output
coverage/          # Test coverage reports
```

## Features

- **Git History Analysis**: Query and analyze commit history with flexible filtering
- **File History Tracking**: Track changes to specific files over time
- **Author and Date Filtering**: Filter commits by author patterns and date ranges
- **Commit Enhancement**: Get detailed diff and statistics for commits
- **Repository Information**: Extract branch, remote, and repository metadata
- **TypeScript Support**: Comprehensive type definitions for all operations
- **Error Handling**: Robust error handling with custom exception types
- **Performance**: Built-in caching and efficient data processing

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Git History Analysis

```typescript
import { GitHistoryModule } from 'git-analysis';

async function analyzeRepository() {
  // Initialize the module with repository path
  const gitHistory = new GitHistoryModule('/path/to/git/repo');
  await gitHistory.initialize();
  
  // Get repository information
  const repoInfo = await gitHistory.getRepositoryInfo();
  console.log(`Current branch: ${repoInfo.currentBranch}`);
  
  // Query recent commits
  const recentCommits = await gitHistory.queryHistory({
    maxCount: 10,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  console.log(`Found ${recentCommits.commits.length} commits`);
  recentCommits.commits.forEach(commit => {
    console.log(`${commit.shortHash}: ${commit.subject}`);
  });
}
```

### Advanced Querying

```typescript
// Filter by author and date range
const authorCommits = await gitHistory.queryHistory({
  authors: ['john.doe@example.com'],
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
  maxCount: 50
});

// Filter by file patterns
const fileChanges = await gitHistory.queryHistory({
  filePattern: '*.ts',
  includeMerges: false
});

// Get detailed commit information
const detailedCommit = await gitHistory.getCommit('abc123', true);
if (detailedCommit) {
  console.log(`Total changes: ${detailedCommit.stats?.filesChanged} files`);
  console.log(`Insertions: ${detailedCommit.stats?.totalInsertions}`);
  console.log(`Deletions: ${detailedCommit.stats?.totalDeletions}`);
}
```

### File History Analysis

```typescript
// Get history for a specific file
const fileHistory = await gitHistory.getFileHistory('src/index.ts', {
  maxCount: 20,
  authors: ['developer@example.com']
});

console.log(`File has ${fileHistory.commits.length} commits`);
fileHistory.commits.forEach(commit => {
  const fileChange = commit.files.find(f => f.path === 'src/index.ts');
  if (fileChange) {
    console.log(`${commit.date.toISOString()}: ${fileChange.changeType}`);
  }
});
```

### Repository Metadata

```typescript
// Get branch information
const branches = await gitHistory.getBranches(true); // Include remote branches
const currentBranch = await gitHistory.getCurrentBranch();
const remotes = await gitHistory.getRemotes();

console.log(`Branches: ${branches.join(', ')}`);
console.log(`Current: ${currentBranch}`);
console.log(`Remotes: ${remotes.join(', ')}`);
```

## API Reference

### GitHistoryModule

The main class for interacting with Git repository history.

#### Methods

- `initialize()`: Validate and initialize the repository
- `getRepositoryInfo()`: Get basic repository information
- `queryHistory(query?)`: Query commit history with optional filtering
- `getCommit(hash, enhanced?)`: Get a specific commit by hash
- `getFileHistory(filePath, query?)`: Get history for a specific file
- `getBranches(includeRemote?)`: Get list of branches
- `getCurrentBranch()`: Get current branch name
- `getRemotes()`: Get list of remotes

### Query Options (GitHistoryQuery)

- `dateFrom`, `dateTo`: Filter by date range
- `authors`: Filter by specific author emails
- `authorPattern`: Filter by author name/email pattern
- `filePaths`: Filter by specific file paths
- `filePattern`: Filter by file pattern (glob)
- `maxCount`: Limit number of results
- `skip`: Skip number of results (pagination)
- `includeMerges`: Include merge commits
- `sortBy`: Sort by 'date', 'author', or 'hash'
- `sortOrder`: Sort order 'asc' or 'desc'

## Configuration

The module uses configuration for caching and performance optimization:

```json
{
  "testDir": "tests",
  "sourceDir": "src", 
  "coverageThreshold": 80,
  "excludePatterns": ["node_modules/**", "dist/**"],
  "includePatterns": ["**/*.ts", "**/*.js"]
}
```

## Development Agents

This project includes automated development agents that streamline common workflows through Claude Code integration. These agents automatically trigger after code changes to maintain project quality and documentation.

### Available Agents

- **task-commit-proposer**: Automatically analyzes changes and proposes appropriate commit messages after completing development work
- **readme-maintainer**: Keeps the README updated when significant code changes are made to ensure documentation stays current
- **cost-estimator**: Tracks and estimates Claude Code usage costs after commits to help monitor AI assistance expenses

### How It Works

The agents are invoked automatically through instructions in `CLAUDE.md` that trigger the general-purpose agent with specialized prompts. Each agent has its own configuration file in `.claude/agents/` that defines its specific behavior and triggers.

### Benefits

- **Consistency**: Automated commit messages follow project conventions
- **Documentation**: README stays synchronized with codebase changes
- **Cost Awareness**: Track AI tool usage to manage development expenses
- **Quality**: Reduces manual overhead while maintaining project standards

### Agent Files

Agent configurations are stored in `.claude/agents/` with prompts that define each agent's specialized behavior. This approach allows for easy customization and extension of automated workflows.

## Development

```bash
# Build the project
npm run build

# Run tests
npm test

# Development mode with watch
npm run dev
```