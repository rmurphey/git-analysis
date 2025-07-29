import { ASTParser } from '../../src/parser/ast-parser';
import * as path from 'path';

describe('ASTParser Integration Tests', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  it('should parse the interfaces file', () => {
    const filePath = path.join(__dirname, '../../src/types/interfaces.ts');
    const result = parser.parseSourceFile(filePath);

    // Should have the correct file path
    expect(result.filePath).toBe(filePath);
    
    // Interfaces are type-only constructs and don't appear as runtime exports
    // Our parser focuses on runtime constructs (functions, classes, variables)
    expect(result.functions).toEqual([]);
    expect(result.classes).toEqual([]);
    
    // This is expected behavior - interfaces don't create runtime exports
    expect(result.exports).toEqual([]);
  });

  it('should parse the config file', () => {
    const filePath = path.join(__dirname, '../../src/config/index.ts');
    const result = parser.parseSourceFile(filePath);

    // Config file might be empty or have basic exports
    expect(result).toBeDefined();
    expect(result.filePath).toBe(filePath);
  });

  it('should handle files with imports and complex syntax', () => {
    // Test with our own AST parser file
    const filePath = path.join(__dirname, '../../src/parser/ast-parser.ts');
    const result = parser.parseSourceFile(filePath);

    // Should find the ASTParser class
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe('ASTParser');
    expect(result.classes[0].isExported).toBe(true);
    
    // Should have methods
    expect(result.classes[0].methods.length).toBeGreaterThan(0);
    
    // Should find the class in exports
    expect(result.exports).toContainEqual({
      name: 'ASTParser',
      type: 'class',
      isDefault: false
    });
  });
});