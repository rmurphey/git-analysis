import { GitDataProcessor } from '../../src/git-history/processor';
import { GitCommit, FileChange } from '../../src/git-history/types';
import { DataProcessingError } from '../../src/git-history/errors';
import { DefaultLogFields } from 'simple-git';

// Extended type for testing with diff data
type TestLogFields = DefaultLogFields & {
  diff?: { files?: unknown[] } | null;
};

// Helper function to create test commit data
function createTestCommit(overrides: Partial<TestLogFields>): TestLogFields {
  return {
    hash: 'abc123',
    date: '2023-01-01T10:00:00Z',
    message: 'Test commit',
    author_name: 'Test Author',
    author_email: 'test@example.com',
    refs: '',
    body: '',
    diff: null,
    ...overrides
  };
}

describe('GitDataProcessor', () => {
  let processor: GitDataProcessor;

  beforeEach(() => {
    processor = new GitDataProcessor();
  });

  describe('processCommits', () => {
    it('should process multiple commits', () => {
      const simpleGitCommits: TestLogFields[] = [
        createTestCommit({
          hash: 'abc123',
          date: '2023-01-01T10:00:00Z',
          message: 'First commit',
          author_name: 'John Doe',
          author_email: 'john@example.com'
        }),
        createTestCommit({
          hash: 'def456',
          date: '2023-01-02T11:00:00Z',
          message: 'Second commit',
          author_name: 'Jane Smith',
          author_email: 'jane@example.com'
        })
      ];

      const result = processor.processCommits(simpleGitCommits);

      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe('abc123');
      expect(result[1].hash).toBe('def456');
    });

    it('should throw DataProcessingError when processing fails', () => {
      const invalidCommit = { invalid: 'data' } as any;

      expect(() => processor.processCommits([invalidCommit]))
        .toThrow(DataProcessingError);
    });
  });

  describe('processCommit', () => {
    it('should convert simple-git commit to GitCommit', () => {
      const simpleGitCommit: TestLogFields = createTestCommit({
        hash: 'abc123def456',
        date: '2023-01-01T10:00:00Z',
        message: 'feat: Add new feature\n\nThis adds a new feature with tests.',
        author_name: 'John Doe',
        author_email: 'john@example.com',
        diff: {
          files: [
            {
              file: 'src/feature.ts',
              insertions: 10,
              deletions: 2
            }
          ]
        }
      });

      const result = processor.processCommit(simpleGitCommit);

      expect(result.hash).toBe('abc123def456');
      expect(result.shortHash).toBe('abc123d');
      expect(result.author.name).toBe('John Doe');
      expect(result.author.email).toBe('john@example.com');
      expect(result.author.date).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(result.message).toBe('feat: Add new feature\n\nThis adds a new feature with tests.');
      expect(result.subject).toBe('feat: Add new feature');
      expect(result.body).toBe('This adds a new feature with tests.');
      expect(result.date).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(result.files).toHaveLength(1);
      expect(result.stats?.totalInsertions).toBe(10);
      expect(result.stats?.totalDeletions).toBe(2);
      expect(result.stats?.filesChanged).toBe(1);
    });

    it('should handle commits with no diff data', () => {
      const simpleGitCommit: TestLogFields = createTestCommit({
        message: 'Simple commit',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      });

      const result = processor.processCommit(simpleGitCommit);

      expect(result.files).toHaveLength(0);
      expect(result.stats).toBeUndefined();
    });

    it('should handle missing author information', () => {
      const simpleGitCommit: TestLogFields = createTestCommit({
        message: 'Commit without author',
        author_name: '',
        author_email: ''
      });

      const result = processor.processCommit(simpleGitCommit);

      expect(result.author.name).toBe('Unknown');
      expect(result.author.email).toBe('unknown@example.com');
    });

    it('should detect merge commits', () => {
      const mergeCommit: TestLogFields = createTestCommit({
        message: 'Merge pull request #123',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      });

      const result = processor.processCommit(mergeCommit);

      expect(result.isMerge).toBe(true);
    });
  });

  describe('parseDiffOutput', () => {
    it('should parse diff output for added file', () => {
      const diffOutput = `diff --git a/new-file.ts b/new-file.ts
new file mode 100644
index 0000000..abc123
--- /dev/null
+++ b/new-file.ts
@@ -0,0 +1,5 @@
+export class NewFile {
+  private value: string;
+  
+  constructor(value: string) {
+    this.value = value;
+  }
+}`;

      const result = processor.parseDiffOutput(diffOutput);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('new-file.ts');
      expect(result[0].changeType).toBe('added');
      expect(result[0].insertions).toBe(7);
      expect(result[0].deletions).toBe(0);
    });

    it('should parse diff output for deleted file', () => {
      const diffOutput = `diff --git a/old-file.ts b/old-file.ts
deleted file mode 100644
index abc123..0000000
--- a/old-file.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export class OldFile {
-  // This file is being deleted
-}`;

      const result = processor.parseDiffOutput(diffOutput);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('old-file.ts');
      expect(result[0].changeType).toBe('deleted');
      expect(result[0].insertions).toBe(0);
      expect(result[0].deletions).toBe(3);
    });

    it('should parse diff output for modified file', () => {
      const diffOutput = `diff --git a/existing-file.ts b/existing-file.ts
index abc123..def456 100644
--- a/existing-file.ts
+++ b/existing-file.ts
@@ -1,5 +1,7 @@
 export class ExistingFile {
-  private oldMethod() {
-    return 'old';
+  private newMethod() {
+    return 'new';
   }
+  
+  private anotherMethod() {
+    return 'another';
+  }
 }`;

      const result = processor.parseDiffOutput(diffOutput);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('existing-file.ts');
      expect(result[0].changeType).toBe('modified');
      expect(result[0].insertions).toBe(6);
      expect(result[0].deletions).toBe(2);
    });

    it('should parse diff output for renamed file', () => {
      const diffOutput = `diff --git a/old-name.ts b/new-name.ts
similarity index 85%
rename from old-name.ts
rename to new-name.ts
index abc123..def456 100644
--- a/old-name.ts
+++ b/new-name.ts
@@ -1,3 +1,4 @@
 export class RenamedFile {
   // File was renamed
+  // And slightly modified
 }`;

      const result = processor.parseDiffOutput(diffOutput);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('new-name.ts');
      expect(result[0].changeType).toBe('renamed');
      expect(result[0].oldPath).toBe('old-name.ts');
      expect(result[0].insertions).toBe(1);
      expect(result[0].deletions).toBe(0);
    });

    it('should handle multiple files in diff output', () => {
      const diffOutput = `diff --git a/file1.ts b/file1.ts
index abc123..def456 100644
--- a/file1.ts
+++ b/file1.ts
@@ -1,2 +1,3 @@
 line 1
+line 2
 line 3
diff --git a/file2.ts b/file2.ts
new file mode 100644
index 0000000..ghi789
--- /dev/null
+++ b/file2.ts
@@ -0,0 +1,2 @@
+export const NEW_CONSTANT = 'value';
+export default NEW_CONSTANT;`;

      const result = processor.parseDiffOutput(diffOutput);

      expect(result).toHaveLength(2);
      
      expect(result[0].path).toBe('file1.ts');
      expect(result[0].changeType).toBe('modified');
      expect(result[0].insertions).toBe(1);
      
      expect(result[1].path).toBe('file2.ts');
      expect(result[1].changeType).toBe('added');
      expect(result[1].insertions).toBe(2);
    });

    it('should throw DataProcessingError for invalid diff output', () => {
      const invalidDiff = null as any;

      expect(() => processor.parseDiffOutput(invalidDiff))
        .toThrow(DataProcessingError);
    });
  });

  describe('enhanceCommit', () => {
    const baseCommit: GitCommit = {
      hash: 'abc123',
      shortHash: 'abc123d',
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date('2023-01-01T10:00:00Z')
      },
      committer: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date('2023-01-01T10:00:00Z')
      },
      message: 'Test commit',
      subject: 'Test commit',
      date: new Date('2023-01-01T10:00:00Z'),
      files: [],
      isMerge: false,
      parents: []
    };

    it('should enhance commit with diff output', () => {
      const diffOutput = `diff --git a/test.ts b/test.ts
new file mode 100644
index 0000000..abc123
--- /dev/null
+++ b/test.ts
@@ -0,0 +1,2 @@
+export const TEST = 'value';
+export default TEST;`;

      const result = processor.enhanceCommit(baseCommit, { diffOutput });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('test.ts');
      expect(result.files[0].changeType).toBe('added');
      expect(result.stats?.totalInsertions).toBe(2);
      expect(result.stats?.filesChanged).toBe(1);
    });

    it('should return original commit when no additional data provided', () => {
      const result = processor.enhanceCommit(baseCommit);

      expect(result).toEqual(baseCommit);
    });

    it('should handle enhancement failures gracefully', () => {
      // The current implementation gracefully handles null diff output
      // by falling back to original commit data
      const invalidDiffOutput = null as any;

      const result = processor.enhanceCommit(baseCommit, { diffOutput: invalidDiffOutput });

      expect(result).toEqual(baseCommit);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle commits with only subject line', () => {
      const simpleGitCommit: TestLogFields = createTestCommit({
        message: 'Simple subject only',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      });

      const result = processor.processCommit(simpleGitCommit);

      expect(result.subject).toBe('Simple subject only');
      expect(result.body).toBeUndefined();
    });

    it('should handle commits with subject and single line body', () => {
      const simpleGitCommit: TestLogFields = createTestCommit({
        message: 'Subject line\n\nSingle body line',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      });

      const result = processor.processCommit(simpleGitCommit);

      expect(result.subject).toBe('Subject line');
      expect(result.body).toBe('Single body line');
    });

    it('should handle empty diff files gracefully', () => {
      const simpleGitCommit: TestLogFields = createTestCommit({
        message: 'Commit with empty diff',
        author_name: 'John Doe',
        author_email: 'john@example.com',
        diff: { files: [] }
      });

      const result = processor.processCommit(simpleGitCommit);

      expect(result.files).toHaveLength(0);
      expect(result.stats).toBeUndefined();
    });
  });
});