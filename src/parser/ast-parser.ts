import * as ts from 'typescript';
import * as fs from 'fs';
import {
  ParsedFile,
  FunctionInfo,
  ClassInfo,
  MethodInfo,
  PropertyInfo
} from '../types/interfaces';

/**
 * TypeScript AST parser for analyzing source files and extracting
 * function and class information for test generation
 */
export class ASTParser {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  /**
   * Parse a TypeScript source file and extract relevant information
   */
  parseSourceFile(filePath: string): ParsedFile {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Create TypeScript program for the file
    const program = ts.createProgram([filePath], {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      allowJs: true,
      skipLibCheck: true
    });

    this.program = program;
    this.checker = program.getTypeChecker();

    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      throw new Error(`Could not parse source file: ${filePath}`);
    }

    const parsedFile: ParsedFile = {
      functions: [],
      classes: [],
      exports: [],
      filePath: filePath
    };

    // Visit all nodes in the AST
    this.visitNode(sourceFile, parsedFile);

    return parsedFile;
  }

  /**
   * Recursively visit AST nodes to extract information
   */
  private visitNode(node: ts.Node, parsedFile: ParsedFile): void {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        this.processFunctionDeclaration(node as ts.FunctionDeclaration, parsedFile);
        break;
      case ts.SyntaxKind.ClassDeclaration:
        this.processClassDeclaration(node as ts.ClassDeclaration, parsedFile);
        break;
      case ts.SyntaxKind.VariableStatement:
        this.processVariableStatement(node as ts.VariableStatement, parsedFile);
        break;
      case ts.SyntaxKind.ExportAssignment:
        this.processExportAssignment(node as ts.ExportAssignment, parsedFile);
        break;
    }

    // Continue visiting child nodes
    ts.forEachChild(node, (child) => this.visitNode(child, parsedFile));
  }

  /**
   * Process function declarations
   */
  private processFunctionDeclaration(node: ts.FunctionDeclaration, parsedFile: ParsedFile): void {
    if (!node.name) return;

    const functionInfo: FunctionInfo = {
      name: node.name.text,
      parameters: this.extractParameters(node.parameters),
      isAsync: this.hasAsyncModifier(node),
      isExported: this.hasExportModifier(node),
      returnType: this.getReturnType(node)
    };

    parsedFile.functions.push(functionInfo);

    if (functionInfo.isExported) {
      parsedFile.exports.push({
        name: functionInfo.name,
        type: 'function',
        isDefault: this.hasDefaultModifier(node)
      });
    }
  }

  /**
   * Process class declarations
   */
  private processClassDeclaration(node: ts.ClassDeclaration, parsedFile: ParsedFile): void {
    if (!node.name) return;

    const classInfo: ClassInfo = {
      name: node.name.text,
      methods: [],
      properties: [],
      isExported: this.hasExportModifier(node)
    };

    // Process class members
    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
        const methodInfo: MethodInfo = {
          name: member.name.text,
          parameters: this.extractParameters(member.parameters),
          isAsync: this.hasAsyncModifier(member),
          isStatic: this.hasStaticModifier(member),
          visibility: this.getVisibility(member)
        };
        classInfo.methods.push(methodInfo);
      } else if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
        const propertyInfo: PropertyInfo = {
          name: member.name.text,
          type: this.getPropertyType(member),
          isStatic: this.hasStaticModifier(member),
          visibility: this.getVisibility(member)
        };
        classInfo.properties.push(propertyInfo);
      }
    });

    parsedFile.classes.push(classInfo);

    if (classInfo.isExported) {
      parsedFile.exports.push({
        name: classInfo.name,
        type: 'class',
        isDefault: this.hasDefaultModifier(node)
      });
    }
  }

  /**
   * Process variable statements (for arrow functions and other exports)
   */
  private processVariableStatement(node: ts.VariableStatement, parsedFile: ParsedFile): void {
    const isExported = this.hasExportModifier(node);
    
    node.declarationList.declarations.forEach(declaration => {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        const name = declaration.name.text;
        
        // Check if it's an arrow function
        if (ts.isArrowFunction(declaration.initializer)) {
          const functionInfo: FunctionInfo = {
            name: name,
            parameters: this.extractParameters(declaration.initializer.parameters),
            isAsync: this.hasAsyncModifier(declaration.initializer),
            isExported: isExported,
            returnType: this.getReturnType(declaration.initializer)
          };
          parsedFile.functions.push(functionInfo);
          
          if (isExported) {
            parsedFile.exports.push({
              name: name,
              type: 'function',
              isDefault: false
            });
          }
        } else if (isExported) {
          // Other exported variables
          parsedFile.exports.push({
            name: name,
            type: 'variable',
            isDefault: false
          });
        }
      }
    });
  }

  /**
   * Process export assignments (export default)
   */
  private processExportAssignment(node: ts.ExportAssignment, parsedFile: ParsedFile): void {
    if (node.isExportEquals) return; // Skip export = syntax
    
    if (ts.isIdentifier(node.expression)) {
      parsedFile.exports.push({
        name: node.expression.text,
        type: 'variable',
        isDefault: true
      });
    }
  }

  /**
   * Extract parameter information from function parameters
   */
  private extractParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>): string[] {
    return parameters.map(param => {
      if (ts.isIdentifier(param.name)) {
        const name = param.name.text;
        const type = this.getParameterType(param);
        return type ? `${name}: ${type}` : name;
      }
      return 'param';
    });
  }

  /**
   * Check if node has async modifier
   */
  private hasAsyncModifier(node: ts.Node): boolean {
    const modifiersNode = node as ts.HasModifiers;
    return modifiersNode.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }

  /**
   * Check if node has export modifier
   */
  private hasExportModifier(node: ts.Node): boolean {
    const modifiersNode = node as ts.HasModifiers;
    return modifiersNode.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }

  /**
   * Check if node has default modifier
   */
  private hasDefaultModifier(node: ts.Node): boolean {
    const modifiersNode = node as ts.HasModifiers;
    return modifiersNode.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
  }

  /**
   * Check if node has static modifier
   */
  private hasStaticModifier(node: ts.Node): boolean {
    const modifiersNode = node as ts.HasModifiers;
    return modifiersNode.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ?? false;
  }

  /**
   * Get visibility of class member
   */
  private getVisibility(node: ts.Node): 'public' | 'private' | 'protected' {
    const modifiersNode = node as ts.HasModifiers;
    if (modifiersNode.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)) {
      return 'private';
    }
    if (modifiersNode.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ProtectedKeyword)) {
      return 'protected';
    }
    return 'public';
  }

  /**
   * Get return type of function
   */
  private getReturnType(node: ts.FunctionDeclaration | ts.ArrowFunction): string | undefined {
    if (node.type) {
      return node.type.getText();
    }
    return undefined;
  }

  /**
   * Get parameter type
   */
  private getParameterType(param: ts.ParameterDeclaration): string | undefined {
    if (param.type) {
      return param.type.getText();
    }
    return undefined;
  }

  /**
   * Get property type
   */
  private getPropertyType(prop: ts.PropertyDeclaration): string | undefined {
    if (prop.type) {
      return prop.type.getText();
    }
    return undefined;
  }
}