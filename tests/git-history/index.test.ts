import { GitHistoryModule } from '../../src/git-history';
import { GitWrapper } from '../../src/git-history/wrapper';
import { GitDataProcessor } from '../../src/git-history/processor';
import { GitQueryEngine } from '../../src/git-history/query';
import { 
  GitCommit, 
  GitHistoryQuery, 
  RepositoryInfo 
} from '../../src/git-history/types';
import { 
  RepositoryNotFoundError, 
  InvalidRepositoryError,
  GitCommandError 
} from '../../src/git-history/errors';
import { DefaultLogFields, LogOptions, LogResult } from 'simple-git';

// Mock the dependencies
jest.mock('../../src/git-history/wrapper');
jest.mock('../../src/git-history/processor');
jest.mock('../../src/git-history/query');

const MockedGitWrapper = GitWrapper as jest.MockedClass<typeof GitWrapper>;
const MockedGitDataProcessor = GitDataProcessor as jest.MockedClass<typeof GitDataProcessor>;
const MockedGitQueryEngine = GitQueryEngine as jest.MockedClass<typeof GitQueryEngine>;

describe('GitHistoryModule', () => {
  let module: GitHistoryModule;
  let mockWrapper: jest.Mocked<GitWrapper>;
  let mockProcessor: jest.Mocked<GitDataProcessor>;
  let mockQueryEngine: jest.Mocked<GitQueryEngine>;

  const testRepoPath = '/test/repo';
  const testCommit: GitCommit = {
    hash: 'abc123',
    shortHash: 'abc123'.substring(0, 7),
    author: {
      name: 'Test Author',
      email: 'test@example.com',
      date: new Date('2023-01-01')
    },
    committer: {
      name: 'Test Author',
      email: 'test@example.com',
      date: new Date('2023-01-01')
    },
    message: 'Test commit message',
    subject: 'Test commit message',
    body: undefined,
    date: new Date('2023-01-01'),
    files: [],
    isMerge: false,
    parents: [],
    stats: undefined
  };

  const testLogResult: LogResult = {
    all: [{
      hash: 'abc123',
      date: '2023-01-01',
      message: 'Test commit message',
      author_name: 'Test Author',
      author_email: 'test@example.com'
    }] as DefaultLogFields[],
    latest: null,
    total: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockWrapper = {
      validateRepository: jest.fn(),
      getRepositoryInfo: jest.fn(),
      getLog: jest.fn(),
      getCommitDetails: jest.fn(),
      getCommitDiff: jest.fn(),
      getCommitStats: jest.fn(),
      getFileHistory: jest.fn(),
      getBranches: jest.fn(),
      getCurrentBranch: jest.fn(),
      getRemotes: jest.fn()
    } as any;

    mockProcessor = {
      processCommits: jest.fn(),
      processCommit: jest.fn(),
      enhanceCommit: jest.fn(),
      parseDiffOutput: jest.fn()
    } as any;

    mockQueryEngine = {
      buildLogOptions: jest.fn(),
      executeQuery: jest.fn()
    } as any;

    MockedGitWrapper.mockImplementation(() => mockWrapper);
    MockedGitDataProcessor.mockImplementation(() => mockProcessor);
    MockedGitQueryEngine.mockImplementation(() => mockQueryEngine);

    module = new GitHistoryModule(testRepoPath);
  });

  describe('constructor', () => {
    it('should create instances of all components', () => {
      expect(MockedGitWrapper).toHaveBeenCalledWith(testRepoPath);
      expect(MockedGitDataProcessor).toHaveBeenCalled();
      expect(MockedGitQueryEngine).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should validate the repository', async () => {
      mockWrapper.validateRepository.mockResolvedValue();

      await module.initialize();

      expect(mockWrapper.validateRepository).toHaveBeenCalled();
    });

    it('should propagate validation errors', async () => {
      const error = new InvalidRepositoryError(testRepoPath);
      mockWrapper.validateRepository.mockRejectedValue(error);

      await expect(module.initialize()).rejects.toThrow(InvalidRepositoryError);
    });
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information', async () => {
      const expectedInfo: RepositoryInfo = {
        path: testRepoPath,
        isRepository: true,
        currentBranch: 'main',
        remotes: ['origin']
      };
      mockWrapper.getRepositoryInfo.mockResolvedValue(expectedInfo);

      const result = await module.getRepositoryInfo();

      expect(result).toEqual(expectedInfo);
      expect(mockWrapper.getRepositoryInfo).toHaveBeenCalled();
    });
  });

  describe('queryHistory', () => {
    const testQuery: GitHistoryQuery = {
      maxCount: 10,
      authors: ['test@example.com']
    };

    const testResult = {
      commits: [testCommit],
      totalCount: 1,
      hasMore: false,
      query: testQuery
    };

    beforeEach(() => {
      mockQueryEngine.buildLogOptions.mockReturnValue({ maxCount: 10 });
      mockWrapper.getLog.mockResolvedValue(testLogResult);
      mockProcessor.processCommits.mockReturnValue([testCommit]);
      mockQueryEngine.executeQuery.mockReturnValue(testResult);
    });

    it('should query history successfully', async () => {
      const result = await module.queryHistory(testQuery);

      expect(mockQueryEngine.buildLogOptions).toHaveBeenCalledWith(testQuery);
      expect(mockWrapper.getLog).toHaveBeenCalledWith({ maxCount: 10 });
      expect(mockProcessor.processCommits).toHaveBeenCalledWith(testLogResult.all);
      expect(mockQueryEngine.executeQuery).toHaveBeenCalledWith([testCommit], testQuery);
      expect(result).toEqual(testResult);
    });

    it('should work with empty query', async () => {
      await module.queryHistory();

      expect(mockQueryEngine.buildLogOptions).toHaveBeenCalledWith({});
    });

    it('should propagate git errors', async () => {
      const error = new GitCommandError('test operation', new Error('Git failed'));
      mockWrapper.getLog.mockRejectedValue(error);

      await expect(module.queryHistory(testQuery)).rejects.toThrow(GitCommandError);
    });

    it('should wrap unknown errors', async () => {
      const error = new Error('Unknown error');
      mockWrapper.getLog.mockRejectedValue(error);

      await expect(module.queryHistory(testQuery)).rejects.toThrow(GitCommandError);
    });
  });

  describe('getCommit', () => {
    const testHash = 'abc123';

    beforeEach(() => {
      mockWrapper.getCommitDetails.mockResolvedValue(testLogResult);
      mockProcessor.processCommit.mockReturnValue(testCommit);
    });

    it('should get commit without enhancement', async () => {
      const result = await module.getCommit(testHash);

      expect(mockWrapper.getCommitDetails).toHaveBeenCalledWith(testHash);
      expect(mockProcessor.processCommit).toHaveBeenCalledWith(testLogResult.all[0]);
      expect(result).toEqual(testCommit);
    });

    it('should get commit with enhancement', async () => {
      const enhancedCommit = { ...testCommit, stats: { totalInsertions: 10, totalDeletions: 5, filesChanged: 2 } };
      mockWrapper.getCommitDiff.mockResolvedValue('diff output');
      mockWrapper.getCommitStats.mockResolvedValue('stats output');
      mockProcessor.enhanceCommit.mockReturnValue(enhancedCommit);

      const result = await module.getCommit(testHash, true);

      expect(mockWrapper.getCommitDiff).toHaveBeenCalledWith(testHash);
      expect(mockWrapper.getCommitStats).toHaveBeenCalledWith(testHash);
      expect(mockProcessor.enhanceCommit).toHaveBeenCalledWith(testCommit, {
        diffOutput: 'diff output',
        statsOutput: 'stats output'
      });
      expect(result).toEqual(enhancedCommit);
    });

    it('should return null for non-existent commit', async () => {
      mockWrapper.getCommitDetails.mockResolvedValue({ all: [], latest: null, total: 0 });

      const result = await module.getCommit(testHash);

      expect(result).toBeNull();
    });

    it('should handle enhancement errors gracefully', async () => {
      mockWrapper.getCommitDiff.mockRejectedValue(new Error('Diff failed'));
      mockWrapper.getCommitStats.mockRejectedValue(new Error('Stats failed'));

      const result = await module.getCommit(testHash, true);

      expect(result).toEqual(testCommit); // Should return unenhanced commit
    });

    it('should propagate git command errors', async () => {
      const error = new GitCommandError('test operation', new Error('Git failed'));
      mockWrapper.getCommitDetails.mockRejectedValue(error);

      await expect(module.getCommit(testHash)).rejects.toThrow(GitCommandError);
    });
  });

  describe('getFileHistory', () => {
    const testFilePath = 'src/test.ts';
    const testQuery: GitHistoryQuery = { maxCount: 5 };
    const testResult = {
      commits: [testCommit],
      totalCount: 1,
      hasMore: false,
      query: testQuery
    };

    beforeEach(() => {
      mockQueryEngine.buildLogOptions.mockReturnValue({ maxCount: 5 });
      mockWrapper.getFileHistory.mockResolvedValue(testLogResult);
      mockProcessor.processCommits.mockReturnValue([testCommit]);
      mockQueryEngine.executeQuery.mockReturnValue(testResult);
    });

    it('should get file history successfully', async () => {
      const result = await module.getFileHistory(testFilePath, testQuery);

      expect(mockQueryEngine.buildLogOptions).toHaveBeenCalledWith(testQuery);
      expect(mockWrapper.getFileHistory).toHaveBeenCalledWith(testFilePath, { maxCount: 5 });
      expect(mockProcessor.processCommits).toHaveBeenCalledWith(testLogResult.all);
      expect(mockQueryEngine.executeQuery).toHaveBeenCalledWith([testCommit], testQuery);
      expect(result).toEqual(testResult);
    });

    it('should work with empty query', async () => {
      await module.getFileHistory(testFilePath);

      expect(mockQueryEngine.buildLogOptions).toHaveBeenCalledWith({});
    });

    it('should propagate git command errors', async () => {
      const error = new GitCommandError('test operation', new Error('Git failed'));
      mockWrapper.getFileHistory.mockRejectedValue(error);

      await expect(module.getFileHistory(testFilePath, testQuery)).rejects.toThrow(GitCommandError);
    });
  });

  describe('getBranches', () => {
    it('should get branches without remotes', async () => {
      const branches = ['main', 'develop'];
      mockWrapper.getBranches.mockResolvedValue(branches);

      const result = await module.getBranches();

      expect(mockWrapper.getBranches).toHaveBeenCalledWith(false);
      expect(result).toEqual(branches);
    });

    it('should get branches with remotes', async () => {
      const branches = ['main', 'develop', 'origin/main'];
      mockWrapper.getBranches.mockResolvedValue(branches);

      const result = await module.getBranches(true);

      expect(mockWrapper.getBranches).toHaveBeenCalledWith(true);
      expect(result).toEqual(branches);
    });
  });

  describe('getCurrentBranch', () => {
    it('should get current branch', async () => {
      mockWrapper.getCurrentBranch.mockResolvedValue('main');

      const result = await module.getCurrentBranch();

      expect(mockWrapper.getCurrentBranch).toHaveBeenCalled();
      expect(result).toBe('main');
    });

    it('should return undefined when no current branch', async () => {
      mockWrapper.getCurrentBranch.mockResolvedValue(undefined);

      const result = await module.getCurrentBranch();

      expect(result).toBeUndefined();
    });
  });

  describe('getRemotes', () => {
    it('should get remotes list', async () => {
      const remotes = ['origin', 'upstream'];
      mockWrapper.getRemotes.mockResolvedValue(remotes);

      const result = await module.getRemotes();

      expect(mockWrapper.getRemotes).toHaveBeenCalled();
      expect(result).toEqual(remotes);
    });
  });
});