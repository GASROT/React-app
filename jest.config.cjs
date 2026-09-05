module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/shared/services/experiments/**/*.ts',
    '!src/shared/services/experiments/**/*.test.ts',
    '!src/shared/services/experiments/contracts.ts',
    '!src/shared/services/experiments/experiment-api.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
