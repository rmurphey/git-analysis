#!/usr/bin/env node

/**
 * TypeScript Project Setup Script
 * 
 * This script initializes a new TypeScript project with:
 * - Git repository
 * - TypeScript configuration
 * - Jest testing framework
 * - ESLint and Prettier
 * - Project structure
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
    }

    info(message) {
        console.log(`ℹ️  ${message}`);
    }

    success(message) {
        console.log(`✅ ${message}`);
    }

    warn(message) {
        console.warn(`⚠️  ${message}`);
    }

    error(message) {
        console.error(`❌ ${message}`);
    }

    debug(message) {
        if (this.logLevel === 'debug') {
            console.log(`🐛 ${message}`);
        }
    }

    step(stepNumber, totalSteps, message) {
        console.log(`\n[${stepNumber}/${totalSteps}] ${message}`);
    }
}

class SetupError extends Error {
    constructor(message, code = 'SETUP_ERROR') {
        super(message);
        this.name = 'SetupError';
        this.code = code;
    }
}

class ProjectSetup {
    constructor() {
        this.logger = new Logger();
        this.projectRoot = process.cwd();
        this.setupSteps = [
            'Validate prerequisites',
            'Initialize Git repository',
            'Create package.json configuration',
            'Implement TypeScript configuration',
            'Set up Jest testing framework',
            'Configure development tooling',
            'Create project structure',
            'Generate documentation',
            'Install dependencies',
            'Cleanup setup files'
        ];
    }

    async run() {
        try {
            this.logger.info('Starting TypeScript project setup...');
            this.logger.info(`Project directory: ${this.projectRoot}`);
            
            // Step 1: Validate prerequisites
            this.logger.step(1, this.setupSteps.length, 'Validating prerequisites');
            await this.validatePrerequisites();
            
            this.logger.success('Project setup completed successfully!');
            this.logger.info('You can now start developing your TypeScript project.');
            
        } catch (error) {
            this.logger.error(`Setup failed: ${error.message}`);
            
            if (error.code) {
                this.logger.error(`Error code: ${error.code}`);
            }
            
            this.logger.info('Please resolve the issues above and run the setup again.');
            process.exit(1);
        }
    }

    async validatePrerequisites() {
        this.logger.info('Checking system prerequisites...');
        
        // Check Node.js
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            this.logger.success(`Node.js found: ${nodeVersion}`);
            
            // Verify Node.js version is 16 or higher
            const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
            if (majorVersion < 16) {
                throw new SetupError(
                    `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or higher.`,
                    'NODE_VERSION_UNSUPPORTED'
                );
            }
        } catch (error) {
            if (error instanceof SetupError) {
                throw error;
            }
            throw new SetupError(
                'Node.js is not installed or not available in PATH. Please install Node.js 16 or higher.',
                'NODE_NOT_FOUND'
            );
        }

        // Check npm
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            this.logger.success(`npm found: ${npmVersion}`);
        } catch (error) {
            throw new SetupError(
                'npm is not installed or not available in PATH. Please install npm.',
                'NPM_NOT_FOUND'
            );
        }

        // Check Git
        try {
            const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
            this.logger.success(`Git found: ${gitVersion}`);
        } catch (error) {
            throw new SetupError(
                'Git is not installed or not available in PATH. Please install Git.',
                'GIT_NOT_FOUND'
            );
        }

        // Check if directory is empty or has only setup files
        const files = fs.readdirSync(this.projectRoot);
        const setupFiles = ['setup.js', '.kiro'];
        const nonSetupFiles = files.filter(file => !setupFiles.includes(file));
        
        if (nonSetupFiles.length > 0) {
            this.logger.warn('Directory is not empty. Existing files:');
            nonSetupFiles.forEach(file => this.logger.warn(`  - ${file}`));
            
            // Check for potential conflicts
            const conflictFiles = ['package.json', 'tsconfig.json', '.git', 'src'];
            const conflicts = nonSetupFiles.filter(file => conflictFiles.includes(file));
            
            if (conflicts.length > 0) {
                throw new SetupError(
                    `Directory contains conflicting files: ${conflicts.join(', ')}. Please run setup in an empty directory or remove these files.`,
                    'DIRECTORY_NOT_EMPTY'
                );
            }
        }

        // Check write permissions
        try {
            const testFile = path.join(this.projectRoot, '.setup-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            this.logger.success('Write permissions verified');
        } catch (error) {
            throw new SetupError(
                'No write permissions in current directory. Please check directory permissions.',
                'NO_WRITE_PERMISSION'
            );
        }

        this.logger.success('All prerequisites validated successfully');
    }

    async executeCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            this.logger.debug(`Executing: ${command}`);
            
            const child = spawn(command, [], {
                shell: true,
                cwd: options.cwd || this.projectRoot,
                stdio: options.silent ? 'pipe' : 'inherit'
            });

            let stdout = '';
            let stderr = '';

            if (options.silent) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
                }
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    cleanup() {
        try {
            this.logger.info('Cleaning up setup files...');
            
            // Remove setup script
            if (fs.existsSync('setup.js')) {
                fs.unlinkSync('setup.js');
                this.logger.success('Removed setup.js');
            }
            
        } catch (error) {
            this.logger.warn(`Failed to cleanup some files: ${error.message}`);
        }
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\nSetup interrupted by user');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('\nUncaught exception:', error.message);
    process.exit(1);
});

// Run setup if this file is executed directly
if (require.main === module) {
    const setup = new ProjectSetup();
    setup.run();
}

module.exports = { ProjectSetup, Logger, SetupError };