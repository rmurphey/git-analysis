import { GitWrapper } from './wrapper';
import { GitDataProcessor } from './processor';
import { GitQueryEngine } from './query';
import { 
  GitCommit, 
  GitHistoryQuery, 
  GitHistoryResult, 
  RepositoryInfo 
} from './types';
import { 
  RepositoryNotFoundError, 
  InvalidRepositoryError,
  GitCommandError 
} from './errors';

export class GitHistoryModule {
  private readonly wrapper: GitWrapper;
  private readonly processor: GitDataProcessor;
  private readonly queryEngine: GitQueryEngine;

  constructor(repositoryPath: string) {
    this.wrapper = new GitWrapper(repositoryPath);
    this.processor = new GitDataProcessor();
    this.queryEngine = new GitQueryEngine();
  }

  /**
   * Initialize the module by validating the repository
   */
  async initialize(): Promise<void> {
    await this.wrapper.validateRepository();
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<RepositoryInfo> {
    return await this.wrapper.getRepositoryInfo();
  }

  /**
   * Query git history with filtering and pagination
   */
  async queryHistory(query: GitHistoryQuery = {}): Promise<GitHistoryResult> {
    try {
      // Get raw commits from git
      const logOptions = this.queryEngine.buildLogOptions(query);
      const logResult = await this.wrapper.getLog(logOptions);
      
      // Process commits to domain objects
      const commits = this.processor.processCommits(logResult.all);
      
      // Apply filtering and pagination
      const result = this.queryEngine.executeQuery(commits, query);
      
      return result;
    } catch (error) {
      if (error instanceof RepositoryNotFoundError || 
          error instanceof InvalidRepositoryError ||
          error instanceof GitCommandError) {
        throw error;
      }
      throw new GitCommandError('query history', error as Error);
    }
  }

  /**
   * Get a specific commit by hash
   */
  async getCommit(hash: string, enhanced = false): Promise<GitCommit | null> {
    try {
      const logResult = await this.wrapper.getCommitDetails(hash);
      if (logResult.all.length === 0) {
        return null;
      }

      let commit = this.processor.processCommit(logResult.all[0]);

      // Enhance with additional data if requested
      if (enhanced) {
        try {
          const [diffOutput, statsOutput] = await Promise.all([
            this.wrapper.getCommitDiff(hash),
            this.wrapper.getCommitStats(hash)
          ]);
          
          commit = this.processor.enhanceCommit(commit, {
            diffOutput,
            statsOutput
          });
        } catch {
          // If enhancement fails, return basic commit
        }
      }

      return commit;
    } catch (error) {
      if (error instanceof GitCommandError) {
        throw error;
      }
      throw new GitCommandError(`get commit ${hash}`, error as Error);
    }
  }

  /**
   * Get history for a specific file
   */
  async getFileHistory(filePath: string, query: GitHistoryQuery = {}): Promise<GitHistoryResult> {
    try {
      // Get file-specific log
      const logOptions = this.queryEngine.buildLogOptions(query);
      const logResult = await this.wrapper.getFileHistory(filePath, logOptions);
      
      // Process commits
      const commits = this.processor.processCommits(logResult.all);
      
      // Apply additional filtering
      const result = this.queryEngine.executeQuery(commits, query);
      
      return result;
    } catch (error) {
      if (error instanceof GitCommandError) {
        throw error;
      }
      throw new GitCommandError(`get file history for ${filePath}`, error as Error);
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(includeRemote = false): Promise<string[]> {
    return await this.wrapper.getBranches(includeRemote);
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string | undefined> {
    return await this.wrapper.getCurrentBranch();
  }

  /**
   * Get list of remotes
   */
  async getRemotes(): Promise<string[]> {
    return await this.wrapper.getRemotes();
  }
}

// Re-export types and errors for convenience
export * from './types';
export * from './errors';