/**
 * Git Analysis - Main entry point
 * 
 * A comprehensive TypeScript library for analyzing Git repository history,
 * providing tools to query commits, analyze file changes, and extract repository insights.
 */

// Export core interfaces
export * from './types/interfaces';

// Export configuration management
export { ConfigManager, getConfig, DEFAULT_CONFIG } from './config';

// Export git-history module
export { GitHistoryModule } from './git-history';
export * from './git-history/types';
export * from './git-history/errors';

// Export version info
export const VERSION = '1.0.0';