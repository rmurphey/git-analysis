import { GitQueryEngine } from '../../src/git-history/query';
import { GitHistoryQuery } from '../../src/git-history/types';
import { InvalidQueryError } from '../../src/git-history/errors';

describe('GitQueryEngine', () => {
  let queryEngine: GitQueryEngine;

  beforeEach(() => {
    queryEngine = new GitQueryEngine();
  });

  describe('buildLogOptions', () => {
    it('should handle basic pagination', () => {
      const query: GitHistoryQuery = {
        maxCount: 10,
        skip: 5
      };

      const options = queryEngine.buildLogOptions(query);

      expect(options.maxCount).toBe(10);
      expect(options.from).toBe('HEAD~5');
    });

    it('should handle empty query', () => {
      const query: GitHistoryQuery = {};

      const options = queryEngine.buildLogOptions(query);

      expect(options).toEqual({});
    });
  });

  describe('validateQuery', () => {
    it('should pass validation for valid query', () => {
      const query: GitHistoryQuery = {
        maxCount: 10,
        skip: 5
      };

      expect(() => queryEngine.validateQuery(query)).not.toThrow();
    });

    it('should throw for negative maxCount', () => {
      const query: GitHistoryQuery = {
        maxCount: -1
      };

      expect(() => queryEngine.validateQuery(query))
        .toThrow(InvalidQueryError);
    });

    it('should throw for negative skip', () => {
      const query: GitHistoryQuery = {
        skip: -1
      };

      expect(() => queryEngine.validateQuery(query))
        .toThrow(InvalidQueryError);
    });
  });

  describe('buildGitArgs', () => {
    it('should return empty args for empty query', () => {
      const query: GitHistoryQuery = {};

      const args = queryEngine.buildGitArgs(query);

      expect(args).toEqual([]);
    });

    it('should validate query before building args', () => {
      const invalidQuery: GitHistoryQuery = {
        maxCount: -1
      };

      expect(() => queryEngine.buildGitArgs(invalidQuery))
        .toThrow(InvalidQueryError);
    });
  });
});