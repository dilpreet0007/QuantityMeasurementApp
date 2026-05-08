export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: ['Backend/**/*.js'],
};
