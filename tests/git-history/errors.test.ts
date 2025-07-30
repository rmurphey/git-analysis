import {
  GitHistoryError,
  RepositoryNotFoundError,
  InvalidRepositoryError,
  GitCommandError,
  InvalidQueryError,
  CacheError,
  DataProcessingError
} from '../../src/git-history/errors';

describe('Git History Errors', () => {
  describe('RepositoryNotFoundError', () => {
    it('should create error with correct properties', () => {
      const error = new RepositoryNotFoundError('/invalid/path');
      
      expect(error).toBeInstanceOf(GitHistoryError);
      expect(error).toBeInstanceOf(RepositoryNotFoundError);
      expect(error.name).toBe('RepositoryNotFoundError');
      expect(error.code).toBe('REPOSITORY_NOT_FOUND');
      expect(error.message).toBe('Repository not found at path: /invalid/path');
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new RepositoryNotFoundError('/invalid/path', cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('InvalidRepositoryError', () => {
    it('should create error with correct properties', () => {
      const error = new InvalidRepositoryError('/not/a/repo');
      
      expect(error).toBeInstanceOf(GitHistoryError);
      expect(error.code).toBe('INVALID_REPOSITORY');
      expect(error.message).toBe('Invalid git repository at path: /not/a/repo');
    });
  });

  describe('GitCommandError', () => {
    it('should create error with correct properties', () => {
      const error = new GitCommandError('git log --oneline');
      
      expect(error).toBeInstanceOf(GitHistoryError);
      expect(error.code).toBe('GIT_COMMAND_ERROR');
      expect(error.message).toBe('Git command failed: git log --oneline');
    });
  });

  describe('InvalidQueryError', () => {
    it('should create error with correct properties', () => {
      const error = new InvalidQueryError('Invalid date range');
      
      expect(error).toBeInstanceOf(GitHistoryError);
      expect(error.code).toBe('INVALID_QUERY');
      expect(error.message).toBe('Invalid query: Invalid date range');
    });
  });

  describe('CacheError', () => {
    it('should create error with correct properties', () => {
      const error = new CacheError('set operation');
      
      expect(error).toBeInstanceOf(GitHistoryError);
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.message).toBe('Cache operation failed: set operation');
    });
  });

  describe('DataProcessingError', () => {
    it('should create error with correct properties', () => {
      const error = new DataProcessingError('Failed to parse commit data');
      
      expect(error).toBeInstanceOf(GitHistoryError);
      expect(error.code).toBe('DATA_PROCESSING_ERROR');
      expect(error.message).toBe('Data processing failed: Failed to parse commit data');
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper prototype chain', () => {
      const error = new RepositoryNotFoundError('/test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof GitHistoryError).toBe(true);
      expect(error instanceof RepositoryNotFoundError).toBe(true);
    });

    it('should have stack trace', () => {
      const error = new GitCommandError('test command');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('GitCommandError');
    });
  });
});