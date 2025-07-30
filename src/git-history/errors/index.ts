export abstract class GitHistoryError extends Error {
  abstract readonly code: string;
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    
    if (cause && Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Set the cause on the Error object for proper error chaining
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class RepositoryNotFoundError extends GitHistoryError {
  readonly code = 'REPOSITORY_NOT_FOUND';
  
  constructor(path: string, cause?: Error) {
    super(`Repository not found at path: ${path}`, cause);
  }
}

export class InvalidRepositoryError extends GitHistoryError {
  readonly code = 'INVALID_REPOSITORY';
  
  constructor(path: string, cause?: Error) {
    super(`Invalid git repository at path: ${path}`, cause);
  }
}

export class GitCommandError extends GitHistoryError {
  readonly code = 'GIT_COMMAND_ERROR';
  
  constructor(command: string, cause?: Error) {
    super(`Git command failed: ${command}`, cause);
  }
}

export class InvalidQueryError extends GitHistoryError {
  readonly code = 'INVALID_QUERY';
  
  constructor(message: string, cause?: Error) {
    super(`Invalid query: ${message}`, cause);
  }
}

export class CacheError extends GitHistoryError {
  readonly code = 'CACHE_ERROR';
  
  constructor(operation: string, cause?: Error) {
    super(`Cache operation failed: ${operation}`, cause);
  }
}

export class DataProcessingError extends GitHistoryError {
  readonly code = 'DATA_PROCESSING_ERROR';
  
  constructor(message: string, cause?: Error) {
    super(`Data processing failed: ${message}`, cause);
  }
}