import { GitWrapper } from '../../src/git-history/wrapper';
import { 
  RepositoryNotFoundError, 
  InvalidRepositoryError, 
  GitCommandError 
} from '../../src/git-history/errors';

// Mock simple-git
const mockGit = {
  checkIsRepo: jest.fn(),
  status: jest.fn(),
  getRemotes: jest.fn(),
  branch: jest.fn(),
  log: jest.fn(),
  show: jest.fn()
};

jest.mock('simple-git', () => ({
  simpleGit: jest.fn(() => mockGit)
}));

describe('GitWrapper', () => {
  let wrapper: GitWrapper;
  const testPath = '/test/repo';

  beforeEach(() => {
    wrapper = new GitWrapper(testPath);
    jest.clearAllMocks();
  });

  describe('validateRepository', () => {
    it('should pass validation for valid repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true);

      await expect(wrapper.validateRepository()).resolves.toBeUndefined();
      expect(mockGit.checkIsRepo).toHaveBeenCalled();
    });

    it('should throw InvalidRepositoryError for non-repository path', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false);

      await expect(wrapper.validateRepository()).rejects.toThrow(InvalidRepositoryError);
      await expect(wrapper.validateRepository()).rejects.toThrow('Invalid git repository at path: /test/repo');
    });

    it('should throw RepositoryNotFoundError when checkIsRepo fails', async () => {
      const error = new Error('Path not found');
      mockGit.checkIsRepo.mockRejectedValue(error);

      await expect(wrapper.validateRepository()).rejects.toThrow(RepositoryNotFoundError);
      await expect(wrapper.validateRepository()).rejects.toThrow('Repository not found at path: /test/repo');
    });
  });

  describe('getRepositoryInfo', () => {
    it('should return complete repository info for valid repo', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.status.mockResolvedValue({ current: 'main' });
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: {} },
        { name: 'upstream', refs: {} }
      ]);

      const info = await wrapper.getRepositoryInfo();

      expect(info).toEqual({
        path: testPath,
        isRepository: true,
        currentBranch: 'main',
        remotes: ['origin', 'upstream']
      });
    });

    it('should return invalid repo info when validation fails', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false);

      const info = await wrapper.getRepositoryInfo();

      expect(info).toEqual({
        path: testPath,
        isRepository: false
      });
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockGit.status.mockResolvedValue({ current: 'feature-branch' });

      const branch = await wrapper.getCurrentBranch();

      expect(branch).toBe('feature-branch');
      expect(mockGit.status).toHaveBeenCalled();
    });

    it('should return undefined when no current branch', async () => {
      mockGit.status.mockResolvedValue({ current: null });

      const branch = await wrapper.getCurrentBranch();

      expect(branch).toBeUndefined();
    });

    it('should throw GitCommandError when status fails', async () => {
      const error = new Error('Git status failed');
      mockGit.status.mockRejectedValue(error);

      await expect(wrapper.getCurrentBranch()).rejects.toThrow(GitCommandError);
      await expect(wrapper.getCurrentBranch()).rejects.toThrow('Git command failed: get current branch');
    });
  });

  describe('getRemotes', () => {
    it('should return list of remote names', async () => {
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: {} },
        { name: 'upstream', refs: {} }
      ]);

      const remotes = await wrapper.getRemotes();

      expect(remotes).toEqual(['origin', 'upstream']);
      expect(mockGit.getRemotes).toHaveBeenCalledWith(true);
    });

    it('should throw GitCommandError when getRemotes fails', async () => {
      const error = new Error('Cannot access remotes');
      mockGit.getRemotes.mockRejectedValue(error);

      await expect(wrapper.getRemotes()).rejects.toThrow(GitCommandError);
      await expect(wrapper.getRemotes()).rejects.toThrow('Git command failed: get remotes');
    });
  });

  describe('getBranches', () => {
    it('should return local branches by default', async () => {
      mockGit.branch.mockResolvedValue({ all: ['main', 'feature'] });

      const branches = await wrapper.getBranches();

      expect(branches).toEqual(['main', 'feature']);
      expect(mockGit.branch).toHaveBeenCalledWith([]);
    });

    it('should return all branches when includeRemote is true', async () => {
      mockGit.branch.mockResolvedValue({ all: ['main', 'feature', 'origin/main'] });

      const branches = await wrapper.getBranches(true);

      expect(branches).toEqual(['main', 'feature', 'origin/main']);
      expect(mockGit.branch).toHaveBeenCalledWith(['-a']);
    });

    it('should throw GitCommandError when branch command fails', async () => {
      const error = new Error('Branch command failed');
      mockGit.branch.mockRejectedValue(error);

      await expect(wrapper.getBranches()).rejects.toThrow(GitCommandError);
    });
  });

  describe('getLog', () => {
    it('should return log result with default options', async () => {
      const mockLogResult = { all: [], total: 0, latest: null };
      mockGit.log.mockResolvedValue(mockLogResult);

      const result = await wrapper.getLog();

      expect(result).toBe(mockLogResult);
      expect(mockGit.log).toHaveBeenCalledWith({});
    });

    it('should pass through log options', async () => {
      const mockLogResult = { all: [], total: 0, latest: null };
      const options = { maxCount: 10, from: 'HEAD~5' };
      mockGit.log.mockResolvedValue(mockLogResult);

      const result = await wrapper.getLog(options);

      expect(result).toBe(mockLogResult);
      expect(mockGit.log).toHaveBeenCalledWith(options);
    });

    it('should throw GitCommandError when log fails', async () => {
      const error = new Error('Log command failed');
      mockGit.log.mockRejectedValue(error);

      await expect(wrapper.getLog()).rejects.toThrow(GitCommandError);
    });
  });

  describe('getCommitDetails', () => {
    it('should return commit details for specific hash', async () => {
      const mockLogResult = { all: [{ hash: 'abc123' }], total: 1, latest: null };
      mockGit.log.mockResolvedValue(mockLogResult);

      const result = await wrapper.getCommitDetails('abc123');

      expect(result).toBe(mockLogResult);
      expect(mockGit.log).toHaveBeenCalledWith({
        from: 'abc123',
        to: 'abc123',
        maxCount: 1
      });
    });
  });

  describe('getCommitDiff', () => {
    it('should return diff for commit', async () => {
      const mockDiff = 'diff --git a/file.txt b/file.txt...';
      mockGit.show.mockResolvedValue(mockDiff);

      const result = await wrapper.getCommitDiff('abc123');

      expect(result).toBe(mockDiff);
      expect(mockGit.show).toHaveBeenCalledWith(['abc123', '--format=']);
    });
  });

  describe('getCommitStats', () => {
    it('should return stats for commit', async () => {
      const mockStats = 'file.txt | 5 ++---';
      mockGit.show.mockResolvedValue(mockStats);

      const result = await wrapper.getCommitStats('abc123');

      expect(result).toBe(mockStats);
      expect(mockGit.show).toHaveBeenCalledWith(['abc123', '--stat', '--format=']);
    });
  });

  describe('getFileHistory', () => {
    it('should return file history', async () => {
      const mockLogResult = { all: [], total: 0, latest: null };
      mockGit.log.mockResolvedValue(mockLogResult);

      const result = await wrapper.getFileHistory('src/file.ts');

      expect(result).toBe(mockLogResult);
      expect(mockGit.log).toHaveBeenCalledWith({
        file: 'src/file.ts'
      });
    });

    it('should merge options with file parameter', async () => {
      const mockLogResult = { all: [], total: 0, latest: null };
      const options = { maxCount: 5 };
      mockGit.log.mockResolvedValue(mockLogResult);

      const result = await wrapper.getFileHistory('src/file.ts', options);

      expect(result).toBe(mockLogResult);
      expect(mockGit.log).toHaveBeenCalledWith({
        maxCount: 5,
        file: 'src/file.ts'
      });
    });
  });
});