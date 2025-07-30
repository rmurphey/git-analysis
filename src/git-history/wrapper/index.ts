import { simpleGit, SimpleGit, LogResult, LogOptions } from 'simple-git';
import { 
  RepositoryNotFoundError, 
  InvalidRepositoryError, 
  GitCommandError 
} from '../errors';
import { RepositoryInfo } from '../types';

export class GitWrapper {
  private readonly git: SimpleGit;
  private readonly repoPath: string;

  constructor(repositoryPath: string) {
    this.repoPath = repositoryPath;
    this.git = simpleGit(repositoryPath);
  }

  async validateRepository(): Promise<void> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new InvalidRepositoryError(this.repoPath);
      }
    } catch (error) {
      if (error instanceof InvalidRepositoryError) {
        throw error;
      }
      throw new RepositoryNotFoundError(this.repoPath, error as Error);
    }
  }

  async getRepositoryInfo(): Promise<RepositoryInfo> {
    try {
      await this.validateRepository();
      
      const [currentBranch, remotes] = await Promise.all([
        this.getCurrentBranch(),
        this.getRemotes()
      ]);

      return {
        path: this.repoPath,
        isRepository: true,
        currentBranch,
        remotes
      };
    } catch {
      return {
        path: this.repoPath,
        isRepository: false
      };
    }
  }

  async getCurrentBranch(): Promise<string | undefined> {
    try {
      const status = await this.git.status();
      return status.current || undefined;
    } catch (error) {
      throw new GitCommandError('get current branch', error as Error);
    }
  }

  async getRemotes(): Promise<string[]> {
    try {
      const remotes = await this.git.getRemotes(true);
      return remotes.map(remote => remote.name);
    } catch (error) {
      throw new GitCommandError('get remotes', error as Error);
    }
  }

  async getBranches(includeRemote = false): Promise<string[]> {
    try {
      const branches = await this.git.branch(includeRemote ? ['-a'] : []);
      return branches.all;
    } catch (error) {
      throw new GitCommandError('get branches', error as Error);
    }
  }

  async getLog(options: LogOptions = {}): Promise<LogResult> {
    try {
      return await this.git.log(options);
    } catch (error) {
      throw new GitCommandError(`get log with options: ${JSON.stringify(options)}`, error as Error);
    }
  }

  async getCommitDetails(hash: string): Promise<LogResult> {
    try {
      return await this.git.log({ 
        from: hash, 
        to: hash,
        maxCount: 1
      });
    } catch (error) {
      throw new GitCommandError(`get commit details for ${hash}`, error as Error);
    }
  }

  async getCommitDiff(hash: string): Promise<string> {
    try {
      return await this.git.show([hash, '--format=']);
    } catch (error) {
      throw new GitCommandError(`get diff for commit ${hash}`, error as Error);
    }
  }

  async getCommitStats(hash: string): Promise<string> {
    try {
      return await this.git.show([hash, '--stat', '--format=']);
    } catch (error) {
      throw new GitCommandError(`get stats for commit ${hash}`, error as Error);
    }
  }

  async getFileHistory(filePath: string, options: LogOptions = {}): Promise<LogResult> {
    try {
      return await this.git.log({
        ...options,
        file: filePath
      });
    } catch (error) {
      throw new GitCommandError(`get file history for ${filePath}`, error as Error);
    }
  }
}