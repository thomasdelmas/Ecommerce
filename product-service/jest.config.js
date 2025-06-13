// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm', // ESM + TypeScript support
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Allow importing without .js extension
  },
  transform: {},
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
