import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types/interfaces';

/**
 * Default configuration for the Rapid Test Suite
 */
const DEFAULT_CONFIG: Config = {
  testDir: 'tests',
  sourceDir: 'src',
  coverageThreshold: 80,
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    '*.d.ts',
    'coverage/**'
  ],
  includePatterns: [
    '**/*.ts',
    '**/*.js'
  ]
};

/**
 * Configuration manager for loading and managing test suite settings
 */
export class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.findConfigFile();
    this.config = this.loadConfig();
  }

  /**
   * Get the current configuration
   */
  getConfig(): Config {
    return { ...this.config };
  }

  /**
   * Update configuration with new values
   */
  updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Save current configuration to file
   */
  saveConfig(): void {
    const configData = JSON.stringify(this.config, null, 2);
    fs.writeFileSync(this.configPath, configData, 'utf8');
  }

  /**
   * Load configuration from file or use defaults
   */
  private loadConfig(): Config {
    if (fs.existsSync(this.configPath)) {
      try {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const fileConfig = JSON.parse(configData);
        return { ...DEFAULT_CONFIG, ...fileConfig };
      } catch (error) {
        console.warn(`Warning: Could not parse config file ${this.configPath}. Using defaults.`);
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }

  /**
   * Find configuration file in current directory or parent directories
   */
  private findConfigFile(): string {
    const configNames = [
      'rapid-test.config.json',
      '.rapid-test.json',
      'rapid-test.json'
    ];

    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      for (const configName of configNames) {
        const configPath = path.join(currentDir, configName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    // Default to rapid-test.config.json in current directory
    return path.join(process.cwd(), 'rapid-test.config.json');
  }

  /**
   * Validate configuration values
   */
  validateConfig(): string[] {
    const errors: string[] = [];

    if (!this.config.testDir || typeof this.config.testDir !== 'string') {
      errors.push('testDir must be a non-empty string');
    }

    if (!this.config.sourceDir || typeof this.config.sourceDir !== 'string') {
      errors.push('sourceDir must be a non-empty string');
    }

    if (typeof this.config.coverageThreshold !== 'number' || 
        this.config.coverageThreshold < 0 || 
        this.config.coverageThreshold > 100) {
      errors.push('coverageThreshold must be a number between 0 and 100');
    }

    return errors;
  }

  /**
   * Create a default configuration file
   */
  static createDefaultConfig(filePath?: string): void {
    const configPath = filePath || path.join(process.cwd(), 'rapid-test.config.json');
    const configData = JSON.stringify(DEFAULT_CONFIG, null, 2);
    fs.writeFileSync(configPath, configData, 'utf8');
  }
}

/**
 * Get configuration instance (singleton pattern)
 */
let configInstance: ConfigManager | null = null;

export function getConfig(configPath?: string): ConfigManager {
  if (!configInstance) {
    configInstance = new ConfigManager(configPath);
  }
  return configInstance;
}

export { DEFAULT_CONFIG };