import { ASTParser } from '../../src/parser/ast-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ASTParser', () => {
  let parser: ASTParser;
  let tempDir: string;

  beforeEach(() => {
    parser = new ASTParser();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-parser-test-'));
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const createTempFile = (filename: string, content: string): string => {
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  describe('parseSourceFile', () => {
    it('should throw error for non-existent file', () => {
      expect(() => {
        parser.parseSourceFile('/non/existent/file.ts');
      }).toThrow('File not found: /non/existent/file.ts');
    });

    it('should parse empty file', () => {
      const filePath = createTempFile('empty.ts', '');
      const result = parser.parseSourceFile(filePath);

      expect(result).toEqual({
        functions: [],
        classes: [],
        exports: [],
        filePath: filePath
      });
    });
  });

  describe('function parsing', () => {
    it('should parse simple function declaration', () => {
      const content = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const filePath = createTempFile('simple-function.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'add',
        parameters: ['a: number', 'b: number'],
        isAsync: false,
        isExported: false,
        returnType: 'number'
      });
    });

    it('should parse exported function', () => {
      const content = `
        export function multiply(x: number, y: number): number {
          return x * y;
        }
      `;
      const filePath = createTempFile('exported-function.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'multiply',
        parameters: ['x: number', 'y: number'],
        isAsync: false,
        isExported: true,
        returnType: 'number'
      });

      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toEqual({
        name: 'multiply',
        type: 'function',
        isDefault: false
      });
    });

    it('should parse async function', () => {
      const content = `
        export async function fetchData(url: string): Promise<any> {
          const response = await fetch(url);
          return response.json();
        }
      `;
      const filePath = createTempFile('async-function.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'fetchData',
        parameters: ['url: string'],
        isAsync: true,
        isExported: true,
        returnType: 'Promise<any>'
      });
    });

    it('should parse arrow function', () => {
      const content = `
        export const calculate = (a: number, b: number): number => {
          return a * b + 10;
        };
      `;
      const filePath = createTempFile('arrow-function.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'calculate',
        parameters: ['a: number', 'b: number'],
        isAsync: false,
        isExported: true,
        returnType: 'number'
      });
    });

    it('should parse async arrow function', () => {
      const content = `
        const processAsync = async (data: string): Promise<string> => {
          return data.toUpperCase();
        };
      `;
      const filePath = createTempFile('async-arrow.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'processAsync',
        parameters: ['data: string'],
        isAsync: true,
        isExported: false,
        returnType: 'Promise<string>'
      });
    });

    it('should parse function without type annotations', () => {
      const content = `
        function simpleAdd(a, b) {
          return a + b;
        }
      `;
      const filePath = createTempFile('no-types.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'simpleAdd',
        parameters: ['a', 'b'],
        isAsync: false,
        isExported: false,
        returnType: undefined
      });
    });
  });

  describe('class parsing', () => {
    it('should parse simple class', () => {
      const content = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `;
      const filePath = createTempFile('simple-class.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]).toEqual({
        name: 'Calculator',
        methods: [{
          name: 'add',
          parameters: ['a: number', 'b: number'],
          isAsync: false,
          isStatic: false,
          visibility: 'public'
        }],
        properties: [],
        isExported: false
      });
    });

    it('should parse exported class with properties and methods', () => {
      const content = `
        export class UserService {
          private apiUrl: string;
          public static instance: UserService;

          constructor(url: string) {
            this.apiUrl = url;
          }

          public async getUser(id: number): Promise<User> {
            // implementation
          }

          private static createInstance(): UserService {
            return new UserService('api.example.com');
          }

          protected validateId(id: number): boolean {
            return id > 0;
          }
        }
      `;
      const filePath = createTempFile('user-service.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.classes).toHaveLength(1);
      const classInfo = result.classes[0];
      
      expect(classInfo.name).toBe('UserService');
      expect(classInfo.isExported).toBe(true);
      
      // Check properties
      expect(classInfo.properties).toHaveLength(2);
      expect(classInfo.properties).toContainEqual({
        name: 'apiUrl',
        type: 'string',
        isStatic: false,
        visibility: 'private'
      });
      expect(classInfo.properties).toContainEqual({
        name: 'instance',
        type: 'UserService',
        isStatic: true,
        visibility: 'public'
      });

      // Check methods
      expect(classInfo.methods).toHaveLength(3);
      expect(classInfo.methods).toContainEqual({
        name: 'getUser',
        parameters: ['id: number'],
        isAsync: true,
        isStatic: false,
        visibility: 'public'
      });
      expect(classInfo.methods).toContainEqual({
        name: 'createInstance',
        parameters: [],
        isAsync: false,
        isStatic: true,
        visibility: 'private'
      });
      expect(classInfo.methods).toContainEqual({
        name: 'validateId',
        parameters: ['id: number'],
        isAsync: false,
        isStatic: false,
        visibility: 'protected'
      });

      // Check exports
      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toEqual({
        name: 'UserService',
        type: 'class',
        isDefault: false
      });
    });
  });

  describe('export parsing', () => {
    it('should parse named exports', () => {
      const content = `
        export const API_URL = 'https://api.example.com';
        export function helper() {}
        export class Utils {}
      `;
      const filePath = createTempFile('named-exports.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.exports).toHaveLength(3);
      expect(result.exports).toContainEqual({
        name: 'API_URL',
        type: 'variable',
        isDefault: false
      });
      expect(result.exports).toContainEqual({
        name: 'helper',
        type: 'function',
        isDefault: false
      });
      expect(result.exports).toContainEqual({
        name: 'Utils',
        type: 'class',
        isDefault: false
      });
    });

    it('should parse default export', () => {
      const content = `
        class DefaultClass {}
        export default DefaultClass;
      `;
      const filePath = createTempFile('default-export.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toEqual({
        name: 'DefaultClass',
        type: 'variable',
        isDefault: true
      });
    });

    it('should parse export default function', () => {
      const content = `
        export default function defaultFunction(param: string): void {
          console.log(param);
        }
      `;
      const filePath = createTempFile('default-function.ts', content);
      const result = parser.parseSourceFile(filePath);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual({
        name: 'defaultFunction',
        parameters: ['param: string'],
        isAsync: false,
        isExported: true,
        returnType: 'void'
      });

      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toEqual({
        name: 'defaultFunction',
        type: 'function',
        isDefault: true
      });
    });
  });

  describe('complex scenarios', () => {
    it('should parse file with mixed content', () => {
      const content = `
        import { SomeType } from './types';

        // Private function
        function privateHelper(data: any): string {
          return JSON.stringify(data);
        }

        // Exported class
        export class DataProcessor {
          private cache: Map<string, any> = new Map();

          public async process(input: SomeType): Promise<string> {
            const key = this.generateKey(input);
            if (this.cache.has(key)) {
              return this.cache.get(key);
            }
            
            const result = await this.processInternal(input);
            this.cache.set(key, result);
            return result;
          }

          private generateKey(input: SomeType): string {
            return privateHelper(input);
          }

          private async processInternal(input: SomeType): Promise<string> {
            // Complex processing logic
            return 'processed';
          }
        }

        // Exported arrow function
        export const validateInput = (input: unknown): input is SomeType => {
          return typeof input === 'object' && input !== null;
        };

        // Default export
        export default DataProcessor;
      `;
      const filePath = createTempFile('complex.ts', content);
      const result = parser.parseSourceFile(filePath);

      // Check functions
      expect(result.functions).toHaveLength(2);
      expect(result.functions.find(f => f.name === 'privateHelper')).toEqual({
        name: 'privateHelper',
        parameters: ['data: any'],
        isAsync: false,
        isExported: false,
        returnType: 'string'
      });
      expect(result.functions.find(f => f.name === 'validateInput')).toEqual({
        name: 'validateInput',
        parameters: ['input: unknown'],
        isAsync: false,
        isExported: true,
        returnType: 'input is SomeType'
      });

      // Check classes
      expect(result.classes).toHaveLength(1);
      const classInfo = result.classes[0];
      expect(classInfo.name).toBe('DataProcessor');
      expect(classInfo.isExported).toBe(true);
      expect(classInfo.methods).toHaveLength(3);
      expect(classInfo.properties).toHaveLength(1);

      // Check exports
      expect(result.exports).toHaveLength(3);
      expect(result.exports).toContainEqual({
        name: 'DataProcessor',
        type: 'class',
        isDefault: false
      });
      expect(result.exports).toContainEqual({
        name: 'validateInput',
        type: 'function',
        isDefault: false
      });
      expect(result.exports).toContainEqual({
        name: 'DataProcessor',
        type: 'variable',
        isDefault: true
      });
    });
  });
});