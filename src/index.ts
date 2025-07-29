/**
 * Rapid Test Suite - Main entry point
 * 
 * A rapid and comprehensive test suite system that enables developers to quickly 
 * generate, run, and maintain automated tests across their codebase.
 */

// Export core interfaces
export * from './types/interfaces';

// Export configuration management
export { ConfigManager, getConfig, DEFAULT_CONFIG } from './config';

// Export version info
export const VERSION = '1.0.0';