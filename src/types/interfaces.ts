/**
 * Core interfaces for the Rapid Test Suite
 */

// Configuration interfaces
export interface Config {
  testDir: string;
  sourceDir: string;
  coverageThreshold: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}

// Test stub generator interfaces
export interface StubGenerator {
  parseSourceFile(_filePath: string): ParsedFile;
  generateStub(_parsedFile: ParsedFile): string;
  createTestFile(_sourceFile: string, _outputPath: string): void;
}

export interface ParsedFile {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  exports: ExportInfo[];
  filePath: string;
}

export interface FunctionInfo {
  name: string;
  parameters: string[];
  isAsync: boolean;
  isExported: boolean;
  returnType?: string;
}

export interface ClassInfo {
  name: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
  isExported: boolean;
}

export interface MethodInfo {
  name: string;
  parameters: string[];
  isAsync: boolean;
  isStatic: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface PropertyInfo {
  name: string;
  type?: string;
  isStatic: boolean;
  visibility: 'public' | 'private' | 'protected';
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'type';
  isDefault: boolean;
}

// Smart test runner interfaces
export interface SmartRunner {
  runAffectedTests(): Promise<TestResults>;
  runAllTests(): Promise<TestResults>;
  watchMode(): void;
}

export interface TestResults {
  passed: number;
  failed: number;
  total: number;
  coverage: number;
  uncoveredFiles: string[];
  failedTests: FailedTest[];
  executionTime: number;
}

export interface FailedTest {
  testName: string;
  filePath: string;
  error: string;
  line?: number;
}

// Coverage reporter interfaces
export interface CoverageReporter {
  generateReport(): Promise<void>;
  showUncoveredLines(): string[];
  getCoverageData(): CoverageData;
}

export interface CoverageData {
  lines: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  statements: CoverageMetric;
  files: FileCoverage[];
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

export interface FileCoverage {
  filePath: string;
  lines: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  statements: CoverageMetric;
  uncoveredLines: number[];
}

// CLI interfaces
export interface CLICommand {
  name: string;
  description: string;
  execute(_args: string[]): Promise<void>;
}

export interface CLIOptions {
  sourceDir?: string;
  testDir?: string;
  coverage?: boolean;
  watch?: boolean;
  verbose?: boolean;
  config?: string;
}

// File watcher interfaces
export interface FileWatcher {
  watch(_paths: string[], _callback: (_changedFiles: string[]) => void): void;
  stop(): void;
}

// Git integration interfaces
export interface GitIntegration {
  getChangedFiles(): Promise<string[]>;
  getAffectedTestFiles(_changedFiles: string[]): Promise<string[]>;
  isGitRepository(): boolean;
}