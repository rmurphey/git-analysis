import { ConfigManager, DEFAULT_CONFIG } from '../../src/config';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigManager', () => {
  const testConfigPath = path.join(__dirname, 'test-config.json');

  afterEach(() => {
    // Clean up test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('constructor', () => {
    it('should load default configuration when no config file exists', () => {
      const config = new ConfigManager('/non/existent/path.json');
      expect(config.getConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('should load configuration from existing file', () => {
      const customConfig = {
        testDir: 'custom-tests',
        sourceDir: 'custom-src',
        coverageThreshold: 90
      };
      
      fs.writeFileSync(testConfigPath, JSON.stringify(customConfig), 'utf8');
      
      const config = new ConfigManager(testConfigPath);
      const loadedConfig = config.getConfig();
      
      expect(loadedConfig.testDir).toBe('custom-tests');
      expect(loadedConfig.sourceDir).toBe('custom-src');
      expect(loadedConfig.coverageThreshold).toBe(90);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration values', () => {
      const config = new ConfigManager();
      
      config.updateConfig({
        testDir: 'updated-tests',
        coverageThreshold: 95
      });
      
      const updatedConfig = config.getConfig();
      expect(updatedConfig.testDir).toBe('updated-tests');
      expect(updatedConfig.coverageThreshold).toBe(95);
      expect(updatedConfig.sourceDir).toBe(DEFAULT_CONFIG.sourceDir); // Should keep default
    });
  });

  describe('validateConfig', () => {
    it('should return no errors for valid configuration', () => {
      const config = new ConfigManager();
      const errors = config.validateConfig();
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid configuration', () => {
      const config = new ConfigManager();
      config.updateConfig({
        testDir: '',
        coverageThreshold: 150
      });
      
      const errors = config.validateConfig();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('testDir'))).toBe(true);
      expect(errors.some(error => error.includes('coverageThreshold'))).toBe(true);
    });
  });
});