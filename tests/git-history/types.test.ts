import { GitCommit, GitAuthor, FileChange, GitHistoryQuery } from '../../src/git-history/types';

describe('Git History Types', () => {
  describe('GitAuthor', () => {
    it('should have required properties', () => {
      const author: GitAuthor = {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date('2023-01-01T10:00:00Z')
      };

      expect(author.name).toBe('John Doe');
      expect(author.email).toBe('john@example.com');
      expect(author.date).toEqual(new Date('2023-01-01T10:00:00Z'));
    });
  });

  describe('FileChange', () => {
    it('should support all change types', () => {
      const changes: FileChange[] = [
        { path: 'added.ts', changeType: 'added', insertions: 10 },
        { path: 'modified.ts', changeType: 'modified', insertions: 5, deletions: 2 },
        { path: 'deleted.ts', changeType: 'deleted', deletions: 15 },
        { path: 'new.ts', changeType: 'renamed', oldPath: 'old.ts', insertions: 1, deletions: 1 },
        { path: 'copy.ts', changeType: 'copied', insertions: 20 }
      ];

      expect(changes[0].changeType).toBe('added');
      expect(changes[1].changeType).toBe('modified');
      expect(changes[2].changeType).toBe('deleted');
      expect(changes[3].changeType).toBe('renamed');
      expect(changes[3].oldPath).toBe('old.ts');
      expect(changes[4].changeType).toBe('copied');
    });
  });

  describe('GitCommit', () => {
    it('should have all required properties', () => {
      const author: GitAuthor = {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date('2023-01-01T10:00:00Z')
      };

      const fileChange: FileChange = {
        path: 'src/test.ts',
        changeType: 'modified',
        insertions: 5,
        deletions: 2
      };

      const commit: GitCommit = {
        hash: 'abc123def456',
        shortHash: 'abc123d',
        author,
        committer: author,
        message: 'Fix: Update test file',
        subject: 'Fix: Update test file',
        date: new Date('2023-01-01T10:00:00Z'),
        files: [fileChange],
        isMerge: false,
        parents: ['parent123'],
        stats: {
          totalInsertions: 5,
          totalDeletions: 2,
          filesChanged: 1
        }
      };

      expect(commit.hash).toBe('abc123def456');
      expect(commit.shortHash).toBe('abc123d');
      expect(commit.author).toEqual(author);
      expect(commit.message).toBe('Fix: Update test file');
      expect(commit.files).toHaveLength(1);
      expect(commit.isMerge).toBe(false);
      expect(commit.parents).toEqual(['parent123']);
      expect(commit.stats?.totalInsertions).toBe(5);
    });
  });

  describe('GitHistoryQuery', () => {
    it('should support all query options', () => {
      const query: GitHistoryQuery = {
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-12-31'),
        authors: ['john@example.com', 'jane@example.com'],
        authorPattern: '*@example.com',
        filePaths: ['src/**/*.ts'],
        filePattern: '*.ts',
        maxCount: 100,
        skip: 10,
        includeMerges: false,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      expect(query.dateFrom).toEqual(new Date('2023-01-01'));
      expect(query.authors).toEqual(['john@example.com', 'jane@example.com']);
      expect(query.maxCount).toBe(100);
      expect(query.sortBy).toBe('date');
      expect(query.sortOrder).toBe('desc');
    });

    it('should work with minimal query', () => {
      const query: GitHistoryQuery = {};
      
      expect(query.dateFrom).toBeUndefined();
      expect(query.maxCount).toBeUndefined();
    });
  });
});